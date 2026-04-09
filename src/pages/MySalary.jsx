import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaDollarSign, FaCalendarAlt, FaCheckCircle, FaTimesCircle,
    FaHistory, FaMoneyBillWave, FaInfoCircle, FaClock,
    FaSearch, FaTimes, FaEye, FaUserCircle, FaBriefcase,
    FaEnvelope, FaIdCard, FaChevronDown, FaChevronUp,
    FaYenSign, FaEuroSign, FaPoundSign, FaRupeeSign,
    FaSortAmountDown, FaLayerGroup, FaWallet, FaAngleDown,
    FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const CURRENCY_SYMBOLS = {
    usd: '$', eur: '€', gbp: '£', jpy: '¥', inr: '₹',
    krw: '₩', cny: '¥', aud: 'A$', cad: 'C$', chf: 'CHF',
    sgd: 'S$', myr: 'RM', thb: '฿', php: '₱', idr: 'Rp',
};

const CURRENCY_ICONS = {
    jpy: FaYenSign, eur: FaEuroSign, gbp: FaPoundSign,
    inr: FaRupeeSign, usd: FaDollarSign,
};

const AVATAR_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-500',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrencySymbol = (currency) =>
    CURRENCY_SYMBOLS[currency?.toLowerCase()] || currency?.toUpperCase() || '$';

const getCurrencyIcon = (currency) =>
    CURRENCY_ICONS[currency?.toLowerCase()] || FaDollarSign;

const formatAmount = (amount, currency) => {
    const sym = getCurrencySymbol(currency);
    const num = parseFloat(amount || 0);
    return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (s) => {
    if (!s) return 'Present';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDisplay = (v) =>
    v?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A';

const avatarGradient = (id) => AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];

const getInitials = (name = '') =>
    name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ─── Shared Sub-Components ────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const ActiveBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isActive
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
        {isActive
            ? <FaCheckCircle size={9} />
            : <FaTimesCircle size={9} />}
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const SalaryDetailModal = ({ record, onClose, showEmployee = false }) => {
    if (!record) return null;
    const CurrIcon = getCurrencyIcon(record.salary?.currency || record.currency);
    const salaryData = record.salary || record;

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500" />

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
                                    <FaMoneyBillWave className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Salary Details</h2>
                                    <p className="text-xs text-gray-400">Record #{salaryData.id}</p>
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

                    <div className="p-6 space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">

                        {/* Employee info if admin view */}
                        {showEmployee && record.name && (
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(record.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <span className="text-white font-bold">{getInitials(record.name)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{record.name}</h3>
                                    <p className="text-xs text-gray-500">{record.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{formatDisplay(record.designation)}</span>
                                        <span className="text-xs font-mono text-gray-400">{record.employee_code}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Big amount display - Sweet light colors */}
                        <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 rounded-2xl p-5 text-center">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Base Salary</p>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                                    <CurrIcon className="text-white text-sm" />
                                </div>
                                <span className="text-4xl font-bold text-amber-700">
                                    {formatAmount(salaryData.base_amount, salaryData.currency)}
                                </span>
                            </div>
                            <p className="text-sm text-amber-600 mt-2 font-medium">{formatDisplay(salaryData.salary_type)}</p>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <InfoItem
                                icon={<FaDollarSign className="text-amber-500" size={11} />}
                                label="Currency"
                                value={salaryData.currency?.toUpperCase() || 'N/A'}
                            />
                            <InfoItem
                                icon={<FaLayerGroup className="text-blue-500" size={11} />}
                                label="Type"
                                value={formatDisplay(salaryData.salary_type)}
                            />
                            <InfoItem
                                icon={<FaCalendarAlt className="text-rose-500" size={11} />}
                                label="Effective From"
                                value={formatDate(salaryData.effective_from)}
                            />
                            <InfoItem
                                icon={<FaCalendarAlt className="text-orange-400" size={11} />}
                                label="Effective To"
                                value={formatDate(salaryData.effective_to)}
                            />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                <FaClock size={11} className="text-gray-400" />
                                Created {formatDate(salaryData.created_at)}
                            </span>
                            <ActiveBadge isActive={!!salaryData.is_active} />
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-2">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-medium text-sm">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — MY SALARY (UPDATED with History Toggle & Sweet Light Colors)
// ═══════════════════════════════════════════════════════════════════════════════

export const MySalary = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [showHistory, setShowHistory] = useState(true); // Toggle state for history
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);

    // Updated fetchSalary with conditional history param
    const fetchSalary = useCallback(async () => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            // Conditionally add history param based on showHistory state
            const url = showHistory ? '/salary/my-salary?history=true' : '/salary/my-salary';
            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setSalaries(result.data || []);
            } else {
                throw new Error(result.message || 'Failed to fetch salary');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [showHistory]); // Dependency on showHistory

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchSalary();
            initialFetchDone.current = true;
        }
    }, [fetchSalary]);

    // Re-fetch when showHistory toggles
    const handleToggleHistory = () => {
        setShowHistory(prev => !prev);
        // Reset fetch flag to allow new request
        fetchInProgress.current = false;
        initialFetchDone.current = false;
    };

    useEffect(() => {
        if (initialFetchDone.current) {
            fetchSalary();
        }
    }, [showHistory, fetchSalary]);

    const activeSalary = salaries.find(s => s.is_active === 1 || s.is_active === true);
    const history = salaries.filter(s => !s.is_active);

    return (
        <div className="max-w-7xl m-auto min-h-screen p-3 md:p-6 font-sans">

            {/* Header with History Toggle Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-rose-600">
                        My Salary
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Your compensation details & history</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* History Toggle Button */}
                    <button
                        onClick={handleToggleHistory}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${showHistory
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {showHistory ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                        <FaHistory size={14} />
                        {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                        <FaHistory className="text-amber-400" />
                        {salaries.length} record{salaries.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </motion.div>

            {loading && <SkeletonComponent />}

            {!loading && salaries.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaMoneyBillWave className="text-4xl text-gray-300" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No salary records found</p>
                    <p className="text-gray-400 mt-2 text-sm">Your salary information hasn't been set up yet</p>
                </motion.div>
            )}

            {!loading && salaries.length > 0 && (
                <div className="space-y-6">

                    {/* Active Salary Hero Card - Sweet Light Colors Update */}
                    {activeSalary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        >
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                                Current Salary
                            </p>
                            <div className="relative bg-gradient-to-br from-amber-50 via-rose-50 to-pink-50 rounded-3xl p-6 md:p-8 overflow-hidden shadow-xl border border-amber-100">
                                {/* Background decoration - softer */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-rose-200/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-200/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-amber-200/50 border border-amber-300/50 rounded-xl flex items-center justify-center">
                                                <FaWallet className="text-amber-600 text-base" />
                                            </div>
                                            <div>
                                                <p className="text-amber-700 text-xs font-medium uppercase tracking-wider">Base Salary</p>
                                                <p className="text-amber-600 text-sm">{formatDisplay(activeSalary.salary_type)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    {/* Big Amount - Sweet colors */}
                                    <div className="mb-6">
                                        <span className="text-4xl md:text-5xl font-bold text-amber-800 tracking-tight">
                                            {formatAmount(activeSalary.base_amount, activeSalary.currency)}
                                        </span>
                                        <span className="text-amber-500 text-sm ml-2 font-medium">
                                            {activeSalary.currency?.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                                            <FaCalendarAlt size={12} className="text-amber-400" />
                                            <span>From <span className="text-amber-800 font-medium">{formatDate(activeSalary.effective_from)}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                                            <FaCalendarAlt size={12} className="text-rose-400" />
                                            <span>To <span className="text-amber-800 font-medium">{formatDate(activeSalary.effective_to)}</span></span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedRecord(activeSalary)}
                                            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors ml-auto"
                                        >
                                            <FaEye size={12} /> View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* History Section - Conditionally rendered based on toggle */}
                    {showHistory && history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        >
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FaHistory className="text-gray-400" size={11} />
                                Salary History
                            </p>
                            <div className="space-y-3">
                                {history.map((record, index) => {
                                    const isExpanded = expandedId === record.id;
                                    const CurrIcon = getCurrencyIcon(record.currency);
                                    return (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200"
                                        >
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                                className="w-full flex items-center justify-between p-4 md:p-5 text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <CurrIcon className="text-gray-500 text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{formatAmount(record.base_amount, record.currency)}</p>
                                                        <p className="text-xs text-gray-400">{formatDisplay(record.salary_type)} · {record.currency?.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-gray-500">{formatDate(record.effective_from)}</p>
                                                        <p className="text-xs text-gray-400">→ {formatDate(record.effective_to)}</p>
                                                    </div>
                                                    <ActiveBadge isActive={false} />
                                                    {isExpanded
                                                        ? <FaChevronUp size={12} className="text-gray-400" />
                                                        : <FaChevronDown size={12} className="text-gray-400" />}
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="border-t border-gray-100 overflow-hidden"
                                                    >
                                                        <div className="p-4 md:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <div className="bg-gray-50 rounded-xl p-3">
                                                                <p className="text-xs text-gray-400 mb-1">Currency</p>
                                                                <p className="font-semibold text-gray-700 text-sm">{record.currency?.toUpperCase()}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-3">
                                                                <p className="text-xs text-gray-400 mb-1">Type</p>
                                                                <p className="font-semibold text-gray-700 text-sm">{formatDisplay(record.salary_type)}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-3">
                                                                <p className="text-xs text-gray-400 mb-1">From</p>
                                                                <p className="font-semibold text-gray-700 text-sm">{formatDate(record.effective_from)}</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-3">
                                                                <p className="text-xs text-gray-400 mb-1">To</p>
                                                                <p className="font-semibold text-gray-700 text-sm">{formatDate(record.effective_to)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 pb-4 md:px-5 flex justify-end">
                                                            <button
                                                                onClick={() => setSelectedRecord(record)}
                                                                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                                            >
                                                                <FaEye size={11} /> View Full Details
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Message when history is hidden but there is history */}
                    {!showHistory && history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
                        >
                            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                                <FaHistory className="text-amber-400" />
                                History is hidden. Click "Show History" to view past salary records.
                            </p>
                        </motion.div>
                    )}

                    {/* All records compact list if only 1 total and it's active */}
                    {salaries.length === 1 && activeSalary && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <FaInfoCircle size={13} className="text-blue-400" />
                                This is your first and only salary record on file.
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedRecord && (
                    <SalaryDetailModal
                        record={selectedRecord}
                        onClose={() => setSelectedRecord(null)}
                    />
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — EMPLOYEES SALARIES (Admin View)
// ═══════════════════════════════════════════════════════════════════════════════

export const EmployeesSalaries = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [viewMode, setViewMode] = useState('card');

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            if (pagination.page !== 1) goToPage(1);
            else fetchEmployees(1);
        }
    }, [debouncedSearch]); // eslint-disable-line

    const fetchEmployees = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({ page, limit: pagination.limit });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiCall(
                `/salary/employees-salaries?${params}`, 'GET', null, company?.id
            );
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data || []);
                updatePagination({
                    page: result.page || page,
                    limit: result.limit || pagination.limit,
                    total: result.total || 0,
                    total_pages: Math.ceil((result.total || 0) / (result.limit || pagination.limit)),
                    is_last_page: result.page >= Math.ceil((result.total || 0) / (result.limit || pagination.limit))
                });
            } else {
                throw new Error(result.message || 'Failed to fetch salaries');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchEmployees(1);
            initialFetchDone.current = true;
        }
    }, [fetchEmployees]);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchEmployees(pagination.page);
        }
    }, [pagination.page]); // eslint-disable-line

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-rose-600">
                        Employee Salaries
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Current compensation across all employees</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                    <FaUserCircle className="text-amber-400" />
                    {pagination.total} employees
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="mb-6"
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, or employee code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none shadow-lg transition-all"
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

            {/* View toggle */}
            {!loading && employees.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{employees.length}</span> of{' '}
                        <span className="font-semibold text-gray-800">{pagination.total}</span>
                        {debouncedSearch && <span className="ml-1 text-amber-600">· "{debouncedSearch}"</span>}
                    </p>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                </div>
            )}

            {loading && <SkeletonComponent />}

            {/* Empty */}
            {!loading && employees.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaMoneyBillWave className="text-4xl text-gray-300" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No salary records found</p>
                    <p className="text-gray-400 mt-2 text-sm">
                        {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No employee salaries configured yet'}
                    </p>
                    {debouncedSearch && (
                        <button onClick={() => setSearchTerm('')}
                            className="mt-4 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all text-sm font-medium">
                            Clear Search
                        </button>
                    )}
                </motion.div>
            )}

            {/* Grid View */}
            {!loading && employees.length > 0 && viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode}>
                    {employees.map((emp, index) => {
                        const sal = emp.salary;
                        const CurrIcon = getCurrencyIcon(sal?.currency);
                        return (
                            <motion.div
                                key={emp.employee_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedRecord(emp)}
                                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                        <span className="text-white font-bold text-sm">{getInitials(emp.name)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate text-sm">{emp.name}</h3>
                                        <p className="text-xs text-gray-400 truncate">{formatDisplay(emp.designation)}</p>
                                    </div>
                                </div>

                                {/* Salary highlight - Sweet light colors */}
                                <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 rounded-xl p-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <CurrIcon className="text-white text-xs" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-amber-700">
                                                {sal ? formatAmount(sal.base_amount, sal.currency) : '—'}
                                            </p>
                                            <p className="text-xs text-amber-600">{formatDisplay(sal?.salary_type)} · {sal?.currency?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <FaCalendarAlt size={9} className="text-gray-300" />
                                        {sal ? formatDate(sal.effective_from) : 'N/A'}
                                    </span>
                                    {sal && <ActiveBadge isActive={!!sal.is_active} />}
                                </div>

                                <div className="mt-2 text-xs font-mono text-gray-300 truncate">{emp.employee_code}</div>
                            </motion.div>
                        );
                    })}
                </ManagementGrid>
            )}

            {/* List View */}
            {!loading && employees.length > 0 && viewMode === 'table' && (
                <>
                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-4"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-[1050px] w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Salary</th>
                                        <th className="px-6 py-4">Currency</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Effective From</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {employees.map((emp, index) => {
                                        const sal = emp.salary;
                                        const CurrIcon = getCurrencyIcon(sal?.currency);
                                        return (
                                            <motion.tr
                                                key={emp.employee_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-rose-50 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedRecord(emp)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white font-bold text-xs">{getInitials(emp.name)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{emp.name}</p>
                                                            <p className="text-xs text-gray-400">{emp.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                                        {formatDisplay(emp.designation)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <CurrIcon className="text-white" size={10} />
                                                        </div>
                                                        <span className="font-bold text-amber-700">
                                                            {sal ? formatAmount(sal.base_amount, sal.currency) : '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-lg">
                                                        {sal?.currency?.toUpperCase() || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                                                        {formatDisplay(sal?.salary_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">
                                                    {sal ? formatDate(sal.effective_from) : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {sal ? <ActiveBadge isActive={!!sal.is_active} /> : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSelectedRecord(emp); }}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs rounded-lg hover:from-amber-700 hover:to-rose-700 transition-all shadow-sm hover:shadow-md"
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

                    {false && (<>
                    {/* Mobile Cards */}
                    <div className="flex flex-col gap-3 md:hidden mb-4">
                        {employees.map((emp, index) => {
                            const sal = emp.salary;
                            const CurrIcon = getCurrencyIcon(sal?.currency);
                            return (
                                <motion.div
                                    key={emp.employee_id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedRecord(emp)}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                            <span className="text-white font-bold">{getInitials(emp.name)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate">{emp.name}</h3>
                                            <p className="text-xs text-gray-500">{formatDisplay(emp.designation)}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employee_code}</p>
                                        </div>
                                        {sal && <ActiveBadge isActive={!!sal.is_active} />}
                                    </div>

                                    <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <CurrIcon className="text-white text-xs" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-700 text-lg">
                                                {sal ? formatAmount(sal.base_amount, sal.currency) : '—'}
                                            </p>
                                            <p className="text-xs text-amber-600">{formatDisplay(sal?.salary_type)} · From {sal ? formatDate(sal.effective_from) : '—'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    </>)}
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

            {/* Modal */}
            <AnimatePresence>
                {selectedRecord && (
                    <SalaryDetailModal
                        record={selectedRecord}
                        onClose={() => setSelectedRecord(null)}
                        showEmployee={true}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default MySalary;
