import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaEnvelope,
    FaPhone,
    FaBuilding,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaCrown,
    FaCheckCircle,
    FaCalendarAlt,
    FaChevronRight,
    FaIdBadge,
    FaGlobe,
    FaCity,
    FaUserCircle,
    FaHashtag,
    FaBolt,
    FaLayerGroup,
    FaUserShield,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
};

const TABS = ["Overview", "Companies", "Permissions"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { userDetails, loading, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState("Overview");
    const [expandedCompany, setExpandedCompany] = useState(null);

    // Loading state
    if (loading || !userDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600"
                />
            </div>
        );
    }

    // Destructure directly from userDetails (which is response.data)
    const { user, companies = [], total_companies = 0, permissions = [] } = userDetails;
    const role = userRole === "user"
        ? "User"
        : userRole === "employee"
            ? "Employee"
            : userRole === "company_owner"
                ? "Company Owner" : "Unknown";


    return (
        <div className="min-h-screen relative overflow-hidden">

            {/* ── Background blobs ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Profile Hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6"
                >
                    {/* Cover strip */}
                    <div className="h-28 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full" />
                        <div className="absolute top-4 left-12 w-10 h-10 bg-white/10 rounded-xl rotate-12" />
                    </div>

                    {/* Avatar + Role row */}
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">

                            {/* Avatar */}
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
                                className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl border-4 border-white"
                            >
                                <span className="text-2xl font-black text-white">
                                    {getInitials(user.name)}
                                </span>
                                {user.is_active === 1 && (
                                    <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                                        <FaCheckCircle className="text-white text-[8px]" />
                                    </span>
                                )}
                            </motion.div>

                            {/* Role badge */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl self-start sm:self-auto"
                            >
                                <FaCrown className="text-amber-500 text-sm" />
                                <span className="text-amber-700 font-semibold text-sm">{role}</span>
                            </motion.div>
                        </div>

                        {/* Name & inline meta */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{user.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <FaEnvelope className="text-indigo-400" />{user.email}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <FaPhone className="text-indigo-400" />{user.phone}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <FaHashtag className="text-indigo-400" />ID {user.id}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Tab Navigation ── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm mb-6"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md"
                                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                                />
                            )}
                            <span className="relative z-10">{tab}</span>
                        </button>
                    ))}
                </motion.div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">

                    {/* ── OVERVIEW ── */}
                    {activeTab === "Overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            {/* Contact card */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                    <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <FaIdBadge className="text-indigo-500 text-xs" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">Contact Details</p>
                                </div>
                                <ul className="px-5 py-2 divide-y divide-slate-100">
                                    {[
                                        { icon: FaEnvelope, label: "Email", value: user.email },
                                        { icon: FaPhone, label: "Phone", value: user.phone },
                                        { icon: FaCalendarAlt, label: "Joined", value: formatDate(user.created_at) },
                                        { icon: FaUserCircle, label: "Status", value: user.is_active === 1 ? "Active" : "Inactive" },
                                        { icon: FaUserShield, label: "System Admin", value: user.is_system_admin === 1 ? "Yes" : "No" },
                                    ].map(({ icon: Icon, label, value }, i) => (
                                        <motion.li
                                            key={label}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            className="flex items-center gap-3 py-3 group"
                                        >
                                            <div className="w-8 h-8 bg-slate-50 group-hover:bg-indigo-50 rounded-lg flex items-center justify-center transition-colors duration-200 flex-shrink-0">
                                                <Icon className="text-slate-400 group-hover:text-indigo-500 text-xs transition-colors duration-200" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-400">{label}</p>
                                                <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>

                            {/* Summary tiles */}
                            <div className="flex flex-col gap-4">
                                {[
                                    {
                                        icon: FaBuilding,
                                        label: "Companies Owned",
                                        value: total_companies,
                                        color: "from-blue-500 to-cyan-500",
                                        bg: "bg-blue-50",
                                        iconColor: "text-blue-500",
                                    },
                                    {
                                        icon: FaShieldAlt,
                                        label: "Active Permissions",
                                        value: permissions.length,
                                        color: "from-indigo-500 to-purple-600",
                                        bg: "bg-indigo-50",
                                        iconColor: "text-indigo-500",
                                    },
                                    {
                                        icon: FaBolt,
                                        label: "Access Level",
                                        value: permissions.some(p => p.code === "OWN_ALL") ? "Full" : "Limited",
                                        color: "from-amber-500 to-orange-500",
                                        bg: "bg-amber-50",
                                        iconColor: "text-amber-500",
                                    },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{ x: 4 }}
                                        className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            <item.icon className={`${item.iconColor} w-5 h-5`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">{item.label}</p>
                                            <p className="text-lg font-bold text-slate-800">{item.value}</p>
                                        </div>
                                        <div className={`w-1.5 h-10 rounded-full bg-gradient-to-b ${item.color} opacity-60`} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── COMPANIES ── */}
                    {activeTab === "Companies" && (
                        <motion.div
                            key="companies"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Count pill */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm self-start">
                                <FaLayerGroup className="text-indigo-500 text-sm" />
                                <p className="text-sm font-semibold text-slate-700">
                                    {total_companies} {total_companies === 1 ? "Company" : "Companies"} found
                                </p>
                            </div>

                            {companies.map((company, i) => (
                                <motion.div
                                    key={company.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 180, damping: 22 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                >
                                    {/* Header row */}
                                    <button
                                        onClick={() =>
                                            setExpandedCompany(expandedCompany === company.id ? null : company.id)
                                        }
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/60 transition-colors duration-200"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                                            <FaBuilding className="text-white w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800">{company.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{company.legal_name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {company.is_active === 1 && (
                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                    Active
                                                </span>
                                            )}
                                            <motion.div
                                                animate={{ rotate: expandedCompany === company.id ? 90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <FaChevronRight className="text-slate-400 text-xs" />
                                            </motion.div>
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    <AnimatePresence>
                                        {expandedCompany === company.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-4 border-t border-slate-100">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {[
                                                            {
                                                                icon: FaMapMarkerAlt,
                                                                label: "Address",
                                                                val: [company.address_line1, company.address_line2]
                                                                    .filter(Boolean).join(", "),
                                                            },
                                                            {
                                                                icon: FaCity,
                                                                label: "City / State",
                                                                val: `${company.city}, ${company.state}`,
                                                            },
                                                            {
                                                                icon: FaGlobe,
                                                                label: "Country",
                                                                val: `${company.country} — ${company.postal_code}`,
                                                            },
                                                            {
                                                                icon: FaCalendarAlt,
                                                                label: "Registered",
                                                                val: formatDate(company.created_at),
                                                            },
                                                        ].map(({ icon: Icon, label, val }) => (
                                                            <div
                                                                key={label}
                                                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                                                            >
                                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Icon className="text-indigo-500 text-xs" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-slate-400">{label}</p>
                                                                    <p className="text-sm font-medium text-slate-700">{val}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── PERMISSIONS ── */}
                    {activeTab === "Permissions" && (
                        <motion.div
                            key="permissions"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Info banner */}
                            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FaShieldAlt className="text-indigo-500 text-xs" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-indigo-800">Access Permissions</p>
                                    <p className="text-xs text-indigo-500 mt-0.5">
                                        Permissions assigned to your account based on your role.
                                    </p>
                                </div>
                            </div>

                            {/* Permission cards */}
                            {permissions.map((perm, i) => (
                                <motion.div
                                    key={perm.code}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-lg transition-all duration-300"
                                >
                                    {/* Hover gradient wash */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                                            <FaShieldAlt className="text-white w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                                <p className="font-semibold text-slate-800">{perm.name}</p>
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full font-mono">
                                                    {perm.code}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {perm.action.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom sweep line on hover */}
                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33%       { transform: translate(30px, -50px) scale(1.1); }
                    66%       { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-float { animation: float 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}