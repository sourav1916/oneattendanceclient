import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EndUserMainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Mock user data
  const user = {
    name: 'Alex Morgan',
    email: 'alex.morgan@company.com',
    role: 'Software Engineer',
    avatar: null,
    initials: 'AM'
  };

  // Fetch notifications
  useEffect(() => {
    // Simulate fetching notifications
    const dummyNotifications = [
      { id: 1, title: 'Leave Approved', read: false },
      { id: 2, title: 'Late Warning', read: false },
      { id: 3, title: 'Timesheet Reminder', read: true }
    ];
    setNotifications(dummyNotifications);
    setUnreadCount(dummyNotifications.filter(n => !n.read).length);
  }, []);

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/attendance', label: 'Attendance', icon: '⏱️' },
    { path: '/history', label: 'History', icon: '📅' },
    { path: '/leave-management', label: 'Leave', icon: '🌴' },
    { path: '/working-hours-summary', label: 'Hours', icon: '📈' },
    { path: '/notification', label: 'Notifications', icon: '🔔', badge: unreadCount },
    { path: '/my-profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar overlay - always visible when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - slides in from left, same on all screen sizes */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 overflow-y-auto"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">EmployeeHub</h1>
              <p className="text-xs text-slate-500">Employee Portal</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-white font-semibold">{user.initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-sm text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isActive
                          ? 'bg-white text-blue-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content - full width on all screens */}
      <div className="min-h-screen">
        {/* Top navbar */}
        <header className="bg-gradient-to-r from-blue-100 via-white to-sky-100 text-slate-700 sticky top-0 z-30 shadow-sm border-b border-blue-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left section */}
              <div className="flex items-center gap-4">
                {/* Menu button - visible on all screen sizes */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-xl hover:bg-slate-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Page title */}
                <h2 className="text-lg font-semibold text-slate-800">
                  {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
              </div>

              {/* Right section */}
              <div className="flex items-center gap-3">
                {/* Notifications button */}
                <div className="relative">
                  <button
                    className="relative p-2 rounded-xl hover:bg-slate-100"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{user.initials}</span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-slate-700">{user.name}</span>
                  </button>

                  {/* Profile dropdown menu */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                      >
                        <Link
                          to="/my-profile"
                          className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span>👤</span>
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span>⚙️</span>
                          <span>Settings</span>
                        </Link>
                        <hr className="border-slate-200" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <span>🚪</span>
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-slate-400">Employee</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 font-medium">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EndUserMainLayout;