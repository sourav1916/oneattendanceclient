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

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered || !isCollapsed;

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full bg-white shadow-xl border-r border-slate-200 overflow-hidden relative"
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Menu Items - Manual Typed */}
      <nav className="p-3 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ height: 'calc(100vh - 200px)' }}>
        
        {/* Dashboard */}
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0 * 0.05 }}
          whileHover={{ x: isExpanded ? 5 : 0 }}
          className={`
            flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
            ${location.pathname === "/" 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }
            ${!isExpanded ? 'justify-center' : 'space-x-3'}
          `}
          title={!isExpanded ? "Dashboard" : ''}
        >
          <FaTachometerAlt className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Dashboard
              </motion.span>
            )}
          </AnimatePresence>
          {location.pathname === "/" && isExpanded && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
            />
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Dashboard
            </div>
          )}
        </motion.a>

        {/* Employees */}
        <motion.a
          href="/profile"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 * 0.05 }}
          whileHover={{ x: isExpanded ? 5 : 0 }}
          className={`
            flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
            ${location.pathname === "/profile" 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }
            ${!isExpanded ? 'justify-center' : 'space-x-3'}
          `}
          title={!isExpanded ? "Employees" : ''}
        >
          <FaUsers className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Profile
              </motion.span>
            )}
          </AnimatePresence>
          {location.pathname === "/profile" && isExpanded && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
            />
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Profile
            </div>
          )}
        </motion.a>

        {/* Attendance */}
        <motion.a
          href="/attendance"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 * 0.05 }}
          whileHover={{ x: isExpanded ? 5 : 0 }}
          className={`
            flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
            ${location.pathname === "/attendance" 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }
            ${!isExpanded ? 'justify-center' : 'space-x-3'}
          `}
          title={!isExpanded ? "Attendance" : ''}
        >
          <FaClock className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Attendance
              </motion.span>
            )}
          </AnimatePresence>
          {location.pathname === "/attendance" && isExpanded && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
            />
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Attendance
            </div>
          )}
        </motion.a>

        {/* Leaves */}
        <motion.a
          href="/leaves"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3 * 0.05 }}
          whileHover={{ x: isExpanded ? 5 : 0 }}
          className={`
            flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
            ${location.pathname === "/leaves" 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }
            ${!isExpanded ? 'justify-center' : 'space-x-3'}
          `}
          title={!isExpanded ? "Leaves" : ''}
        >
          <FaFileAlt className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Leaves
              </motion.span>
            )}
          </AnimatePresence>
          {location.pathname === "/leaves" && isExpanded && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
            />
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Leaves
            </div>
          )}
        </motion.a>

        {/* Reports */}
        <motion.a
          href="/reports"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 4 * 0.05 }}
          whileHover={{ x: isExpanded ? 5 : 0 }}
          className={`
            flex items-center p-2 rounded-lg transition-all duration-200 relative cursor-pointer
            ${location.pathname === "/reports" 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }
            ${!isExpanded ? 'justify-center' : 'space-x-3'}
          `}
          title={!isExpanded ? "Reports" : ''}
        >
          <FaChartBar className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Reports
              </motion.span>
            )}
          </AnimatePresence>
          {location.pathname === "/reports" && isExpanded && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
            />
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Reports
            </div>
          )}
        </motion.a>

      </nav>
    </motion.aside>
  );
}
