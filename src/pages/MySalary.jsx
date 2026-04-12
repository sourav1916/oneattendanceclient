import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaMoneyBillWave, FaCalendarAlt, FaUserCircle, FaBriefcase,
    FaChartBar, FaArrowUp, FaArrowDown, FaInfoCircle,
    FaSpinner, FaSearch, FaTimes, FaEye,
    FaRegClock, FaFileInvoiceDollar, FaExclamationTriangle,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaIdCard,
    FaUserTag, FaWallet, FaCalendarCheck, FaUserTie, FaDollarSign
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MODAL_TYPES = { NONE: 'NONE', VIEW: 'VIEW' };

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(Math.abs(num));
};

const formatLabel = (str) => {
    if (!str) return 'N/A';
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusConfig = (status) => ({
    draft:     { label: 'Draft',     className: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: FaHourglassHalf },
    approved:  { label: 'Approved',  className: 'bg-green-100 text-green-800 border border-green-200',   icon: FaCheckCircle   },
    paid:      { label: 'Paid',      className: 'bg-blue-100 text-blue-800 border border-blue-200',      icon: FaCheckCircle   },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border border-red-200',         icon: FaTimesCircle   },
}[status] || { label: formatLabel(status), className: 'bg-gray-100 text-gray-800 border border-gray-200', icon: FaInfoCircle });

// ─── Sub Components ────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        className={`relative overflow-hidden rounded-2xl p-5 shadow-lg text-white ${gradient}`}
    >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white -translate-y-8 translate-x-8" />
        <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="text-xl" />
            </div>
            {sub && <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded-full">{sub}</span>}
        </div>
        <p className="text-sm text-white/80 font-medium">{label}</p>
        <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
    </motion.div>
);

const AttendancePill = ({ label, value, color }) => (
    <div className={`flex flex-col items-center p-3 rounded-xl bg-${color}-50 border border-${color}-100 min-w-0`}>
        <span className={`text-xl font-bold text-${color}-600`}>{parseFloat(value || 0).toFixed(1)}</span>
        <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
    </div>
);

// ─── View Modal ────────────────────────────────────────────────────────────────

const PayrollViewModal = ({ payroll, employee, onClose }) => {
    if (!payroll) return null;
    const { payroll: p } = payroll;
    const status = getStatusConfig(p.status);
    const StatusIcon = status.icon;
    const netNegative = parseFloat(p.net_salary) < 0;

    return (
        <>
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                            <FaFileInvoiceDollar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Payroll Details</h2>
                            <p className="text-sm text-blue-100 mt-0.5">{MONTHS[p.month - 1]} {p.year}</p>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <FaTimes className="w-4 h-4 text-white" />
                    </motion.button>
                </div>
            </div>

            <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                {/* Employee Info */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <FaUserCircle className="text-white text-3xl" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{formatLabel(employee?.designation)}</h3>
                        <p className="text-sm text-gray-500 font-mono">{employee?.employee_code}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{formatLabel(employee?.employment_type)}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{formatLabel(employee?.salary_type)}</span>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${status.className}`}>
                        <StatusIcon className="text-xs" />{status.label}
                    </span>
                </div>

                {/* Salary Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 text-center">
                        <FaArrowUp className="text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Earnings</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(p.total_earnings)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100 text-center">
                        <FaArrowDown className="text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Deductions</p>
                        <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(p.total_deductions)}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border text-center ${netNegative ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-100' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
                        <FaWallet className={`mx-auto mb-2 ${netNegative ? 'text-orange-500' : 'text-blue-500'}`} />
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Net Salary</p>
                        <p className={`text-xl font-bold mt-1 ${netNegative ? 'text-orange-600' : 'text-blue-600'}`}>
                            {netNegative ? '-' : ''}{formatCurrency(p.net_salary)}
                        </p>
                        {netNegative && (
                            <p className="text-xs text-orange-500 mt-1 flex items-center justify-center gap-1">
                                <FaExclamationTriangle className="text-xs" /> Deficit
                            </p>
                        )}
                    </div>
                </div>

                {/* Attendance Summary */}
                {p.attendance && (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <FaCalendarCheck className="text-indigo-500" /> Attendance Summary
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <AttendancePill label="Present"      value={p.attendance.present_days}      color="green"  />
                            <AttendancePill label="Absent"       value={p.attendance.absent_days}       color="red"    />
                            <AttendancePill label="Paid Leave"   value={p.attendance.paid_leave_days}   color="blue"   />
                            <AttendancePill label="Unpaid Leave" value={p.attendance.unpaid_leave_days} color="orange" />
                            <AttendancePill label="LOP Days"     value={p.attendance.lop_days}          color="purple" />
                            <div className="flex flex-col items-center p-3 rounded-xl bg-rose-50 border border-rose-100 min-w-0">
                                <span className="text-sm font-bold text-rose-600 text-center leading-tight">
                                    {p.attendance.lop_deduction ? formatCurrency(p.attendance.lop_deduction) : '₹0'}
                                </span>
                                <span className="text-xs text-gray-500 mt-1 text-center">LOP Deduct.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hours */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaRegClock className="text-blue-600 text-sm" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Worked Hours</p>
                            <p className="text-sm font-semibold text-gray-800">{parseFloat(p.worked_hours || 0).toFixed(2)} hrs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaChartBar className="text-purple-600 text-sm" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overtime Hours</p>
                            <p className="text-sm font-semibold text-gray-800">{parseFloat(p.overtime_hours || 0).toFixed(2)} hrs</p>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Payroll ID</span>
                    <span className="text-xs font-mono font-semibold text-gray-700">#{p.id}</span>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
                    Close
                </button>
            </div>
        </>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const MyPayroll = () => {
    const [payrollData, setPayrollData] = useState([]);
    const [employee, setEmployee]       = useState(null);
    const [loading, setLoading]         = useState(false);
    const [modalType, setModalType]     = useState(MODAL_TYPES.NONE);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [viewMode, setViewMode]       = useState('table');
    const [searchTerm, setSearchTerm]   = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { pagination, updatePagination, goToPage } = usePagination(1, 12);
    const fetchInProgress  = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad    = useRef(true);
    const isMounted        = useRef(true);

    // ─── Responsive Columns — mirrors EmployeeManagement pattern ──────────────
    // Columns drop one by one as viewport shrinks:
    //  ≥1280 : all columns visible
    //  ≥1100 : drop Hours
    //  ≥1024 : drop Attendance
    //  ≥768  : drop Deductions
    //  ≥640  : drop Earnings + Status
    //  <640  : Period + Net + Actions only

    const [visibleColumns, setVisibleColumns] = useState(() => ({
        showPeriod:      true,
        showEarnings:    window.innerWidth >= 640,
        showDeductions:  window.innerWidth >= 768,
        showNet:         true,
        showAttendance:  window.innerWidth >= 1024,
        showHours:       window.innerWidth >= 1100,
        showStatus:      window.innerWidth >= 640,
    }));

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() => setVisibleColumns({
                showPeriod:      true,
                showEarnings:    window.innerWidth >= 640,
                showDeductions:  window.innerWidth >= 768,
                showNet:         true,
                showAttendance:  window.innerWidth >= 1024,
                showHours:       window.innerWidth >= 1100,
                showStatus:      window.innerWidth >= 640,
            }), 150);
        };
        window.addEventListener('resize', onResize);
        return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    }, []);

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            if (pagination.page !== 1) goToPage(1);
            else fetchPayroll(1);
        }
    }, [debouncedSearch]);

    // ─── API ────────────────────────────────────────────────────────────────────

    const fetchPayroll = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company   = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;
            const params    = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiCall(`/payroll/my?${params}`, 'GET', null, companyId);
            const result   = await response.json();

            if (result.success) {
                setPayrollData(result.data || []);
                setEmployee(result.employee || null);
                updatePagination({
                    page:        result.pagination?.page        || page,
                    limit:       result.pagination?.limit       || pagination.limit,
                    total:       result.total                   || result.data?.length || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? true
                });
            } else {
                throw new Error(result.message || 'Failed to fetch payroll');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch payroll');
        } finally {
            setLoading(false);
            fetchInProgress.current  = false;
            isInitialLoad.current    = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchPayroll(1, true);
            initialFetchDone.current = true;
        }
    }, [fetchPayroll]);

    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchPayroll(pagination.page, true);
        }
    }, [pagination.page]);

    // ─── Summary Stats ──────────────────────────────────────────────────────────

    const totalEarnings   = payrollData.reduce((s, r) => s + parseFloat(r.payroll?.total_earnings   || 0), 0);
    const totalDeductions = payrollData.reduce((s, r) => s + parseFloat(r.payroll?.total_deductions  || 0), 0);
    const totalNet        = payrollData.reduce((s, r) => s + parseFloat(r.payroll?.net_salary        || 0), 0);
    const latestPayroll   = payrollData[0]?.payroll;

    const openViewModal = (item) => { setSelectedPayroll(item); setModalType(MODAL_TYPES.VIEW); };
    const closeModal    = ()     => { setModalType(MODAL_TYPES.NONE); setSelectedPayroll(null); };

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    My Payroll
                </h1>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                    Total: {pagination.total} records
                </div>
            </motion.div>

            {/* Employee Info Strip */}
            {employee && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
                >
                    {[
                        { icon: FaIdCard,     label: 'Employee ID',     value: `#${employee.id}`,                     bg: 'bg-blue-50',    border: 'border-blue-100',    iconCls: 'text-blue-500'    },
                        { icon: FaUserTie,    label: 'Designation',     value: formatLabel(employee.designation),     bg: 'bg-indigo-50',  border: 'border-indigo-100',  iconCls: 'text-indigo-500'  },
                        { icon: FaBriefcase,  label: 'Employment Type', value: formatLabel(employee.employment_type), bg: 'bg-purple-50',  border: 'border-purple-100',  iconCls: 'text-purple-500'  },
                        { icon: FaDollarSign, label: 'Salary Type',     value: formatLabel(employee.salary_type),     bg: 'bg-emerald-50', border: 'border-emerald-100', iconCls: 'text-emerald-500' },
                    ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                            className={`p-3 ${item.bg} ${item.border} border rounded-xl flex items-center gap-3`}
                        >
                            <item.icon className={`${item.iconCls} flex-shrink-0`} />
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">{item.label}</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{item.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Summary Stats */}
            {payrollData.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={FaMoneyBillWave} label="Total Earnings"   value={formatCurrency(totalEarnings)}
                        sub={`${payrollData.length} records`}
                        gradient="bg-gradient-to-br from-green-500 to-emerald-600"  delay={0.1} />
                    <StatCard icon={FaArrowDown}     label="Total Deductions" value={formatCurrency(totalDeductions)}
                        gradient="bg-gradient-to-br from-red-500 to-rose-600"       delay={0.15} />
                    <StatCard icon={FaWallet}        label="Net Salary"       value={(totalNet < 0 ? '-' : '') + formatCurrency(totalNet)}
                        gradient={totalNet < 0 ? "bg-gradient-to-br from-orange-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"} delay={0.2} />
                    <StatCard icon={FaCalendarAlt}   label="Latest Payroll"
                        value={latestPayroll ? `${MONTHS[latestPayroll.month - 1]} ${latestPayroll.year}` : 'N/A'}
                        sub={latestPayroll ? getStatusConfig(latestPayroll.status).label : ''}
                        gradient="bg-gradient-to-br from-purple-500 to-violet-600" delay={0.25} />
                </div>
            )}

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
                <div className="relative w-full">
                    <input type="text" placeholder="Search by month, year, or status..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all text-sm"
                    />
                    <FaSearch className="absolute left-4 top-4 text-gray-400 text-lg" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <FaTimes />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* View Toggle */}
            <div className="flex justify-end mb-6">
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
            </div>

            {/* Loading */}
            {loading && !payrollData.length && <SkeletonComponent />}

            {/* Empty */}
            {!loading && payrollData.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl"
                >
                    <FaFileInvoiceDollar className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No payroll records found</p>
                    <p className="text-gray-400 mt-2">Your payroll data will appear here once processed</p>
                </motion.div>
            )}

            {!loading && payrollData.length > 0 && (
                <>
                    {/* ── TABLE VIEW ─────────────────────────────────────────────────────── */}
                    {viewMode === 'table' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-xl overflow-visible"
                        >
                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                        <tr>
                                            {visibleColumns.showPeriod      && <th className="px-6 py-4">Period</th>}
                                            {visibleColumns.showEarnings    && <th className="px-6 py-4">Earnings</th>}
                                            {visibleColumns.showDeductions  && <th className="px-6 py-4">Deductions</th>}
                                            {visibleColumns.showNet         && <th className="px-6 py-4">Net Salary</th>}
                                            {visibleColumns.showAttendance  && <th className="px-6 py-4">Attendance</th>}
                                            {visibleColumns.showHours       && <th className="px-6 py-4">Hours</th>}
                                            {visibleColumns.showStatus      && <th className="px-6 py-4">Status</th>}
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payrollData.map((item, index) => {
                                            const p         = item.payroll;
                                            const statusCfg = getStatusConfig(p.status);
                                            const StatusIcon = statusCfg.icon;
                                            const netNeg    = parseFloat(p.net_salary) < 0;

                                            return (
                                                <motion.tr key={p.id}
                                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
                                                >
                                                    {visibleColumns.showPeriod && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                                                    <FaCalendarAlt className="text-blue-500 text-sm" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-800">{MONTHS[p.month - 1]}</p>
                                                                    <p className="text-xs text-gray-500">{p.year}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showEarnings && (
                                                        <td className="px-6 py-4">
                                                            <span className="text-green-600 font-semibold">{formatCurrency(p.total_earnings)}</span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showDeductions && (
                                                        <td className="px-6 py-4">
                                                            <span className="text-red-500 font-semibold">{formatCurrency(p.total_deductions)}</span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showNet && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`font-bold text-base ${netNeg ? 'text-orange-600' : 'text-blue-600'}`}>
                                                                    {netNeg ? '-' : ''}{formatCurrency(p.net_salary)}
                                                                </span>
                                                                {netNeg && <FaExclamationTriangle className="text-orange-400 text-xs" title="Deficit" />}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showAttendance && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1 text-xs">
                                                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                                                    ✓ {parseFloat(p.attendance?.present_days || 0).toFixed(0)}d
                                                                </span>
                                                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                                                                    ✗ {parseFloat(p.attendance?.absent_days || 0).toFixed(0)}d
                                                                </span>
                                                                {parseFloat(p.attendance?.paid_leave_days || 0) > 0 && (
                                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                                        PL {parseFloat(p.attendance.paid_leave_days).toFixed(0)}d
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showHours && (
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                                <p>{parseFloat(p.worked_hours || 0).toFixed(1)}h worked</p>
                                                                {parseFloat(p.overtime_hours || 0) > 0 && (
                                                                    <p className="text-purple-600">+{parseFloat(p.overtime_hours).toFixed(1)}h OT</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showStatus && (
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${statusCfg.className}`}>
                                                                <StatusIcon className="text-xs" /> {statusCfg.label}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => openViewModal(item)}
                                                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all hover:scale-110 duration-200"
                                                        >
                                                            <FaEye size={14} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CARD VIEW ──────────────────────────────────────────────────────── */}
                    {viewMode === 'card' && (
                        <ManagementGrid viewMode={viewMode}>
                            {payrollData.map((item, index) => {
                                const p         = item.payroll;
                                const statusCfg = getStatusConfig(p.status);
                                const StatusIcon = statusCfg.icon;
                                const netNeg    = parseFloat(p.net_salary) < 0;

                                return (
                                    <motion.div key={p.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-md">
                                                <FaCalendarAlt className="text-white text-xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-800">{MONTHS[p.month - 1]}</h3>
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.year} · #{p.id}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${statusCfg.className}`}>
                                                        <StatusIcon className="text-xs" /> {statusCfg.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Salary Grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="text-center p-2.5 bg-green-50 rounded-xl border border-green-100">
                                                <FaArrowUp className="text-green-500 text-xs mx-auto mb-1" />
                                                <p className="text-xs text-gray-500">Earnings</p>
                                                <p className="text-sm font-bold text-green-600 mt-0.5">{formatCurrency(p.total_earnings)}</p>
                                            </div>
                                            <div className="text-center p-2.5 bg-red-50 rounded-xl border border-red-100">
                                                <FaArrowDown className="text-red-500 text-xs mx-auto mb-1" />
                                                <p className="text-xs text-gray-500">Deductions</p>
                                                <p className="text-sm font-bold text-red-500 mt-0.5">{formatCurrency(p.total_deductions)}</p>
                                            </div>
                                            <div className={`text-center p-2.5 rounded-xl border ${netNeg ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                                <FaWallet className={`text-xs mx-auto mb-1 ${netNeg ? 'text-orange-500' : 'text-blue-500'}`} />
                                                <p className="text-xs text-gray-500">Net</p>
                                                <p className={`text-sm font-bold mt-0.5 ${netNeg ? 'text-orange-600' : 'text-blue-600'}`}>
                                                    {netNeg ? '-' : ''}{formatCurrency(p.net_salary)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Attendance pills */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full">
                                                ✓ {parseFloat(p.attendance?.present_days || 0).toFixed(0)}d Present
                                            </span>
                                            <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
                                                ✗ {parseFloat(p.attendance?.absent_days || 0).toFixed(0)}d Absent
                                            </span>
                                            {parseFloat(p.attendance?.paid_leave_days || 0) > 0 && (
                                                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                                                    PL {parseFloat(p.attendance.paid_leave_days).toFixed(0)}d
                                                </span>
                                            )}
                                            {parseFloat(p.attendance?.lop_days || 0) > 0 && (
                                                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">
                                                    LOP {parseFloat(p.attendance.lop_days).toFixed(0)}d
                                                </span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <FaRegClock className="text-gray-400" />
                                                <span>{parseFloat(p.worked_hours || 0).toFixed(1)}h worked</span>
                                                {parseFloat(p.overtime_hours || 0) > 0 && (
                                                    <span className="text-purple-600">+{parseFloat(p.overtime_hours).toFixed(1)}h OT</span>
                                                )}
                                            </div>
                                            <button onClick={() => openViewModal(item)}
                                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-110"
                                            >
                                                <FaEye size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </ManagementGrid>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        variant="default"
                        showInfo={true}
                    />
                </>
            )}

            {/* View Modal */}
            <AnimatePresence>
                {modalType !== MODAL_TYPES.NONE && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {modalType === MODAL_TYPES.VIEW && (
                                <PayrollViewModal payroll={selectedPayroll} employee={employee} onClose={closeModal} />
                            )}
                        </motion.div>
                    </motion.div>
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

export default MyPayroll;