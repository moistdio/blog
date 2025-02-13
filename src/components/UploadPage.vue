<template>
    <div class="upload-page">
      <h1 class="page-title">Blogeintrag hochladen</h1>
  
      <form @submit.prevent="handleUpload" class="upload-form">
        <label for="fileInput">Datei (Bild oder Video):</label>
        <input
          type="file"
          id="fileInput"
          accept="image/*,video/*"
          @change="onFileSelected"
        />
  
        <label for="captionInput">Text:</label>
        <textarea
          id="captionInput"
          v-model="newCaption"
          rows="3"
        ></textarea>
  
        <button type="submit">Hochladen</button>
      </form>
  
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const selectedFile = ref(null)
  const newCaption = ref('')
  const errorMessage = ref('')
  const successMessage = ref('')
  
  function onFileSelected(e) {
    selectedFile.value = e.target.files[0] || null
  }
  
  async function handleUpload() {
    errorMessage.value = ''
    successMessage.value = ''
  
    if (!selectedFile.value) {
      errorMessage.value = 'Bitte Datei auswählen!'
      return
    }
    const formData = new FormData()
    formData.append('media', selectedFile.value)  // ACHTUNG: "media" = server key
    formData.append('caption', newCaption.value)
  
    try {
      const res = await fetch('http://localhost:3000/api/blog-entries', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Upload.')
      }
      successMessage.value = 'Upload erfolgreich!'
      selectedFile.value = null
      newCaption.value = ''
      document.getElementById('fileInput').value = '' // input reset
    } catch (err) {
      errorMessage.value = err.message
    }
  }
  </script>
  
  <style scoped>
  .upload-page {
    max-width: 600px;
    margin: 2rem auto;
    background: #2b2b2b;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    color: #ddd;
  }
  
  .page-title {
    font-size: 2rem;
    color: #4a90e2;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .upload-form label {
    font-weight: 500;
  }
  
  .upload-form input[type="file"],
  .upload-form textarea {
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 8px;
    background-color: #1a1a1a;
    color: #ddd;
  }
  
  .upload-form button {
    background-color: #4a90e2;
    color: #fff;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  .upload-form button:hover {
    background-color: #3b78b4;
    transform: scale(1.02);
  }
  
  .error {
    color: #ff6666;
    margin-top: 1rem;
  }
  .success {
    color: #66ff66;
    margin-top: 1rem;
  }
  </style>
  