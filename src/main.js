// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

const app = createApp(App)

// Wichtig: Für Session-Cookies bei Fetch: credentials: 'include'
// => Siehe einzelne Fetch-Aufrufe in den Komponenten

app.use(router)
app.mount('#app')
