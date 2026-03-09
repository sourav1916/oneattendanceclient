import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars,
    FaBell,
    FaUserCircle,
    FaFingerprint,
    FaCaretDown,
} from 'react-icons/fa';
import { useAuth } from "../context/AuthContext";


const Navbar = ({ toggleSidebar, isMobile, sidebarOpen }) => {
    const { user, logout } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();              
        navigate("/login"); 
    };

    return (
        <nav className="sticky top-0 z-30 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Left section */}
                    <div className="flex items-center space-x-4">
                        {/* Menu button - visible on mobile with modern style */}
                        <button
                            onClick={toggleSidebar}
                            className={`
                                p-2 rounded-xl bg-white/10 hover:bg-white/20 
                                backdrop-blur-sm transition-all duration-200
                                border border-white/20 hover:border-white/30
                                ${isMobile ? 'block' : 'hidden'}
                            `}
                            aria-label="Toggle menu"
                        >
                            <FaBars className="w-5 h-5 text-white" />
                        </button>

                        {/* Logo/Brand - visible on desktop with modern design */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/30 shadow-inner">
                                <FaFingerprint className="h-5 w-5 text-white" />
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

                        {/* Notifications with modern badge */}
                        <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 
                                         backdrop-blur-sm border border-white/20 hover:border-white/30
                                         transition-all duration-200 relative group">
                            <FaBell className="w-4 h-4 text-white" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 
                                           rounded-full text-[10px] flex items-center justify-center 
                                           text-rose-900 font-bold border-2 border-white">5</span>
                            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                                           bg-gray-900 text-white text-xs py-1 px-2 rounded-lg 
                                           opacity-0 group-hover:opacity-100 transition-opacity 
                                           whitespace-nowrap pointer-events-none">
                                Notifications
                            </span>
                        </button>

                        {/* User menu with modern dropdown style */}
                        <div className="relative inline-block">
                            <button
                                onClick={() => setOpenDropdown(!openDropdown)}
                                className="flex items-center space-x-3 p-1.5 pr-3 
        rounded-xl bg-white/10 hover:bg-white/20 
        backdrop-blur-sm border border-white/20 hover:border-white/30
        transition-all duration-200 group"
                            >
                                <div className="relative">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-300 to-amber-500 
            rounded-xl flex items-center justify-center shadow-lg">
                                        <FaUserCircle className="w-6 h-6 text-white" />
                                    </div>

                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 
            bg-emerald-400 border-2 border-white rounded-full"></div>
                                </div>

                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-white">
                                        {user?.name || "User"}
                                    </p>

                                    <p className="text-[10px] text-white/70">
                                        {user?.role}
                                    </p>
                                </div>

                                <FaCaretDown className="w-3 h-3 text-white/70 group-hover:text-white transition-colors hidden md:block" />
                            </button>

                            {/* Dropdown */}
                            {openDropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    >
                                        My Profile
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;