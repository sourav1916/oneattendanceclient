import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaUserCircle, FaSpinner, FaBriefcase, FaCheckCircle,
    FaTimesCircle, FaSearch, FaTimes, FaChartBar,
    FaMoon, FaSun, FaInfoCircle, FaAngleDown,
    FaEnvelope, FaPhone, FaIdCard, FaUserTag,
    FaDollarSign, FaHandPaper, FaRobot, FaEye,
    FaListUl, FaTh, FaShieldAlt, FaCog
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ModalScrollLock from "../components/ModalScrollLock";
import ActionMenu from '../components/ActionMenu';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatHours = (h) => {
    if (!h && h !== 0) return '0h';
    return `${parseFloat(h).toFixed(1)}h`;
};

const formatDays = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

const formatDate = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getInitials = (name = '') =>
    name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const AVATAR_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-500',
];

const avatarGradient = (id) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            {icon}{label}
        </label>
        <div className="text-gray-800 text-sm font-medium">{value}</div>
    </div>
);

// ─── Sub Components ───────────────────────────────────────────────────────────

const AttendanceBadge = ({ pct }) => {
    const color =
        pct >= 80 ? 'text-green-700 bg-green-50 border-green-200'
            : pct >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                : 'text-red-700 bg-red-50 border-red-200';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
            <FaChartBar size={9} />{pct?.toFixed(1)}%
        </span>
    );
};

const MiniStatBar = ({ worked, total, pct }) => {
    const barColor =
        pct >= 80 ? 'from-green-400 to-emerald-500'
            : pct >= 50 ? 'from-yellow-400 to-orange-400'
                : 'from-red-400 to-rose-500';
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{formatDays(worked)}d worked</span>
                <span>{formatDays(total)}d total</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                />
            </div>
        </div>
    );
};

const StatPill = ({ icon, value, label, color }) => {
    const colors = {
        green: 'bg-green-50 text-green-700 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return (
        <div className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-0 ${colors[color]}`}>
            <span className="text-base font-bold">{formatDays(value)}</span>
            <span className="text-xs opacity-75 whitespace-nowrap">{label}</span>
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">{icon}{label}</span>
        <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%] truncate">{value}</span>
    </div>
);

const EmployeeDetailModal = ({ employee, onClose }) => {
    if (!employee) return null;
    const s = employee.summary || {};
    const u = employee.user || {};

    const designationLabel = (v) => v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';
    const statusColor = employee.status === 'active'
        ? 'bg-green-100 text-green-700 border-green-200'
        : 'bg-gray-100 text-gray-600 border-gray-200';

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative bg-white backdrop-blur-xl w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 sm:px-8 py-5 sticky top-0 z-[10]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-200">
                                <FaUserCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Employee Details</h2>
                                <p className="text-xs text-slate-500">Overview of attendance and statistics</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                        {/* Employee Profile */}
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <div className={`bg-gradient-to-br ${avatarGradient(employee.employee_id)} p-3 rounded-xl`}>
                                <FaUserCircle className="text-white text-4xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{u.name || employee.name || 'Unknown'}</h3>
                                <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                    <FaIdCard className="text-blue-500" size={12} />{employee.employee_code}
                                </p>
                                <p className="text-xs text-gray-600 flex items-center gap-2 mt-0.5">
                                    <FaBriefcase className="text-purple-500" size={12} />{designationLabel(employee.designation)}
                                </p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            <InfoItem icon={<FaEnvelope className="text-blue-500" />} label="Email" value={u.email || 'N/A'} />
                            <InfoItem icon={<FaPhone className="text-green-500" />} label="Phone" value={u.phone || 'N/A'} />
                            <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Joined Date" value={formatDate(employee.joining_date)} />
                            <InfoItem icon={<FaUserTag className="text-purple-500" />} label="Employment Type" value={designationLabel(employee.employment_type)} />
                            <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" value={designationLabel(employee.salary_type)} />
                            <InfoItem
                                icon={<FaShieldAlt className="text-orange-500" />}
                                label="Status"
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                        {employee.status}
                                    </span>
                                }
                            />
                        </div>

                        {/* Monthly Stats */}
                        <div className="mt-4">
                            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                <FaChartBar className="text-blue-500" /> Monthly Breakdown ({MONTHS[s.month - 1]} {s.year})
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <StatPill value={s.worked_days} label="Worked Days" color="green" />
                                <StatPill value={s.leave_days} label="Leave Days" color="purple" />
                                <StatPill value={s.holidays} label="Holidays" color="blue" />
                                <StatPill value={s.absent_days} label="Absent Days" color="red" />
                                <StatPill value={formatHours(s.total_work_hours)} label="Total Hours" color="orange" />
                            </div>
                        </div>

                        {/* Attendance Rate */}
                        <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-700">Attendance Rate</span>
                                <AttendanceBadge pct={s.attendance_percentage} />
                            </div>
                            <MiniStatBar worked={s.worked_days} total={s.total_days_in_month} pct={s.attendance_percentage} />
                            <p className="text-[10px] text-gray-500 mt-2">
                                Average {formatHours(s.average_hours_per_day)} / working day
                            </p>
                        </div>
                    </div>
                    <div className="px-4 sm:px-6 pb-4">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Employee Card (Grid) ─────────────────────────────────────────────────────

const EmployeeCard = ({ employee, index, onClick }) => {
    const s = employee.summary || {};
    const u = employee.user || {};
    const designationLabel = (v) => v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';
    const statusColor = employee.status === 'active'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-gray-100 text-gray-500 border-gray-200';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full"
        >
            {/* Top */}
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient(employee.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-white font-bold text-base">{getInitials(u.name || employee.name || '')}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate text-sm">{u.name || employee.name || 'Unknown'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{designationLabel(employee.designation)}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                            {employee.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{employee.employee_code}</span>
                    </div>
                </div>
                <AttendanceBadge pct={s.attendance_percentage} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-green-700">{formatDays(s.worked_days)}</p>
                    <p className="text-xs text-green-500">Worked</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-blue-700">{formatHours(s.total_work_hours)}</p>
                    <p className="text-xs text-blue-500">Hours</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-red-600">{formatDays(s.absent_days)}</p>
                    <p className="text-xs text-red-400">Absent</p>
                </div>
            </div>

            {/* Bar */}
            <MiniStatBar worked={s.worked_days} total={s.total_days_in_month} pct={s.attendance_percentage} />

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                    {formatDays(s.leave_days)} leaves · {formatDays(s.holidays)} holidays
                </span>
                <span className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    View <FaEye size={10} />
                </span>
            </div>
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeesShifts = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchEmployees = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            let url = `/shifts/employees-shifts?month=${month}&year=${year}&page=${page}&limit=${pagination.limit}`;
            if (search) url += `&search=${search}`;

            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data || []);
                setMeta(result.meta || null);
                const currentPage = Number(result.pagination?.page ?? result.meta?.page ?? result.page ?? page);
                const perPage = Number(result.pagination?.limit ?? result.meta?.limit ?? result.limit ?? pagination.limit);
                const total = Number(result.pagination?.total ?? result.meta?.total ?? result.total ?? (result.data?.length || 0));
                const totalPages = Number(
                    result.pagination?.total_pages ??
                    result.meta?.total_pages ??
                    result.last_page ??
                    Math.max(1, Math.ceil(total / perPage))
                );
                updatePagination({
                    page: currentPage,
                    limit: perPage,
                    total,
                    total_pages: totalPages,
                    is_last_page: result.pagination?.is_last_page ?? result.meta?.is_last_page ?? (currentPage >= totalPages)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch employee shifts');
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Failed to load employee shifts');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [month, year, pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    const toggleActionMenu = useCallback((id) => {
        setActiveActionMenu((current) => (current === id ? null : id));
    }, []);

    // Search and month/year triggers
    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchEmployees(1, debouncedSearch, true);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchEmployees(pagination.page, debouncedSearch, true);
        }
    }, [pagination.page, pagination.limit, debouncedSearch]);

    useEffect(() => {
        if (!isInitialLoad) {
            fetchEmployees(1, debouncedSearch, true);
        }
    }, [month, year]);

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('company'));
        if (company && isInitialLoad) {
            fetchEmployees(1, "", true);
        } else if (!company) {
            toast.error("Company ID not found. Please ensure you're logged in as a company.");
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    const navigateMonth = (dir) => {
        let m = month + dir, y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m);
        setYear(y);
    };

    const designationLabel = (v) =>
        v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';

    // Responsive column visibility
    const showDesignation = windowWidth >= 1280;
    const showWorked = windowWidth >= 640;
    const showHours = windowWidth >= 1024;
    const showLeave = windowWidth >= 1440;
    const showAbsent = windowWidth >= 1440;
    const showAttendance = windowWidth >= 768;
    const showStatus = windowWidth >= 1280;

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto">

                <div className="space-y-6 p-2 lg:p-0">
                    {/* ─── Page Header ─── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div>
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <FaClock size={14} className="animate-pulse-slow" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Workforce Scheduling</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Employee Shifts</h1>
                            <p className="text-sm text-slate-500 mt-1">Monitor and manage employee work schedules, attendance rates, and monthly summaries.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                                <FaUserCircle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Employees</p>
                                <p className="text-lg font-black text-slate-800 leading-tight">{pagination.total}</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── Consolidated Filter & View Bar ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6"
                    >
                        {/* Left Section: Search, Result Info & View Mode */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                            <div className="relative flex-1 w-full">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or code..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <FaTimes size={14} />
                                    </button>
                                )}
                            </div>
                            {!loading && employees.length > 0 && (
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block border-l pl-4 border-gray-200">
                                    {pagination.total} Employees
                                </p>
                            )}

                            <div className="flex justify-between">
                                {/* Right Section: Controls */}
                                <div className="flex items-center gap-3 justify-end">
                                    {/* Month Picker Controls */}
                                    <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-0.5 sm:p-1 rounded-xl border border-slate-200">
                                        <button
                                            onClick={() => navigateMonth(-1)}
                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all"
                                        >
                                            <FaChevronLeft size={9} className="sm:text-[10px]" />
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() => setMonthPickerOpen(o => !o)}
                                                className="px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2 font-bold text-slate-700 text-[11px] sm:text-sm hover:text-blue-600 transition-colors whitespace-nowrap"
                                            >
                                                {MONTHS[month - 1].slice(0, 3)} {year}
                                                <FaAngleDown className={`text-[9px] sm:text-[10px] transition-transform ${monthPickerOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {monthPickerOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-xl shadow-2xl p-2 sm:p-3 grid grid-cols-3 gap-1.5 sm:gap-2 min-w-[200px] sm:min-w-[240px] z-[60]"
                                                    >
                                                        {MONTHS.map((m, i) => (
                                                            <button
                                                                key={m}
                                                                onClick={() => { setMonth(i + 1); setMonthPickerOpen(false); }}
                                                                className={`py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase transition-all duration-200 ${month === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-slate-600 hover:text-blue-700'}`}
                                                            >
                                                                {m.slice(0, 3)}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            onClick={() => navigateMonth(1)}
                                            disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <FaChevronRight size={9} className="sm:text-[10px]" />
                                        </button>
                                    </div>

                                </div>
                                <div className="hidden lg:block h-8 w-px bg-gray-200 mx-1"></div>

                                <ManagementViewSwitcher
                                    viewMode={viewMode}
                                    onChange={setViewMode}
                                    accent="blue"
                                />
                            </div>


                        </div>


                    </motion.div>

                    {/* Loading skeleton */}
                    {loading && !employees.length && <SkeletonComponent />}

                    {/* Empty State */}
                    {!loading && employees.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 bg-white rounded-xl shadow-xl border border-gray-100"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaUserCircle className="text-4xl text-gray-300" />
                            </div>
                            <p className="text-xl font-semibold text-gray-600">No employees found</p>
                            <p className="text-gray-400 mt-2 text-sm">
                                {debouncedSearch ? `No results for "${debouncedSearch}"` : `No shifts recorded for ${MONTHS[month - 1]} ${year}`}
                            </p>
                            {debouncedSearch && (
                                <button onClick={() => setSearchTerm('')}
                                    className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium">
                                    Clear Search
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Grid View */}
                    {!loading && employees.length > 0 && viewMode === "card" && (
                        <ManagementGrid viewMode={viewMode}>
                            {employees.map((emp, index) => (
                                <EmployeeCard
                                    key={emp.employee_id}
                                    employee={emp}
                                    index={index}
                                    onClick={() => setSelectedEmployee(emp)}
                                />
                            ))}
                        </ManagementGrid>
                    )}

                    {/* Table View */}
                    {!loading && employees.length > 0 && viewMode === "table" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-xl overflow-visible"
                        >
                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Employee</th>
                                            {showDesignation && <th className="px-6 py-4">Designation</th>}
                                            {showWorked && <th className="px-6 py-4">Worked</th>}
                                            {showHours && <th className="px-6 py-4">Hours</th>}
                                            {showLeave && <th className="px-6 py-4">Leave</th>}
                                            {showAbsent && <th className="px-6 py-4">Absent</th>}
                                            {showAttendance && <th className="px-6 py-4">Attendance</th>}
                                            {showStatus && <th className="px-6 py-4">Status</th>}
                                            <th className="px-6 py-4 text-right"><FaCog className="w-4 h-4 ml-auto" /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {employees.map((emp, index) => {
                                            const s = emp.summary || {};
                                            const u = emp.user || {};
                                            const statusColor = emp.status === 'active'
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200';

                                            return (
                                                <motion.tr
                                                    key={emp.employee_id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                                                    onClick={() => setSelectedEmployee(emp)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                                                                {getInitials(u.name || emp.name || '')}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-800 truncate max-w-[150px] md:max-w-none">{u.name || emp.name || 'Unknown'}</p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <FaEnvelope className="text-gray-400 flex-shrink-0" size={10} />
                                                                    <span className="truncate max-w-[120px] md:max-w-none">{u.email || 'N/A'}</span>
                                                                </p>
                                                                <p className="text-xs text-gray-400 font-mono">{emp.employee_code}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {showDesignation && (
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 whitespace-nowrap">
                                                                {designationLabel(emp.designation)}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {showWorked && (
                                                        <td className="px-6 py-4 font-semibold text-gray-700">{formatDays(s.worked_days)}d</td>
                                                    )}
                                                    {showHours && (
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 whitespace-nowrap">
                                                                {formatHours(s.total_work_hours)}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {showLeave && (
                                                        <td className="px-6 py-4 text-purple-600 font-medium">{formatDays(s.leave_days)}d</td>
                                                    )}
                                                    {showAbsent && (
                                                        <td className="px-6 py-4 text-red-500 font-medium">{formatDays(s.absent_days)}d</td>
                                                    )}
                                                    {showAttendance && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                                                    <div
                                                                        className={`h-full rounded-full ${s.attendance_percentage >= 80 ? 'bg-green-400' : s.attendance_percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                                        style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <AttendanceBadge pct={s.attendance_percentage} />
                                                            </div>
                                                        </td>
                                                    )}
                                                    {showStatus && (
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                                                {emp.status}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <div onClick={e => e.stopPropagation()} className="flex justify-end">
                                                            <ActionMenu
                                                                menuId={emp.employee_id}
                                                                activeId={activeActionMenu}
                                                                onToggle={(e, id) => toggleActionMenu(id)}
                                                                actions={[
                                                                    {
                                                                        label: 'View Details',
                                                                        icon: <FaEye size={14} />,
                                                                        onClick: () => setSelectedEmployee(emp),
                                                                        className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                                    }
                                                                ]}
                                                            />
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {!loading && (employees.length > 0 || pagination.total > 0) && (
                        <Pagination
                            currentPage={pagination.page}
                            totalItems={pagination.total}
                            itemsPerPage={pagination.limit}
                            onPageChange={handlePageChange}
                            showInfo={true}
                            onLimitChange={changeLimit}
                        />
                    )}

                    {/* Detail Modal */}
                    <AnimatePresence>
                        {selectedEmployee && (
                            <EmployeeDetailModal
                                employee={selectedEmployee}
                                onClose={() => setSelectedEmployee(null)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default EmployeesShifts;
