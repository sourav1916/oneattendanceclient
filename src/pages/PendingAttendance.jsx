import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
    FaUser, FaBuilding, FaMapMarkerAlt,
    FaInfoCircle, FaEye, FaSpinner, FaChevronLeft,
    FaChevronRight, FaHourglassStart, FaHourglassEnd, FaCheck,
    FaBan, FaComment, FaHistory, FaUserCheck,
    FaEllipsisV, FaFilter, FaCalendarAlt, FaEnvelope, FaIdCard,
    FaTh, FaListUl
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

const NOTES_MODAL_CLASS = "bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col";

const pendingAttendanceAPI = {
    fetchPendingPunchIns: async (companyId, page = 1, limit = 10, search = '') => {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search })
        });

        const response = await apiCall(`/attendance/pending-punches?${queryParams.toString()}`, 'GET', null, companyId);

        if (!response.ok) {
            throw new Error('Failed to fetch pending attendance data');
        }

        return response.json();
    },

    updateAttendanceStatus: async (companyId, punchId, action, notes = '') => {
        let endpoint = '';

        if (action === 'approve') {
            endpoint = '/attendance/approve';
        } else if (action === 'reject') {
            endpoint = '/attendance/reject';
        } else {
            throw new Error('Invalid action type');
        }

        const response = await apiCall(endpoint, 'PUT', {
            punch_id: punchId,
            notes
        }, companyId);

        if (!response.ok) {
            throw new Error(`Failed to ${action} attendance`);
        }

        return response.json();
    }
};

// Helper Components
const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return { icon: FaCheckCircle, text: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' };
            case 'rejected':
                return { icon: FaTimesCircle, text: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' };
            case 'pending':
                return { icon: FaClock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            default:
                return { icon: FaInfoCircle, text: status || 'Unknown', className: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
            <Icon size={12} /> {config.text}
        </span>
    );
};

const PunchTypeBadge = ({ type }) => {
    const getTypeConfig = () => {
        switch (type?.toLowerCase()) {
            case 'in':
                return { icon: FaHourglassStart, text: 'In', className: 'bg-blue-100 text-blue-800' };
            case 'out':
                return { icon: FaHourglassEnd, text: 'Out', className: 'bg-purple-100 text-purple-800' };
            case 'break_start':
                return { icon: FaHourglassStart, text: 'Break Start', className: 'bg-orange-100 text-orange-800' };
            case 'break_end':
                return { icon: FaHourglassEnd, text: 'Break End', className: 'bg-orange-100 text-orange-800' };
            default:
                return { icon: FaClock, text: type || 'Unknown', className: 'bg-gray-100 text-gray-700' };
        }
    };

    const config = getTypeConfig();
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
            <Icon size={10} /> {config.text}
        </span>
    );
};

const PendingDetailsModal = ({ attendance, onClose }) => {
    if (!attendance) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={onClose}
        >
            <ModalScrollLock />
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-6 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <FaInfoCircle /> Pending Attendance Details
                        </h2>
                        <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition">
                            <FaTimesCircle size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="border-b pb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaUser className="text-amber-500" /> Employee Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Name</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee_name || attendance.employee?.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Email</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base break-all">{attendance.employee_email || attendance.employee?.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Employee Code</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee_code || attendance.employee?.code}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Designation</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee?.designation || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-b pb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaClock className="text-amber-500" /> Attendance Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Punch Type</label>
                                <div className="mt-1">
                                    <PunchTypeBadge type="in" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Punch Time</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base">
                                    {new Date(attendance.punch_time).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Status</label>
                                <div className="mt-1">
                                    <StatusBadge status={attendance.status || 'pending'} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Method</label>
                                <p className="font-medium text-gray-800 text-sm sm:text-base">
                                    {attendance.attendance_method || attendance.attendance?.method || 'N/A'}
                                    {attendance.attendance_mode && ` (${attendance.attendance_mode})`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Card View Component for Mobile
const PendingAttendanceCard = ({ attendance, onViewDetails, onApprove, onReject, processingId, onToggleMenu, activeMenuId, approveDisabled, rejectDisabled, reviewMessage }) => {
    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaUser className="text-amber-600 text-base sm:text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {attendance.employee_name || attendance.employee?.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">{attendance.employee_code || attendance.employee?.code}</p>
                        <p className="text-xs text-gray-400 truncate">{attendance.employee?.designation || 'N/A'}</p>
                    </div>
                </div>
                <div className="relative flex-shrink-0 ml-2">
                    <ActionMenu
                        menuId={attendance.id}
                        activeId={activeMenuId}
                        onToggle={onToggleMenu}
                        actions={[
                            {
                                label: 'Approve',
                                icon: processingId === attendance.id ? FaSpinner : FaCheck,
                                onClick: () => onApprove(attendance.id),
                                disabled: processingId === attendance.id || approveDisabled,
                                title: approveDisabled ? reviewMessage : '',
                                className: 'text-green-600 hover:bg-green-50'
                            },
                            {
                                label: 'Reject',
                                icon: processingId === attendance.id ? FaSpinner : FaBan,
                                onClick: () => onReject(attendance.id),
                                disabled: processingId === attendance.id || rejectDisabled,
                                title: rejectDisabled ? reviewMessage : '',
                                className: 'text-red-600 hover:bg-red-50'
                            },
                            {
                                label: 'View Details',
                                icon: FaEye,
                                onClick: () => onViewDetails(attendance),
                                className: 'text-blue-600 hover:bg-blue-50'
                            }
                        ]}
                    />
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-gray-500 text-xs sm:text-sm">Punch Time:</span>
                    <span className="font-medium text-xs sm:text-sm">{formatTime(attendance.punch_time)}</span>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-gray-500 text-xs sm:text-sm">Date:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formatDate(attendance.punch_time)}</span>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-gray-500 text-xs sm:text-sm">Status:</span>
                    <StatusBadge status={attendance.status || 'pending'} />
                </div>
                <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="text-gray-500 text-xs sm:text-sm">Method:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{attendance.attendance_method || attendance.attendance?.method || 'N/A'}</span>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const PendingAttendance = ({ companyId }) => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [notes, setNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const navigate = useNavigate();

    const resolvedCompanyId = companyId || JSON.parse(localStorage.getItem('company') || 'null')?.id;
    const previousSearchRef = useRef('');
    const lastRequestKeyRef = useRef('');
    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const itemsPerPage = pagination.limit;
    const approveAccess = checkActionAccess('pendingAttendance', 'approve');
    const rejectAccess = checkActionAccess('pendingAttendance', 'reject');
    const pendingReviewMessage = getAccessMessage(approveAccess.disabled ? approveAccess : rejectAccess);

    const showEmail = viewMode === 'table';
    const showMethod = viewMode === 'table';
    const showDateTime = viewMode === 'table';

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch pending attendances
    const fetchPendingAttendances = useCallback(async (force = false) => {
        if (!resolvedCompanyId) {
            setError('Company ID is required');
            setLoading(false);
            return;
        }
        const requestKey = `${resolvedCompanyId}-${pagination.page}-${debouncedSearchTerm}-${pagination.limit}`;
        if (!force && lastRequestKeyRef.current === requestKey) {
            return;
        }

        try {
            lastRequestKeyRef.current = requestKey;
            setLoading(true);
            const response = await pendingAttendanceAPI.fetchPendingPunchIns(
                resolvedCompanyId,
                pagination.page,
                itemsPerPage,
                debouncedSearchTerm
            );

            if (response.success) {
                const currentPage = response.current_page || response.page || pagination.page;
                const perPage = response.per_page || response.limit || pagination.limit;
                const total = response.total || 0;
                const totalPages = response.total_pages || response.last_page || Math.ceil(total / perPage) || 1;

                setAttendances(response.data);
                updatePagination({
                    page: currentPage,
                    limit: perPage,
                    total,
                    total_pages: totalPages,
                    is_last_page: currentPage >= totalPages
                });
                setError(null);
            } else {
                throw new Error(response.message || 'Failed to fetch pending attendances');
            }
        } catch (err) {
            lastRequestKeyRef.current = '';
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [resolvedCompanyId, pagination.page, pagination.limit, debouncedSearchTerm, itemsPerPage, updatePagination]);

    useEffect(() => {
        if (previousSearchRef.current !== debouncedSearchTerm && pagination.page !== 1) {
            previousSearchRef.current = debouncedSearchTerm;
            goToPage(1);
            return;
        }

        previousSearchRef.current = debouncedSearchTerm;
        fetchPendingAttendances();
    }, [pagination.page, debouncedSearchTerm, fetchPendingAttendances, goToPage]);

    // Handle status update
    const handleStatusUpdate = async (punchId, action) => {
        const access = action === 'approve' ? approveAccess : rejectAccess;
        if (access.disabled) return;
        if (action === 'reject' && !notes.trim()) {
            setSelectedAction({ punchId, action });
            setShowNotesModal(true);
            setActiveActionMenu(null);
            return;
        }

        await processStatusUpdate(punchId, action, notes);
    };

    const processStatusUpdate = async (punchId, action, notesText) => {
        try {
            setProcessingId(punchId);
            const response = await pendingAttendanceAPI.updateAttendanceStatus(resolvedCompanyId, punchId, action, notesText);

            if (response.success) {
                toast.success(`Attendance ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
                fetchPendingAttendances(true);
                setNotes('');
                setShowNotesModal(false);
                setSelectedAction(null);
                setActiveActionMenu(null);
            } else {
                throw new Error(response.message || 'Failed to update status');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        if (page !== pagination.page) {
            goToPage(page);
        }
        setActiveActionMenu(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle view details
    const handleViewDetails = (attendance) => {
        setSelectedAttendance(attendance);
        setShowModal(true);
        setActiveActionMenu(null);
    };

    // Format date
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleActionMenu = (attendanceId) => {
        setActiveActionMenu((current) => (current === attendanceId ? null : attendanceId));
    };

    if (!resolvedCompanyId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                    <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Company ID is required</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                                    <FaHistory className="text-amber-500 text-base sm:text-xl md:text-2xl" />
                                    <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        Pending Attendance
                                    </span>
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">Company ID: {resolvedCompanyId}</p>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/attendance-management')}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-purple-600 sm:text-sm"
                                >
                                    <FaCheckCircle />
                                    All Attendance
                                </button>
                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg justify-between sm:justify-start">
                                    <FaUserCheck className="text-amber-500 text-sm sm:text-base" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                                        Pending: {pagination.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* View Toggle */}
                    <div className="flex justify-end mb-4 sm:mb-5 md:mb-6">
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6"
                    >
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                            <input
                                type="text"
                                placeholder="Search by employee name, email, or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm sm:text-base"
                            />
                        </div>
                    </motion.div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <FaSpinner className="animate-spin text-amber-500 text-3xl sm:text-4xl" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-center text-sm sm:text-base">
                            {error}
                        </div>
                    ) : attendances.length === 0 ? (
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-10 md:p-12 text-center">
                            <FaClock className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                            <p className="text-gray-500 text-sm sm:text-base md:text-lg">No pending attendance records found</p>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">All attendances have been processed</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'table' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-visible"
                                >
                                    <div className="overflow-x-auto overflow-y-visible">
                                        <table className="w-full min-w-[1100px]">
                                            <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                                                <tr>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Employee
                                                    </th>
                                                    {showDateTime && (
                                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Date & Time
                                                        </th>
                                                    )}
                                                    {showEmail && (
                                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Email
                                                        </th>
                                                    )}
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    {showMethod && (
                                                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            Method
                                                        </th>
                                                    )}
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {attendances.map((attendance) => (
                                                    <motion.tr
                                                        key={attendance.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="hover:bg-amber-50/30 transition"
                                                    >
                                                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <FaUser className="text-amber-600 text-xs sm:text-sm md:text-base" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate max-w-[120px] sm:max-w-[150px] md:max-w-[200px]">
                                                                        {attendance.employee_name || attendance.employee?.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[130px] md:max-w-[180px]">
                                                                        {attendance.employee_code || attendance.employee?.code}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {showDateTime && (
                                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                                <div className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                                    {formatDateTime(attendance.punch_time)}
                                                                </div>
                                                            </td>
                                                        )}
                                                        {showEmail && (
                                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                                <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px] md:max-w-[200px]">
                                                                    {attendance.employee_email || attendance.employee?.email}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                            <StatusBadge status={attendance.status || 'pending'} />
                                                        </td>
                                                        {showMethod && (
                                                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                                <div className="text-xs sm:text-sm text-gray-900">
                                                                    {attendance.attendance_method || attendance.attendance?.method || 'N/A'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                            <div className="relative flex justify-center">
                                                                <ActionMenu
                                                                    menuId={attendance.id}
                                                                    activeId={activeActionMenu}
                                                                    onToggle={toggleActionMenu}
                                                                    actions={[
                                                                        {
                                                                            label: 'Approve',
                                                                            icon: processingId === attendance.id ? FaSpinner : FaCheck,
                                                                            onClick: () => handleStatusUpdate(attendance.id, 'approve'),
                                                                            disabled: processingId === attendance.id || approveAccess.disabled,
                                                                            title: approveAccess.disabled ? pendingReviewMessage : '',
                                                                            className: 'text-green-700 hover:bg-green-50'
                                                                        },
                                                                        {
                                                                            label: 'Reject',
                                                                            icon: processingId === attendance.id ? FaSpinner : FaBan,
                                                                            onClick: () => handleStatusUpdate(attendance.id, 'reject'),
                                                                            disabled: processingId === attendance.id || rejectAccess.disabled,
                                                                            title: rejectAccess.disabled ? pendingReviewMessage : '',
                                                                            className: 'text-red-700 hover:bg-red-50'
                                                                        },
                                                                        {
                                                                            label: 'View Details',
                                                                            icon: FaEye,
                                                                            onClick: () => handleViewDetails(attendance),
                                                                            className: 'text-blue-700 hover:bg-blue-50'
                                                                        }
                                                                    ]}
                                                                />
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>


                                </motion.div>
                            )}
                            {viewMode === 'card' && (
                                <ManagementGrid viewMode={viewMode}>
                                    {attendances.map((attendance) => (
                                        <PendingAttendanceCard
                                            key={attendance.id}
                                            attendance={attendance}
                                            onViewDetails={handleViewDetails}
                                            onApprove={(id) => handleStatusUpdate(id, 'approve')}
                                            onReject={(id) => handleStatusUpdate(id, 'reject')}
                                            processingId={processingId}
                                            onToggleMenu={toggleActionMenu}
                                            activeMenuId={activeActionMenu}
                                            approveDisabled={approveAccess.disabled}
                                            rejectDisabled={rejectAccess.disabled}
                                            reviewMessage={pendingReviewMessage}
                                        />
                                    ))}
                                </ManagementGrid>
                            )}
                            {pagination.total > 0 && (
                                <Pagination
                                    currentPage={pagination.page}
                                    totalItems={pagination.total}
                                    itemsPerPage={pagination.limit}
                                    onPageChange={goToPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {showModal && selectedAttendance && (
                    <PendingDetailsModal
                        attendance={selectedAttendance}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Notes Modal for Rejection */}
            <AnimatePresence>
                {showNotesModal && selectedAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
                        onClick={() => {
                            setShowNotesModal(false);
                            setSelectedAction(null);
                            setNotes('');
                        }}
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className={NOTES_MODAL_CLASS}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-5 md:p-6 rounded-t-2xl">
                                <h2 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2">
                                    <FaComment /> Rejection Notes
                                </h2>
                            </div>
                            <div className="flex flex-1 flex-col p-4 sm:p-5 md:p-6">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Please provide a reason for rejection
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="min-h-[140px] w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm"
                                    placeholder="Enter rejection reason..."
                                    autoFocus
                                />
                                <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
                                    <button
                                        onClick={() => {
                                            if (notes.trim()) {
                                                processStatusUpdate(selectedAction.punchId, selectedAction.action, notes);
                                            } else {
                                                toast.warning('Please provide a reason for rejection');
                                            }
                                        }}
                                        disabled={rejectAccess.disabled}
                                        title={rejectAccess.disabled ? pendingReviewMessage : ''}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 sm:py-2 rounded-lg font-medium transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit Rejection
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNotesModal(false);
                                            setSelectedAction(null);
                                            setNotes('');
                                        }}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 sm:py-2 rounded-lg font-medium transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </>
    );
};

export default PendingAttendance;
