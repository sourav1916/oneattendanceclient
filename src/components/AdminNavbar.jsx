// components/AdminNavbar.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBell, FaChevronDown, FaSignOutAlt, 
  FaCog, FaRocket, FaMoon, FaSun, FaCloudSun,
  FaBars, FaTimes, FaShieldAlt, FaUserCog,
  FaSearch, FaFilter
} from "react-icons/fa";

export default function AdminNavbar({ 
  isCollapsed, 
  isMobile, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const notifications = [
    { id: 1, text: "5 leave requests pending", time: "5 min ago", type: "leave" },
    { id: 2, text: "3 salary advance requests", time: "1 hour ago", type: "salary" },
    { id: 3, text: "8 attendance regularization", time: "2 hours ago", type: "attendance" },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm w-auto flex-shrink-0 relative z-50"
    >
      <div className="px-3 md:px-4 h-16 flex items-center justify-between">
        {/* Left Section - Logo and Menu Toggle */}
        <div className="flex items-center flex-1">
          {/* Mobile Menu Toggle - Only shows on mobile */}
          {isMobile && (
            <motion.button
              id="admin-hamburger-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 mr-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </motion.button>
          )}
          
          {/* Logo - Shows differently based on screen size */}
          <AnimatePresence mode="wait">
            {(!isMobile || (isMobile && !isMobileMenuOpen)) && (
              <motion.div 
                key="logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <FaShieldAlt className="text-sm text-white" />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-slate-800 font-semibold text-base whitespace-nowrap"
                >
                  {isMobile ? 'Admin' : 'Admin Portal'}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center ml-6 flex-1 max-w-md">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees, attendance, reports..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Right Section - Weather, Search, Notifications, User */}
        <div className="flex items-center space-x-2 md:space-x-3 ml-auto">
          {/* Mobile Search Toggle */}
          {isMobile && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
            >
              <FaSearch className="w-4 h-4" />
            </motion.button>
          )}

          {/* Weather Widget - Hide on very small screens */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <FaCloudSun className="text-amber-500 text-lg" />
            <div className="text-sm whitespace-nowrap">
              <span className="font-semibold text-slate-800">29°C</span>
              <span className="text-slate-500 ml-1 hidden lg:inline">Sunny</span>
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

          {/* Notifications */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FaBell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] rounded-full flex items-center justify-center text-white font-medium">
                {notifications.length}
              </span>
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                  </div>
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className="w-full px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                    >
                      <p className="text-sm text-slate-700">{notif.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                    </button>
                  ))}
                  <div className="px-4 py-2 border-t border-slate-100">
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-slate-800 font-medium text-sm whitespace-nowrap">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-slate-500 capitalize whitespace-nowrap">Administrator</p>
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
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
                >
                  <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <FaUserCog className="w-4 h-4 mr-2 text-slate-400" />
                    Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <FaCog className="w-4 h-4 mr-2 text-slate-400" />
                    Settings
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
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

      {/* Mobile Search Bar - Animated */}
      <AnimatePresence>
        {isMobile && showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3"
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