import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEye, FaEdit, FaCheck, FaTrash, FaSpinner, FaTimes, FaPlus, FaCloudUploadAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall, { uploadFile } from '../utils/api';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ActionMenu from '../components/ActionMenu';
import { DatePickerField } from '../components/DatePicker';

// ─── Modal Variants ────────────────────────────────────────────────────────────
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
const fmt = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const fmtDateTime = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const initials = (name = '') =>
    name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const STATUS = {
    approved: {
        label: 'Approved',
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-500',
        border: 'border-green-200'
    },
    rejected: {
        label: 'Rejected',
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500',
        border: 'border-red-200'
    },
    pending: {
        label: 'Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
        border: 'border-yellow-200'
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        dot: 'bg-gray-400',
        border: 'border-gray-200'
    },
};

const getCompanyId = () => {
    try {
        return JSON.parse(localStorage.getItem('company'))?.id ?? null;
    } catch {
        return null;
    }
};

const INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400';

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text} border ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
            {s.label}
        </span>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }) {
    return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
            {initials(name)}
        </div>
    );
}

// ─── InfoItem Component ───────────────────────────────────────────────────────
const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium text-sm break-words">{value || '—'}</div>
    </div>
);

// ─── Shared ActionMenu action builder ──────────────────────────────────────────
function buildLeaveActions({ leave, onView, onEdit, onApprove, onReject, editDisabled, approveDisabled, rejectDisabled, editMessage, reviewMessage }) {
    const isPending = leave?.status === 'pending';
    return [
        {
            label: 'View Details',
            icon: <FaEye size={13} />,
            onClick: () => onView(leave),
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
        },
        ...(isPending ? [
            {
                label: 'Edit Leave',
                icon: <FaEdit size={13} />,
                onClick: () => onEdit(leave),
                disabled: editDisabled,
                title: editDisabled ? editMessage : '',
                className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
            },
            {
                label: 'Approve',
                icon: <FaCheck size={13} />,
                onClick: () => onApprove(leave),
                disabled: approveDisabled,
                title: approveDisabled ? reviewMessage : '',
                className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
            },
            {
                label: 'Reject',
                icon: <FaTrash size={13} />,
                onClick: () => onReject(leave),
                disabled: rejectDisabled,
                title: rejectDisabled ? reviewMessage : '',
                className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }
        ] : [])
    ];
}

// ─── Mobile Leave Card ─────────────────────────────────────────────────────────
function MobileLeaveCard({
    leave,
    onView,
    onEdit,
    onApprove,
    onReject,
    editDisabled,
    approveDisabled,
    rejectDisabled,
    editMessage,
    reviewMessage,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            onClick={() => onView(leave)}
        >
            <div className="flex items-start gap-3 mb-3">
                <Avatar name={leave.employee_name} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{leave.employee_name}</h3>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                                menuId={leave.id}
                                actions={buildLeaveActions({ leave, onView, onEdit, onApprove, onReject, editDisabled, approveDisabled, rejectDisabled, editMessage, reviewMessage })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{leave.employee_code}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <StatusBadge status={leave.status} />
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
                    📅 {parseFloat(leave.total_days)} days
                </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white rounded-md text-xs font-bold text-gray-600 border border-gray-200">
                        {leave.leave_code}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{leave.leave_name}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{leave.is_paid ? '💰 Paid' : '🚫 Unpaid'}</span>
                    {leave.approved_by_name && <span>✓ {leave.approved_by_name}</span>}
                </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-2 mb-3 text-xs font-semibold text-blue-700 text-center">
                📅 {fmt(leave.start_date)} → {fmt(leave.end_date)}
            </div>

            {leave.approval_remarks && (
                <div className="bg-gray-50 rounded-xl p-2 mb-3 text-xs italic text-gray-500">
                    "{leave.approval_remarks}"
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">Applied: {fmt(leave.applied_at)}</span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onView(leave); }}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    View Details
                </button>
            </div>
        </motion.div>
    );
}

// ─── Skeleton Component ───────────────────────────────────────────────────────
const SkeletonComponent = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const LeaveManagement = () => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const toggleActionMenu = useCallback((id) => {
        setActiveActionMenu((prev) => (prev === id ? null : id));
    }, []);

    // Modal states
    const [detailLeave, setDetailLeave] = useState(null);
    const [approveLeave, setApproveLeave] = useState(null);
    const [rejectLeave, setRejectLeave] = useState(null);
    const [editLeave, setEditLeave] = useState(null);

    // Form state
    const [approveRemarks, setApproveRemarks] = useState('');
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [editForm, setEditForm] = useState({});
    const [deletedAttachments, setDeletedAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const updateAccess = checkActionAccess('leaveManagement', 'update');
    const approveAccess = checkActionAccess('leaveManagement', 'approve');
    const rejectAccess = checkActionAccess('leaveManagement', 'reject');
    const updateMessage = getAccessMessage(updateAccess);
    const reviewMessage = getAccessMessage(approveAccess.disabled ? approveAccess : rejectAccess);

    const fetchInProgress = useRef(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Fetch Leaves ──────────────────────────────────────────────────────────
    const fetchLeaves = useCallback(async (page = pagination.page, searchVal = debouncedSearch, statusVal = statusFilter, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const companyId = getCompanyId();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
            });
            if (searchVal) params.append('search', searchVal);
            if (statusVal) params.append('status', statusVal);

            const response = await apiCall(`/leave/emp-leaves?${params}`, 'GET', null, companyId);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to load leaves');
            }

            const rows = result.data || [];
            const currentPage = Number(result.meta?.page ?? result.page ?? page);
            const perPage = Number(result.meta?.limit ?? result.limit ?? pagination.limit);
            const total = Number(result.meta?.total ?? result.total ?? rows.length ?? 0);
            const totalPages = Number(
                result.meta?.total_pages ??
                result.total_pages ??
                result.last_page ??
                Math.max(1, Math.ceil(total / perPage))
            );

            setLeaves(rows);
            updatePagination({
                page: currentPage,
                limit: perPage,
                total: total,
                total_pages: totalPages,
                is_last_page: result.meta?.is_last_page ?? result.is_last_page ?? (currentPage >= totalPages),
            });
        } catch (error) {
            toast.error(error.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.limit, updatePagination, debouncedSearch, statusFilter]);

    // Trigger fetch on page change
    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

    // Trigger fetch on search change
    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchLeaves(1, debouncedSearch, statusFilter, true);
        }
    }, [debouncedSearch, statusFilter]);

    // Initial fetch
    useEffect(() => {
        const company = getCompanyId();
        if (company && isInitialLoad) {
            fetchLeaves(1, '', '', true);
        } else if (!company) {
            toast.error("Company ID not found. Please ensure you're logged in as a company.");
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // ── Action Handlers ─────────────────────────────────────────────────────────
    const handleView = useCallback((leave) => {
        setDetailLeave(leave);
    }, []);

    const handleEdit = useCallback((leave) => {
        if (updateAccess.disabled) {
            toast.warning(updateMessage);
            return;
        }
        setEditLeave(leave);
        setEditForm({
            leave_config_id: leave.leave_config_id,
            start_date: leave.start_date?.split('T')[0] || leave.start_date,
            end_date: leave.end_date?.split('T')[0] || leave.end_date,
            is_half_day: leave.is_half_day ? 1 : 0,
            half_day_type: leave.half_day_type || 'first_half',
            reason: leave.reason || '',
        });
        setDeletedAttachments([]);
        setNewAttachments([]);
    }, [updateAccess.disabled, updateMessage]);

    const handleApproveOpen = useCallback((leave) => {
        if (approveAccess.disabled) {
            toast.warning(reviewMessage);
            return;
        }
        setApproveLeave(leave);
        setApproveRemarks('');
    }, [approveAccess.disabled, reviewMessage]);

    const handleRejectOpen = useCallback((leave) => {
        if (rejectAccess.disabled) {
            toast.warning(reviewMessage);
            return;
        }
        setRejectLeave(leave);
        setRejectRemarks('');
    }, [rejectAccess.disabled, reviewMessage]);

    // ── Approve ────────────────────────────────────────────────────────────────
    const submitApprove = async () => {
        if (!approveLeave) return;
        setSubmitting(true);
        try {
            const response = await apiCall('/leave/approve', 'PUT',
                { id: approveLeave.id, remarks: approveRemarks }, getCompanyId());
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to approve');
            toast.success('Leave approved successfully');
            setApproveLeave(null);
            fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
        } catch (error) {
            toast.error(error.message || 'Failed to approve');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Reject ─────────────────────────────────────────────────────────────────
    const submitReject = async () => {
        if (!rejectLeave) return;
        if (!rejectRemarks.trim()) {
            toast.warn('Rejection reason is required');
            return;
        }
        setSubmitting(true);
        try {
            const response = await apiCall('/leave/reject', 'PUT',
                { id: rejectLeave.id, remarks: rejectRemarks }, getCompanyId());
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to reject');
            toast.success('Leave rejected');
            setRejectLeave(null);
            fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
        } catch (error) {
            toast.error(error.message || 'Failed to reject');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Edit with Attachments ─────────────────────────────────────────────────
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        setIsUploading(true);
        try {
            const uploadPromises = files.map(file => uploadFile(file).then(url => ({
                url,
                name: file.name
            })));
            const uploaded = await Promise.all(uploadPromises);
            setNewAttachments(prev => [...prev, ...uploaded]);
            toast.success("Files uploaded successfully");
        } catch (error) {
            toast.error("Failed to upload one or more files");
        } finally {
            setIsUploading(false);
        }
    };

    const removeNewAttachment = (index) => {
        setNewAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const submitEdit = async () => {
        if (!editLeave) return;
        if (!editForm.start_date || !editForm.end_date) {
            toast.warn('Start date and end date are required');
            return;
        }

        if (new Date(editForm.start_date) > new Date(editForm.end_date)) {
            toast.warn('Start date cannot be after end date');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                id: editLeave.id,
                leave_config_id: editForm.leave_config_id,
                start_date: editForm.start_date,
                end_date: editForm.end_date,
                is_half_day: editForm.is_half_day,
                reason: editForm.reason || '',
                deleted_attachments: deletedAttachments,
                attachments: newAttachments.map(a => a.url)
            };

            if (editForm.is_half_day === 1) {
                payload.half_day_type = editForm.half_day_type;
            }

            const response = await apiCall('/leave/application-update', 'PUT', payload, getCompanyId());
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update leave');
            toast.success('Leave updated successfully');
            setEditLeave(null);
            fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
        } catch (error) {
            toast.error(error.message || 'Failed to update leave');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalItems = pagination.total || leaves.length;
    const stats = [
        { label: 'Total', val: totalItems, icon: '📋', color: 'blue' },
        { label: 'Approved', val: leaves.filter((l) => l.status === 'approved').length, icon: '✅', color: 'green' },
        { label: 'Rejected', val: leaves.filter((l) => l.status === 'rejected').length, icon: '❌', color: 'red' },
        { label: 'Pending', val: leaves.filter((l) => l.status === 'pending').length, icon: '⏳', color: 'yellow' },
    ];

    const statusOptions = ['', 'approved', 'rejected', 'pending', 'cancelled'];

    // Responsive column visibility
    const showLeaveType = windowWidth >= 640;
    const showDuration = windowWidth >= 768;
    const showDays = windowWidth >= 560;
    const showApplied = windowWidth >= 1024;
    const showApprovedBy = windowWidth >= 1280;

    if (isInitialLoad && loading) return <div className="min-h-screen p-6"><SkeletonComponent /></div>;

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
                >
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Leave Management
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                            <span className="text-lg">🏖️</span>
                            <span className="font-medium text-gray-700">{totalItems}</span>
                            <span className="text-gray-500">requests</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                    {stats.map((s) => {
                        const colorMap = {
                            blue: 'from-blue-500 to-indigo-600',
                            green: 'from-green-500 to-emerald-600',
                            red: 'from-red-500 to-rose-600',
                            yellow: 'from-yellow-500 to-amber-600',
                        };
                        return (
                            <div
                                key={s.label}
                                className={`bg-gradient-to-r ${colorMap[s.color]} rounded-2xl p-4 text-white shadow-lg`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs opacity-80">{s.label}</p>
                                        <p className="text-2xl font-bold">{s.val}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                                        {s.icon}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, code, or leave type..."
                            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Status Filter Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex flex-wrap gap-2"
                >
                    {statusOptions.map((s) => (
                        <button
                            key={s || 'all'}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
                                ${statusFilter === s
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </motion.div>

                {/* View Toggle & Info */}
                {!loading && leaves.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-800">{leaves.length}</span> of{' '}
                            <span className="font-semibold text-gray-800">{totalItems}</span> requests
                            {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                            {statusFilter && <span className="ml-1 text-purple-600">· {statusFilter}</span>}
                        </p>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !leaves.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && leaves.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📭</span>
                        </div>
                        <p className="text-xl font-semibold text-gray-600">No leave requests found</p>
                        <p className="text-gray-400 mt-2 text-sm">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No leave requests match your filters'}
                        </p>
                        {debouncedSearch && (
                            <button onClick={() => setSearch('')}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium">
                                Clear Search
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Table View */}
                {!loading && leaves.length > 0 && viewMode === "table" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-visible"
                    >
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        {showLeaveType && <th className="px-6 py-4">Leave Type</th>}
                                        <th className="px-6 py-4">Status</th>
                                        {showDuration && <th className="px-6 py-4">Duration</th>}
                                        {showDays && <th className="px-6 py-4">Days</th>}
                                        {showApplied && <th className="px-6 py-4">Applied</th>}
                                        {showApprovedBy && <th className="px-6 py-4">Approved By</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaves.map((leave, index) => (
                                        <motion.tr
                                            key={leave.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                                            onClick={() => handleView(leave)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={leave.employee_name} />
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{leave.employee_name}</p>
                                                        <p className="text-xs text-gray-500">{leave.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {showLeaveType && (
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-100">
                                                            {leave.leave_code}
                                                        </span>
                                                        <p className="text-sm text-gray-700 mt-1">{leave.leave_name}</p>
                                                        <p className="text-xs text-gray-400">{leave.is_paid ? 'Paid' : 'Unpaid'}</p>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <StatusBadge status={leave.status} />
                                            </td>
                                            {showDuration && (
                                                <td className="px-6 py-4">
                                                    <div className="text-xs">
                                                        <div>{fmt(leave.start_date)}</div>
                                                        <div className="text-gray-400">→ {fmt(leave.end_date)}</div>
                                                    </div>
                                                </td>
                                            )}
                                            {showDays && (
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                                                        {parseFloat(leave.total_days)} days
                                                    </span>
                                                </td>
                                            )}
                                            {showApplied && (
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {fmt(leave.applied_at)}
                                                </td>
                                            )}
                                            {showApprovedBy && (
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">{leave.approved_by_name || '—'}</div>
                                                    {leave.approval_remarks && (
                                                        <div className="text-xs text-gray-400 italic truncate max-w-[150px]">
                                                            "{leave.approval_remarks}"
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <ActionMenu
                                                    menuId={leave.id}
                                                    activeId={activeActionMenu}
                                                    onToggle={(e, id) => toggleActionMenu(id)}
                                                    actions={buildLeaveActions({
                                                        leave,
                                                        onView: handleView,
                                                        onEdit: handleEdit,
                                                        onApprove: handleApproveOpen,
                                                        onReject: handleRejectOpen,
                                                        editDisabled: updateAccess.disabled,
                                                        approveDisabled: approveAccess.disabled,
                                                        rejectDisabled: rejectAccess.disabled,
                                                        editMessage: updateMessage,
                                                        reviewMessage,
                                                    })}
                                                />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Card View */}
                {!loading && leaves.length > 0 && viewMode === "card" && (
                    <ManagementGrid viewMode={viewMode}>
                        {leaves.map((leave) => (
                            <MobileLeaveCard
                                key={leave.id}
                                leave={leave}
                                onView={handleView}
                                onEdit={handleEdit}
                                onApprove={handleApproveOpen}
                                onReject={handleRejectOpen}
                                editDisabled={updateAccess.disabled}
                                approveDisabled={approveAccess.disabled}
                                rejectDisabled={rejectAccess.disabled}
                                editMessage={updateMessage}
                                reviewMessage={reviewMessage}
                            />
                        ))}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && (leaves.length > 0 || pagination.total > 0) && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={totalItems}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
                )}

                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* DETAIL MODAL - With Attachments */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                <AnimatePresence>
                    {detailLeave && (
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setDetailLeave(null)}
                        >
                            <ModalScrollLock />
                            <motion.div
                                variants={modalVariants}
                                initial="hidden" animate="visible" exit="exit"
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <FaEye /> Leave Details
                                    </h2>
                                    <button onClick={() => setDetailLeave(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                        <FaTimes size={20} />
                                    </button>
                                </div>
                                <div className="p-6">
                                    {/* Employee Info */}
                                    <div className="flex items-center gap-4 pb-4 border-b">
                                        <Avatar name={detailLeave.employee_name} />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{detailLeave.employee_name}</h3>
                                            <p className="text-gray-500 text-sm">{detailLeave.employee_code}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{detailLeave.email}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <StatusBadge status={detailLeave.status} />
                                        </div>
                                    </div>

                                    {/* Leave Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <InfoItem icon={<span>📋</span>} label="Leave Type" value={`${detailLeave.leave_code} - ${detailLeave.leave_name}`} />
                                        <InfoItem icon={<span>💰</span>} label="Paid Status" value={detailLeave.is_paid ? 'Paid Leave' : 'Unpaid Leave'} />
                                        <InfoItem icon={<span>📅</span>} label="Start Date" value={fmt(detailLeave.start_date)} />
                                        <InfoItem icon={<span>📅</span>} label="End Date" value={fmt(detailLeave.end_date)} />
                                        <InfoItem icon={<span>📊</span>} label="Total Days" value={`${parseFloat(detailLeave.total_days)} days`} />
                                        <InfoItem icon={<span>⏰</span>} label="Half Day" value={detailLeave.is_half_day ? `Yes (${detailLeave.half_day_type || 'N/A'})` : 'No'} />
                                        <InfoItem icon={<span>📨</span>} label="Applied On" value={fmtDateTime(detailLeave.applied_at)} />
                                        <InfoItem icon={<span>👤</span>} label="Approved By" value={detailLeave.approved_by_name || '—'} />
                                        {detailLeave.approved_at && (
                                            <InfoItem icon={<span>✅</span>} label="Approved At" value={fmtDateTime(detailLeave.approved_at)} />
                                        )}
                                        {detailLeave.cancelled_at && (
                                            <InfoItem icon={<span>🚫</span>} label="Cancelled At" value={fmtDateTime(detailLeave.cancelled_at)} />
                                        )}
                                    </div>

                                    {/* Reason */}
                                    {detailLeave.reason && (
                                        <div className="mt-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                                            <div className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-700">{detailLeave.reason}</div>
                                        </div>
                                    )}

                                    {/* Approval Remarks */}
                                    {detailLeave.approval_remarks && (
                                        <div className="mt-4">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</label>
                                            <div className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-500 italic">"{detailLeave.approval_remarks}"</div>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {detailLeave.attachments && (Array.isArray(detailLeave.attachments) || typeof detailLeave.attachments === 'string') && (
                                        <div className="mt-4">
                                            {(() => {
                                                let atts = detailLeave.attachments;
                                                if (typeof atts === 'string') {
                                                    try { atts = JSON.parse(atts); } catch { atts = []; }
                                                }
                                                if (!Array.isArray(atts) || atts.length === 0) return null;

                                                return (
                                                    <>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                                            Attachments ({atts.length})
                                                        </label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                            {atts.map((att, idx) => {
                                                                const url = typeof att === 'string' ? att : att.file_url;
                                                                if (!url) return null;
                                                                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

                                                                return (
                                                                    <a
                                                                        key={att.id || idx}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-gray-50 flex items-center justify-center"
                                                                    >
                                                                        {isImage ? (
                                                                            <img
                                                                                src={url}
                                                                                alt="attachment"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                                                                <span className="text-3xl mb-1">📄</span>
                                                                                <span className="text-[10px] text-gray-500 truncate w-full px-1">
                                                                                    {att.file_type ? att.file_type.split('/')[1].toUpperCase() : 'VIEW FILE'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <span className="text-white text-xs font-medium">View</span>
                                                                        </div>
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <div className="px-6 pb-6">
                                    <button onClick={() => setDetailLeave(null)} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* APPROVE MODAL */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                <AnimatePresence>
                    {approveLeave && (
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setApproveLeave(null)}
                        >
                            <ModalScrollLock />
                            <motion.div
                                variants={modalVariants}
                                initial="hidden" animate="visible" exit="exit"
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FaCheck className="text-green-600 text-2xl" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Approve Leave Request</h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {approveLeave.employee_name} · {approveLeave.leave_name}
                                        </p>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={approveRemarks}
                                        onChange={(e) => setApproveRemarks(e.target.value)}
                                        placeholder="Add approval remarks (optional)..."
                                        className={`${INPUT} resize-none`}
                                    />
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setApproveLeave(null)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium">
                                            Cancel
                                        </button>
                                        <button onClick={submitApprove} disabled={submitting || approveAccess.disabled}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                            {submitting && <FaSpinner className="animate-spin" />} Approve
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* REJECT MODAL */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                <AnimatePresence>
                    {rejectLeave && (
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setRejectLeave(null)}
                        >
                            <ModalScrollLock />
                            <motion.div
                                variants={modalVariants}
                                initial="hidden" animate="visible" exit="exit"
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6">
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FaTrash className="text-red-600 text-2xl" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Reject Leave Request</h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {rejectLeave.employee_name} · {rejectLeave.leave_name}
                                        </p>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={rejectRemarks}
                                        onChange={(e) => setRejectRemarks(e.target.value)}
                                        placeholder="Reason for rejection (required)..."
                                        className={`${INPUT} resize-none`}
                                    />
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setRejectLeave(null)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium">
                                            Cancel
                                        </button>
                                        <button onClick={submitReject} disabled={submitting || rejectAccess.disabled}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                            {submitting && <FaSpinner className="animate-spin" />} Reject
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* EDIT MODAL - With Add/Delete Attachments */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                <AnimatePresence>
                    {editLeave && (
                        <motion.div
                            variants={backdropVariants}
                            initial="hidden" animate="visible" exit="exit"
                            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setEditLeave(null)}
                        >
                            <ModalScrollLock />
                            <motion.div
                                variants={modalVariants}
                                initial="hidden" animate="visible" exit="exit"
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <FaEdit /> Edit Leave Request
                                    </h2>
                                    <button onClick={() => setEditLeave(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                        <FaTimes size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Employee Info */}
                                    <div className="flex items-center gap-3 pb-3 border-b">
                                        <Avatar name={editLeave.employee_name} />
                                        <div>
                                            <p className="font-semibold text-gray-800">{editLeave.employee_name}</p>
                                            <p className="text-xs text-gray-500">{editLeave.employee_code}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{editLeave.leave_name}</p>
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date *</label>
                                        <DatePickerField
                                            value={editForm.start_date || ''}
                                            onChange={(value) => setEditForm(f => ({ ...f, start_date: value }))}
                                            placeholder="Select start date"
                                            buttonClassName={INPUT}
                                            popoverClassName="mt-2"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">End Date *</label>
                                        <DatePickerField
                                            value={editForm.end_date || ''}
                                            onChange={(value) => setEditForm(f => ({ ...f, end_date: value }))}
                                            placeholder="Select end date"
                                            buttonClassName={INPUT}
                                            popoverClassName="mt-2"
                                        />
                                    </div>

                                    {/* Half Day Toggle */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Half Day</label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditForm(f => ({ ...f, is_half_day: 0 }))}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${editForm.is_half_day === 0
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
                                                    }`}
                                            >
                                                Full Day
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditForm(f => ({ ...f, is_half_day: 1 }))}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${editForm.is_half_day === 1
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
                                                    }`}
                                            >
                                                Half Day
                                            </button>
                                        </div>
                                    </div>

                                    {/* Half Day Type */}
                                    {editForm.is_half_day === 1 && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Half Day Type</label>
                                            <select
                                                value={editForm.half_day_type}
                                                onChange={(e) => setEditForm(f => ({ ...f, half_day_type: e.target.value }))}
                                                className={INPUT}
                                            >
                                                <option value="first_half">First Half</option>
                                                <option value="second_half">Second Half</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Reason */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason</label>
                                        <textarea
                                            rows={3}
                                            value={editForm.reason || ''}
                                            onChange={(e) => setEditForm(f => ({ ...f, reason: e.target.value }))}
                                            placeholder="Reason for leave..."
                                            className={`${INPUT} resize-none`}
                                        />
                                    </div>

                                    {/* Existing Attachments - Can Delete */}
                                    {editLeave.attachments && editLeave.attachments.length > 0 && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Current Attachments</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {editLeave.attachments.map((att, idx) => {
                                                    const isDeleted = deletedAttachments.includes(att.id);
                                                    const url = att.file_url;
                                                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                                                    return (
                                                        <div
                                                            key={att.id || idx}
                                                            onClick={() => {
                                                                if (isDeleted) {
                                                                    setDeletedAttachments(prev => prev.filter(id => id !== att.id));
                                                                } else {
                                                                    setDeletedAttachments(prev => [...prev, att.id]);
                                                                }
                                                            }}
                                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex items-center justify-center bg-gray-50 ${isDeleted ? 'border-red-500 opacity-50' : 'border-gray-200 hover:border-red-300'
                                                                }`}
                                                        >
                                                            {isImage ? (
                                                                <img
                                                                    src={url}
                                                                    alt="attachment"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                                                    <span className="text-2xl mb-1">📄</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                                        {att.file_type ? att.file_type.split('/')[1] : 'FILE'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isDeleted && (
                                                                <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-white text-xs font-bold">
                                                                    Remove
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {deletedAttachments.length > 0 && (
                                                <p className="text-xs text-red-500 mt-2 font-medium">
                                                    ⚠ {deletedAttachments.length} attachment(s) will be deleted
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Add New Attachments */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-2 block">Add New Attachments</label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl transition-all bg-gray-50 ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-blue-400 hover:bg-gray-100'}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {isUploading ? <FaSpinner className="text-2xl text-blue-500 animate-spin mb-2" /> : <FaCloudUploadAlt className="text-2xl text-gray-400 mb-2" />}
                                                <p className="text-xs text-gray-500">{isUploading ? 'Uploading files...' : 'Click to upload or drag and drop'}</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF (Max 5MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf"
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* New Attachments Preview */}
                                    {newAttachments.length > 0 && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-2 block">New Attachments ({newAttachments.length})</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {newAttachments.map((file, idx) => {
                                                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.url);
                                                    return (
                                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
                                                            {isImage ? (
                                                                <img
                                                                    src={file.url}
                                                                    alt={file.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                                                    <span className="text-2xl mb-1">📄</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold truncate w-full px-1">
                                                                        {file.name.split('.').pop().toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => removeNewAttachment(idx)}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 shadow-md transition-all z-10"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 pb-6 flex gap-3">
                                    <button
                                        onClick={() => setEditLeave(null)}
                                        className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitEdit}
                                        disabled={submitting || updateAccess.disabled}
                                        title={updateAccess.disabled ? updateMessage : ''}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting && <FaSpinner className="animate-spin" />}
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LeaveManagement;
