import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBars,
    FaUserCircle,
    FaFingerprint,
    FaCaretDown,
    FaTimes,
    FaCog,
    FaStore,
    FaExchangeAlt,
    FaCheck
} from 'react-icons/fa';
import { useAuth } from "../context/AuthContext";

const formatRole = (role) =>
    role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'User';

const CompanyLogo = ({ company, size = 8 }) => {
    const [imgError, setImgError] = useState(false);
    const sizeClass = `w-${size} h-${size}`;

    if (company?.logo_url && !imgError) {
        return (
            <img
                src={company.logo_url.startsWith('http') ? company.logo_url : `https://api-attendance.onesaas.in${company.logo_url}`}
                alt="Company Logo"
                className={`${sizeClass} rounded-lg object-cover border border-white/20 bg-white`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`${sizeClass} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center`}>
            <FaStore className="w-4 h-4 text-white" />
        </div>
    );
};

const CompanySwitcherModal = ({ companies = [], currentCompany, onSwitch, onClose }) => {
    return (
        // Faux viewport — normal flow, contributes layout height
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">Switch Company</p>
                        <p className="text-xs text-gray-400 mt-0.5">Select a workspace to switch to</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>

                {/* Company list */}
                <div className="py-2 max-h-72 overflow-y-auto">
                    {companies.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No other companies available</p>
                    ) : (
                        companies.map((company) => {
                            const isActive = company.id === currentCompany?.id;
                            return (
                                <button
                                    key={company.id}
                                    onClick={() => { onSwitch(company); onClose(); }}
                                    className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left
                                        ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                >
                                    <CompanyLogo company={company} size={9} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                {company.name}
                                            </p>
                                            {company.role && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-tight
                                                    ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {formatRole(company.role)}
                                                </span>
                                            )}
                                        </div>
                                        {company.branch && (
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{company.branch}</p>
                                        )}
                                    </div>
                                    {isActive && (
                                        <FaCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const Navbar = ({
    toggleSidebar,
    isMobile,
    sidebarOpen,
    isDesktopSidebarExpanded,
    company,          // current active company object { id, name, logo_url, branch }
    companies = [],   // array of all companies user has access to
    onCompanySwitch,  // callback(company) when user selects a different company
}) => {
    const { user, logout, activeRole } = useAuth();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;



    return (
        <>
            <nav className="sticky top-0 z-30 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
                <div className="px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center justify-between h-full">

                        {/* Left section */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleSidebar}
                                className={`p-2 rounded-lg transition-all duration-200 focus:outline-none
                                    ${isSidebarOpen ? 'text-white' : 'text-white/80 hover:text-white hover:bg-white/20'}`}
                                data-sidebar-toggle="true"
                                aria-label="Toggle menu"
                            >
                                {isSidebarOpen ? <FaTimes className="w-4 h-4" /> : <FaBars className="w-4 h-4" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/home')}
                                className="flex items-center gap-1 rounded-lg transition-opacity duration-200 hover:opacity-90 focus:outline-none"
                                aria-label="Go to home"
                            >
                                {/* <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-sm shadow-inner">
                                    <FaFingerprint className="h-5 w-5 text-white" />
                                </div> */}
                                <div>
                                    <span className="text-xl font-bold text-white tracking-tight">
                                        One<span className="font-light text-white/90">Attendance</span>
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Right section */}
                        <div className="flex items-center space-x-2 sm:space-x-3">

                            {/* ── Desktop company switcher ── */}
                            <button
                                onClick={() => setShowCompanySwitcher(true)}
                                className="hidden md:flex items-center gap-2.5 px-3 py-1.5
                                    transition-all duration-200 group"
                            >
                                <CompanyLogo company={company} size={6} />
                                <div className="text-left max-w-[110px]">
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest leading-none mb-0.5">
                                        Company
                                    </p>
                                    <p className="text-xs font-semibold text-white truncate leading-tight">
                                        {company?.name || 'Select Company'}
                                    </p>
                                </div>
                                <FaExchangeAlt className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors ml-0.5" />
                            </button>

                            {/* User menu */}
                            <div className="relative inline-block">
                                <button
                                    onClick={() => setOpenDropdown(!openDropdown)}
                                    className="flex items-center space-x-3 p-1.5 pr-3
                                        rounded-lg bg-white/10 hover:bg-white/20
                                        backdrop-blur-sm transition-all duration-200 group"
                                >
                                    {/* Avatar stack — mobile shows company swap badge */}
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-300 to-amber-500
                                            rounded-lg flex items-center justify-center shadow-lg">
                                            <FaUserCircle className="w-6 h-6 text-white" />
                                        </div>

                                        {/* Online dot */}
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3
                                            bg-emerald-400 border-2 border-white rounded-full"></div>
                                    </div>

                                    <div className="hidden md:block text-left max-w-[120px]">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-[10px] text-white/70 truncate">
                                            {formatRole(activeRole || user?.role)}
                                        </p>
                                    </div>

                                    <FaCaretDown className="w-3 h-3 text-white/70 group-hover:text-white transition-colors hidden md:block" />
                                </button>

                                {/* Dropdown */}
                                {openDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                            <div className="md:hidden p-3 border-b border-gray-200 bg-gray-50">
                                                <p className="font-semibold text-gray-800">{user?.name || "User"}</p>
                                                <p className="text-xs text-gray-500">{formatRole(activeRole || user?.role)}</p>
                                            </div>

                                            {/* Mobile: company switcher row inside dropdown */}
                                            <button
                                                onClick={() => { setOpenDropdown(false); setShowCompanySwitcher(true); }}
                                                className="md:hidden w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 border-b border-gray-100"
                                            >
                                                <FaExchangeAlt className="w-4 h-4 text-indigo-500" />
                                                <span>Switch Company</span>
                                                {company?.name && (
                                                    <span className="ml-auto text-xs text-gray-400 truncate max-w-[70px]">{company.name}</span>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => { setOpenDropdown(false); navigate("/profile"); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                            >
                                                <FaUserCircle className="w-4 h-4" />
                                                My Profile
                                            </button>
                                            <button
                                                onClick={() => { setOpenDropdown(false); navigate("/settings"); }}
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

            {/* Company switcher modal — rendered outside nav to avoid stacking context issues */}
            {showCompanySwitcher && (
                <CompanySwitcherModal
                    companies={companies}
                    currentCompany={company}
                    onSwitch={onCompanySwitch}
                    onClose={() => setShowCompanySwitcher(false)}
                />
            )}
        </>
    );
};

export default Navbar;
