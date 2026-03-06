import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import NotFound from './pages/NotFound';

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected routes with layout */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return <AppContent />;
}
