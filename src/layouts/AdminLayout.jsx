// layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-white overflow-hidden flex flex-col">
      {/* Admin Navbar */}
      <AdminNavbar isCollapsed={isCollapsed} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar */}
        <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        {/* Main Content */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto bg-slate-50"
          style={{
            marginLeft: isCollapsed ? '80px' : '280px',
            transition: 'margin-left 0.2s ease-in-out'
          }}
        >
          <div className="p-6">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
}