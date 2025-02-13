<template>
    <div class="edit-page">
      <h1 class="page-title">Blogeintrag bearbeiten</h1>
  
      <form @submit.prevent="handleEdit" class="auth-form">
        <div class="form-group">
          <label for="imageInput">Neues Bild/Video auswählen (optional):</label>
          <input
            type="file"
            id="imageInput"
            accept="image/*,video/*"
            @change="onFileSelected"
          />
        </div>
  
        <div class="form-group">
          <label for="captionInput">Neuer Text:</label>
          <textarea
            id="captionInput"
            v-model="updatedCaption"
            rows="5"
            placeholder="Neuer Blogtext..."
          ></textarea>
        </div>
  
        <button type="submit" class="btn-primary">
          Änderungen speichern
        </button>
      </form>
  
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  const route = useRoute()
  const router = useRouter()
  const entryId = route.params.id
  
  const selectedFile = ref(null)
  const updatedCaption = ref('')
  const errorMessage = ref('')
  const successMessage = ref('')
  
  // Beim Mount Daten des vorhandenen Posts laden
  onMounted(() => {
    fetchExistingEntry()
  })
  
  async function fetchExistingEntry() {
    try {
      const res = await fetch(`http://localhost:3000/api/blog-entries`, {
        credentials: 'include'
      })
      const allEntries = await res.json()
      // Gewünschten Eintrag finden
      const found = allEntries.find(e => e.id === parseInt(entryId))
      if (!found) {
        throw new Error('Eintrag nicht gefunden.')
      }
      // Caption ins Feld übernehmen
      updatedCaption.value = found.caption || ''
    } catch (err) {
      errorMessage.value = err.message
    }
  }
  
  function onFileSelected(e) {
    selectedFile.value = e.target.files[0] || null
  }
  
  async function handleEdit() {
    errorMessage.value = ''
    successMessage.value = ''
  
    // FormData zusammenbauen
    const formData = new FormData()
    if (selectedFile.value) {
      formData.append('media', selectedFile.value)
    }
    formData.append('caption', updatedCaption.value)
  
    try {
      const response = await fetch(`http://localhost:3000/api/blog-entries/${entryId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Fehler beim Aktualisieren.')
      }
      successMessage.value = 'Eintrag erfolgreich aktualisiert!'
      router.push('/')
    } catch (err) {
      errorMessage.value = err.message
    }
  }
  </script>
  
  <style scoped>
  .edit-page {
    max-width: 600px;
    margin: 2rem auto;
    background: #2b2b2b;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    color: #ddd;
    animation: fadeIn 0.4s ease forwards; /* kleines Fade-In */
  }
  
  .page-title {
    font-size: 2rem;
    color: #4a90e2;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  /* Gleiche Klassen wie in Login/Register verwenden (auth-form, form-group etc.) */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .form-group input[type="file"],
  .form-group textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 8px;
    background-color: #1a1a1a;
    color: #ddd;
  }
  
  .btn-primary {
    background-color: #4a90e2;
    color: #fff;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  .btn-primary:hover {
    background-color: #3b78b4;
    transform: scale(1.02);
  }
  
  .error {
    color: #ff6666;
    margin-top: 1rem;
    text-align: center;
  }
  .success {
    color: #66ff66;
    margin-top: 1rem;
    text-align: center;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(-10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  </style>
  