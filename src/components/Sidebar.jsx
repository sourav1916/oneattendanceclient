// components/Sidebar.jsx
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

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || !isCollapsed;

  // ✅ Sidebar items config
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full bg-white shadow-xl border-r border-slate-200 overflow-hidden"
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.2 }}
    >
      <nav className="p-3 space-y-1 overflow-y-auto h-full">

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
              onClick={() => navigate(item.path)}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer relative
                transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
                ${!isExpanded ? "justify-center" : "space-x-3"}
              `}
            >
              {/* Icon */}
              <Icon className="w-5 h-5 flex-shrink-0" />

              {/* Text */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {isActive && isExpanded && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
                />
              )}
            </motion.div>
          );
        })}
      </nav>
    </motion.aside>
  );
}
