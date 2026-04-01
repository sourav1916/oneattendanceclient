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
import SettingsPage from "./pages/Setting";
import CompanyInvites from "./pages/CompanyInviteManagement";
import HelpPage from "./pages/Help";
import MyInvites from "./pages/invites";
import MyLeave from "./pages/MyLeave";
import EmployeeManagement from "./pages/EmployeeManagement";
import PunchAttendance from "./pages/PunchAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import AttendanceManagement from "./pages/AttendanceManagement";
import PendingAttendance from "./pages/PendingAttendance";
import PermissionManagement from "./pages/PermissionManagement";
import LeaveManagement from "./pages/LeaveManagement";
import CompanySettings from "./pages/CompanySettings";
import GlobalSkeleton from "./components/GlobalSkeletonComponent";
import ProfilePage from "./pages/Profile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppContent() {
  const { user, loading, mustSelectCompany } = useAuth();


  // Show loading state
  if (loading) {
    return (
      <GlobalSkeleton/>
    );
  }

  return (
    <>
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
        <Route path="/home"element={<ProtectedRoute> <MainLayout> <Home /> </MainLayout> </ProtectedRoute>}/>
        <Route path="/profile"element={<ProtectedRoute> <MainLayout> <ProfilePage /> </MainLayout> </ProtectedRoute>}/>
        <Route path="/settings" element={ <ProtectedRoute> <MainLayout> <SettingsPage /> </MainLayout> </ProtectedRoute> }/>
        <Route path="/company-invites" element={ <ProtectedRoute><MainLayout><CompanyInvites /></MainLayout></ProtectedRoute>}/>
        <Route path="/attendance"element={<ProtectedRoute><MainLayout><PunchAttendance /></MainLayout></ProtectedRoute>} />
        <Route path="/attendance-history"element={<ProtectedRoute><MainLayout><AttendanceHistory /></MainLayout></ProtectedRoute>} />
        <Route path="/attendance-management"element={<ProtectedRoute><MainLayout><AttendanceManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/leave-management"element={<ProtectedRoute><MainLayout><LeaveManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/pending-attendance"element={<ProtectedRoute><MainLayout><PendingAttendance /></MainLayout></ProtectedRoute>} />
        <Route path="/help"element={<ProtectedRoute><MainLayout><HelpPage /></MainLayout></ProtectedRoute> } />
        <Route path="/my-leaves"element={<ProtectedRoute><MainLayout><MyLeave /></MainLayout></ProtectedRoute> } />
        <Route path="/my-invites"element={<ProtectedRoute><MainLayout> <MyInvites /></MainLayout></ProtectedRoute> }/>
        <Route path="/employee-management"element={<ProtectedRoute><MainLayout><EmployeeManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/company-settings"element={<ProtectedRoute><MainLayout><CompanySettings /></MainLayout></ProtectedRoute>} />
        <Route path="/permission-management"element={<ProtectedRoute><MainLayout><PermissionManagement /></MainLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
