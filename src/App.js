import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import PunchAttendance from "./pages/employee/PunchAttendance";
import AttendanceHistory from "./pages/employee/AttendanceHistory";
import AttendanceCalendar from "./pages/employee/AttendanceCalendar";
import RegularizationRequest from "./pages/employee/RegularizationRequest";
import MyRequests from "./pages/employee/MyRequests";
import SalaryPreview from "./pages/employee/SalaryPreview";
import SalaryHistory from "./pages/employee/SalaryHistory";
import SalaryAdvance from "./pages/employee/SalaryAdvance";
import ApplyLeave from "./pages/employee/ApplyLeave";
import LeaveHistory from "./pages/employee/LeaveHistory";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import Notifications from "./pages/employee/Notifications";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";
import { motion } from "framer-motion";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="punch-attendance" element={<PunchAttendance />} />
          <Route path="attendance-history" element={<AttendanceHistory />} />
          <Route path="attendance-calendar" element={<AttendanceCalendar />} />
          <Route path="regularization" element={<RegularizationRequest />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="salary-preview" element={<SalaryPreview />} />
          <Route path="salary-history" element={<SalaryHistory />} />
          <Route path="salary-advance" element={<SalaryAdvance />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-history" element={<LeaveHistory />} />
          <Route path="employee-profile" element={<EmployeeProfile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}