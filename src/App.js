import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import NotFound from "./pages/NotFound";
import Cashbook from "./pages/CashBook";
import SettingsPage from "./pages/Setting";
import CompanyInvites from "./pages/CompanyInvites";
import HelpPage from "./pages/Help";
import MyInvites from "./pages/invites";
import EmployeeManagement from "./pages/EmployeeManagement";
import PunchAttendance from "./pages/PunchAttendance";

function AppContent() {
  const { user, loading, mustSelectCompany } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          user && !mustSelectCompany ? <Navigate to="/home" replace /> : <Login />
        }
      />
      <Route
        path="/signup"
        element={
          user ? <Navigate to={mustSelectCompany ? "/login" : "/home"} replace /> : <Signup />
        }
      />

      {/* Protected Routes - Only accessible after company selection */}
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

      <Route
        path="/cashbook"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Cashbook />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company-invites"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CompanyInvites />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendence"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PunchAttendance />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <MainLayout>
              <HelpPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-invites"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyInvites />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EmployeeManagement />
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