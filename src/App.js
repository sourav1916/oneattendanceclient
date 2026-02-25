// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen for storage changes (including logout from other tabs)
  const handleStorageChange = useCallback(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    setIsAuth(!!(token && user));
  }, []);

  useEffect(() => {
    handleStorageChange();
    setLoading(false);

    // Listen for logout from other tabs
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* ✅ Dashboard handles MainLayout internally */}
        <Route path="/" element={<Dashboard />} />
        
        <Route path="*" element={<Navigate to={isAuth ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
