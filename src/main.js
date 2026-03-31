import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useGameStore } from './stores/game'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')

// Expose for debugging/testing
window.useGameStore = () => useGameStore(pinia)
