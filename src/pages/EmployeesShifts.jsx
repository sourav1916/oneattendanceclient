import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaUserCircle, FaSpinner, FaBriefcase, FaCheckCircle,
    FaTimesCircle, FaSearch, FaTimes, FaChartBar,
    FaMoon, FaSun, FaInfoCircle, FaAngleDown,
    FaEnvelope, FaPhone, FaIdCard, FaUserTag,
    FaDollarSign, FaHandPaper, FaRobot, FaEye,
    FaListUl, FaTh, FaShieldAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatHours = (h) => {
    if (!h && h !== 0) return '0h';
    return `${parseFloat(h).toFixed(1)}h`;
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
                <span>{worked}d worked</span>
                <span>{total}d total</span>
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
            <span className="text-base font-bold">{value}</span>
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
    const s = employee.summary;
    const u = employee.user;

    const designationLabel = (v) => v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';
    const statusColor = employee.status === 'active'
        ? 'bg-green-100 text-green-700 border-green-200'
        : 'bg-gray-100 text-gray-600 border-gray-200';

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaEye className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Employee Details</h2>
                                    <p className="text-xs text-gray-400">{MONTHS[s.month - 1]} {s.year} Summary</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-5">

                        {/* Employee Profile */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(employee.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                <span className="text-white font-bold text-lg">{getInitials(u.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-lg truncate">{u.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <FaBriefcase className="text-blue-400 flex-shrink-0" size={11} />
                                    {designationLabel(employee.designation)}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                                        {employee.status}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                                        {employee.employee_code}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                            <InfoRow icon={<FaEnvelope className="text-blue-400" size={11} />} label="Email" value={u.email} />
                            <InfoRow icon={<FaPhone className="text-green-400" size={11} />} label="Phone" value={u.phone} />
                            <InfoRow icon={<FaCalendarAlt className="text-rose-400" size={11} />} label="Joined" value={formatDate(employee.joining_date)} />
                            <InfoRow icon={<FaUserTag className="text-purple-400" size={11} />} label="Type" value={designationLabel(employee.employment_type)} />
                            <InfoRow icon={<FaDollarSign className="text-emerald-400" size={11} />} label="Salary" value={designationLabel(employee.salary_type)} />
                        </div>

                        {/* Monthly Stats */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaChartBar className="text-blue-400" />Monthly Breakdown
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                                <StatPill value={s.worked_days} label="Worked" color="green" />
                                <StatPill value={s.leave_days} label="Leave" color="purple" />
                                <StatPill value={s.holidays} label="Holiday" color="blue" />
                                <StatPill value={s.absent_days} label="Absent" color="red" />
                                <StatPill value={formatHours(s.total_work_hours)} label="Hours" color="orange" />
                            </div>
                        </div>

                        {/* Attendance Rate */}
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
                                <AttendanceBadge pct={s.attendance_percentage} />
                            </div>
                            <MiniStatBar worked={s.worked_days} total={s.total_days_in_month} pct={s.attendance_percentage} />
                            <p className="text-xs text-gray-400 mt-2">Avg {formatHours(s.average_hours_per_day)} / working day</p>
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-2">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
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
    const s = employee.summary;
    const u = employee.user;
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
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
            {/* Top */}
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(employee.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-white font-bold text-base">{getInitials(u.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate text-sm">{u.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{designationLabel(employee.designation)}</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                        {employee.status}
                    </span>
                </div>
                <AttendanceBadge pct={s.attendance_percentage} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-green-700">{s.worked_days}</p>
                    <p className="text-xs text-green-500">Worked</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-blue-700">{formatHours(s.total_work_hours)}</p>
                    <p className="text-xs text-blue-500">Hours</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-red-600">{s.absent_days}</p>
                    <p className="text-xs text-red-400">Absent</p>
                </div>
            </div>

            {/* Bar */}
            <MiniStatBar worked={s.worked_days} total={s.total_days_in_month} pct={s.attendance_percentage} />

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono">{employee.employee_code}</span>
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
    const [viewMode, setViewMode] = useState('grid');
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            if (pagination.page !== 1) goToPage(1);
            else fetchEmployees(1);
        }
    }, [debouncedSearch]);

    const fetchEmployees = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({ month, year, page, limit: pagination.limit });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiCall(
                `/shifts/employees-shifts?${params}`, 'GET', null, company?.id
            );
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data || []);
                setMeta(result.meta || null);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? true
                });
            } else {
                throw new Error(result.message || 'Failed to fetch employee shifts');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [month, year, pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchEmployees(1);
            initialFetchDone.current = true;
        }
    }, [fetchEmployees]);

    useEffect(() => {
        if (initialFetchDone.current) {
            fetchEmployees(1);
        }
    }, [month, year]);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchEmployees(pagination.page);
        }
    }, [pagination.page]);

    const navigateMonth = (dir) => {
        let m = month + dir, y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m); setYear(y);
    };

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    const designationLabel = (v) =>
        v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="max-w-7xl m-auto min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Employee Shifts
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor attendance across all employees</p>
                </div>
                {meta && (
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                        <FaUserCircle className="text-blue-400" />
                        {pagination.total} employees
                    </div>
                )}
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-4"
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, or employee code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
                    />
                    <FaSearch className="absolute left-4 top-4 text-gray-400 text-lg" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <FaTimes />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Month Navigator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between bg-white rounded-2xl shadow-md border border-gray-100 p-3 md:p-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => navigateMonth(-1)}
                        className="w-9 h-9 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-gray-200"
                    >
                        <FaChevronLeft size={12} />
                    </motion.button>

                    <div className="flex flex-col items-center">
                        <button
                            onClick={() => setMonthPickerOpen(o => !o)}
                            className="flex items-center gap-2 font-bold text-gray-800 text-base md:text-xl hover:text-blue-600 transition-colors"
                        >
                            {MONTHS[month - 1]} {year}
                            <FaAngleDown className={`text-sm transition-transform ${monthPickerOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {meta?.is_current_month && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1">Current Month</span>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => navigateMonth(1)}
                        disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
                        className="w-9 h-9 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <FaChevronRight size={12} />
                    </motion.button>
                </div>

                <AnimatePresence>
                    {monthPickerOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 grid grid-cols-4 gap-2"
                        >
                            {MONTHS.map((m, i) => (
                                <button
                                    key={m}
                                    onClick={() => { setMonth(i + 1); setMonthPickerOpen(false); }}
                                    className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${month === i + 1 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'hover:bg-blue-50 text-gray-600 hover:text-blue-700'}`}
                                >
                                    {m.slice(0, 3)}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* View Toggle */}
            {!loading && employees.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{employees.length}</span> of{' '}
                        <span className="font-semibold text-gray-800">{pagination.total}</span> employees
                        {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                    </p>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FaTh size={13} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FaListUl size={13} />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && <SkeletonComponent />}

            {/* Empty State */}
            {!loading && employees.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
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
            {!loading && employees.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                    {employees.map((emp, index) => (
                        <EmployeeCard
                            key={emp.employee_id}
                            employee={emp}
                            index={index}
                            onClick={() => setSelectedEmployee(emp)}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {!loading && employees.length > 0 && viewMode === 'list' && (
                <>
                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-4"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Worked</th>
                                        <th className="px-6 py-4">Hours</th>
                                        <th className="px-6 py-4">Leave</th>
                                        <th className="px-6 py-4">Absent</th>
                                        <th className="px-6 py-4">Attendance</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp, index) => {
                                        const s = emp.summary;
                                        const u = emp.user;
                                        const statusColor = emp.status === 'active'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-gray-100 text-gray-500 border-gray-200';

                                        return (
                                            <motion.tr
                                                key={emp.employee_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedEmployee(emp)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white font-bold text-xs">{getInitials(u.name)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{u.name}</p>
                                                            <p className="text-xs text-gray-400 font-mono">{emp.employee_code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                                        {designationLabel(emp.designation)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-700">{s.worked_days}d</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                                        {formatHours(s.total_work_hours)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-purple-600 font-medium">{s.leave_days}d</td>
                                                <td className="px-6 py-4 text-red-500 font-medium">{s.absent_days}d</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${s.attendance_percentage >= 80 ? 'bg-green-400' : s.attendance_percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                                style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <AttendanceBadge pct={s.attendance_percentage} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSelectedEmployee(emp); }}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Mobile List Cards */}
                    <div className="flex flex-col gap-3 md:hidden mb-4">
                        {employees.map((emp, index) => {
                            const s = emp.summary;
                            const u = emp.user;
                            const statusColor = emp.status === 'active'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200';

                            return (
                                <motion.div
                                    key={emp.employee_id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedEmployee(emp)}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                            <span className="text-white font-bold">{getInitials(u.name)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 truncate">{u.name}</h3>
                                                    <p className="text-xs text-gray-500">{designationLabel(emp.designation)}</p>
                                                </div>
                                                <AttendanceBadge pct={s.attendance_percentage} />
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono mt-1 bg-gray-50 px-2 py-0.5 rounded-lg inline-block">{emp.employee_code}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                                        <div className="bg-green-50 rounded-xl p-2 text-center border border-green-100">
                                            <p className="text-sm font-bold text-green-700">{s.worked_days}</p>
                                            <p className="text-xs text-green-500">Worked</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                                            <p className="text-sm font-bold text-blue-700">{formatHours(s.total_work_hours)}</p>
                                            <p className="text-xs text-blue-500">Hours</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-2 text-center border border-purple-100">
                                            <p className="text-sm font-bold text-purple-700">{s.leave_days}</p>
                                            <p className="text-xs text-purple-500">Leave</p>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-2 text-center border border-red-100">
                                            <p className="text-sm font-bold text-red-600">{s.absent_days}</p>
                                            <p className="text-xs text-red-400">Absent</p>
                                        </div>
                                    </div>

                                    <MiniStatBar worked={s.worked_days} total={s.total_days_in_month} pct={s.attendance_percentage} />

                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>{emp.status}</span>
                                        <span className="text-xs text-gray-400">{u.email}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Pagination */}
            {!loading && employees.length > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    variant="default"
                    showInfo={true}
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @media (min-width: 475px) {
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default EmployeesShifts;