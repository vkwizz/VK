import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { PlayerProvider } from './context/PlayerContext'
import ErrorBoundary from './components/ErrorBoundary'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

const GOOGLE_CLIENT_ID = "546695716908-08er461t7vhptajuhqg5j1ifhkoae3rp.apps.googleusercontent.com"; // User must replace this

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
