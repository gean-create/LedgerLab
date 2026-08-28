import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './storageShim.js'
import './index.css'
import LedgerLab from './LedgerLab.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LedgerLab />
  </StrictMode>,
)
