import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import axios from 'axios'

const rawBaseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000'
axios.defaults.baseURL = rawBaseURL.replace(/\/+$/, '')

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)

// Progressive Web App (PWA) Service Worker Registration
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker active with scope:', registration.scope)
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration notice:', err.message)
      })
  })
}
