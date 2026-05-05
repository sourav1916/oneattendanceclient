import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle,
    FaSearch, FaSpinner, FaCalendarAlt, FaDollarSign,
    FaMoneyBillWave, FaChartLine, FaExclamationTriangle,
    FaCheckCircle, FaFileInvoiceDollar, FaClock, FaPlus,
    FaDownload, FaSave, FaCalculator, FaClipboardList,
    FaTh, FaListUl, FaBriefcase, FaEnvelope, FaIdCard,
    FaUsers, FaUserFriends, FaUser, FaCog, FaAngleDoubleRight, FaAngleDoubleLeft
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../components/SelectField';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import usePermissionAccess from '../hooks/usePermissionAccess';
import { EmployeeSelect } from '../components/common';
import AdvancedDateFilter from '../components/AdvancedDateFilter';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    VIEW: 'VIEW',
    GENERATE: 'GENERATE',
};

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

const PAYROLL_REQUEST_CACHE_TTL = 5000;
const payrollListRequestCache = new Map();

const getPayrollListCacheKey = ({ companyId, page, limit, month, year }) =>
    `${companyId ?? 'none'}|${page}|${limit}|${month}|${year}`;

const GENERATION_MODES = {
    INDIVIDUAL: 'individual',
    MULTIPLE: 'multiple',
    ALL: 'all'
};

// ─── Helper Components ───────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value, valueClassName = '' }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className={`text-gray-800 font-medium ${valueClassName}`}>{value}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const statusConfig = {
        draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Draft' },
        approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Approved' },
        paid: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Paid' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
            {config.label}
        </span>
    );
};

const PayrollManagement = () => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [payrollList, setPayrollList] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [viewMode, setViewMode] = useState('table');

    const [availableSearch, setAvailableSearch] = useState('');
    const [selectedSearch, setSelectedSearch] = useState('');

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const [generationMode, setGenerationMode] = useState(GENERATION_MODES.INDIVIDUAL);
    const [generateFormData, setGenerateFormData] = useState({
        employee_id: null,
        employee_ids: [],
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
    });

    const {
        pagination,
        updatePagination,
        goToPage,
        changeLimit,
    } = usePagination(1, 20);

    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    const viewPayrollAccess = checkActionAccess('payrollManagement', 'read');
    const generatePayrollAccess = checkActionAccess('payrollManagement', 'create');

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // ─── API Calls ────────────────────────────────────────────────────────────────

    const fetchEmployees = useCallback(async () => {
        setEmployeesLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;

            // Fetch all employees
            const response = await apiCall('/employees/all-list', 'GET', null, companyId);
            const result = await response.json();

            if (result.success) {
                setEmployeeList(result.data || []);
            } else {
                throw new Error(result.message || 'Failed to fetch employees');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load employees');
        } finally {
            setEmployeesLoading(false);
        }
    }, []);

    const fetchPayrollList = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                month: selectedMonth.toString(),
                year: selectedYear.toString()
            });

            const requestKey = getPayrollListCacheKey({
                companyId,
                page,
                limit: pagination.limit,
                month: selectedMonth,
                year: selectedYear
            });
            const cachedEntry = payrollListRequestCache.get(requestKey);
            let result;

            if (cachedEntry?.data && cachedEntry.expiresAt > Date.now()) {
                result = cachedEntry.data;
            } else if (cachedEntry?.promise) {
                result = await cachedEntry.promise;
            } else {
                const requestPromise = (async () => {
                    const response = await apiCall(`/payroll/list?${params}`, 'GET', null, companyId);
                    const json = await response.json();
                    if (!json.success) {
                        throw new Error(json.message || 'Failed to fetch payroll');
                    }
                    payrollListRequestCache.set(requestKey, {
                        data: json,
                        expiresAt: Date.now() + PAYROLL_REQUEST_CACHE_TTL
                    });
                    return json;
                })().catch((error) => {
                    payrollListRequestCache.delete(requestKey);
                    throw error;
                });

                payrollListRequestCache.set(requestKey, { promise: requestPromise });
                result = await requestPromise;
            }

            if (result.success) {
                setPayrollList(result.data);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? (page === result.pagination?.total_pages)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch payroll');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch payroll');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, selectedMonth, selectedYear, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchPayrollList(1, true);
            initialFetchDone.current = true;
        }
    }, [fetchPayrollList]);

    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchPayrollList(pagination.page, true);
        }
    }, [pagination.page, fetchPayrollList]);

    const generatePayroll = async (mode, data) => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
                employee_id: data.employee_ids,
                month: data.month,
                year: data.year
            };

            const response = await apiCall('/payroll/generate-payroll', 'POST', payload, company?.id);
            const result = await response.json();
            if (result.success) {
                payrollListRequestCache.clear();
                await fetchPayrollList(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Generation failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally { setLoading(false); }
    };

    // ─── Modal Handlers ──────────────────────────────────────────────────────

    const openViewModal = (payrollData) => {
        setSelectedPayroll(payrollData);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };

    const openGenerateModal = async () => {
        if (generatePayrollAccess.disabled) return;
        setGenerationMode(GENERATION_MODES.INDIVIDUAL);
        setGenerateFormData({
            employee_id: null,
            employee_ids: [],
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
        });
        setModalType(MODAL_TYPES.GENERATE);
        setAvailableSearch('');
        setSelectedSearch('');

        // Fetch employees when modal opens
        await fetchEmployees();
    };

    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedPayroll(null);
    };

    // ─── Form Handlers ───────────────────────────────────────────────────────

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!generateFormData.employee_ids || generateFormData.employee_ids.length === 0) {
            toast.warning('Please select at least one employee');
            return;
        }

        const result = await generatePayroll(GENERATION_MODES.MULTIPLE, {
            employee_ids: generateFormData.employee_ids,
            month: generateFormData.month,
            year: generateFormData.year
        });

        if (result.success) {
            toast.success(`Payroll generated for ${generateFormData.employee_ids.length} employees successfully!`);
            closeModal();
        } else {
            toast.error(result.error || 'Failed to generate payroll');
        }
    };

    const handlePeriodFilterApply = useCallback((result) => {
        const fallbackMonth = currentDate.getMonth() + 1;
        const fallbackYear = currentDate.getFullYear();

        let nextMonth = fallbackMonth;
        let nextYear = fallbackYear;

        if (result?.month && result?.year) {
            nextMonth = Number(result.month);
            nextYear = Number(result.year);
        } else if (result?.date) {
            const parsed = new Date(`${result.date}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) {
                nextMonth = parsed.getMonth() + 1;
                nextYear = parsed.getFullYear();
            }
        } else if (result?.from_date) {
            const parsed = new Date(`${result.from_date}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) {
                nextMonth = parsed.getMonth() + 1;
                nextYear = parsed.getFullYear();
            }
        }

        setSelectedMonth(nextMonth);
        setSelectedYear(nextYear);

        if (pagination.page !== 1) {
            goToPage(1);
        }
    }, [currentDate, goToPage, pagination.page]);

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '₹0.00';
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDays = (value) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return '0';
        return Number.isInteger(num) ? String(num) : num.toFixed(1);
    };

    const getMonthName = (monthNum) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthNum - 1] || '';
    };

    // ─── Responsive Columns ──────────────────────────────────────────────────

    const [visibleColumns, setVisibleColumns] = useState(() => ({
        showEmployeeCode: window.innerWidth >= 1280,
        showName: true,
        showDesignation: window.innerWidth >= 768,
        showNetSalary: true,
        showEarnings: window.innerWidth >= 1100,
        showDeductions: window.innerWidth >= 1100,
        showStatus: window.innerWidth >= 640,
        showAttendance: window.innerWidth >= 1440,
    }));

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() => setVisibleColumns({
                showEmployeeCode: window.innerWidth >= 1280,
                showName: true,
                showDesignation: window.innerWidth >= 768,
                showNetSalary: true,
                showEarnings: window.innerWidth >= 1100,
                showDeductions: window.innerWidth >= 1100,
                showStatus: window.innerWidth >= 640,
                showAttendance: window.innerWidth >= 1440,
            }), 150);
        };
        window.addEventListener('resize', onResize);
        return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) {
            goToPage(newPage);
        }
    }, [pagination.page, goToPage]);

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "48px",
            borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
            "&:hover": { borderColor: "#6366f1" },
            borderRadius: "0.75rem",
            padding: "0 0.5rem"
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
            color: state.isSelected ? "white" : "#1e293b",
            "&:active": { backgroundColor: "#6366f1" }
        }),
    };

    // Month options
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i).toLocaleString('default', { month: 'long' })
    }));

    // Year options (current year ± 5 years)
    const yearOptions = Array.from({ length: 11 }, (_, i) => {
        const year = currentDate.getFullYear() - 5 + i;
        return { value: year, label: year.toString() };
    });

    // Dual-List Computations for MULTIPLE mode
    const availableEmployees = useMemo(() => {
        return employeeList
            .filter(emp => !generateFormData.employee_ids.includes(emp.id))
            .filter(emp => emp.name.toLowerCase().includes(availableSearch.toLowerCase()) || 
                           emp.employee_code.toLowerCase().includes(availableSearch.toLowerCase()));
    }, [employeeList, generateFormData.employee_ids, availableSearch]);

    const selectedEmployees = useMemo(() => {
        return employeeList
            .filter(emp => generateFormData.employee_ids.includes(emp.id))
            .filter(emp => emp.name.toLowerCase().includes(selectedSearch.toLowerCase()) || 
                           emp.employee_code.toLowerCase().includes(selectedSearch.toLowerCase()));
    }, [employeeList, generateFormData.employee_ids, selectedSearch]);

    // Avatar styling helper for dual list
    const AVATAR_GRADIENTS = [
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-orange-500 to-amber-500',
        'from-rose-500 to-red-600',
        'from-cyan-500 to-blue-500',
    ];
    const getInitials = (name = '') => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const avatarGradient = (id) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-500 mb-2">
                        Payroll Overview
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Payroll Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Generate and manage employee payroll records with integrated attendance data.
                    </p>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={openGenerateModal}
                        disabled={generatePayrollAccess.disabled}
                        title={generatePayrollAccess.disabled ? getAccessMessage(generatePayrollAccess) : ''}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                        <FaPlus size={14} />
                        Generate Payroll
                    </button>
                </div>
            </motion.div>

            {/* ─── Consolidated Filter & View Bar ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6"
            >
                {/* Left Section: Time Period Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
                    <div className="w-full sm:w-auto">
                        <AdvancedDateFilter
                            value={{ month: selectedMonth, year: selectedYear }}
                            onChange={handlePeriodFilterApply}
                            placeholder={`${getMonthName(selectedMonth)} ${selectedYear}`}
                            buttonClassName="inline-flex w-full min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-green-200 hover:bg-green-50"
                            tabOptions={["month"]}
                        />
                    </div>

                    {!loading && payrollList.length > 0 && (
                        <p className="text-sm text-gray-500 hidden xl:block border-l pl-4 border-gray-200">
                            Showing <span className="font-semibold text-gray-800">{payrollList.length}</span> records for <span className="font-semibold text-green-700">{getMonthName(selectedMonth)} {selectedYear}</span>
                        </p>
                    )}
                </div>

                {/* Right Section: Controls */}
                <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-4">

                    {/* Vertical Separator */}
                    <div className="h-8 w-px bg-gray-200 hidden lg:block"></div>

                    {/* View Switcher */}
                    <div className="flex w-full lg:w-auto justify-end">
                        <ManagementViewSwitcher
                            viewMode={viewMode}
                            onChange={setViewMode}
                            accent="green"
                        />
                    </div>
                </div>
            </motion.div>

            {loading && !payrollList.length && <SkeletonComponent />}

            {!loading && payrollList.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-xl shadow-xl"
                >
                    <FaFileInvoiceDollar className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No payroll records found</p>
                    <p className="text-gray-400 mt-2">Generate payroll for {getMonthName(selectedMonth)} {selectedYear}</p>
                </motion.div>
            )}

            {!loading && payrollList.length > 0 && (
                <>
                    {viewMode === 'table' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl shadow-xl overflow-visible"
                        >
                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full text-sm text-left text-gray-700">
                                    <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                        <tr>
                                            {visibleColumns.showEmployeeCode && <th className="px-6 py-4">Employee Code</th>}
                                            {visibleColumns.showName && <th className="px-6 py-4">Employee</th>}
                                            {visibleColumns.showDesignation && <th className="px-6 py-4">Designation</th>}
                                            {visibleColumns.showNetSalary && <th className="px-6 py-4">Net Salary</th>}
                                            {visibleColumns.showEarnings && <th className="px-6 py-4">Earnings</th>}
                                            {visibleColumns.showDeductions && <th className="px-6 py-4">Deductions</th>}
                                            {visibleColumns.showStatus && <th className="px-6 py-4">Status</th>}
                                            {visibleColumns.showAttendance && <th className="px-6 py-4">Attendance</th>}
                                            <th className="px-6 py-4 text-right"><FaCog className="w-4 h-4 ml-auto" /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payrollList.map((item, index) => {
                                            const netSalary = parseFloat(item.payroll.net_salary);
                                            const isNegative = netSalary < 0;

                                            return (
                                                <motion.tr key={item.payroll.id} initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300"
                                                    onClick={() => openViewModal(item)}
                                                >
                                                    {visibleColumns.showEmployeeCode && (
                                                        <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">
                                                            {item.employee.employee_code}
                                                        </td>
                                                    )}
                                                    {visibleColumns.showName && (
                                                        <td className="px-6 py-4 font-semibold">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100">
                                                                    <FaUserCircle className="text-emerald-500 text-sm" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-800 font-medium">{item.employee.name}</div>
                                                                    <div className="text-xs text-gray-500">{item.employee.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showDesignation && (
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">
                                                                {item.employee.designation?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showNetSalary && (
                                                        <td className="px-6 py-4">
                                                            <div className={`font-bold text-lg ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(item.payroll.net_salary)}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showEarnings && (
                                                        <td className="px-6 py-4">
                                                            <div className="text-green-700 font-semibold">
                                                                {formatCurrency(item.payroll.total_earnings)}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showDeductions && (
                                                        <td className="px-6 py-4">
                                                            <div className="text-red-700 font-semibold">
                                                                {formatCurrency(item.payroll.total_deductions)}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.showStatus && (
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={item.payroll.status} />
                                                        </td>
                                                    )}
                                                    {visibleColumns.showAttendance && (
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <FaCheckCircle className="text-green-500" />
                                                                    <span>{formatDays(item.payroll.attendance.present_days)} Present</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <FaExclamationTriangle className="text-red-500" />
                                                                    <span>{formatDays(item.payroll.attendance.absent_days)} Absent</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <ActionMenu
                                                            menuId={item.payroll.id}
                                                            activeId={activeActionMenu}
                                                            onToggle={(e, id) => {
                                                                setActiveActionMenu((current) => (current === id ? null : id));
                                                            }}
                                                            actions={[
                                                                {
                                                                    label: 'View Details',
                                                                    icon: <FaEye size={14} />,
                                                                    onClick: () => openViewModal(item),
                                                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                                },
                                                            ]}
                                                        />
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'card' && (
                        <ManagementGrid viewMode={viewMode}>
                            {payrollList.map((item, index) => {
                                const netSalary = parseFloat(item.payroll.net_salary);
                                const isNegative = netSalary < 0;

                                return (
                                    <motion.div key={item.payroll.id} initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                        onClick={() => openViewModal(item)}
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                                                <FaFileInvoiceDollar className="text-white text-3xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg text-gray-800 truncate">{item.employee.name}</h3>
                                                    <StatusBadge status={item.payroll.status} />
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded-lg inline-block">
                                                    {item.employee.employee_code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                                    <FaDollarSign className="text-green-500" />
                                                    Net Salary
                                                </span>
                                                <span className={`font-bold text-lg ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(item.payroll.net_salary)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-2 bg-green-50 rounded-lg">
                                                    <div className="text-xs text-gray-500">Earnings</div>
                                                    <div className="font-semibold text-green-700 text-sm">
                                                        {formatCurrency(item.payroll.total_earnings)}
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-red-50 rounded-lg">
                                                    <div className="text-xs text-gray-500">Deductions</div>
                                                    <div className="font-semibold text-red-700 text-sm">
                                                        {formatCurrency(item.payroll.total_deductions)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-100">
                                                <div className="text-xs font-semibold text-gray-600 mb-2">Attendance</div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <FaCheckCircle />
                                                        <span>{formatDays(item.payroll.attendance.present_days)} Present</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <FaExclamationTriangle />
                                                        <span>{formatDays(item.payroll.attendance.absent_days)} Absent</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openViewModal(item); }}
                                                className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110"
                                            >
                                                <FaEye size={16} />
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
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
                </>
            )}

            {/* Modals */}
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
                            className="relative w-full bg-white rounded-xl shadow-2xl overflow-hidden max-w-4xl max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* VIEW MODAL */}
                            {modalType === MODAL_TYPES.VIEW && selectedPayroll && (
                                <>
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                                    <FaFileInvoiceDollar className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Payroll Details</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {getMonthName(selectedMonth)} {selectedYear}
                                                    </p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={closeModal}
                                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            >
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-6">
                                            {/* Employee Info */}
                                            <div className="col-span-1 pb-6 border-b">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <FaUserCircle className="text-emerald-500" />
                                                    Employee Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InfoItem
                                                        icon={<FaUserCircle className="text-emerald-500" />}
                                                        label="Name"
                                                        value={selectedPayroll.employee.name}
                                                    />
                                                    <InfoItem
                                                        icon={<FaIdCard className="text-blue-500" />}
                                                        label="Employee Code"
                                                        value={selectedPayroll.employee.employee_code}
                                                    />
                                                    <InfoItem
                                                        icon={<FaEnvelope className="text-green-500" />}
                                                        label="Email"
                                                        value={selectedPayroll.employee.email}
                                                    />
                                                    <InfoItem
                                                        icon={<FaBriefcase className="text-purple-500" />}
                                                        label="Designation"
                                                        value={
                                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium capitalize">
                                                                {selectedPayroll.employee.designation?.replace('_', ' ')}
                                                            </span>
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* Salary Summary */}
                                            <div className="col-span-1 pb-6 border-b">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <FaDollarSign className="text-green-500" />
                                                    Salary Summary
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <InfoItem
                                                        icon={<FaMoneyBillWave className="text-green-500" />}
                                                        label="Total Earnings"
                                                        value={formatCurrency(selectedPayroll.payroll.total_earnings)}
                                                        valueClassName="text-green-600"
                                                    />
                                                    <InfoItem
                                                        icon={<FaChartLine className="text-red-500" />}
                                                        label="Total Deductions"
                                                        value={formatCurrency(selectedPayroll.payroll.total_deductions)}
                                                        valueClassName="text-red-600"
                                                    />
                                                    <InfoItem
                                                        icon={<FaCalculator className="text-blue-500" />}
                                                        label="Net Salary"
                                                        value={formatCurrency(selectedPayroll.payroll.net_salary)}
                                                        valueClassName={
                                                            parseFloat(selectedPayroll.payroll.net_salary) < 0
                                                                ? 'text-red-600 font-bold'
                                                                : 'text-green-600 font-bold'
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <InfoItem
                                                        icon={<FaClipboardList className="text-purple-500" />}
                                                        label="Status"
                                                        value={<StatusBadge status={selectedPayroll.payroll.status} />}
                                                    />
                                                </div>
                                            </div>

                                            {/* Attendance Details */}
                                            <div className="col-span-1">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <FaCalendarAlt className="text-indigo-500" />
                                                    Attendance Details
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCheckCircle className="text-green-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Present Days</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-green-700">
                                                            {formatDays(selectedPayroll.payroll.attendance.present_days)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaExclamationTriangle className="text-red-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Absent Days</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-red-700">
                                                            {formatDays(selectedPayroll.payroll.attendance.absent_days)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCalendarAlt className="text-blue-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Paid Leave</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-blue-700">
                                                            {formatDays(selectedPayroll.payroll.attendance.paid_leave_days)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCalendarAlt className="text-yellow-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Unpaid Leave</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-yellow-700">
                                                            {formatDays(selectedPayroll.payroll.attendance.unpaid_leave_days)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaExclamationTriangle className="text-orange-600" />
                                                            <span className="text-xs font-semibold text-gray-600">LOP Days</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-orange-700">
                                                            {formatDays(selectedPayroll.payroll.attendance.lop_days)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaDollarSign className="text-purple-600" />
                                                            <span className="text-xs font-semibold text-gray-600">LOP Deduction</span>
                                                        </div>
                                                        <div className="text-lg font-bold text-purple-700">
                                                            {formatCurrency(selectedPayroll.payroll.attendance.lop_deduction)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    <InfoItem
                                                        icon={<FaClock className="text-indigo-500" />}
                                                        label="Worked Hours"
                                                        value={`${selectedPayroll.payroll.worked_hours} hours`}
                                                    />
                                                    <InfoItem
                                                        icon={<FaClock className="text-orange-500" />}
                                                        label="Overtime Hours"
                                                        value={`${selectedPayroll.payroll.overtime_hours} hours`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={closeModal}
                                                className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* GENERATE MODAL */}
                            {modalType === MODAL_TYPES.GENERATE && (
                                <>
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                                    <FaPlus className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Generate Payroll</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">Create payroll for employees</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={closeModal}
                                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            >
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleGenerate} className="flex flex-col flex-1 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                            <div className="space-y-6 p-2 lg:p-0">
                                                {/* Month and Year Selection */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                            <FaCalendarAlt className="text-emerald-500" />
                                                            Month
                                                        </label>
                                                        <Select
                                                            options={monthOptions}
                                                            value={monthOptions.find(opt => opt.value === generateFormData.month)}
                                                            onChange={(option) => setGenerateFormData(prev => ({
                                                                ...prev,
                                                                month: option.value
                                                            }))}
                                                            styles={customSelectStyles}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                            <FaCalendarAlt className="text-emerald-500" />
                                                            Year
                                                        </label>
                                                        <Select
                                                            options={yearOptions}
                                                            value={yearOptions.find(opt => opt.value === generateFormData.year)}
                                                            onChange={(option) => setGenerateFormData(prev => ({
                                                                ...prev,
                                                                year: option.value
                                                            }))}
                                                            styles={customSelectStyles}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Employee Selection */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                >
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <FaUserFriends className="text-emerald-500" />
                                                        Select Employees
                                                    </label>
                                                        {employeesLoading ? (
                                                            <div className="flex items-center justify-center py-4">
                                                                <FaSpinner className="animate-spin text-emerald-500 mr-2" />
                                                                <span className="text-gray-500">Loading employees...</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 mt-2">
                                                                
                                                                {/* Available Employees Pane */}
                                                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                                                        <span className="font-semibold text-sm text-gray-700">Available</span>
                                                                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{availableEmployees.length}</span>
                                                                    </div>
                                                                    <div className="p-2 border-b border-gray-100">
                                                                        <div className="relative">
                                                                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search available..."
                                                                                value={availableSearch}
                                                                                onChange={(e) => setAvailableSearch(e.target.value)}
                                                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-64 overflow-y-auto p-2 custom-scrollbar space-y-1">
                                                                        {availableEmployees.length === 0 ? (
                                                                            <div className="text-center py-8 text-sm text-gray-400">No employees found</div>
                                                                        ) : (
                                                                            availableEmployees.map(emp => (
                                                                                <div 
                                                                                    key={emp.id}
                                                                                    onClick={() => setGenerateFormData(prev => ({
                                                                                        ...prev,
                                                                                        employee_ids: [...prev.employee_ids, emp.id]
                                                                                    }))}
                                                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-100 cursor-pointer transition-colors group"
                                                                                >
                                                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(emp.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                                                        {getInitials(emp.name)}
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="text-sm font-semibold text-gray-800 truncate">{emp.name}</div>
                                                                                        <div className="text-xs text-gray-500 truncate">{emp.employee_code}</div>
                                                                                    </div>
                                                                                    <div className="opacity-0 group-hover:opacity-100 text-emerald-500">
                                                                                        <FaCheckCircle size={14} />
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Divider / Visual Arrows */}
                                                                <div className="hidden md:flex flex-col items-center justify-center gap-3 px-2">
                                                                    <button 
                                                                        type="button"
                                                                        title="Select All"
                                                                        onClick={() => setGenerateFormData(prev => ({
                                                                            ...prev,
                                                                            employee_ids: [...new Set([...prev.employee_ids, ...availableEmployees.map(emp => emp.id)])]
                                                                        }))}
                                                                        className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200 transition-colors"
                                                                    >
                                                                        <FaAngleDoubleRight size={16} />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        title="Deselect All"
                                                                        onClick={() => setGenerateFormData(prev => ({
                                                                            ...prev,
                                                                            employee_ids: prev.employee_ids.filter(id => !selectedEmployees.find(emp => emp.id === id))
                                                                        }))}
                                                                        className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors"
                                                                    >
                                                                        <FaAngleDoubleLeft size={16} />
                                                                    </button>
                                                                </div>

                                                                {/* Selected Employees Pane */}
                                                                <div className="flex flex-col border border-emerald-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-emerald-50">
                                                                    <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100 flex justify-between items-center">
                                                                        <span className="font-semibold text-sm text-emerald-800">Selected</span>
                                                                        <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{selectedEmployees.length}</span>
                                                                    </div>
                                                                    <div className="p-2 border-b border-emerald-50">
                                                                        <div className="relative">
                                                                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" size={12} />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search selected..."
                                                                                value={selectedSearch}
                                                                                onChange={(e) => setSelectedSearch(e.target.value)}
                                                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/30"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="h-64 overflow-y-auto p-2 custom-scrollbar space-y-1">
                                                                        {selectedEmployees.length === 0 ? (
                                                                            <div className="text-center py-8 text-sm text-emerald-400">No employees selected</div>
                                                                        ) : (
                                                                            selectedEmployees.map(emp => (
                                                                                <div 
                                                                                    key={emp.id}
                                                                                    onClick={() => setGenerateFormData(prev => ({
                                                                                        ...prev,
                                                                                        employee_ids: prev.employee_ids.filter(id => id !== emp.id)
                                                                                    }))}
                                                                                    className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 hover:bg-red-50 border border-emerald-100 hover:border-red-100 cursor-pointer transition-colors group"
                                                                                >
                                                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(emp.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                                                                        {getInitials(emp.name)}
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="text-sm font-semibold text-emerald-900 truncate group-hover:text-red-900">{emp.name}</div>
                                                                                        <div className="text-xs text-emerald-600 truncate group-hover:text-red-600">{emp.employee_code}</div>
                                                                                    </div>
                                                                                    <div className="opacity-0 group-hover:opacity-100 text-red-500">
                                                                                        <FaTimes size={14} />
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={closeModal}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={loading || employeesLoading || generatePayrollAccess.disabled}
                                                title={generatePayrollAccess.disabled ? getAccessMessage(generatePayrollAccess) : ''}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCalculator className="w-4 h-4" />
                                                        Generate Payroll
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default PayrollManagement;
