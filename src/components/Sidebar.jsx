import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUserClock, FaCalendarAlt, FaUsers, FaClipboardList, 
  FaChartBar, FaFileAlt, FaClock, FaQuestionCircle, FaSignOutAlt,
  FaMoon, FaSun, FaBars
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const isDark = !prev;
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      return isDark;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: FaHome, path: '/home' },
    { id: 'attendance', label: 'Attendance', icon: FaUserClock, path: '/attendance' },
    { id: 'calendar', label: 'Calendar', icon: FaCalendarAlt, path: '/calendar' },
    { id: 'employees', label: 'Employees', icon: FaUsers, path: '/employees' },
    { id: 'reports', label: 'Reports', icon: FaClipboardList, path: '/reports' },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar, path: '/analytics' },
    { id: 'documents', label: 'Documents', icon: FaFileAlt, path: '/documents' },
  ];

  const sidebarVariants = {
    collapsed: { width: 80 },
    expanded: { width: 280 },
    mobile: { width: 320 }
  };

  return (
    <>
      {/* Mobile Button */}
      <motion.button
        className="lg:hidden fixed top-6 left-6 z-[60] w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 flex items-center justify-center"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaBars className="w-5 h-5" />
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Perfect Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-screen z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-blue-100/50 dark:shadow-slate-900/30 border-r border-blue-100/50 dark:border-slate-800/50"
        variants={sidebarVariants}
        animate={isMobileOpen ? 'mobile' : isHovered ? 'expanded' : 'collapsed'}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onHoverStart={() => !isMobileOpen && setIsHovered(true)}
        onHoverEnd={() => !isMobileOpen && setIsHovered(false)}
      >
        <div className="h-full flex flex-col">
          {/* Menu Items */}
          <nav className="flex-1 py-8 px-2 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.id} to={item.path}>
                  <motion.div
                    className={`
                      relative group flex items-center h-14 px-4 rounded-3xl mx-2 transition-all duration-200 cursor-pointer
                      ${(isHovered || isMobileOpen) 
                        ? 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-700' 
                        : ''
                      }
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-2xl shadow-blue-200/50 hover:shadow-3xl hover:shadow-blue-300/60 translate-y-0'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }
                    `}
                    whileHover={{ scale: isActive ? 1.02 : 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 -inset-2 rounded-3xl blur-xl"
                        style={{ zIndex: -1 }}
                      />
                    )}
                    
                    {/* Icon */}
                    <div className={`w-6 h-6 flex-shrink-0 transition-colors ${isActive ? 'text-white' : ''}`}>
                      <item.icon />
                    </div>
                    
                    {/* Label */}
                    <AnimatePresence>
                      {(isHovered || isMobileOpen) && (
                        <motion.span
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.15 }}
                          className="ml-4 font-semibold text-sm whitespace-nowrap flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Mini Tooltip */}
                    {!isHovered && !isMobileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -left-32 ml-2 px-3 py-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl shadow-2xl border border-white/20 whitespace-nowrap z-[100] pointer-events-none"
                      >
                        {item.label}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-l-slate-900 translate-x-1" />
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 pt-0 border-t border-slate-200/30 dark:border-slate-800/50 space-y-3">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="w-full flex items-center h-10 px-4 rounded-3xl mx-2 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800/70 dark:hover:to-slate-700/70 transition-all duration-200 text-slate-700 dark:text-slate-300 hover:text-slate-900"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-4 h-4 flex-shrink-0">
                {isDarkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-slate-500" />}
              </div>
              <AnimatePresence>
                {(isHovered || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="ml-4 font-semibold text-sm"
                  >
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Logout */}
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center h-10 px-4 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-500/10 dark:to-red-600/10 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-3xl mx-2 hover:shadow-lg hover:shadow-red-200/50 transition-all duration-200 border border-red-200/50 hover:border-red-300/70"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaSignOutAlt className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {(isHovered || isMobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="ml-4 font-semibold text-sm"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Spacer */}
      <div 
        className={`
          hidden lg:block transition-all duration-300 h-20 z-0
          pointer-events-none fixed left-0 top-0
          ${isHovered ? 'w-[280px]' : 'w-20'}
        `}
      />
    </>
  );
};

export default Sidebar;
