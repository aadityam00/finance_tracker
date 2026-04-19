import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://finance-tracker-w00v.onrender.com'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
