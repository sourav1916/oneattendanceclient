import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import EmployeeDashboard from "./pages/employee/Dashboard";
import MyAttendance from "./pages/employee/MyAttendance";
import { useAuth } from "./context/AuthContext";
import MyProfile from "./pages/employee/Profile";

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
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="profile" element={<MyProfile />} />
            </>
          ) : null}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
