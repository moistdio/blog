// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import BlogGrid from './components/BlogGrid.vue'
import UploadPage from './components/UploadPage.vue'
import LoginPage from './components/LoginPage.vue'
import RegisterPage from './components/RegisterPage.vue'
// Neue Komponente fürs Editieren importieren
import EditPage from './components/EditPage.vue'

const routes = [
  { path: '/', name: 'Home', component: BlogGrid },
  { path: '/upload', name: 'Upload', component: UploadPage },
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/register', name: 'Register', component: RegisterPage },
  // Neue Route zum Editieren
  { path: '/edit/:id', name: 'Edit', component: EditPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
