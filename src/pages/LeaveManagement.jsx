import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle,
    FaSearch, FaSpinner, FaEllipsisV, FaEnvelope, FaPhone,
    FaCalendarAlt, FaBriefcase, FaDollarSign, FaUserTag,
    FaShieldAlt, FaBan, FaTrashAlt, FaInfoCircle, FaPlus,
    FaUserTie, FaUserCheck, FaRobot, FaHandPaper, FaCamera,
    FaMapMarkerAlt, FaWifi, FaFingerprint, FaNetworkWired,
    FaSave, FaClock, FaRegCalendarCheck, FaHourglassHalf,
    FaPlane, FaMedkit, FaGraduationCap, FaFileAlt, FaComment,
    FaThumbsUp, FaThumbsDown, FaFilter, FaCalendarWeek,
    FaChartLine, FaDownload, FaPrint
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
    CANCEL: 'CANCEL'
};

const LEAVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
};

const LEAVE_TYPES = {
    ANNUAL: 'annual',
    SICK: 'sick',
    CASUAL: 'casual',
    UNPAID: 'unpaid',
    MATERNITY: 'maternity',
    PATERNITY: 'paternity',
    BEREAVEMENT: 'bereavement',
    STUDY: 'study',
    OTHER: 'other'
};

const LEAVE_TYPE_CONFIG = {
    [LEAVE_TYPES.ANNUAL]: { label: 'Annual Leave', icon: FaRegCalendarCheck, color: 'blue', requiresDoc: false, maxDays: 30 },
    [LEAVE_TYPES.SICK]: { label: 'Sick Leave', icon: FaMedkit, color: 'green', requiresDoc: true, maxDays: 15 },
    [LEAVE_TYPES.CASUAL]: { label: 'Casual Leave', icon: FaClock, color: 'purple', requiresDoc: false, maxDays: 12 },
    [LEAVE_TYPES.UNPAID]: { label: 'Unpaid Leave', icon: FaHourglassHalf, color: 'orange', requiresDoc: false, maxDays: null },
    [LEAVE_TYPES.MATERNITY]: { label: 'Maternity Leave', icon: FaUserCircle, color: 'pink', requiresDoc: true, maxDays: 180 },
    [LEAVE_TYPES.PATERNITY]: { label: 'Paternity Leave', icon: FaUserCircle, color: 'cyan', requiresDoc: true, maxDays: 15 },
    [LEAVE_TYPES.BEREAVEMENT]: { label: 'Bereavement Leave', icon: FaTimes, color: 'gray', requiresDoc: false, maxDays: 5 },
    [LEAVE_TYPES.STUDY]: { label: 'Study Leave', icon: FaGraduationCap, color: 'indigo', requiresDoc: true, maxDays: 30 },
    [LEAVE_TYPES.OTHER]: { label: 'Other Leave', icon: FaFileAlt, color: 'gray', requiresDoc: false, maxDays: null }
};

const STATUS_CONFIG = {
    [LEAVE_STATUS.PENDING]: { label: 'Pending', color: 'yellow', icon: FaHourglassHalf, bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', borderClass: 'border-yellow-200' },
    [LEAVE_STATUS.APPROVED]: { label: 'Approved', color: 'green', icon: FaThumbsUp, bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-200' },
    [LEAVE_STATUS.REJECTED]: { label: 'Rejected', color: 'red', icon: FaThumbsDown, bgClass: 'bg-red-100', textClass: 'text-red-800', borderClass: 'border-red-200' },
    [LEAVE_STATUS.CANCELLED]: { label: 'Cancelled', color: 'gray', icon: FaBan, bgClass: 'bg-gray-100', textClass: 'text-gray-800', borderClass: 'border-gray-200' }
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

// ─── Helper Components ───────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value, className = "" }) => (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 ${className}`}>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[LEAVE_STATUS.PENDING];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass} border ${config.borderClass}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

const LeaveTypeBadge = ({ type }) => {
    const config = LEAVE_TYPE_CONFIG[type];
    if (!config) return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Unknown</span>;
    
    const Icon = config.icon;
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        orange: 'bg-orange-100 text-orange-700 border-orange-200',
        pink: 'bg-pink-100 text-pink-700 border-pink-200',
        cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
        indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colorClasses[config.color]} border`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

const DateRangeDisplay = ({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return (
        <div className="flex items-center gap-2 text-sm">
            <FaCalendarAlt className="text-gray-400" />
            <span>{start.toLocaleDateString()} - {end.toLocaleDateString()}</span>
            <span className="text-xs text-gray-500">({days} day{days !== 1 ? 's' : ''})</span>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const LeaveManagement = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterEmployee, setFilterEmployee] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    const [formData, setFormData] = useState({
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        supporting_document: null,
        contact_during_leave: '',
        alternate_contact: ''
    });
    
    const [rejectionReason, setRejectionReason] = useState('');
    
    const {
        pagination,
        updatePagination,
        goToPage,
    } = usePagination(1, 20);
    
    const constantsFetched = useRef(false);
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);
    
    useEffect(() => {
        const load = async () => {
            await Promise.all([fetchEmployees(), fetchLeaveBalances()]);
        };
        load();
    }, []);
    
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(t);
    }, [searchTerm]);
    
    useEffect(() => {
        if (!isInitialLoad.current && debouncedSearchTerm !== undefined) {
            if (pagination.page !== 1) {
                goToPage(1);
            } else {
                fetchLeaveRequests(1);
            }
        }
    }, [debouncedSearchTerm, filterStatus, filterType, filterEmployee, dateRange]);
    
    // ─── API Calls ────────────────────────────────────────────────────────────────
    
    const fetchEmployees = useCallback(async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/employees/list?limit=1000', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data.map(emp => ({
                    value: emp.id,
                    label: emp.name,
                    email: emp.email,
                    employee_code: emp.employee_code,
                    designation: emp.designation
                })));
            }
        } catch (e) {
            console.error('Failed to fetch employees:', e);
        }
    }, []);
    
    const fetchLeaveRequests = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });
            
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterType !== 'all') params.append('leave_type', filterType);
            if (filterEmployee) params.append('employee_id', filterEmployee.value);
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);
            
            const response = await apiCall(`/leave-requests/list?${params}`, 'GET', null, company?.id);
            const result = await response.json();
            
            if (result.success) {
                setLeaveRequests(result.data);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? (page === result.pagination?.total_pages)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch leave requests');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch leave requests');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm, filterStatus, filterType, filterEmployee, dateRange, updatePagination]);
    
    const fetchLeaveBalances = useCallback(async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/leave-balances', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setLeaveBalances(result.data);
            }
        } catch (e) {
            console.error('Failed to fetch leave balances:', e);
        }
    }, []);
    
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchLeaveRequests(1, true);
            initialFetchDone.current = true;
        }
    }, [fetchLeaveRequests]);
    
    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchLeaveRequests(pagination.page, true);
        }
    }, [pagination.page, fetchLeaveRequests]);
    
    const createLeaveRequest = async (requestData) => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const formDataToSend = new FormData();
            
            Object.keys(requestData).forEach(key => {
                if (key === 'supporting_document' && requestData[key]) {
                    formDataToSend.append(key, requestData[key]);
                } else if (requestData[key] !== null && requestData[key] !== undefined) {
                    formDataToSend.append(key, requestData[key]);
                }
            });
            
            const response = await apiCall('/leave-requests/create', 'POST', formDataToSend, company?.id, true);
            const result = await response.json();
            
            if (result.success) {
                await fetchLeaveRequests(pagination.page, false);
                await fetchLeaveBalances();
                return { success: true };
            }
            throw new Error(result.message || 'Create failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    const updateLeaveStatus = async (id, status, reason = '') => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = { id, status };
            if (reason) payload.rejection_reason = reason;
            
            const response = await apiCall('/leave-requests/update-status', 'PUT', payload, company?.id);
            const result = await response.json();
            
            if (result.success) {
                await fetchLeaveRequests(pagination.page, false);
                await fetchLeaveBalances();
                return { success: true };
            }
            throw new Error(result.message || 'Status update failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    const cancelLeaveRequest = async (id) => {
        return updateLeaveStatus(id, LEAVE_STATUS.CANCELLED);
    };
    
    const deleteLeaveRequest = async (id) => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/leave-requests/delete', 'DELETE', { id }, company?.id);
            const result = await response.json();
            
            if (result.success) {
                await fetchLeaveRequests(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Delete failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    // ─── Modal Handlers ──────────────────────────────────────────────────────
    
    const openViewModal = (request) => {
        setSelectedRequest(request);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };
    
    const openEditModal = (request) => {
        setSelectedRequest(request);
        setFormData({
            employee_id: request.employee_id,
            leave_type: request.leave_type,
            start_date: request.start_date.split('T')[0],
            end_date: request.end_date.split('T')[0],
            reason: request.reason || '',
            supporting_document: null,
            contact_during_leave: request.contact_during_leave || '',
            alternate_contact: request.alternate_contact || ''
        });
        setModalType(MODAL_TYPES.EDIT);
        setActiveActionMenu(null);
    };
    
    const openApproveModal = (request) => {
        setSelectedRequest(request);
        setModalType(MODAL_TYPES.APPROVE);
        setActiveActionMenu(null);
    };
    
    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectionReason('');
        setModalType(MODAL_TYPES.REJECT);
        setActiveActionMenu(null);
    };
    
    const openCancelModal = (request) => {
        setSelectedRequest(request);
        setModalType(MODAL_TYPES.CANCEL);
        setActiveActionMenu(null);
    };
    
    const openDeleteModal = (request) => {
        setSelectedRequest(request);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };
    
    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedRequest(null);
        setRejectionReason('');
        setFormData({
            employee_id: '',
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: '',
            supporting_document: null,
            contact_during_leave: '',
            alternate_contact: ''
        });
    };
    
    const toggleActionMenu = (e, id) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === id ? null : id);
    };
    
    // ─── Form Handlers ───────────────────────────────────────────────────────
    
    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.employee_id || !formData.leave_type || !formData.start_date || !formData.end_date) {
            toast.warning('Please fill all required fields');
            return;
        }
        
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        
        if (start > end) {
            toast.warning('End date must be after start date');
            return;
        }
        
        const result = await createLeaveRequest(formData);
        
        if (result.success) {
            toast.success('Leave request created successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to create leave request');
        }
    };
    
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedRequest) return;
        
        const result = await createLeaveRequest({ ...formData, id: selectedRequest.id });
        
        if (result.success) {
            toast.success('Leave request updated successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to update leave request');
        }
    };
    
    const handleApprove = async () => {
        if (!selectedRequest) return;
        
        const result = await updateLeaveStatus(selectedRequest.id, LEAVE_STATUS.APPROVED);
        
        if (result.success) {
            toast.success('Leave request approved successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to approve leave request');
        }
    };
    
    const handleReject = async () => {
        if (!selectedRequest) return;
        
        if (!rejectionReason.trim()) {
            toast.warning('Please provide a reason for rejection');
            return;
        }
        
        const result = await updateLeaveStatus(selectedRequest.id, LEAVE_STATUS.REJECTED, rejectionReason);
        
        if (result.success) {
            toast.success('Leave request rejected');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to reject leave request');
        }
    };
    
    const handleCancel = async () => {
        if (!selectedRequest) return;
        
        const result = await cancelLeaveRequest(selectedRequest.id);
        
        if (result.success) {
            toast.success('Leave request cancelled');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to cancel leave request');
        }
    };
    
    const handleDelete = async () => {
        if (!selectedRequest) return;
        
        const result = await deleteLeaveRequest(selectedRequest.id);
        
        if (result.success) {
            toast.success('Leave request deleted successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to delete leave request');
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };
    
    const handleFilterReset = () => {
        setFilterStatus('all');
        setFilterType('all');
        setFilterEmployee(null);
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
    };
    
    // ─── Helpers ─────────────────────────────────────────────────────────────
    
    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    const formatDateTime = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    const getEmployeeName = (employeeId) => {
        const employee = employees.find(e => e.value === employeeId);
        return employee ? employee.label : 'Unknown';
    };
    
    const getLeaveBalance = (employeeId, leaveType) => {
        const balance = leaveBalances[employeeId]?.[leaveType];
        if (!balance) return null;
        
        const config = LEAVE_TYPE_CONFIG[leaveType];
        return {
            used: balance.used || 0,
            remaining: balance.remaining || 0,
            total: config?.maxDays || balance.total || 0
        };
    };
    
    // ─── Leave Type Options ─────────────────────────────────────────────────
    
    const leaveTypeOptions = useMemo(() => 
        Object.entries(LEAVE_TYPE_CONFIG).map(([value, config]) => ({
            value,
            label: config.label,
            icon: config.icon,
            color: config.color,
            maxDays: config.maxDays,
            requiresDoc: config.requiresDoc
        }))
    , []);
    
    const statusOptions = useMemo(() => [
        { value: 'all', label: 'All Statuses' },
        ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
            value,
            label: config.label
        }))
    ], []);
    
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
        })
    };
    
    // ─── Render ──────────────────────────────────────────────────────────────
    
    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Leave Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage employee leave requests and balances</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setModalType(MODAL_TYPES.EDIT)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <FaPlus className="w-4 h-4" />
                        New Request
                    </button>
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                        Total: {pagination.total} requests
                    </div>
                </div>
            </motion.div>
            
            {/* Filters */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="mb-6 bg-white rounded-2xl shadow-lg p-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search by employee or reason..."
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                <FaTimes className="text-sm" />
                            </button>
                        )}
                    </div>
                    
                    {/* Status Filter */}
                    <Select
                        options={statusOptions}
                        value={statusOptions.find(opt => opt.value === filterStatus)}
                        onChange={(option) => setFilterStatus(option?.value || 'all')}
                        placeholder="Filter by status"
                        styles={customSelectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                    
                    {/* Leave Type Filter */}
                    <Select
                        options={[{ value: 'all', label: 'All Types' }, ...leaveTypeOptions]}
                        value={[{ value: 'all', label: 'All Types' }, ...leaveTypeOptions].find(opt => opt.value === filterType)}
                        onChange={(option) => setFilterType(option?.value || 'all')}
                        placeholder="Filter by type"
                        styles={customSelectStyles}
                        formatOptionLabel={({ label, icon: Icon }) => (
                            <div className="flex items-center gap-2">
                                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                                <span>{label}</span>
                            </div>
                        )}
                    />
                    
                    {/* Employee Filter */}
                    <Select
                        options={employees}
                        value={filterEmployee}
                        onChange={setFilterEmployee}
                        placeholder="Filter by employee"
                        isClearable
                        styles={customSelectStyles}
                    />
                    
                    {/* Reset Filters */}
                    <button
                        onClick={handleFilterReset}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                    >
                        <FaFilter className="w-4 h-4" />
                        Reset Filters
                    </button>
                </div>
                
                {/* Date Range */}
                <div className="flex gap-4 mt-4">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        placeholder="End Date"
                    />
                </div>
            </motion.div>
            
            {loading && !leaveRequests.length && <SkeletonComponent />}
            
            {!loading && leaveRequests.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
                    <FaRegCalendarCheck className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No leave requests found</p>
                    <p className="text-gray-400 mt-2">Create a new leave request to get started</p>
                </motion.div>
            )}
            
            {!loading && leaveRequests.length > 0 && (
                <>
                    {/* Desktop Table */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.2 }}
                        className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Leave Type</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Days</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Applied On</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaveRequests.map((request, index) => {
                                        const start = new Date(request.start_date);
                                        const end = new Date(request.end_date);
                                        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                        
                                        return (
                                            <motion.tr 
                                                key={request.id} 
                                                initial={{ opacity: 0, y: 20 }} 
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-semibold">{getEmployeeName(request.employee_id)}</div>
                                                        {request.employee_code && (
                                                            <div className="text-xs text-gray-500 font-mono">{request.employee_code}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <LeaveTypeBadge type={request.leave_type} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <DateRangeDisplay startDate={request.start_date} endDate={request.end_date} />
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium">
                                                    {days} day{days !== 1 ? 's' : ''}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate" title={request.reason}>
                                                        {request.reason || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={request.status} />
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {formatDateTime(request.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button onClick={e => toggleActionMenu(e, request.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300">
                                                        <FaEllipsisV className="text-gray-600" />
                                                    </button>
                                                    <AnimatePresence>
                                                        {activeActionMenu === request.id && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                                                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <button onClick={() => openViewModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all">
                                                                    <FaEye size={14} /> View Details
                                                                </button>
                                                                {request.status === LEAVE_STATUS.PENDING && (
                                                                    <>
                                                                        <button onClick={() => openEditModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all">
                                                                            <FaEdit size={14} /> Edit
                                                                        </button>
                                                                        <button onClick={() => openApproveModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all">
                                                                            <FaThumbsUp size={14} /> Approve
                                                                        </button>
                                                                        <button onClick={() => openRejectModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all">
                                                                            <FaThumbsDown size={14} /> Reject
                                                                        </button>
                                                                        <button onClick={() => openCancelModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 text-yellow-600 flex items-center gap-3 transition-all">
                                                                            <FaBan size={14} /> Cancel
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {(request.status === LEAVE_STATUS.APPROVED || request.status === LEAVE_STATUS.REJECTED) && (
                                                                    <button onClick={() => openCancelModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 text-yellow-600 flex items-center gap-3 transition-all">
                                                                        <FaBan size={14} /> Cancel
                                                                    </button>
                                                                )}
                                                                <button onClick={() => openDeleteModal(request)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all border-t border-gray-100">
                                                                    <FaTrash size={14} /> Delete
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                    
                    {/* Mobile Cards */}
                    <div className="grid grid-cols-1 gap-4 lg:hidden">
                        {leaveRequests.map((request, index) => {
                            const start = new Date(request.start_date);
                            const end = new Date(request.end_date);
                            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                            
                            return (
                                <motion.div 
                                    key={request.id} 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
                                                <FaUserCircle className="text-white text-2xl" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{getEmployeeName(request.employee_id)}</h3>
                                                <p className="text-xs text-gray-500 font-mono">{request.employee_code}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={request.status} />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <LeaveTypeBadge type={request.leave_type} />
                                            <span className="text-sm font-mono text-gray-600">{days} day{days !== 1 ? 's' : ''}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                                        </div>
                                        
                                        {request.reason && (
                                            <div className="bg-gray-50 p-3 rounded-xl">
                                                <p className="text-xs text-gray-500 mb-1">Reason:</p>
                                                <p className="text-sm text-gray-700">{request.reason}</p>
                                            </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-100">
                                            <span>Applied: {formatDateTime(request.created_at)}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => openViewModal(request)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all">
                                                    <FaEye size={14} />
                                                </button>
                                                {request.status === LEAVE_STATUS.PENDING && (
                                                    <>
                                                        <button onClick={() => openEditModal(request)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all">
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button onClick={() => openApproveModal(request)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all">
                                                            <FaThumbsUp size={14} />
                                                        </button>
                                                        <button onClick={() => openRejectModal(request)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                                                            <FaThumbsDown size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => openDeleteModal(request)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    {/* Pagination */}
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={goToPage}
                        variant="default"
                        showInfo={true}
                    />
                </>
            )}
            
            {/* Modals */}
            <AnimatePresence>
                {modalType !== MODAL_TYPES.NONE && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <ModalScrollLock />
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* VIEW MODAL */}
                            {modalType === MODAL_TYPES.VIEW && selectedRequest && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                                    <FaEye className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Leave Request Details</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">Request #{selectedRequest.id}</p>
                                                </div>
                                            </div>
                                            <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InfoItem 
                                                icon={<FaUserCircle className="text-blue-500" />} 
                                                label="Employee" 
                                                value={
                                                    <div>
                                                        <div className="font-semibold">{getEmployeeName(selectedRequest.employee_id)}</div>
                                                        <div className="text-xs text-gray-500">{selectedRequest.employee_code}</div>
                                                    </div>
                                                }
                                            />
                                            <InfoItem 
                                                icon={<FaRegCalendarCheck className="text-purple-500" />} 
                                                label="Leave Type" 
                                                value={<LeaveTypeBadge type={selectedRequest.leave_type} />}
                                            />
                                            <div className="md:col-span-2">
                                                <InfoItem 
                                                    icon={<FaCalendarAlt className="text-green-500" />} 
                                                    label="Duration" 
                                                    value={<DateRangeDisplay startDate={selectedRequest.start_date} endDate={selectedRequest.end_date} />}
                                                />
                                            </div>
                                            <InfoItem 
                                                icon={<FaHourglassHalf className="text-orange-500" />} 
                                                label="Total Days" 
                                                value={(() => {
                                                    const start = new Date(selectedRequest.start_date);
                                                    const end = new Date(selectedRequest.end_date);
                                                    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                                    return `${days} day${days !== 1 ? 's' : ''}`;
                                                })()}
                                            />
                                            <InfoItem 
                                                icon={<FaClock className="text-indigo-500" />} 
                                                label="Status" 
                                                value={<StatusBadge status={selectedRequest.status} />}
                                            />
                                            <div className="md:col-span-2">
                                                <InfoItem 
                                                    icon={<FaComment className="text-gray-500" />} 
                                                    label="Reason" 
                                                    value={selectedRequest.reason || 'No reason provided'}
                                                />
                                            </div>
                                            {selectedRequest.rejection_reason && (
                                                <div className="md:col-span-2">
                                                    <InfoItem 
                                                        icon={<FaThumbsDown className="text-red-500" />} 
                                                        label="Rejection Reason" 
                                                        value={selectedRequest.rejection_reason}
                                                        className="bg-red-50 border-red-200"
                                                    />
                                                </div>
                                            )}
                                            {selectedRequest.contact_during_leave && (
                                                <InfoItem 
                                                    icon={<FaPhone className="text-green-500" />} 
                                                    label="Contact During Leave" 
                                                    value={selectedRequest.contact_during_leave}
                                                />
                                            )}
                                            <InfoItem 
                                                icon={<FaFileAlt className="text-gray-500" />} 
                                                label="Applied On" 
                                                value={formatDateTime(selectedRequest.created_at)}
                                            />
                                            {selectedRequest.updated_at !== selectedRequest.created_at && (
                                                <InfoItem 
                                                    icon={<FaEdit className="text-gray-500" />} 
                                                    label="Last Updated" 
                                                    value={formatDateTime(selectedRequest.updated_at)}
                                                />
                                            )}
                                        </div>
                                        
                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={closeModal} 
                                                className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* CREATE/EDIT MODAL */}
                            {(modalType === MODAL_TYPES.EDIT) && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                    <FaPlus className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">
                                                        {selectedRequest ? 'Edit Leave Request' : 'New Leave Request'}
                                                    </h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {selectedRequest ? 'Update leave request details' : 'Submit a new leave request'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <form onSubmit={selectedRequest ? handleUpdate : handleCreate} className="p-6">
                                        <div className="space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto px-1">
                                            {/* Employee Selection */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <FaUserCircle className="w-4 h-4 text-indigo-500" />
                                                    Employee *
                                                </label>
                                                <Select
                                                    options={employees}
                                                    value={employees.find(e => e.value === formData.employee_id)}
                                                    onChange={(option) => setFormData(prev => ({ ...prev, employee_id: option?.value || '' }))}
                                                    placeholder="Select employee"
                                                    styles={customSelectStyles}
                                                    isDisabled={!!selectedRequest}
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Leave Type */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <FaRegCalendarCheck className="w-4 h-4 text-indigo-500" />
                                                    Leave Type *
                                                </label>
                                                <Select
                                                    options={leaveTypeOptions}
                                                    value={leaveTypeOptions.find(opt => opt.value === formData.leave_type)}
                                                    onChange={(option) => {
                                                        setFormData(prev => ({ ...prev, leave_type: option?.value || '' }));
                                                    }}
                                                    placeholder="Select leave type"
                                                    styles={customSelectStyles}
                                                    formatOptionLabel={({ label, icon: Icon, maxDays, requiresDoc }) => (
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                                                                <span>{label}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {maxDays && (
                                                                    <span className="text-xs text-gray-400">Max {maxDays} days</span>
                                                                )}
                                                                {requiresDoc && (
                                                                    <span className="text-xs text-orange-500">📄 Document req.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Date Range */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <FaCalendarAlt className="w-4 h-4 text-indigo-500" />
                                                        Start Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="start_date"
                                                        value={formData.start_date}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <FaCalendarAlt className="w-4 h-4 text-indigo-500" />
                                                        End Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="end_date"
                                                        value={formData.end_date}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Reason */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <FaComment className="w-4 h-4 text-indigo-500" />
                                                    Reason *
                                                </label>
                                                <textarea
                                                    name="reason"
                                                    rows="3"
                                                    value={formData.reason}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                                    placeholder="Please provide a detailed reason for the leave request..."
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Supporting Document */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <FaFileAlt className="w-4 h-4 text-indigo-500" />
                                                    Supporting Document
                                                </label>
                                                <input
                                                    type="file"
                                                    name="supporting_document"
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                />
                                                <p className="text-xs text-gray-500">Upload medical certificate or supporting documents (optional)</p>
                                            </div>
                                            
                                            {/* Contact Information */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <FaPhone className="w-4 h-4 text-indigo-500" />
                                                    Contact During Leave
                                                </label>
                                                <input
                                                    type="text"
                                                    name="contact_during_leave"
                                                    value={formData.contact_during_leave}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                    placeholder="Phone number or email for contact during leave"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all text-sm disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-sm disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                                        {selectedRequest ? 'Updating...' : 'Submitting...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="w-4 h-4" />
                                                        {selectedRequest ? 'Update Request' : 'Submit Request'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                            
                            {/* APPROVE MODAL */}
                            {modalType === MODAL_TYPES.APPROVE && selectedRequest && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                                <FaThumbsUp className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Approve Leave Request</h2>
                                                <p className="text-sm text-gray-500 mt-0.5">Confirm approval for {getEmployeeName(selectedRequest.employee_id)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-green-800">
                                                <strong>Leave Details:</strong><br />
                                                Type: {LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label}<br />
                                                Duration: {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
                                            </p>
                                        </div>
                                        
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to approve this leave request? This action will update the employee's leave balance.
                                        </p>
                                        
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={closeModal}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : <FaThumbsUp />}
                                                Approve Request
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* REJECT MODAL */}
                            {modalType === MODAL_TYPES.REJECT && selectedRequest && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-red-500 to-rose-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                                                <FaThumbsDown className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Reject Leave Request</h2>
                                                <p className="text-sm text-gray-500 mt-0.5">Provide reason for rejection</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Rejection Reason *
                                            </label>
                                            <textarea
                                                rows="4"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                                                placeholder="Please provide a reason for rejecting this leave request..."
                                                required
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={closeModal}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium hover:from-red-700 hover:to-rose-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : <FaThumbsDown />}
                                                Reject Request
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* CANCEL MODAL */}
                            {modalType === MODAL_TYPES.CANCEL && selectedRequest && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-yellow-500 to-amber-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                                                <FaBan className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Cancel Leave Request</h2>
                                                <p className="text-sm text-gray-500 mt-0.5">Cancel this leave request</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Leave Details:</strong><br />
                                                Employee: {getEmployeeName(selectedRequest.employee_id)}<br />
                                                Type: {LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label}<br />
                                                Duration: {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
                                            </p>
                                        </div>
                                        
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to cancel this leave request? This action cannot be undone.
                                        </p>
                                        
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={closeModal}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                            >
                                                Keep Request
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-medium hover:from-yellow-700 hover:to-amber-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : <FaBan />}
                                                Cancel Request
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* DELETE MODAL */}
                            {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedRequest && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-red-500 to-rose-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                                                <FaTrash className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Delete Leave Request</h2>
                                                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaTrash className="text-4xl text-red-600" />
                                        </div>
                                        <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                                        <p className="text-gray-500 mb-6">
                                            You are about to permanently delete the leave request for <span className="font-semibold text-red-600">{getEmployeeName(selectedRequest.employee_id)}</span>.<br />
                                            This action cannot be undone.
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button 
                                                onClick={closeModal} 
                                                className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleDelete} 
                                                disabled={loading}
                                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all font-medium disabled:opacity-50 shadow-lg"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                                Delete Request
                                            </button>
                                        </div>
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

export default LeaveManagement;
