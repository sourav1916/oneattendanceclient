import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import MainLayout from "../layout/MainLayout";
import Home from "./Enduser/Home";
import AdminHome from "./Admin/Home";

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
      <MainLayout>
        <Routes>
          <Route path="/" element={<AdminHome />} />
        </Routes>
      </MainLayout>
    );
  }

  // Enduser gets simple layout or direct Home
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};
export default Dashboard;
