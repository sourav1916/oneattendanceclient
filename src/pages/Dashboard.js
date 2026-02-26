import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminMainLayout from "../layout/AdminMainLayout";
import Home from "./Enduser/Home";
import AdminHome from "./Admin/Home";
import Attendance from "./Enduser/Attandance";
import History from "./Enduser/History";
import LeaveManagement from "./Enduser/LeaveManagement";
import MyProfile from "./Enduser/Profile";
import WorkingHoursSummary from "./Enduser/Summary";
import Notifications from "./Enduser/Notification";
import Settings from "./Enduser/Settings";
import EndUserMainLayout from "../layout/EndUserMainLayout";

const Dashboard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin gets MainLayout
  if (user.is_system_admin) {
    return (
      <AdminMainLayout>
        <Routes>
          <Route path="/" element={<AdminHome />} />
        </Routes>
      </AdminMainLayout>
    );
  }

  // Enduser gets simple layout or direct Home
  return (
    <EndUserMainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="history" element={<History />} />
        <Route path="leave-management" element={<LeaveManagement />} />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="working-hours-summary" element={<WorkingHoursSummary />} />
        <Route path="notification" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </EndUserMainLayout>
  );
};
export default Dashboard;
