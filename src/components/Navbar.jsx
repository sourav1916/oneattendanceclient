import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars,
    FaBell,
    FaUserCircle,
    FaFingerprint,
    FaCaretDown,
    FaTimes,
    FaCog
} from 'react-icons/fa';
import { useAuth } from "../context/AuthContext";

const Navbar = ({ toggleSidebar, isMobile, sidebarOpen, isDesktopSidebarExpanded }) => {
    const { user, logout, activeRole } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotifications, setOpenNotifications] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Mock notifications data
    const notifications = [
        { id: 1, message: "New leave request from John Doe", time: "5 min ago", read: false },
        { id: 2, message: "Your attendance has been approved", time: "1 hour ago", read: false },
        { id: 3, message: "Payroll for March is ready", time: "2 hours ago", read: true },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    // Determine if sidebar is open (for icon display)
    const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;

    return (
        <nav className="sticky top-0 z-30 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Left section */}
                    <div className="flex items-center space-x-4">
                        {/* Custom menu button with animated icon */}
                        <button
                            onClick={toggleSidebar}
                            className={`
                                p-2 rounded-lg transition-all duration-200
                                focus:outline-none focus:ring-2 focus:ring-white/50
                                ${isSidebarOpen
                                    ? 'text-white bg-white/20'
                                    : 'text-white/80 hover:text-white hover:bg-white/20'
                                }
                            `}
                            aria-label="Toggle menu"
                        >
                            {isSidebarOpen ? (
                                <FaTimes className="w-4 h-4" />
                            ) : (
                                <FaBars className="w-4 h-4" />
                            )}
                        </button>

                        {/* Logo/Brand - visible on all devices */}
                        <div className="flex items-center gap-1">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm  shadow-inner">
                                <FaFingerprint className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white tracking-tight">
                                    One<span className="font-light text-white/90">Attendance</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {/* Notifications Bell with Badge */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenNotifications(!openNotifications)}
                                className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                                aria-label="Notifications"
                            >
                                <FaBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {openNotifications && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenNotifications(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`
                                                            p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                                                            transition-colors duration-150
                                                            ${!notification.read ? 'bg-blue-50' : ''}
                                                        `}
                                                    >
                                                        <p className="text-sm text-gray-800">{notification.message}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    <p className="text-sm">No notifications</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-gray-200 bg-gray-50">
                                            <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                                                View all notifications
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User menu with modern dropdown style */}
                        <div className="relative inline-block">
                            <button
                                onClick={() => setOpenDropdown(!openDropdown)}
                                className="flex items-center space-x-3 p-1.5 pr-3 
                                        rounded-lg bg-white/10 hover:bg-white/20 
                                        backdrop-blur-sm transition-all duration-200 group"
                            >
                                <div className="relative">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-300 to-amber-500 
                                    rounded-lg flex items-center justify-center shadow-lg">
                                        <FaUserCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 
                                    bg-emerald-400 border-2 border-white rounded-full"></div>
                                </div>

                                <div className="hidden md:block text-left max-w-[120px]">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-[10px] text-white/70 truncate">
                                        {activeRole 
                                            ? activeRole.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
                                            : user?.role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "User"}
                                    </p>
                                </div>

                                <FaCaretDown className="w-3 h-3 text-white/70 group-hover:text-white transition-colors hidden md:block" />
                            </button>

                            {/* Dropdown */}
                            {openDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenDropdown(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                        {/* User info in dropdown for mobile */}
                                        <div className="md:hidden p-3 border-b border-gray-200 bg-gray-50">
                                            <p className="font-semibold text-gray-800">{user?.name || "User"}</p>
                                            <p className="text-xs text-gray-500">
                                                {activeRole 
                                                    ? activeRole.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
                                                    : user?.role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "User"}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setOpenDropdown(false);
                                                navigate("/profile");
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                        >
                                            <FaUserCircle className="w-4 h-4" />
                                            My Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenDropdown(false);
                                                navigate("/settings");
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                        >
                                            <FaCog className="w-4 h-4" />
                                            Settings
                                        </button>

                                        <div className="border-t border-gray-200 my-1"></div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;