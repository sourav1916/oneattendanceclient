import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermission } from "../context/PermissionContext";
import { useAuth } from "../context/AuthContext";
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
  FaBell,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile,
  setIsMobileMenuOpen
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Define all possible menu items with their permission requirements
  const allItems = [
    // Everyone can see dashboard
    { name: "Dashboard", path: "/", icon: FaTachometerAlt, alwaysShow: true },
    
    // Employee self-service features (available to all employees)
    { name: "Punch Attendance", path: "/punch-attendance", icon: FaClock, alwaysShow: true },
    { name: "Attendance History", path: "/attendance-history", icon: FaHistory, alwaysShow: true },
    { name: "Attendance Calendar", path: "/attendance-calendar", icon: FaCalendarAlt, alwaysShow: true },
    { name: "Regularization", path: "/regularization", icon: FaFileAlt, alwaysShow: true },
    { name: "My Requests", path: "/my-requests", icon: FaFileAlt, alwaysShow: true },
    { name: "Salary Preview", path: "/salary-preview", icon: FaMoneyBillWave, alwaysShow: true },
    { name: "Salary History", path: "/salary-history", icon: FaHistory, alwaysShow: true },
    { name: "Salary Advance", path: "/salary-advance", icon: FaWallet, alwaysShow: true },
    { name: "Apply Leave", path: "/apply-leave", icon: FaPlaneDeparture, alwaysShow: true },
    { name: "Leave History", path: "/leave-history", icon: FaHistory, alwaysShow: true },
    { name: "Profile", path: "/employee-profile", icon: FaUser, alwaysShow: true },
    { name: "Notifications", path: "/notifications", icon: FaBell, alwaysShow: true },
    
    // Team Lead only features (requires TL_VEW permission)
    { 
      name: "Team Members", 
      path: "/team-members", 
      icon: FaUsers, 
      permissionCode: "TL_VEW",  // Your backend permission code
      description: "View and manage your team"
    },
    
    // You can add more permission-based items
    { 
      name: "Approve Requests", 
      path: "/approve-requests", 
      icon: FaCheckCircle, 
      permissionCode: "TL_VEW",  // Same permission for multiple features
      description: "Approve team requests"
    },
    { 
      name: "Team Attendance", 
      path: "/team-attendance", 
      icon: FaClock, 
      permissionCode: "TL_VEW",
      description: "View team attendance"
    }
  ];

  // Filter items based on permissions
  const items = allItems.filter(item => {
    // Show if alwaysShow is true OR user has the required permission
    return item.alwaysShow || (item.permissionCode && hasPermission(item.permissionCode));
  });

  const isExpanded = isMobile ? true : (isHovered || !isCollapsed);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

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
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />

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

              {/* Show permission badge for team lead items (optional) */}
              {isExpanded && item.permissionCode && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                >
                  Team Lead
                </motion.span>
              )}

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

      {!isMobile && (
        <div className="hidden p-4 border-t border-slate-200">
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