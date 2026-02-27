// components/AdminNavbar.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBell, FaSearch, FaChevronDown, FaSignOutAlt, 
  FaCog, FaRocket, FaMoon, FaSun, FaCloudSun,
  FaShieldAlt, FaUserCog
} from "react-icons/fa";

export default function AdminNavbar({ isCollapsed }) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm w-auto flex-shrink-0"
      style={{ 
        transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out'
      }}
    >
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left Section - Logo and Admin Badge */}
        <div className="flex items-center flex-1">
          <AnimatePresence>
            {isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 mr-8"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                  <FaShieldAlt className="text-sm text-white" />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-800 font-semibold text-base"
                >
                  Admin Portal
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin Badge - Always visible */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden md:flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-lg ml-4"
          >
            <FaUserCog className="text-purple-600 text-sm" />
            <span className="text-sm font-medium text-purple-700">Admin Access</span>
          </motion.div>
        </div>

        {/* Search Bar - Admin Style */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees, reports, settings..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 ml-4">
          {/* Mobile Search Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FaSearch className="w-4 h-4" />
          </motion.button>

          {/* Weather Widget */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <FaCloudSun className="text-amber-500 text-lg" />
            <div className="text-sm whitespace-nowrap">
              <span className="font-semibold text-slate-800">29°C</span>
              <span className="text-slate-500 ml-1">Sunny</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isDarkMode ? <FaSun className="w-4 h-4" /> : <FaMoon className="w-4 h-4" />}
          </motion.button>

          {/* Notifications - Admin Style with more alerts */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FaBell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center text-white font-medium">
              8
            </span>
          </motion.button>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-slate-800 font-medium text-sm whitespace-nowrap">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-purple-600 capitalize whitespace-nowrap">
                  {user?.role || 'Super Admin'}
                </p>
              </div>
              <motion.div
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="w-3 h-3 text-slate-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || 'admin@company.com'}</p>
                  </div>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <FaUserCog className="w-4 h-4 mr-2 text-slate-400" />
                    Admin Settings
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <FaCog className="w-4 h-4 mr-2 text-slate-400" />
                    System Preferences
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 pb-3"
          >
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}