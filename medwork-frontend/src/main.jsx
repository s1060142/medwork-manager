import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { it } from 'date-fns/locale'
import theme from './theme'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
        <CssBaseline />
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
)

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Clear service worker cache and unregister before React mounts
  // This prevents stale PROD bundle from being served to real browsers
  if (navigator.serviceWorker.controller) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key))
    }).catch(() => {})
    navigator.serviceWorker.controller.unregister().catch(() => {})
  }
  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister().catch(() => {})
  })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
