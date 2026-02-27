import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";
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

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-xl font-semibold text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Fixed: Always render ONE layout based on user */}
        <Route
          path="/"
          element={
            user ? (
              user.is_system_admin ? <AdminLayout /> : <EmployeeLayout />
            ) : (
              <ProtectedRoute />
            )
          }
        >
          {/* Admin routes */}
          {user?.is_system_admin ? (
            <>
              <Route index element={<AdminDashboard />} />
            </>
          ) : null}
          
          {/* Employee routes */}
          {!user?.is_system_admin && user ? (
            <>
              <Route index element={<EmployeeDashboard />} />
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
            </>
          ) : null}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
