// layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false); // ✅ State here

  return (
    <div className="h-screen bg-slate-950/50 backdrop-blur-xl overflow-hidden flex flex-col">
      <Navbar isCollapsed={isCollapsed} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* ✅ PASS BOTH isCollapsed AND setIsCollapsed */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        <main className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
