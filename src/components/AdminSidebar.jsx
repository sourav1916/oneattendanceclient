// components/AdminSidebar.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  FaTachometerAlt,
  FaUserMd,
  FaBuilding
} from "react-icons/fa";

export default function AdminSidebar({ 
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

  // Sidebar items config for Admin
  const items = [
    {
      name: "Dashboard",
      path: "/",
      icon: FaTachometerAlt,
    },
    {
      section: "Employee Management",
      items: [
        {
          name: "All Companies",
          path: "/admin/companies",
          icon: FaBuilding,
        },        
        {
          name: "Attendances",
          path: "/admin/attendance",
          icon: FaUserMd,
        }        
      ]
    }
  ];

  const renderMenuItem = (item, index) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <motion.div
        key={item.path}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        whileHover={{ x: isExpanded ? 5 : 0 }}
        onClick={() => handleNavigation(item.path)}
        className={`
          flex items-center p-3 rounded-lg cursor-pointer relative group
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
              className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && (
          <span className={`
            bg-red-500 text-white text-xs rounded-full px-2 py-0.5
            ${!isExpanded ? 'absolute -top-1 -right-1' : 'ml-auto'}
          `}>
            {item.badge}
          </span>
        )}

        {/* Active indicator */}
        {isActive && isExpanded && (
          <motion.div
            layoutId="adminActiveIndicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
          />
        )}

        {/* Active indicator for collapsed state */}
        {isActive && !isExpanded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"
          />
        )}
      </motion.div>
    );
  };

  return (
    <motion.aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={`
        h-full bg-white shadow-xl border-r border-slate-200 relative
        ${isMobile ? 'w-64 h-[calc(100vh-4rem)]' : ''}
      `}
      animate={{ 
        width: isExpanded ? 256 : 80
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
 
        <nav className="p-3 space-y-2">
          {items.map((item, index) => {
            if (item.section) {
              return (
                <div key={item.section} className="space-y-1">
                  {/* Section Header - Only show when expanded */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-3 pt-2 pb-1"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {item.section}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Section Items */}
                  {item.items.map((subItem, subIndex) => 
                    renderMenuItem(subItem, index + subIndex)
                  )}
                </div>
              );
            }
            
            // Regular menu item
            return renderMenuItem(item, index);
          })}
        </nav>

      {/* Collapse/Expand Toggle Button - Only show on desktop */}
      {!isMobile && (
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-white border border-slate-200 rounded-lg shadow-md hover:bg-slate-50 transition-colors z-10"
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