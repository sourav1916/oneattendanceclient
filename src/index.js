import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { PermissionProvider } from './context/PermissionContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider> 
      <AuthProvider>
        <CompanyProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);