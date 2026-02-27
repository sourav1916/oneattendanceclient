// components/Sidebar.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ScrollableArea from "../components/ScrollbarArea";

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
    {
      name: "Dashboard",
      path: "/",
      icon: FaTachometerAlt,
    },
    {
      name: "Punch Attendance",
      path: "/punch-attendance",
      icon: FaClock,
    },
    {
      name: "Attendance History",
      path: "/attendance-history",
      icon: FaHistory,
    },
    {
      name: "Attendance Calendar",
      path: "/attendance-calendar",
      icon: FaCalendarAlt,
    },
    {
      name: "Regularization",
      path: "/regularization",
      icon: FaFileAlt,
    },
    {
      name: "My Requests",
      path: "/my-requests",
      icon: FaFileAlt,
    },
    {
      name: "Salary Preview",
      path: "/salary-preview",
      icon: FaMoneyBillWave,
    },
    {
      name: "Salary History",
      path: "/salary-history",
      icon: FaHistory,
    },
    {
      name: "Salary Advance",
      path: "/salary-advance",
      icon: FaWallet,
    },
    {
      name: "Apply Leave",
      path: "/apply-leave",
      icon: FaPlaneDeparture,
    },
    {
      name: "Leave History",
      path: "/leave-history",
      icon: FaHistory,
    },
    {
      name: "Profile",
      path: "/employee-profile",
      icon: FaUser,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: FaBell,
    },
  ];

  return (
    <motion.aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={`
        h-full bg-white shadow-xl border-r border-slate-200
        ${isMobile ? 'w-64 h-[calc(100vh-4rem)]' : ''}
      `}
      animate={{ 
        width: isExpanded ? 256 : 80
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Use ScrollableArea for the navigation */}
      <ScrollableArea 
        variant={isExpanded ? "gradient" : "thin"}
        className="h-full"
        showGradient={isExpanded}
        maxHeight="100%"
      >
        <nav className="p-3 space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ x: isExpanded ? 5 : 0 }}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center p-3 rounded-lg cursor-pointer relative
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                  ${!isExpanded ? "justify-center" : "space-x-3"}
                `}
                title={!isExpanded ? item.name : ""}
              >
                {/* Icon */}
                <Icon className="w-5 h-5 flex-shrink-0" />

                {/* Text - Only show when expanded */}
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active indicator - Only show when expanded */}
                {isActive && isExpanded && (
                  <motion.div
                    layoutId="activeIndicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
                  />
                )}

                {/* Active indicator for collapsed state - small dot */}
                {isActive && !isExpanded && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </nav>
      </ScrollableArea>

      {/* Collapse/Expand Toggle Button - Only show on desktop */}
      {!isMobile && (
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-white border border-slate-200 rounded-lg shadow-md hover:bg-slate-50 transition-colors z-10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </motion.div>
        </motion.button>
      )}
    </motion.aside>
  );
}