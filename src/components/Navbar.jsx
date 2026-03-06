import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCompany } from "../context/CompanyContext";
import { usePermission } from "../context/PermissionContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBell, FaChevronDown, FaSignOutAlt, 
  FaCog, FaRocket, FaMoon, FaSun, FaCloudSun,
  FaBars, FaTimes, FaUserCircle, FaShieldAlt,
  FaQuestionCircle, FaKeyboard, FaPalette,
  FaGlobe, FaLock, FaBell as FaBellIcon
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import CompanySwitcher from "./CompanySwitcher";

export default function Navbar({ 
  isCollapsed, 
  isMobile, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}) {
  const { user, logout } = useAuth();
  const { companies, activeCompany } = useCompany();
  const { hasPermission } = usePermission();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [weather, setWeather] = useState({ temp: 29, condition: "Sunny" });
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Attendance Reminder", read: false, time: "5 min ago" },
    { id: 2, title: "Leave Approved", read: false, time: "1 hour ago" },
    { id: 3, title: "Salary Slip Generated", read: true, time: "2 hours ago" },
  ]);
  const navigate = useNavigate();

  // Simulate weather fetch (replace with actual API)
  useEffect(() => {
    // You can replace this with actual weather API
    const fetchWeather = () => {
      // Mock weather based on time
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) {
        setWeather({ temp: 24, condition: "Morning" });
      } else if (hour >= 12 && hour < 18) {
        setWeather({ temp: 29, condition: "Sunny" });
      } else {
        setWeather({ temp: 22, condition: "Clear" });
      }
    };
    fetchWeather();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNavigate = (path) => {
    navigate(path);
    setShowProfileMenu(false);
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const hasMultipleCompanies = companies && companies.length > 1;
  const isTeamLead = hasPermission('TL_VEW');

  // Animation variants
  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm w-full h-16 flex-shrink-0 relative z-50"
    >
      <div className="px-3 md:px-4 h-full flex items-center justify-between">
        {/* Left Section - Logo and Menu Toggle */}
        <div className="flex items-center flex-1 min-w-0">
          {isMobile && (
            <motion.button
              id="hamburger-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 mr-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </motion.button>
          )}
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <FaRocket className="text-sm text-white" />
            </div>
            <span className="text-slate-800 dark:text-white font-semibold text-base whitespace-nowrap hidden sm:inline">
              OneAttendance
            </span>
          </motion.div>

          {/* Company Badge for Mobile */}
          {activeCompany && isMobile && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
            >
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {activeCompany.name}
              </span>
            </motion.div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Company Switcher - Show if multiple companies */}
          {hasMultipleCompanies && (
            <div className="hidden sm:block">
              <CompanySwitcher />
            </div>
          )}

          {/* Weather Widget */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg cursor-default"
          >
            <FaCloudSun className={`text-lg ${
              weather.condition === 'Sunny' ? 'text-amber-500' : 
              weather.condition === 'Morning' ? 'text-orange-400' : 
              'text-indigo-400'
            }`} />
            <div className="text-sm whitespace-nowrap">
              <span className="font-semibold text-slate-800 dark:text-white">
                {weather.temp}°C
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-1 hidden lg:inline">
                {weather.condition}
              </span>
            </div>
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            aria-label="Toggle theme"
          >
            <motion.div
              animate={{ rotate: isDarkMode ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {isDarkMode ? (
                <FaSun className="w-4 h-4 text-amber-500" />
              ) : (
                <FaMoon className="w-4 h-4 text-indigo-500" />
              )}
            </motion.div>
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
              aria-label="Notifications"
            >
              <FaBell className="w-4 h-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-xs rounded-full flex items-center justify-center text-white font-medium"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: index * 0.05 }}
                          className={`p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                            !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => handleNavigate('/notifications')}
                        >
                          <div className="flex justify-between items-start">
                            <p className={`text-sm ${
                              !notification.read 
                                ? 'font-semibold text-slate-800 dark:text-white' 
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {notification.time}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleNavigate('/notifications')}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-1"
                    >
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
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-slate-800 dark:text-white font-medium text-sm truncate max-w-32">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate flex items-center">
                  {user?.roleBadge || 'Employee'}
                  {isTeamLead && (
                    <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-medium">
                      TL
                    </span>
                  )}
                  {activeCompany?.name && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="truncate max-w-16">{activeCompany.name}</span>
                    </>
                  )}
                </p>
              </div>
              <motion.div
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  variants={menuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {user?.name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {user?.email}
                    </p>
                    {isTeamLead && (
                      <div className="mt-2 inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FaShieldAlt className="w-3 h-3 text-purple-600 dark:text-purple-400 mr-1" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Team Lead
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/employee-profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaUserCircle className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Your Profile
                    </motion.button>

                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/settings')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaCog className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Settings
                    </motion.button>

                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/appearance')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaPalette className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Appearance
                    </motion.button>

                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/notifications')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaBellIcon className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </motion.button>

                    <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>

                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/help')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaQuestionCircle className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Help & Support
                    </motion.button>

                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleNavigate('/shortcuts')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <FaKeyboard className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" />
                      Keyboard Shortcuts
                    </motion.button>

                    <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>

                    <motion.button
                      variants={itemVariants}
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FaSignOutAlt className="w-4 h-4 mr-3" />
                      Logout
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 mt-1">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Version 1.0.0
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}