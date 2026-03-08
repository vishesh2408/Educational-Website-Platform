import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { BrowserRouter as Router } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ModalProvider } from './contexts/ModalContext';
import { ToastProvider } from './contexts/ToastContext';
import { MenuProvider } from './contexts/MenuContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ModalProvider>
        <ThemeProvider>
          <ToastProvider>
            <MenuProvider>
              <AuthProvider>
                <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                  <App />
                </GoogleOAuthProvider>
              </AuthProvider>
            </MenuProvider>
          </ToastProvider>
        </ThemeProvider>
      </ModalProvider>
    </Router>
  </React.StrictMode>
);



