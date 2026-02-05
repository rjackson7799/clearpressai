import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { installGlobalErrorHandler } from './lib/global-error-handler'
import App from './App.tsx'

// Install global error capturing before React mounts
installGlobalErrorHandler();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
