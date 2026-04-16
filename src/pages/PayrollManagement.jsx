import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle,
    FaSearch, FaSpinner, FaCalendarAlt, FaDollarSign,
    FaMoneyBillWave, FaChartLine, FaExclamationTriangle,
    FaCheckCircle, FaFileInvoiceDollar, FaClock, FaPlus,
    FaDownload, FaSave, FaCalculator, FaClipboardList,
    FaTh, FaListUl, FaBriefcase, FaEnvelope, FaIdCard,
    FaUsers, FaUserFriends, FaUser
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import usePermissionAccess from '../hooks/usePermissionAccess';

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
            
            // Fetch all employees without pagination
            const response = await apiCall('/employees/list?limit=1000', 'GET', null, companyId);
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
            let payload;

            if (mode === GENERATION_MODES.INDIVIDUAL) {
                payload = {
                    employee_id: data.employee_id,
                    month: data.month,
                    year: data.year
                };
            } else if (mode === GENERATION_MODES.MULTIPLE) {
                payload = {
                    employee_ids: data.employee_ids,
                    month: data.month,
                    year: data.year
                };
            } else if (mode === GENERATION_MODES.ALL) {
                payload = {
                    all_employees: true,
                    month: data.month,
                    year: data.year
                };
            }

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

        // Validation based on generation mode
        if (generationMode === GENERATION_MODES.INDIVIDUAL) {
            if (!generateFormData.employee_id) {
                toast.warning('Please select an employee');
                return;
            }
        } else if (generationMode === GENERATION_MODES.MULTIPLE) {
            if (!generateFormData.employee_ids || generateFormData.employee_ids.length === 0) {
                toast.warning('Please select at least one employee');
                return;
            }
        }

        const result = await generatePayroll(generationMode, {
            employee_id: generateFormData.employee_id,
            employee_ids: generateFormData.employee_ids,
            month: generateFormData.month,
            year: generateFormData.year
        });

        if (result.success) {
            const successMessage = generationMode === GENERATION_MODES.ALL 
                ? 'Payroll generated for all employees successfully!'
                : generationMode === GENERATION_MODES.MULTIPLE
                ? `Payroll generated for ${generateFormData.employee_ids.length} employees successfully!`
                : 'Payroll generated successfully!';
            
            toast.success(successMessage);
            closeModal();
        } else {
            toast.error(result.error || 'Failed to generate payroll');
        }
    };

    const handleMonthYearChange = () => {
        if (pagination.page !== 1) {
            goToPage(1);
        } else {
            fetchPayrollList(1);
        }
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '₹0.00';
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    // Employee options for select
    const employeeOptions = useMemo(() => {
        return employeeList.map(emp => ({
            value: emp.id,
            label: emp.name,
            email: emp.email,
            code: emp.employee_code,
            designation: emp.designation
        }));
    }, [employeeList]);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                    Payroll Management
                </h1>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                        Total: {pagination.total} records
                    </div>
                    <button
                        onClick={openGenerateModal}
                        disabled={generatePayrollAccess.disabled}
                        title={generatePayrollAccess.disabled ? getAccessMessage(generatePayrollAccess) : ''}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                        <FaPlus size={14} />
                        Generate Payroll
                    </button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-6 bg-white rounded-2xl shadow-lg p-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FaCalendarAlt className="text-green-500" />
                            Month
                        </label>
                        <Select
                            options={monthOptions}
                            value={monthOptions.find(opt => opt.value === selectedMonth)}
                            onChange={(option) => {
                                setSelectedMonth(option.value);
                                setTimeout(handleMonthYearChange, 100);
                            }}
                            styles={customSelectStyles}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FaCalendarAlt className="text-green-500" />
                            Year
                        </label>
                        <Select
                            options={yearOptions}
                            value={yearOptions.find(opt => opt.value === selectedYear)}
                            onChange={(option) => {
                                setSelectedYear(option.value);
                                setTimeout(handleMonthYearChange, 100);
                            }}
                            styles={customSelectStyles}
                        />
                    </div>
                    <div className="flex items-end">
                        <div className="text-sm text-gray-600 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200 w-full">
                            <div className="font-semibold text-green-800">Viewing</div>
                            <div className="text-xs text-gray-600 mt-1">
                                {getMonthName(selectedMonth)} {selectedYear}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* View Toggle */}
            <div className="flex justify-end mb-6">
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="green" />
            </div>

            {loading && !payrollList.length && <SkeletonComponent />}

            {!loading && payrollList.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl"
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
                            className="bg-white rounded-2xl shadow-xl overflow-visible"
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
                                            <th className="px-6 py-4 text-right">Actions</th>
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
                                                                    <span>{item.payroll.attendance.present_days} Present</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <FaExclamationTriangle className="text-red-500" />
                                                                    <span>{item.payroll.attendance.absent_days} Absent</span>
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
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                        onClick={() => openViewModal(item)}
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
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
                                                        <span>{item.payroll.attendance.present_days} Present</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <FaExclamationTriangle />
                                                        <span>{item.payroll.attendance.absent_days} Absent</span>
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
                            className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl max-h-[90vh] flex flex-col"
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
                                                            {selectedPayroll.payroll.attendance.present_days}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaExclamationTriangle className="text-red-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Absent Days</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-red-700">
                                                            {selectedPayroll.payroll.attendance.absent_days}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCalendarAlt className="text-blue-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Paid Leave</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-blue-700">
                                                            {selectedPayroll.payroll.attendance.paid_leave_days}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCalendarAlt className="text-yellow-600" />
                                                            <span className="text-xs font-semibold text-gray-600">Unpaid Leave</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-yellow-700">
                                                            {selectedPayroll.payroll.attendance.unpaid_leave_days}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaExclamationTriangle className="text-orange-600" />
                                                            <span className="text-xs font-semibold text-gray-600">LOP Days</span>
                                                        </div>
                                                        <div className="text-2xl font-bold text-orange-700">
                                                            {selectedPayroll.payroll.attendance.lop_days}
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

                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <form onSubmit={handleGenerate} className="p-6">
                                        <div className="space-y-6">
                                            {/* Generation Mode Selection */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <FaUserFriends className="text-emerald-500" />
                                                    Generation Mode
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {/* Individual Mode */}
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            setGenerationMode(GENERATION_MODES.INDIVIDUAL);
                                                            setGenerateFormData(prev => ({ 
                                                                ...prev, 
                                                                employee_id: null,
                                                                employee_ids: []
                                                            }));
                                                        }}
                                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                                            generationMode === GENERATION_MODES.INDIVIDUAL
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                                                : 'border-gray-200 bg-white hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        <FaUser className={`mx-auto mb-2 text-2xl ${
                                                            generationMode === GENERATION_MODES.INDIVIDUAL
                                                                ? 'text-emerald-600'
                                                                : 'text-gray-400'
                                                        }`} />
                                                        <div className="font-semibold text-sm text-gray-800">Individual</div>
                                                        <div className="text-xs text-gray-500 mt-1">Single employee</div>
                                                    </motion.button>

                                                    {/* Multiple Mode */}
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            setGenerationMode(GENERATION_MODES.MULTIPLE);
                                                            setGenerateFormData(prev => ({ 
                                                                ...prev, 
                                                                employee_id: null,
                                                                employee_ids: []
                                                            }));
                                                        }}
                                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                                            generationMode === GENERATION_MODES.MULTIPLE
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                                                : 'border-gray-200 bg-white hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        <FaUserFriends className={`mx-auto mb-2 text-2xl ${
                                                            generationMode === GENERATION_MODES.MULTIPLE
                                                                ? 'text-emerald-600'
                                                                : 'text-gray-400'
                                                        }`} />
                                                        <div className="font-semibold text-sm text-gray-800">Multiple</div>
                                                        <div className="text-xs text-gray-500 mt-1">Select employees</div>
                                                    </motion.button>

                                                    {/* All Employees Mode */}
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            setGenerationMode(GENERATION_MODES.ALL);
                                                            setGenerateFormData(prev => ({ 
                                                                ...prev, 
                                                                employee_id: null,
                                                                employee_ids: []
                                                            }));
                                                        }}
                                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                                            generationMode === GENERATION_MODES.ALL
                                                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                                                : 'border-gray-200 bg-white hover:border-emerald-200'
                                                        }`}
                                                    >
                                                        <FaUsers className={`mx-auto mb-2 text-2xl ${
                                                            generationMode === GENERATION_MODES.ALL
                                                                ? 'text-emerald-600'
                                                                : 'text-gray-400'
                                                        }`} />
                                                        <div className="font-semibold text-sm text-gray-800">All Employees</div>
                                                        <div className="text-xs text-gray-500 mt-1">Everyone at once</div>
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* Employee Selection - Individual */}
                                            {generationMode === GENERATION_MODES.INDIVIDUAL && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                >
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <FaUserCircle className="text-emerald-500" />
                                                        Select Employee
                                                    </label>
                                                    {employeesLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <FaSpinner className="animate-spin text-emerald-500 mr-2" />
                                                            <span className="text-gray-500">Loading employees...</span>
                                                        </div>
                                                    ) : (
                                                        <Select
                                                            options={employeeOptions}
                                                            value={employeeOptions.find(opt => opt.value === generateFormData.employee_id)}
                                                            onChange={(option) => setGenerateFormData(prev => ({
                                                                ...prev,
                                                                employee_id: option?.value || null
                                                            }))}
                                                            placeholder="Search and select employee..."
                                                            isClearable
                                                            isSearchable
                                                            styles={customSelectStyles}
                                                            formatOptionLabel={({ label, email, code, designation }) => (
                                                                <div className="py-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <FaUserCircle className="text-emerald-500" />
                                                                        <div className="flex-1">
                                                                            <div className="font-medium text-gray-900">{label}</div>
                                                                            <div className="text-xs text-gray-500">{email}</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-xs font-mono text-gray-400">{code}</div>
                                                                            {designation && (
                                                                                <div className="text-xs text-gray-500 capitalize">
                                                                                    {designation.replace('_', ' ')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        />
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* Employee Selection - Multiple */}
                                            {generationMode === GENERATION_MODES.MULTIPLE && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                >
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <FaUserFriends className="text-emerald-500" />
                                                        Select Multiple Employees
                                                    </label>
                                                    {employeesLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <FaSpinner className="animate-spin text-emerald-500 mr-2" />
                                                            <span className="text-gray-500">Loading employees...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Select
                                                                options={employeeOptions}
                                                                value={employeeOptions.filter(opt => 
                                                                    generateFormData.employee_ids.includes(opt.value)
                                                                )}
                                                                onChange={(selected) => setGenerateFormData(prev => ({
                                                                    ...prev,
                                                                    employee_ids: selected ? selected.map(s => s.value) : []
                                                                }))}
                                                                placeholder="Search and select employees..."
                                                                isMulti
                                                                isClearable
                                                                isSearchable
                                                                styles={customSelectStyles}
                                                                formatOptionLabel={({ label, email, code, designation }) => (
                                                                    <div className="py-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <FaUserCircle className="text-emerald-500" />
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-900">{label}</div>
                                                                                <div className="text-xs text-gray-500">{email}</div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-xs font-mono text-gray-400">{code}</div>
                                                                                {designation && (
                                                                                    <div className="text-xs text-gray-500 capitalize">
                                                                                        {designation.replace('_', ' ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                            {generateFormData.employee_ids.length > 0 && (
                                                                <div className="mt-2 text-sm text-emerald-600 font-medium">
                                                                    {generateFormData.employee_ids.length} employee(s) selected
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* All Employees Info */}
                                            {generationMode === GENERATION_MODES.ALL && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <FaUsers className="text-emerald-600 text-2xl mt-1" />
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                                Generate for All Employees
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                Payroll will be generated for all active employees in your company 
                                                                for {getMonthName(generateFormData.month)} {generateFormData.year}.
                                                            </p>
                                                            {employeeList.length > 0 && (
                                                                <div className="mt-2 text-sm font-medium text-emerald-700">
                                                                    Total Employees: {employeeList.length}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

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
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3">
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
                                                        {generationMode === GENERATION_MODES.ALL 
                                                            ? 'Generate for All' 
                                                            : generationMode === GENERATION_MODES.MULTIPLE
                                                            ? `Generate for ${generateFormData.employee_ids.length || 0}`
                                                            : 'Generate Payroll'
                                                        }
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                        </form>
                                    </div>
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
