import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaUserCheck, FaSpinner, FaBriefcase, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaSearch, FaTimes,
    FaChartBar, FaPlay, FaStop, FaMoon, FaSun, FaInfoCircle,
    FaListUl, FaTh, FaAngleDown
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

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const formatShortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0h';
    const h = parseFloat(hours);
    return `${h.toFixed(1)}h`;
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-amber-500',
        red: 'from-red-500 to-rose-600',
        indigo: 'from-indigo-500 to-indigo-600',
    };
    const bgMap = {
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        purple: 'bg-purple-50',
        orange: 'bg-orange-50',
        red: 'bg-red-50',
        indigo: 'bg-indigo-50',
    };
    const textMap = {
        blue: 'text-blue-700',
        green: 'text-green-700',
        purple: 'text-purple-700',
        orange: 'text-orange-700',
        red: 'text-red-700',
        indigo: 'text-indigo-700',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex items-center gap-3 hover:shadow-lg transition-all duration-300"
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-sm">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
                <p className={`text-lg font-bold ${textMap[color]}`}>{value}</p>
            </div>
        </motion.div>
    );
};

const AttendanceBadge = ({ pct }) => {
    const color = pct >= 80 ? 'text-green-700 bg-green-50 border-green-200'
        : pct >= 50 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
            : 'text-red-700 bg-red-50 border-red-200';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${color}`}>
            <FaChartBar size={9} />
            {pct?.toFixed(1)}%
        </span>
    );
};

const ShiftDetailModal = ({ shift, onClose }) => {
    if (!shift) return null;
    const workedH = parseFloat(shift.worked_hours || 0);
    const isFullDay = workedH >= 8;

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
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaClock className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Shift Details</h2>
                                    <p className="text-xs text-gray-400">{formatDate(shift.start_time)}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FaPlay className="text-green-500 text-xs" />
                                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Clock In</span>
                                </div>
                                <p className="text-xl font-bold text-green-700">{formatTime(shift.start_time)}</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FaStop className="text-red-500 text-xs" />
                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Clock Out</span>
                                </div>
                                <p className="text-xl font-bold text-red-700">{formatTime(shift.end_time)}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                            <DetailRow icon={<FaClock className="text-blue-500" />} label="Total Worked" value={formatHours(shift.worked_hours)} />
                            <DetailRow icon={<FaMoon className="text-purple-500" />} label="Break Time" value={formatDuration(shift.break_minutes)} />
                            <DetailRow icon={<FaCalendarAlt className="text-indigo-500" />} label="Duration" value={formatDuration(shift.worked_minutes)} />
                            <DetailRow
                                icon={shift.is_active ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-gray-400" />}
                                label="Status"
                                value={<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${shift.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {shift.is_active ? 'Active' : 'Completed'}
                                </span>}
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <FaInfoCircle />
                            <span>Shift ID: #{shift.id} · Created {formatShortDate(shift.created_at)}</span>
                        </div>
                    </div>

                    <div className="px-6 pb-5">
                        <button onClick={onClose} className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">{icon}{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MyShifts = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [shifts, setShifts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);

    const fetchShifts = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall(
                `/shifts/my-shifts?month=${month}&year=${year}&page=${page}&limit=${pagination.limit}`,
                'GET', null, company?.id
            );
            const result = await response.json();
            if (result.success) {
                setShifts(result.data || []);
                setSummary(result.summary || null);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? true
                });
            } else {
                throw new Error(result.message || 'Failed to fetch shifts');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [month, year, pagination.page, pagination.limit, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchShifts(1);
            initialFetchDone.current = true;
        }
    }, [fetchShifts]);

    useEffect(() => {
        if (initialFetchDone.current) {
            fetchShifts(1);
        }
    }, [month, year]);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchShifts(pagination.page);
        }
    }, [pagination.page]);

    const navigateMonth = (dir) => {
        let m = month + dir;
        let y = year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        setMonth(m);
        setYear(y);
    };

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        My Shifts
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track your work hours and attendance</p>
                </div>
                {summary && (
                    <AttendanceBadge pct={summary.attendance_percentage} />
                )}
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
                        className="w-9 h-9 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200"
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
                        {summary?.is_current_month && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full mt-1">Current Month</span>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => navigateMonth(1)}
                        disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
                        className="w-9 h-9 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <FaChevronRight size={12} />
                    </motion.button>
                </div>

                {/* Month quick-picker */}
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

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <SummaryCard icon={<FaCheckCircle />} label="Worked Days" value={summary.worked_days} color="green" delay={0.1} />
                    <SummaryCard icon={<FaClock />} label="Total Hours" value={formatHours(summary.total_work_hours)} color="blue" delay={0.15} />
                    <SummaryCard icon={<FaSun />} label="Avg / Day" value={formatHours(summary.average_hours_per_day)} color="orange" delay={0.2} />
                    <SummaryCard icon={<FaMoon />} label="Leave Days" value={summary.leave_days} color="purple" delay={0.25} />
                    <SummaryCard icon={<FaTimesCircle />} label="Absent" value={summary.absent_days} color="red" delay={0.3} />
                    <SummaryCard icon={<FaCalendarAlt />} label="Holidays" value={summary.holidays} color="indigo" delay={0.35} />
                </div>
            )}

            {/* Attendance Bar */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 bg-white rounded-2xl shadow-md border border-gray-100 p-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FaChartBar className="text-blue-500" /> Attendance Rate
                        </span>
                        <span className="text-sm font-bold text-blue-600">{summary.attendance_percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(summary.attendance_percentage, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${summary.attendance_percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : summary.attendance_percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{summary.worked_days} worked</span>
                        <span>{summary.total_days_in_month} total days</span>
                    </div>
                </motion.div>
            )}

            {/* View Toggle + Count */}
            {!loading && shifts.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-800">{shifts.length}</span> of <span className="font-semibold text-gray-800">{pagination.total}</span> shifts
                    </p>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FaListUl size={13} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FaTh size={13} />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && <SkeletonComponent />}

            {/* Empty State */}
            {!loading && shifts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaClock className="text-4xl text-gray-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No shifts found</p>
                    <p className="text-gray-400 mt-2 text-sm">No shifts recorded for {MONTHS[month - 1]} {year}</p>
                </motion.div>
            )}

            {/* List View */}
            {!loading && shifts.length > 0 && viewMode === 'list' && (
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
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Clock In</th>
                                        <th className="px-6 py-4">Clock Out</th>
                                        <th className="px-6 py-4">Break</th>
                                        <th className="px-6 py-4">Worked</th>
                                        <th className="px-6 py-4">Hours</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {shifts.map((shift, index) => (
                                        <motion.tr
                                            key={shift.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                                            onClick={() => setSelectedShift(shift)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{formatShortDate(shift.start_time)}</div>
                                                <div className="text-xs text-gray-400">{new Date(shift.start_time).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-green-700 font-medium">
                                                    <FaPlay size={9} className="text-green-500" />
                                                    {formatTime(shift.start_time)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-red-700 font-medium">
                                                    <FaStop size={9} className="text-red-400" />
                                                    {formatTime(shift.end_time)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{formatDuration(shift.break_minutes)}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatDuration(shift.worked_minutes)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                                                    {formatHours(shift.worked_hours)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${shift.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {shift.is_active ? 'Active' : 'Done'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setSelectedShift(shift); }}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Mobile List */}
                    <div className="flex flex-col gap-3 md:hidden mb-4">
                        {shifts.map((shift, index) => (
                            <motion.div
                                key={shift.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedShift(shift)}
                                className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 active:scale-98 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-gray-800">{formatShortDate(shift.start_time)}</p>
                                        <p className="text-xs text-gray-400">{new Date(shift.start_time).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                                            {formatHours(shift.worked_hours)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${shift.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            {shift.is_active ? 'Active' : 'Done'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
                                        <p className="text-xs text-green-600 font-medium mb-0.5">In</p>
                                        <p className="text-sm font-bold text-green-700">{formatTime(shift.start_time)}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
                                        <p className="text-xs text-red-500 font-medium mb-0.5">Out</p>
                                        <p className="text-sm font-bold text-red-600">{formatTime(shift.end_time)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Break</p>
                                        <p className="text-sm font-bold text-gray-700">{formatDuration(shift.break_minutes)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {/* Grid View */}
            {!loading && shifts.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                    {shifts.map((shift, index) => (
                        <motion.div
                            key={shift.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.04 }}
                            onClick={() => setSelectedShift(shift)}
                            className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaClock className="text-white text-sm" />
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${shift.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {shift.is_active ? 'Active' : 'Done'}
                                </span>
                            </div>

                            <p className="font-bold text-gray-800 text-base">{formatShortDate(shift.start_time)}</p>
                            <p className="text-xs text-gray-400 mb-3">{new Date(shift.start_time).toLocaleDateString('en-US', { weekday: 'long' })}</p>

                            <div className="text-2xl font-bold text-blue-600 mb-3">{formatHours(shift.worked_hours)}</div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 flex items-center gap-1"><FaPlay size={8} className="text-green-500" />In</span>
                                    <span className="font-semibold text-green-700">{formatTime(shift.start_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 flex items-center gap-1"><FaStop size={8} className="text-red-400" />Out</span>
                                    <span className="font-semibold text-red-600">{formatTime(shift.end_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 flex items-center gap-1"><FaMoon size={8} className="text-purple-400" />Break</span>
                                    <span className="font-semibold text-gray-600">{formatDuration(shift.break_minutes)}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && shifts.length > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    variant="default"
                    showInfo={true}
                />
            )}

            {/* Shift Detail Modal */}
            <AnimatePresence>
                {selectedShift && (
                    <ShiftDetailModal
                        shift={selectedShift}
                        onClose={() => setSelectedShift(null)}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .active\\:scale-98:active { transform: scale(0.98); }
                @media (min-width: 475px) {
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default MyShifts;