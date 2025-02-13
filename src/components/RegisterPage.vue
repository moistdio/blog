<template>
    <div class="register-page">
      <h1 class="page-title">Registrierung</h1>
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username">Username:</label>
          <input v-model="username" id="username" type="text" />
        </div>
        <div class="form-group">
          <label for="password">Passwort:</label>
          <input v-model="password" id="password" type="password" />
        </div>
        <button type="submit" class="btn-primary">Registrieren</button>
      </form>
  
      <p class="error" v-if="errorMessage">{{ errorMessage }}</p>
      <p class="success" v-if="successMessage">{{ successMessage }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const username = ref('')
  const password = ref('')
  const errorMessage = ref('')
  const successMessage = ref('')
  
  async function handleRegister() {
    errorMessage.value = ''
    successMessage.value = ''
  
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, password: password.value })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen.')
      }
      successMessage.value = 'Benutzer erfolgreich registriert!'
      router.push('/login')
    } catch (err) {
      errorMessage.value = err.message
    }
  }
  </script>
  
  <style scoped>
  .register-page {
    max-width: 400px;
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
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  .form-group input {
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 6px;
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
  