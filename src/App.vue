<template>
  <div id="app">
    <!-- Haupt-Navigation -->
    <header class="navbar">
      <div class="brand" @click="goHome">
        Ikra's cool blog
      </div>
      <nav class="nav-links">
        <!-- "Home" Link geht immer -->
        <router-link to="/" class="nav-item">Home</router-link>

        <!-- Nur sichtbar, wenn eingeloggt -->
        <router-link v-if="user" to="/upload" class="nav-item">Upload</router-link>

        <!-- Nur sichtbar, wenn NICHT eingeloggt -->
        <router-link v-if="!user" to="/login" class="nav-item">Login</router-link>
        <router-link v-if="!user" to="/register" class="nav-item">Register</router-link>

        <!-- Logout-Button nur sichtbar, wenn eingeloggt -->
        <button v-if="user" class="logout-btn" @click="logout">Logout</button>
      </nav>
    </header>

    <!-- Hauptbereich (Route) -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

// Beim Laden abfragen, ob wir eingeloggt sind
onMounted(async () => {
  try {
    const res = await fetch('https://ikrasblogapi.solidbooru.online/api/me', {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      user.value = data
    }
  } catch (err) {
    console.log('Noch nicht eingeloggt oder Fehler:', err)
    user.value = null
  }
})

function goHome() {
  router.push('/')
}

async function logout() {
  try {
    await fetch('https://ikrasblogapi.solidbooru.online/api/logout', {
      credentials: 'include'
    })
    user.value = null
  } catch (err) {
    console.error('Fehler beim Logout:', err)
  }
}
</script>

<style>
/* Globale Reset-Einstellungen */
html, body {
  margin: 0;
  padding: 0;

  /* Leichter Hintergrund-Gradient für das gesamte Dokument */
  background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
  color: #ddd;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

/* Um das App-Layout klar abzutrennen, trotzdem den Dark-Look behalten */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* NAVBAR */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* Subtiler Verlauf in der Navbar */
  background: linear-gradient(to right, #333, #222);
  padding: 1rem 2rem;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 999;

  /* Leichte Schattenkante unter der Navbar */
  box-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

.brand {
  font-weight: 700;
  font-size: 1.5rem;
  cursor: pointer;
  user-select: none;
  color: #4a90e2;

  /* Kleines Glow beim Brand-Titel */
  text-shadow: 0 0 5px rgba(74,144,226,0.6);
  transition: transform 0.3s ease;
}
.brand:hover {
  transform: scale(1.1);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-item {
  color: #ddd;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-item:hover {
  color: #fff;
}

.logout-btn {
  background-color: #e05555;
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.logout-btn:hover {
  background-color: #ff6666;
  transform: scale(1.05);
}

/* Hauptinhalt */
.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>
