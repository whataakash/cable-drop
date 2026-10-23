// main.jsx — Application entry point
// Connects styles, React root, and bundled ADB service

import './assets/base.css'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import adb from './adb'

// Connect bundled ADB and verify connection on launch
console.log('[CableDrop] Connecting to bundled ADB...')
adb.getVersion()
  .then((version) => {
    console.log('[CableDrop] Successfully connected to bundled ADB:\n' + version)
  })
  .catch((err) => {
    console.warn('[CableDrop] ADB check warning:', err.message)
  })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
