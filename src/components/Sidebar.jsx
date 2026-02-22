import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Clients", path: "/clients" },
    { name: "Attendance", path: "/attendance" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div
      className={`h-screen bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <h1 className="text-xl font-bold">OneAttendance</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white"
        >
          ☰
        </button>
      </div>

      {/* Menu */}
      <ul className="mt-4">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className={`block px-6 py-3 hover:bg-slate-700 transition ${
                location.pathname === item.path
                  ? "bg-slate-700"
                  : ""
              }`}
            >
              {!collapsed ? item.name : item.name.charAt(0)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
