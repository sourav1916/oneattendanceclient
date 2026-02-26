// components/Sidebar.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermission } from "../context/PermissionContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTachometerAlt, FaUsers, FaClock, FaFileAlt, FaChartBar, 
  FaBriefcase, FaShieldAlt, FaUser, FaChevronRight,
  FaSignOutAlt, FaCog
} from "react-icons/fa";

const menuItems = [
  { title: "Dashboard", icon: FaTachometerAlt, path: "/", permission: null },
  { title: "Employees", icon: FaUsers, path: "/employees", permission: "view_employees" },
  { title: "Attendance", icon: FaClock, path: "/attendance", permission: "view_attendance" },
  { title: "Leaves", icon: FaFileAlt, path: "/leaves", permission: "view_leaves" },
  { title: "Reports", icon: FaChartBar, path: "/reports", permission: "view_reports" },
  { title: "Companies", icon: FaBriefcase, path: "/companies", permission: "manage_companies" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isHovered || !isCollapsed;

  // Debug: Log permissions
  console.log("Current user:", user);
  console.log("Has view_employees permission:", hasPermission("view_employees"));
  console.log("Has view_attendance permission:", hasPermission("view_attendance"));
  console.log("Has view_leaves permission:", hasPermission("view_leaves"));
  console.log("Has view_reports permission:", hasPermission("view_reports"));
  console.log("Has manage_companies permission:", hasPermission("manage_companies"));

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full bg-white shadow-xl border-r border-slate-200 overflow-hidden relative"
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
          
      {/* Menu Items */}
      <nav className="p-3 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ height: 'calc(100vh - 200px)' }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          
          // Debug: Check each item
          console.log(`Checking ${item.title}:`, {
            permission: item.permission,
            hasAccess: !item.permission || hasPermission(item.permission)
          });

          const hasAccess = true; // TEMPORARY: Show all items for debugging
          
          if (!hasAccess) return null;

          const isActive = location.pathname === item.path;

          return (
            <motion.a
              key={item.path}
              href={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: isExpanded ? 5 : 0 }}
              className={`
                flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
                ${isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
                ${!isExpanded ? 'justify-center' : 'space-x-3'}
              `}
              title={!isExpanded ? item.title : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && isExpanded && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
                />
              )}

              {/* Tooltip for mini mode */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.title}
                </div>
              )}
            </motion.a>
          );
        })}
      </nav>

      
    </motion.aside>
  );
}