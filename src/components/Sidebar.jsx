import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTachometerAlt,
  FaClock,
  FaHistory,
  FaCalendarAlt,
  FaFileAlt,
  FaMoneyBillWave,
  FaWallet,
  FaPlaneDeparture,
  FaUser,
  FaBell
} from "react-icons/fa";

export default function Sidebar({ 
  isCollapsed, 
  setIsCollapsed,
  isMobile,
  setIsMobileMenuOpen 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // For desktop: expand on hover, for mobile: always expanded
  const isExpanded = isMobile ? true : (isHovered || !isCollapsed);
  
  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Sidebar items config
  const items = [
    { name: "Dashboard", path: "/", icon: FaTachometerAlt },
    { name: "Punch Attendance", path: "/punch-attendance", icon: FaClock },
    { name: "Attendance History", path: "/attendance-history", icon: FaHistory },
    { name: "Attendance Calendar", path: "/attendance-calendar", icon: FaCalendarAlt },
    { name: "Regularization", path: "/regularization", icon: FaFileAlt },
    { name: "My Requests", path: "/my-requests", icon: FaFileAlt },
    { name: "Salary Preview", path: "/salary-preview", icon: FaMoneyBillWave },
    { name: "Salary History", path: "/salary-history", icon: FaHistory },
    { name: "Salary Advance", path: "/salary-advance", icon: FaWallet },
    { name: "Apply Leave", path: "/apply-leave", icon: FaPlaneDeparture },
    { name: "Leave History", path: "/leave-history", icon: FaHistory },
    { name: "Profile", path: "/employee-profile", icon: FaUser },
    { name: "Notifications", path: "/notifications", icon: FaBell },
  ];

  return (
    <motion.aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={`
        h-full flex flex-col bg-white shadow-xl border-r border-slate-200
        ${isMobile ? 'w-64' : (isExpanded ? 'w-64' : 'w-20')}
      `}
      initial={{ width: isCollapsed && !isMobile ? 80 : 256 }}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ scale: 1.02, x: isExpanded ? 2 : 0 }}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center p-3 rounded-xl cursor-pointer relative
                transition-all duration-200 group
                ${isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }
                ${!isExpanded ? "justify-center" : "space-x-3"}
              `}
              title={!isExpanded ? item.name : ""}
            >
              {/* Icon */}
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
              
              {/* Text */}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden min-w-0"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  layoutId="activeIndicator"
                />
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Collapse Toggle - Desktop Only */}
      {!isMobile && (
        <div className="p-4 border-t border-slate-200">
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </motion.button>
        </div>
      )}
    </motion.aside>
  );
}
