// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const ffmpeg = require('fluent-ffmpeg');

// Session-Setup
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

// Body-Parser
app.use(express.json());

// CORS (Sessions erlauben)
app.use(cors({
  origin: ['https://ikrasblog.solidbooru.online'], // oder ['http://localhost:5173'] etc.
  credentials: true
}));

// Session via SQLite
app.use(session({
  secret: 'dein_geheimer_key', // bitte anpassen
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: './'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 Tag
  }
}));

// SQLite init
let db;
(async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Neue Tabelle blog_entries
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blog_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_type TEXT,
      media_path TEXT,
      thumbnail_path TEXT,
      caption TEXT,
      user_id INTEGER
    )
  `);

  // User-Tabelle
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  console.log('SQLite ready.');
})();

// Statische Ordner, damit wir die Dateien ausliefern können:
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// ---------- MULTER SETUP ---------- //
const allowedTypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg'
];

function fileFilter(req, file, cb) {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Nur Bilder und Videos sind erlaubt!'), false);
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // in den "uploads"-Ordner
  },
  filename: (req, file, cb) => {
    // eindeutiger Dateiname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // z.B. max 200MB
});

// ---------- AUTH ROUTES ---------- //
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort erforderlich.' });
  }

  try {
    // Demo: Nur 1 User zulassen (falls gewünscht).
    const row = await db.get('SELECT COUNT(*) as total FROM users');
    if (row.total > 0) {
      return res.status(403).json({ error: 'Bereits ein Benutzer registriert.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [
      username, hashedPassword
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Benutzername existiert bereits.' });
    }
    res.status(500).json({ error: 'Serverfehler bei Registrierung.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username und Passwort erforderlich.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Falsches Passwort.' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler beim Login.' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Logout fehlgeschlagen.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht autorisiert.' });
  }
  next();
}

// ---------- BLOG ROUTES ---------- //

// Alle abrufen (öffentlich)
app.get('/api/blog-entries', async (req, res) => {
  try {
    const entries = await db.all('SELECT * FROM blog_entries');
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einträge.' });
  }
});

// Neuen Eintrag anlegen (eingeloggt)
app.post('/api/blog-entries', requireLogin, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen.' });
    }

    const { caption } = req.body;
    const userId = req.session.userId;

    // prüfen, ob es ein Video oder Bild ist
    const isVideo = req.file.mimetype.startsWith('video');
    const mediaType = isVideo ? 'video' : 'image';

    // Pfad zur Datei (z.B. "uploads/1676394877-12345.mp4")
    const filePath = `uploads/${req.file.filename}`;

    // Default: kein Thumbnail
    let thumbnailPath = null;

    if (isVideo) {
      // => Thumbnail generieren
      // wir nehmen hier das Frame bei Sekunde 1 als Vorschau
      // und speichern es in "thumbnails/..."
      const thumbName = req.file.filename.replace(path.extname(req.file.filename), '.jpg');
      thumbnailPath = `thumbnails/${thumbName}`;

      await new Promise((resolve, reject) => {
        ffmpeg(path.join(__dirname, filePath))
          .screenshots({
            timestamps: [ '1' ],         // Sekunde 1
            filename: thumbName,         // z.B. "1676394877-12345.jpg"
            folder: path.join(__dirname, 'thumbnails'),
            size: '320x?'                // Breite 320px, Höhe proportional
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // In DB speichern
    const result = await db.run(`
      INSERT INTO blog_entries (media_type, media_path, thumbnail_path, caption, user_id)
      VALUES (?, ?, ?, ?, ?)
    `, [mediaType, filePath, thumbnailPath, caption || '', userId]);

    const newEntry = await db.get('SELECT * FROM blog_entries WHERE id = ?', [result.lastID]);
    res.json(newEntry);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Speichern.' });
  }
});

// PUT - Eintrag bearbeiten
app.put('/api/blog-entries/:id', requireLogin, upload.single('media'), async (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;

  try {
    // Eintrag holen
    const entry = await db.get('SELECT * FROM blog_entries WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    }
    if (entry.user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Nicht berechtigt.' });
    }

    let { media_type, media_path, thumbnail_path } = entry;

    // Wenn neue Datei hochgeladen, alte ggf. überschreiben
    if (req.file) {
      // neuen Pfad definieren
      media_path = `uploads/${req.file.filename}`;
      media_type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      thumbnail_path = null;

      if (media_type === 'video') {
        // Thumbnail generieren
        const thumbName = req.file.filename.replace(path.extname(req.file.filename), '.jpg');
        thumbnail_path = `thumbnails/${thumbName}`;
        
        await new Promise((resolve, reject) => {
          ffmpeg(path.join(__dirname, media_path))
            .screenshots({
              timestamps: [ '1' ],
              filename: thumbName,
              folder: path.join(__dirname, 'thumbnails'),
              size: '320x?'
            })
            .on('end', resolve)
            .on('error', reject);
        });
      }

      // TODO: Optional: alte Datei löschen, falls gewünscht.
    }

    await db.run(`
      UPDATE blog_entries
      SET media_type = ?, media_path = ?, thumbnail_path = ?, caption = ?
      WHERE id = ?
    `, [media_type, media_path, thumbnail_path, caption || '', id]);

    const updatedEntry = await db.get('SELECT * FROM blog_entries WHERE id = ?', [id]);
    res.json(updatedEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
});

// DELETE - Eintrag löschen
app.delete('/api/blog-entries/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  try {
    const entry = await db.get('SELECT * FROM blog_entries WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ error: 'Nicht gefunden.' });
    }
    if (entry.user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Nicht berechtigt.' });
    }

    // DB-Eintrag löschen
    await db.run('DELETE FROM blog_entries WHERE id = ?', [id]);

    // Optional: Auch physische Datei löschen
    //   (z.B. fs.unlinkSync(path.join(__dirname, entry.media_path)) )
    //   (und thumbnail ebenfalls)

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
});

// ME - Eigene Daten
app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }
  res.json({ userId: req.session.userId, username: req.session.username });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
