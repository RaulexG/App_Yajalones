import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Styles/tailwind.css'
import App from './App.jsx'

//solo para pruebas web
import './devAuthShim';


createRoot(document.getElementById('root')).render(
  
  <StrictMode>
    <App />
  </StrictMode>,
)
