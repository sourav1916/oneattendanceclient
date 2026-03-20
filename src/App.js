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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="text-right">
              <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse mb-1 ml-auto"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200 mb-8"></div>
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full h-px bg-gray-200 mb-8"></div>
          <div className="h-5 w-28 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse mb-3"></div>

            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-4 w-4/5 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/home" replace /> : <Signup />}
      />

      {/* Protected */}
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