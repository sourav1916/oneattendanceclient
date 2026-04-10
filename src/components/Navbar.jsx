import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars,
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
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

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
                            data-sidebar-toggle="true"
                            aria-label="Toggle menu"
                        >
                            {isSidebarOpen ? (
                                <FaTimes className="w-4 h-4" />
                            ) : (
                                <FaBars className="w-4 h-4" />
                            )}
                        </button>

                        {/* Logo/Brand - visible on all devices */}
                        <button
                            type="button"
                            onClick={() => navigate('/home')}
                            className="flex items-center gap-1 rounded-lg transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Go to home"
                        >
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm  shadow-inner">
                                <FaFingerprint className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white tracking-tight">
                                    One<span className="font-light text-white/90">Attendance</span>
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
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
