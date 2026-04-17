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
import MyShifts from "./pages/MyShifts";
import MySalary from "./pages/MySalary";
import SalaryManagementHub from "./pages/SalaryManagementHub";
import AttendanceManagement from "./pages/AttendanceManagement";
import PendingAttendance from "./pages/PendingAttendance";
import PermissionManagement from "./pages/PermissionManagement";
import CompanyHolidays from "./pages/HolidayManagement";
import Holidays from "./pages/Holidays";
import LeaveManagementHub from "./pages/LeaveManagementHub";
import PayrollManagement from "./pages/PayrollManagement";
import CompanySettings from "./pages/CompanySettings";
import EmployeesShifts from "./pages/EmployeesShifts";
import GlobalSkeleton from "./components/GlobalSkeletonComponent";
import ScrollToTop from "./components/ScrollToTop";
import ProfilePage from "./pages/Profile";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeManagementHub from "./pages/EmployeeManagementHub";
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
      <ScrollToTop />
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
        <Route path="/company-invites" element={ <ProtectedRoute><Navigate to="/employee-management?tab=invites" replace /></ProtectedRoute>}/>
        <Route path="/attendance"element={<ProtectedRoute><MainLayout><PunchAttendance /></MainLayout></ProtectedRoute>} />
        <Route path="/attendance-history"element={<ProtectedRoute><MainLayout><AttendanceHistory /></MainLayout></ProtectedRoute>} />
        <Route path="/my-shifts"element={<ProtectedRoute><MainLayout><MyShifts /></MainLayout></ProtectedRoute>} />
        <Route path="/my-salary"element={<ProtectedRoute><MainLayout><MySalary /></MainLayout></ProtectedRoute>} />
        <Route path="/attendance-management"element={<ProtectedRoute><MainLayout><AttendanceManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/salary-management"element={<ProtectedRoute><MainLayout><SalaryManagementHub /></MainLayout></ProtectedRoute>} />
        <Route path="/salary-components-management"element={<ProtectedRoute><Navigate to="/salary-management?tab=components" replace /></ProtectedRoute>} />
        <Route path="/salary-package-management"element={<ProtectedRoute><Navigate to="/salary-management?tab=packages" replace /></ProtectedRoute>} />
        <Route path="/employees-shifts"element={<ProtectedRoute><Navigate to="/employee-management?tab=shifts" replace /></ProtectedRoute>} />
        <Route path="/leave-management"element={<ProtectedRoute><MainLayout><LeaveManagementHub /></MainLayout></ProtectedRoute>} />
        <Route path="/pending-attendance"element={<ProtectedRoute><MainLayout><PendingAttendance /></MainLayout></ProtectedRoute>} />
        <Route path="/holiday-management"element={<ProtectedRoute><MainLayout><CompanyHolidays /></MainLayout></ProtectedRoute>} />
        <Route path="/holidays"element={<ProtectedRoute><MainLayout><Holidays /></MainLayout></ProtectedRoute>} />
        <Route path="/help"element={<ProtectedRoute><MainLayout><HelpPage /></MainLayout></ProtectedRoute> } />
        <Route path="/my-leaves"element={<ProtectedRoute><MainLayout><MyLeave /></MainLayout></ProtectedRoute> } />
        <Route path="/my-invites"element={<ProtectedRoute><MainLayout> <MyInvites /></MainLayout></ProtectedRoute> }/>
        <Route path="/employee-management"element={<ProtectedRoute><MainLayout><EmployeeManagementHub /></MainLayout></ProtectedRoute>} />
        <Route path="/company-settings"element={<ProtectedRoute><MainLayout><CompanySettings /></MainLayout></ProtectedRoute>} />
        <Route path="/permission-management"element={<ProtectedRoute><MainLayout><PermissionManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/leave-config"element={<ProtectedRoute><Navigate to="/leave-management?tab=config" replace /></ProtectedRoute>} />
        <Route path="/leave-balance"element={<ProtectedRoute><Navigate to="/leave-management?tab=balance" replace /></ProtectedRoute>} />
        <Route path="/payroll-management"element={<ProtectedRoute><MainLayout><PayrollManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/employee-profile/:employeeId" element={<ProtectedRoute><MainLayout><EmployeeProfile /></MainLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
