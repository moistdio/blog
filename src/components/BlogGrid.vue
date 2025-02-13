<template>
  <div class="blog-grid">
    <h1 class="page-title">Mein Blog</h1>

    <div class="pinboard">
      <div
        v-for="(entry) in blogEntries"
        :key="entry.id"
        class="pin"
        @click="openModal(entry)"
      >
        <!-- Entscheiden anhand entry.media_type -->
        <template v-if="entry.media_type === 'video'">
          <!-- Zeige Thumbnail, falls vorhanden -->
          <img
            v-if="entry.thumbnail_path"
            :src="`http://localhost:3000/${entry.thumbnail_path}`"
            alt="Video-Thumbnail"
          />
          <img
            v-else
            src="https://cdn-icons-png.flaticon.com/512/3138/3138381.png"
            alt="Video-Platzhalter"
          />
        </template>
        <template v-else>
          <!-- Bild -->
          <img
            :src="`http://localhost:3000/${entry.media_path}`"
            alt="Blog-Bild"
          />
        </template>

        <!-- Caption einblenden -->
        <p v-if="entry.caption" class="caption">{{ entry.caption }}</p>

        <!-- Aktionen nur für Owner -->
        <div v-if="user && entry.user_id === user.userId" class="pin-actions">
          <!-- Edit -->
          <router-link
            :to="`/edit/${entry.id}`"
            class="edit-button"
            @click.stop
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/1827/1827933.png"
              alt="Bearbeiten"
              class="edit-icon"
            />
          </router-link>
          <!-- Delete -->
          <div class="delete-button" @click.stop="deleteEntry(entry.id)">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3096/3096673.png"
              alt="Mülleimer"
              class="trash-icon"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal (Video oder Bild anzeigen) -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <span class="close-button" @click="closeModal">×</span>
        
        <template v-if="selectedEntry">
          <!-- Wenn Video, dann <video> -->
          <video
            v-if="selectedEntry.media_type === 'video'"
            controls
            playsinline
            preload="metadata"
            class="modal-image"
          >
            <source :src="`http://localhost:3000/${selectedEntry.media_path}`" />
          </video>

          <!-- Wenn Bild, dann <img> -->
          <img
            v-else
            :src="`http://localhost:3000/${selectedEntry.media_path}`"
            alt="Blog-Bild"
            class="modal-image"
          />

          <p class="modal-caption" v-if="selectedEntry.caption">
            {{ selectedEntry.caption }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const blogEntries = ref([])
const showModal = ref(false)
const selectedEntry = ref(null)
const user = ref(null)

onMounted(() => {
  fetchUser()
  fetchEntries()
})

async function fetchEntries() {
  try {
    const res = await fetch('http://localhost:3000/api/blog-entries', {
      credentials: 'include'
    })
    blogEntries.value = await res.json()
  } catch (err) {
    console.error('Fehler beim Abrufen:', err)
  }
}

async function fetchUser() {
  try {
    const res = await fetch('http://localhost:3000/api/me', {
      credentials: 'include'
    })
    if (res.ok) {
      user.value = await res.json()
    }
  } catch (err) {
    console.log('Nicht eingeloggt:', err)
  }
}

function openModal(entry) {
  selectedEntry.value = entry
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedEntry.value = null
}

async function deleteEntry(id) {
  if (!confirm('Wirklich löschen?')) return
  try {
    const res = await fetch(`http://localhost:3000/api/blog-entries/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Fehler beim Löschen.')
    }
    blogEntries.value = blogEntries.value.filter(e => e.id !== id)
  } catch (err) {
    alert(err.message)
  }
}
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  color: #4a90e2;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* Masonry-artiges Layout */
.pinboard {
  column-count: 3;
  column-gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.pin {
  display: inline-block;
  width: 100%;
  background: #2b2b2b;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  -moz-column-break-inside: avoid;

  margin-bottom: 0;
  transition: transform 0.3s, box-shadow 0.3s;
}
.pin:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.4);
}

.pin img {
  display: block;
  width: 100%;
  object-fit: cover;
}

/* Optional: Damit Platzhalter-Icon ein bisschen schöner aussieht */
.video-preview {
  max-height: 250px;
  object-fit: contain;
  background: #000;
  padding: 1rem;
}

/* CAPTION-Styling */
.caption {
  margin: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 0.4rem 0.6rem;
  font-size: 0.95rem;
  opacity: 0;
  transform: translateY(100%);
  transition: transform 0.3s ease, opacity 0.3s ease;
  text-align: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pin:hover .caption {
  transform: translateY(0);
  opacity: 1;
}

/* Aktionen (Edit / Delete) */
.pin-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.pin:hover .pin-actions {
  opacity: 1;
}

.edit-button,
.delete-button {
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  padding: 0.3rem;
  cursor: pointer;
}

.edit-icon {
  width: 24px;
  height: 24px;
}
.trash-icon {
  width: 24px;
  height: 24px;
}

/* MODAL - Overlay & Inhalt */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);

  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  animation: fadeIn 0.3s ease forwards;
}

.modal-content {
  position: relative;
  background-color: #2b2b2b;
  border-radius: 10px;
  padding: 2rem;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  text-align: center;
  color: #ddd;

  animation: scaleIn 0.3s ease forwards;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: #ddd;
  transition: transform 0.3s;
}
.close-button:hover {
  transform: scale(1.2);
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  margin-bottom: 1rem;
}

.modal-caption {
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

/* Keyframes */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes scaleIn {
  0% { transform: scale(0.8); }
  100% { transform: scale(1); }
}
</style>
