import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaBuilding, FaUsers, FaUserTie, FaChartLine, FaCog, FaShieldAlt,
    FaBell, FaSearch, FaHome, FaFileAlt, FaWallet, FaTasks,
    FaUserCircle, FaSignOutAlt, FaChevronRight, FaLock, FaUnlock,
    FaEye, FaEdit, FaTrash, FaPlus, FaArrowUp, FaArrowDown, FaStar,
    FaCalendarAlt, FaEnvelope, FaBars, FaTimes, FaLayerGroup,
    FaClipboardList, FaMoneyBillWave, FaUsersCog, FaChartBar,
    FaDatabase, FaKey
} from "react-icons/fa";

const roles = {
    owner: {
        label: "Company Owner",
        icon: FaBuilding,
        color: "#6366f1",
        permissions: [
            { name: "Full System Access", granted: true, icon: FaDatabase },
            { name: "User Management", granted: true, icon: FaUsersCog },
            { name: "Financial Reports", granted: true, icon: FaMoneyBillWave },
            { name: "Analytics & Insights", granted: true, icon: FaChartBar },
            { name: "Settings & Config", granted: true, icon: FaCog },
            { name: "Role Assignment", granted: true, icon: FaKey },
            { name: "Billing Control", granted: true, icon: FaWallet },
            { name: "Audit Logs", granted: true, icon: FaClipboardList },
        ],
        stats: [
            { label: "Total Revenue", value: "$482,910", trend: "+12.4%", up: true },
            { label: "Active Employees", value: "247", trend: "+3", up: true },
            { label: "Projects", value: "38", trend: "-2", up: false },
            { label: "Clients", value: "91", trend: "+7", up: true },
        ],
        nav: ["Dashboard", "Analytics", "Team", "Finance", "Reports", "Settings"],
        navIcons: [FaHome, FaChartLine, FaUsers, FaWallet, FaFileAlt, FaCog],
        description: "Full administrative control over all company operations, users, finances, and system configuration.",
        initials: "CO",
        name: "Alex Chen",
    },
    manager: {
        label: "Department Manager",
        icon: FaUserTie,
        color: "#0ea5e9",
        permissions: [
            { name: "Team Management", granted: true, icon: FaUsersCog },
            { name: "Project Oversight", granted: true, icon: FaTasks },
            { name: "Department Reports", granted: true, icon: FaFileAlt },
            { name: "Task Assignment", granted: true, icon: FaClipboardList },
            { name: "Financial Reports", granted: false, icon: FaMoneyBillWave },
            { name: "System Settings", granted: false, icon: FaCog },
            { name: "Role Assignment", granted: false, icon: FaKey },
            { name: "Audit Logs", granted: true, icon: FaClipboardList },
        ],
        stats: [
            { label: "Team Members", value: "32", trend: "+2", up: true },
            { label: "Active Projects", value: "11", trend: "+1", up: true },
            { label: "Tasks Done", value: "184", trend: "+23", up: true },
            { label: "Pending Review", value: "7", trend: "-3", up: false },
        ],
        nav: ["Dashboard", "Team", "Projects", "Reports", "Calendar"],
        navIcons: [FaHome, FaUsers, FaTasks, FaFileAlt, FaCalendarAlt],
        description: "Manage department teams, projects, and performance. Limited access to company-wide financial data.",
        initials: "DM",
        name: "Jordan Lee",
    },
    employee: {
        label: "Employee",
        icon: FaUserCircle,
        color: "#10b981",
        permissions: [
            { name: "View Tasks", granted: true, icon: FaEye },
            { name: "Update Own Tasks", granted: true, icon: FaEdit },
            { name: "Team Calendar", granted: true, icon: FaCalendarAlt },
            { name: "Messaging", granted: true, icon: FaEnvelope },
            { name: "View Reports", granted: false, icon: FaChartBar },
            { name: "Manage Users", granted: false, icon: FaUsersCog },
            { name: "Financial Data", granted: false, icon: FaMoneyBillWave },
            { name: "System Config", granted: false, icon: FaCog },
        ],
        stats: [
            { label: "My Tasks", value: "14", trend: "+3", up: true },
            { label: "Completed", value: "67", trend: "+8", up: true },
            { label: "Hours Logged", value: "162h", trend: "+4h", up: true },
            { label: "Messages", value: "23", trend: "+5", up: true },
        ],
        nav: ["Dashboard", "My Tasks", "Calendar", "Messages"],
        navIcons: [FaHome, FaTasks, FaCalendarAlt, FaEnvelope],
        description: "Personal workspace for managing tasks, viewing schedules, and communicating with your team.",
        initials: "EM",
        name: "Sam Rivera",
    },
};

const activity = [
    { user: "Sarah K.", action: "Completed project milestone", time: "2m ago", avatar: "SK", color: "#6366f1" },
    { user: "James R.", action: "Submitted expense report", time: "18m ago", avatar: "JR", color: "#0ea5e9" },
    { user: "Maria L.", action: "Added 3 new team tasks", time: "1h ago", avatar: "ML", color: "#10b981" },
    { user: "David P.", action: "Updated client proposal", time: "2h ago", avatar: "DP", color: "#f59e0b" },
    { user: "Ana S.", action: "Scheduled team meeting", time: "3h ago", avatar: "AS", color: "#ec4899" },
];

function Avatar({ initials, color, size = 36 }) {
    return (
        <div style={{ width: size, height: size, background: color + "22", border: `2px solid ${color}55`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

export default function Dashboard() {
    const [activeRole, setActiveRole] = useState("owner");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeNav, setActiveNav] = useState(0);

    const role = roles[activeRole];
    const RoleIcon = role.icon;

    useEffect(() => { setActiveNav(0); }, [activeRole]);

    return (

        <>
            <main style={{ flex: 1, padding: "28px 28px", overflowY: "auto", minWidth: 0 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeRole}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                        {/* PAGE HEADER */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26, gap: 16, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ width: 46, height: 46, background: `linear-gradient(135deg,${role.color},${role.color}bb)`, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px ${role.color}44` }}>
                                    <RoleIcon color="white" size={20} />
                                </div>
                                <div>
                                    <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 21, color: "#0f172a", letterSpacing: "-0.5px", margin: 0 }}>
                                        {role.nav[activeNav]}
                                    </h1>
                                    <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>
                                        Viewing as <span style={{ color: role.color, fontWeight: 700 }}>{role.label}</span>
                                    </div>
                                </div>
                            </div>
                            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: role.color, color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: `0 4px 14px ${role.color}55`, flexShrink: 0 }}>
                                <FaPlus size={12} /> Quick Action
                            </button>
                        </div>

                        <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, marginBottom: 24, maxWidth: 560 }}>{role.description}</p>

                        {/* STATS */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
                            {role.stats.map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    className="stat-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07, duration: 0.3 }}
                                    style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", position: "relative", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                                >
                                    <div style={{ position: "absolute", top: -10, right: -10, width: 64, height: 64, background: role.color + "0d", borderRadius: "50%" }} />
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{s.label}</div>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#0f172a", letterSpacing: "-1px", marginBottom: 8 }}>{s.value}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: s.up ? "#10b981" : "#ef4444" }}>
                                        {s.up ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
                                        {s.trend} <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 2 }}>this month</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* BOTTOM GRID */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                            {/* PERMISSIONS */}
                            <motion.div
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.22, duration: 0.32 }}
                                style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <div style={{ padding: "16px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 9 }}>
                                    <FaShieldAlt color={role.color} size={15} />
                                    <span style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>Access Permissions</span>
                                    <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: role.color + "15", color: role.color }}>
                                        {role.permissions.filter(p => p.granted).length}/{role.permissions.length}
                                    </span>
                                </div>
                                <div style={{ padding: "8px 10px" }}>
                                    {role.permissions.map((perm, i) => {
                                        const PermIcon = perm.icon;
                                        return (
                                            <motion.div
                                                key={perm.name}
                                                className="perm-item"
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.28 + i * 0.05 }}
                                                style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 9, marginBottom: 1, cursor: "default" }}
                                            >
                                                <div style={{ width: 32, height: 32, borderRadius: 9, background: perm.granted ? role.color + "15" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <PermIcon size={13} color={perm.granted ? role.color : "#b0bec5"} />
                                                </div>
                                                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: perm.granted ? "#1e293b" : "#94a3b8" }}>{perm.name}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    {perm.granted
                                                        ? <><FaUnlock size={11} color={role.color} /><span style={{ fontSize: 11.5, fontWeight: 700, color: role.color }}>Active</span></>
                                                        : <><FaLock size={11} color="#cbd5e1" /><span style={{ fontSize: 11.5, fontWeight: 600, color: "#cbd5e1" }}>Locked</span></>
                                                    }
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* RIGHT COL */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* ACTIVITY */}
                                <motion.div
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.28, duration: 0.32 }}
                                    style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                                >
                                    <div style={{ padding: "16px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 9 }}>
                                        <FaBell color={role.color} size={14} />
                                        <span style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>Recent Activity</span>
                                        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#94a3b8" }}>Today</span>
                                    </div>
                                    <div style={{ padding: "6px 10px" }}>
                                        {activity.map((a, i) => (
                                            <motion.div
                                                key={i}
                                                className="act-row"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.32 + i * 0.055 }}
                                                style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 9, marginBottom: 1 }}
                                            >
                                                <Avatar initials={a.avatar} color={a.color} size={33} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{a.user}</div>
                                                    <div style={{ fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.action}</div>
                                                </div>
                                                <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{a.time}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* ROLE BADGE */}
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.42 }}
                                    style={{ background: `linear-gradient(135deg,${role.color},${role.color}cc)`, borderRadius: 16, padding: "22px 22px", color: "white", position: "relative", overflow: "hidden", boxShadow: `0 8px 24px ${role.color}44` }}
                                >
                                    <div style={{ position: "absolute", top: -24, right: -24, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                                    <div style={{ position: "absolute", bottom: -28, right: 16, width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                        <FaStar size={13} style={{ opacity: 0.8 }} />
                                        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Active Role</span>
                                    </div>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, marginBottom: 4 }}>{role.label}</div>
                                    <div style={{ fontSize: 12.5, opacity: 0.8, marginBottom: 14, lineHeight: 1.5 }}>
                                        {role.permissions.filter(p => p.granted).length} of {role.permissions.length} permissions active
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {role.permissions.map((p, i) => (
                                            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: p.granted ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.22)", transition: "background 0.3s" }} />
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </>
    );
}