import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const appContent = (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    ) : (
      appContent
    )}
  </React.StrictMode>,
)
