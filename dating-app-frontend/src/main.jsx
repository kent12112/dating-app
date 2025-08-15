import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import './index.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import your Publishable Key
const PUBLISHABLE_KEY = "pk_test_ZGl2aW5lLXNlYWd1bGwtOTUuY2xlcmsuYWNjb3VudHMuZGV2JA"

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
    </ClerkProvider>
  </StrictMode>,
)
