import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    FaEye, FaEdit, FaCheck, FaTrash, FaSpinner, FaTimes, FaPlus,
    FaCloudUploadAlt, FaCog, FaSearch, FaFilter, FaCalendarAlt,
    FaClock, FaUser, FaClipboardList, FaChartBar, FaPaperclip
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall, { uploadFile } from '../utils/api';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import SelectField from '../components/SelectField';
import { DateRangePickerField } from '../components/DatePicker';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { EmployeeSelect, ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';
import ProfileAvatar from '../components/common/ProfileAvatar';

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

const formatDays = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

const toDateInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_ATTACHMENT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const getFileExtension = (fileName = '') => {
    const normalizedName = String(fileName).toLowerCase();
    const lastDotIndex = normalizedName.lastIndexOf('.');
    return lastDotIndex >= 0 ? normalizedName.slice(lastDotIndex) : '';
};

const isAllowedAttachment = (file) => {
    const fileType = String(file?.type || '').toLowerCase();
    const fileExtension = getFileExtension(file?.name);
    return ALLOWED_ATTACHMENT_TYPES.includes(fileType) || ALLOWED_ATTACHMENT_EXTENSIONS.includes(fileExtension);
};

const isImageAttachment = (file) => {
    const url = file?.url || '';
    const fileType = String(file?.type || '').toLowerCase();
    const fileExtension = getFileExtension(file?.name || url);
    return fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension) || /\.(jpg|jpeg|png|webp)$/i.test(url);
};

const getEmptyCreateForm = () => ({
    employee_id: '',
    leave_config_id: '',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_type: 'first_half',
    remarks: '',
    attachments: [],
});

const STATUS = {
    approved: {
        label: 'Approved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        border: 'border-emerald-100'
    },
    rejected: {
        label: 'Rejected',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        dot: 'bg-rose-500',
        border: 'border-rose-100'
    },
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-100'
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        border: 'border-slate-100'
    },
};

const STAT_STYLES = {
    blue: { iconWrap: 'bg-blue-50 text-blue-600' },
    green: { iconWrap: 'bg-emerald-50 text-emerald-600' },
    red: { iconWrap: 'bg-rose-50 text-rose-600' },
    yellow: { iconWrap: 'bg-amber-50 text-amber-600' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase ${s.bg} ${s.text} border ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

const ToggleSwitch = ({ isOn, onToggle, accent = "blue" }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${isOn ? `bg-${accent}-500 shadow-inner` : 'bg-gray-300'}`}
    >
        <motion.div
            className="bg-white w-3 h-3 rounded-full shadow-md"
            initial={false}
            animate={{ x: isOn ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    </div>
);

const LeaveManagement = () => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
    const [bulkApproveRemarks, setBulkApproveRemarks] = useState('');
    const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
    const [bulkRejectRemarks, setBulkRejectRemarks] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState(getEmptyCreateForm);
    const [leaveConfigs, setLeaveConfigs] = useState([]);
    const [leaveConfigsLoading, setLeaveConfigsLoading] = useState(false);
    const [createUploading, setCreateUploading] = useState(false);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);

    // Modal states
    const [detailLeave, setDetailLeave] = useState(null);
    const [approveLeave, setApproveLeave] = useState(null);
    const [rejectLeave, setRejectLeave] = useState(null);

    const [approveRemarks, setApproveRemarks] = useState('');
    const [approveForm, setApproveForm] = useState({
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: 'first_half',
    });
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Permission Access
    const createAccess = checkActionAccess('leaveManagement', 'create');
    const approveAccess = checkActionAccess('leaveManagement', 'approve');
    const rejectAccess = checkActionAccess('leaveManagement', 'reject');
    const reviewMessage = getAccessMessage(approveAccess.disabled ? approveAccess : rejectAccess);
    const createMessage = getAccessMessage(createAccess);

    const fetchInProgress = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    const fetchLeaves = useCallback(async (page = pagination.page, searchVal = debouncedSearch, typeVal = typeFilter, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
            });
            if (searchVal) params.append('search', searchVal);
            if (typeVal) params.append('leave_type', typeVal);

            const response = await apiCall(`/leave/emp-leaves?${params}`, 'GET', null, companyId);
            const result = await response.json();

            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load leaves');

            const rows = result.data || [];
            updatePagination({
                page: Number(result.meta?.page || page),
                limit: Number(result.meta?.limit || pagination.limit),
                total: Number(result.meta?.total || rows.length),
                total_pages: Number(result.meta?.total_pages || 1),
            });
            setLeaves(rows);
        } catch (error) {
            toast.error(error.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.limit, updatePagination, debouncedSearch, typeFilter]);

    useEffect(() => {
        if (!isInitialLoad) fetchLeaves(pagination.page, debouncedSearch, typeFilter, true);
    }, [pagination.page, pagination.limit, debouncedSearch, typeFilter]);

    useEffect(() => {
        fetchLeaves(1, '', '', true);
    }, []);

    const fetchLeaveConfigs = useCallback(async () => {
        setLeaveConfigsLoading(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const response = await apiCall('/leave/company', 'GET', null, companyId);
            const result = await response.json();

            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load leave types');
            setLeaveConfigs(result.data || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load leave types');
            setLeaveConfigs([]);
        } finally {
            setLeaveConfigsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showCreateModal) fetchLeaveConfigs();
    }, [showCreateModal, fetchLeaveConfigs]);

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateForm(getEmptyCreateForm());
    };

    const handleCreateAttachmentChange = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        event.target.value = '';

        const validFiles = selectedFiles.filter(isAllowedAttachment);
        const invalidFiles = selectedFiles.filter((file) => !isAllowedAttachment(file));

        if (invalidFiles.length > 0) {
            toast.error('Only PDF, JPG, JPEG, PNG and WEBP files are allowed');
        }

        if (validFiles.length === 0) return;

        setCreateUploading(true);
        try {
            const uploadedFiles = await Promise.all(validFiles.map((file) =>
                uploadFile(file).then((url) => ({
                    url,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                }))
            ));

            setCreateForm((prev) => ({
                ...prev,
                attachments: [...prev.attachments, ...uploadedFiles],
            }));
            toast.success(`${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded`);
        } catch (error) {
            toast.error(error.message || 'Failed to upload attachment');
        } finally {
            setCreateUploading(false);
        }
    };

    const submitCreateLeave = async () => {
        if (!createForm.employee_id) return toast.warn('Employee is required');
        if (!createForm.leave_config_id) return toast.warn('Leave type is required');
        if (!createForm.start_date || !createForm.end_date) return toast.warn('Leave date range is required');
        if (createForm.end_date < createForm.start_date) return toast.warn('End date cannot be before start date');

        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const payload = {
                employee_id: Number(createForm.employee_id),
                leave_config_id: String(createForm.leave_config_id),
                start_date: createForm.start_date,
                end_date: createForm.is_half_day ? createForm.start_date : createForm.end_date,
                is_half_day: createForm.is_half_day ? 1 : 0,
                attachments: createForm.attachments.map((file) => file.url),
                remarks: createForm.remarks,
            };

            if (createForm.is_half_day) {
                payload.half_day_type = createForm.half_day_type;
            }

            const response = await apiCall('/leave/management/create/', 'POST', payload, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to create leave');

            toast.success('Leave created successfully');
            closeCreateModal();
            fetchLeaves(1, debouncedSearch, typeFilter, true);
        } catch (error) {
            toast.error(error.message || 'Failed to create leave');
        } finally {
            setSubmitting(false);
        }
    };

    const submitApprove = async () => {
        if (!approveLeave) return;

        const originalStartDate = toDateInputValue(approveLeave.start_date);
        const originalEndDate = toDateInputValue(approveLeave.end_date);
        const hasDateChange = approveForm.start_date !== originalStartDate || approveForm.end_date !== originalEndDate;

        if ((hasDateChange || approveForm.is_half_day) && (!approveForm.start_date || !approveForm.end_date)) {
            toast.warn('Start date and end date are required when editing leave dates');
            return;
        }

        if (approveForm.start_date && approveForm.end_date && approveForm.end_date < approveForm.start_date) {
            toast.warn('End date cannot be before start date');
            return;
        }

        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const payload = {
                id: approveLeave.id,
                remarks: approveRemarks,
            };

            if (hasDateChange || approveForm.is_half_day) {
                payload.start_date = approveForm.start_date;
                payload.end_date = approveForm.is_half_day ? approveForm.start_date : approveForm.end_date;
            }

            if (approveForm.is_half_day) {
                payload.is_half_day = true;
                payload.half_day_type = approveForm.half_day_type;
            }

            const response = await apiCall('/leave/management/approve-edit', 'PUT', payload, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to approve');
            toast.success('Leave approved successfully');
            setApproveLeave(null);
            setApproveRemarks('');
            setApproveForm({
                start_date: '',
                end_date: '',
                is_half_day: false,
                half_day_type: 'first_half',
            });
            fetchLeaves();
        } catch (error) {
            toast.error(error.message || 'Failed to approve');
        } finally {
            setSubmitting(false);
        }
    };

    const submitReject = async () => {
        if (!rejectLeave) return;
        if (!rejectRemarks.trim()) return toast.warn('Rejection reason is required');
        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const response = await apiCall('/leave/reject', 'PUT', { id: rejectLeave.id, remarks: rejectRemarks }, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to reject');
            toast.success('Leave rejected');
            setRejectLeave(null);
            fetchLeaves();
        } catch (error) {
            toast.error(error.message || 'Failed to reject');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => {
            if (prev) setSelectedIds([]);
            return !prev;
        });
    };

    const toggleSelectAll = () => {
        const pendingLeaves = visibleLeaves.filter(l => l.status === 'pending');
        if (selectedIds.length === pendingLeaves.length && pendingLeaves.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingLeaves.map(l => l.id));
        }
    };

    const toggleSelectRow = (e, id) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const response = await apiCall('/leave/management/bulk-approve-reject', 'PUT', { ids: selectedIds, action: 'approve', remarks: bulkApproveRemarks }, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to approve');
            toast.success(`${selectedIds.length} leave request${selectedIds.length > 1 ? 's' : ''} approved successfully`);
            setSelectedIds([]);
            setIsSelectionMode(false);
            setShowBulkApproveModal(false);
            setBulkApproveRemarks('');
            fetchLeaves();
        } catch (error) {
            toast.error(error.message || 'Failed to approve requests');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.length === 0) return;
        if (!bulkRejectRemarks.trim()) return toast.warn('Rejection reason is required');
        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const response = await apiCall('/leave/management/bulk-approve-reject', 'PUT', { ids: selectedIds, action: 'reject', remarks: bulkRejectRemarks }, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to reject');
            toast.success(`${selectedIds.length} leave request${selectedIds.length > 1 ? 's' : ''} rejected successfully`);
            setSelectedIds([]);
            setIsSelectionMode(false);
            setShowBulkRejectModal(false);
            setBulkRejectRemarks('');
            fetchLeaves();
        } catch (error) {
            toast.error(error.message || 'Failed to reject requests');
        } finally {
            setSubmitting(false);
        }
    };

    const ActionMenuButtons = (leave) => {
        const isPending = leave.status === 'pending';
        return [
            { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setDetailLeave(leave), className: 'text-slate-700 hover:text-blue-600 hover:bg-blue-50' },
            ...(isPending ? [
                {
                    label: 'Approve / Edit',
                    icon: <FaCheck size={13} />,
                    onClick: () => {
                        setApproveLeave(leave);
                        setApproveRemarks('');
                        setApproveForm({
                            start_date: toDateInputValue(leave.start_date),
                            end_date: toDateInputValue(leave.end_date),
                            is_half_day: Boolean(leave.is_half_day),
                            half_day_type: leave.half_day_type || 'first_half',
                        });
                    },
                    disabled: approveAccess.disabled,
                    title: approveAccess.disabled ? reviewMessage : '',
                    className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                },
                { label: 'Reject', icon: <FaTrash size={13} />, onClick: () => { setRejectLeave(leave); setRejectRemarks(''); }, disabled: rejectAccess.disabled, title: rejectAccess.disabled ? reviewMessage : '', className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' }
            ] : [])
        ];
    };

    const stats = [
        { label: 'Total Requests', val: pagination.total || 0, icon: FaClipboardList, color: 'blue' },
        { label: 'Approved', val: leaves.filter(l => l.status === 'approved').length, icon: FaCheck, color: 'green' },
        { label: 'Rejected', val: leaves.filter(l => l.status === 'rejected').length, icon: FaTrash, color: 'red' },
        { label: 'Pending', val: leaves.filter(l => l.status === 'pending').length, icon: FaClock, color: 'yellow' },
    ];

    const leaveTypeOptions = useMemo(() => {
        const seen = new Map();

        leaves.forEach((leave) => {
            const rawValue = String(leave.leave_code || leave.leave_name || leave.leave_type || '').trim();
            if (!rawValue) return;

            const normalized = rawValue.toLowerCase();
            if (!seen.has(normalized)) {
                seen.set(normalized, {
                    value: normalized,
                    label: leave.leave_name || leave.leave_code || rawValue,
                });
            }
        });

        return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [leaves]);

    const leaveTypeFilterOptions = useMemo(
        () => [
            { value: '', label: 'All Leave Types' },
            ...leaveTypeOptions,
        ],
        [leaveTypeOptions]
    );

    const selectedLeaveTypeFilter = useMemo(
        () => leaveTypeFilterOptions.find((option) => option.value === typeFilter) || leaveTypeFilterOptions[0],
        [leaveTypeFilterOptions, typeFilter]
    );

    const visibleLeaves = useMemo(() => {
        if (!typeFilter) return leaves;

        const normalized = typeFilter.toLowerCase();
        return leaves.filter((leave) => {
            const candidates = [leave.leave_name, leave.leave_code, leave.leave_type]
                .filter(Boolean)
                .map((value) => String(value).toLowerCase());

            return candidates.some((value) => value === normalized || value.includes(normalized));
        });
    }, [leaves, typeFilter]);

    const leaveConfigOptions = useMemo(
        () => leaveConfigs.map((config) => ({
            value: String(config.id),
            label: `${config.name || config.leave_name || 'Leave'}${config.code ? ` (${config.code})` : ''}${config.is_paid === false ? ' (Unpaid)' : ''}`,
        })),
        [leaveConfigs]
    );

    const selectedCreateLeaveConfig = useMemo(
        () => leaveConfigOptions.find((option) => String(option.value) === String(createForm.leave_config_id)) || null,
        [leaveConfigOptions, createForm.leave_config_id]
    );

    const columns = [
        {
            key: 'employee',
            label: (
                <div className="flex items-center gap-4">
                    {isSelectionMode && (
                        <input
                            type="checkbox"
                            checked={selectedIds.length > 0 && selectedIds.length === visibleLeaves.filter(l => l.status === 'pending').length}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    )}
                    <ToggleSwitch
                        isOn={isSelectionMode}
                        onToggle={toggleSelectionMode}
                        accent="blue"
                    />
                    <span>Employee</span>
                </div>
            ),
            render: (leave) => (
                <div className="flex items-center gap-4">
                    {isSelectionMode && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(leave.id)}
                                onChange={(e) => toggleSelectRow(e, leave.id)}
                                disabled={leave.status !== 'pending'}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <ProfileAvatar
                            record={leave}
                            name={leave.employee_name}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden"
                        >
                            {leave.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </ProfileAvatar>
                        <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{leave.employee_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{leave.employee_code}</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'leave_type',
            label: 'Leave Type',
            render: (leave) => (
                <div>
                    <div className="font-semibold text-slate-800 text-xs">{leave.leave_name}</div>
                    <span className="inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                        {leave.leave_code}
                    </span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (leave) => <StatusBadge status={leave.status} />
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (leave) => (
                <div className="text-[11px] leading-tight">
                    <div className="font-medium text-slate-700">{fmt(leave.start_date)}</div>
                    <div className="text-slate-400">to {fmt(leave.end_date)}</div>
                </div>
            )
        },
        {
            key: 'days',
            label: 'Days',
            render: (leave) => <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-xs">{formatDays(leave.total_days)}d</span>
        },
        {
            key: 'applied',
            label: 'Applied',
            render: (leave) => <span className="text-[11px] text-slate-400 font-medium">{fmt(leave.applied_at)}</span>
        }
    ];

    if (isInitialLoad && loading) return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <FaSpinner className="animate-spin text-blue-500 text-4xl" />
                <p className="text-slate-400 font-medium animate-pulse">Loading leave applications...</p>
            </div>
        </div>
    );

    return (
        <ManagementHub
            eyebrow={<><FaChartBar size={11} /> Application History</>}
            title="Leave Management"
            description="Manage and review employee leave requests, approvals and history."
            accent="blue"
            onRefresh={() => fetchLeaves(1, debouncedSearch, typeFilter, true)}
            actions={
                <ManagementButton
                    tone="blue"
                    variant="solid"
                    leftIcon={<FaPlus />}
                    onClick={() => setShowCreateModal(true)}
                    // disabled={createAccess.disabled}
                    title={createAccess.disabled ? createMessage : 'Create leave request'}
                >
                    Create Leave
                </ManagementButton>
            }
        >
            <div className="space-y-6 p-2 lg:p-0">
                {/* Stats */}
                {!loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">{s.val}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[s.color].iconWrap}`}>
                                    <s.icon size={18} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ─── Consolidated Filter & View Bar ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 md:flex-row md:items-center md:justify-between"
                >
                    {/* Left Section: Search & Type Filter */}
                    <div className="flex flex-col gap-4 flex-1 sm:flex-row sm:items-center md:flex-row md:items-center">
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Search by name, code, or leave type..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Section: View Mode */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1.5 sm:w-56">
                            <SelectField
                                options={leaveTypeFilterOptions}
                                value={selectedLeaveTypeFilter}
                                onChange={(option) => setTypeFilter(option?.value || '')}
                                isClearable={false}
                                placeholder="All Leave Types"
                            />
                        </div>
                        {/* Vertical Separator */}
                        <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

                        <ManagementViewSwitcher
                            viewMode={viewMode}
                            onChange={setViewMode}
                            accent="blue"
                        />
                    </div>
                </motion.div>

                {visibleLeaves.length === 0 && !loading ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaClipboardList size={24} /></div>
                        <p className="text-slate-500 font-bold">No leave requests found</p>
                        <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">
                            {search
                                ? `We couldn't find anything matching "${search}"`
                                : typeFilter
                                    ? `No leave requests match the selected leave type.`
                                    : "Employee leave applications will appear here."}
                        </p>
                    </motion.div>
                ) : viewMode === 'table' ? (
                    <ManagementTable
                        rows={visibleLeaves}
                        columns={columns}
                        rowKey={(row) => row.id}
                        onRowClick={(row) => setDetailLeave(row)}
                        getActions={ActionMenuButtons}
                        accent="blue"
                    />
                ) : (
                    <ManagementGrid>
                        {visibleLeaves.map((leave) => (
                            <ManagementCard
                                key={leave.id}
                                eyebrow={
                                    <div className="flex items-center gap-2">
                                        {isSelectionMode && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(leave.id)}
                                                    onChange={(e) => toggleSelectRow(e, leave.id)}
                                                    disabled={leave.status !== 'pending'}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 mr-2"
                                                />
                                            </div>
                                        )}
                                        <StatusBadge status={leave.status} />
                                        <span className="text-[10px] font-bold text-slate-400"># {leave.id}</span>
                                    </div>
                                }
                                title={leave.employee_name}
                                description={<div className="font-mono text-[10px] text-slate-400">{leave.employee_code}</div>}
                                actions={ActionMenuButtons(leave)}
                                onClick={() => setDetailLeave(leave)}
                            >
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</p>
                                            <p className="text-sm font-bold text-slate-700">{leave.leave_name}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                                            <p className="text-sm font-black text-blue-600">{formatDays(leave.total_days)} Days</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">From</span>
                                                <span className="text-xs font-bold text-slate-600">{fmt(leave.start_date)}</span>
                                            </div>
                                            <div className="h-4 w-[1px] bg-slate-200" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">To</span>
                                                <span className="text-xs font-bold text-slate-600">{fmt(leave.end_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {leave.reason && (
                                        <div className="text-[11px] text-slate-500 italic line-clamp-2">
                                            "{leave.reason}"
                                        </div>
                                    )}
                                </div>
                            </ManagementCard>
                        ))}
                    </ManagementGrid>
                )}

                {pagination.total > 0 && (
                    <div className="mt-8">
                        <Pagination
                            currentPage={pagination.page}
                            totalItems={pagination.total}
                            itemsPerPage={pagination.limit}
                            onPageChange={(p) => goToPage(p)}
                            onLimitChange={changeLimit}
                            showInfo={true}
                        />
                    </div>
                )}

                {/* Modals */}
                {showCreateModal && (
                    <Modal
                        isOpen={showCreateModal}
                        onClose={closeCreateModal}
                        title="Create Leave"
                        subtitle="Create a leave request for an employee."
                        icon={<FaPlus className="h-6 w-6" />}
                        size="3xl"
                        footer={
                            <div className="flex gap-3 w-full justify-end">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={submitting}
                                    className="flex px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitCreateLeave}
                                    disabled={submitting || createUploading}
                                    className="flex px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                    {submitting ? 'Creating...' : 'Create Leave'}
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Employee <span className="text-rose-500">*</span>
                                    </label>
                                    <EmployeeSelect
                                        value={createForm.employee_id}
                                        onChange={(employeeId) => setCreateForm((prev) => ({ ...prev, employee_id: employeeId }))}
                                        placeholder="Select employee..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Leave Type <span className="text-rose-500">*</span>
                                    </label>
                                    <SelectField
                                        options={leaveConfigOptions}
                                        value={selectedCreateLeaveConfig}
                                        onChange={(option) => setCreateForm((prev) => ({ ...prev, leave_config_id: option ? option.value : '' }))}
                                        placeholder={leaveConfigsLoading ? 'Loading leave types...' : 'Choose leave type...'}
                                        isLoading={leaveConfigsLoading}
                                        isClearable
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Date Range <span className="text-rose-500">*</span>
                                    </label>
                                    <DateRangePickerField
                                        value={{ start: createForm.start_date, end: createForm.end_date }}
                                        onChange={(range) => {
                                            const nextStart = range?.start || '';
                                            const nextEnd = createForm.is_half_day ? nextStart : (range?.end || nextStart);
                                            setCreateForm((prev) => ({
                                                ...prev,
                                                start_date: nextStart,
                                                end_date: nextEnd,
                                            }));
                                        }}
                                        placeholder="Select leave date range"
                                        buttonClassName="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-medium"
                                        initialTab="range"
                                        mode="range"
                                        showQuickSelect={false}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Day Type</label>
                                    <div className={`rounded-xl border p-3 transition-all ${createForm.is_half_day ? 'border-blue-200 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'}`}>
                                        <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                                            Half Day
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={createForm.is_half_day}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        is_half_day: checked,
                                                        end_date: checked ? prev.start_date : prev.end_date,
                                                        half_day_type: checked ? (prev.half_day_type || 'first_half') : 'first_half',
                                                    }));
                                                }}
                                            />
                                        </label>
                                        {createForm.is_half_day && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 'first_half', label: 'First Half' },
                                                    { value: 'second_half', label: 'Second Half' },
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setCreateForm((prev) => ({ ...prev, half_day_type: option.value }))}
                                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${createForm.half_day_type === option.value
                                                            ? 'border-blue-500 bg-white text-blue-700 shadow-sm'
                                                            : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700'
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks</label>
                                <textarea
                                    rows={4}
                                    placeholder="Internal remarks..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 resize-none"
                                    value={createForm.remarks}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments</label>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">PDF, JPG, PNG, WEBP</span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={handleCreateAttachmentChange}
                                        disabled={createUploading}
                                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                                    />
                                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition-all group-hover:border-blue-300 group-hover:bg-blue-50/40">
                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm">
                                            {createUploading ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />}
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">Drop files here or browse</p>
                                        <p className="mt-1 text-[11px] font-medium text-slate-400">Uploaded files are attached to the leave request</p>
                                    </div>
                                </div>

                                {createForm.attachments.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                        {createForm.attachments.map((file, index) => (
                                            <div key={`${file.url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                                {isImageAttachment(file) ? (
                                                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-orange-50 text-orange-500">
                                                        <FaPaperclip />
                                                        <span className="max-w-full truncate px-2 text-[9px] font-bold uppercase">{file.name}</span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateForm((prev) => ({
                                                        ...prev,
                                                        attachments: prev.attachments.filter((_, fileIndex) => fileIndex !== index),
                                                    }))}
                                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                >
                                                    <FaTimes size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {detailLeave && (
                    <Modal
                        isOpen={!!detailLeave}
                        onClose={() => setDetailLeave(null)}
                        title="Leave Details"
                        subtitle={`${detailLeave.employee_name} · ${detailLeave.leave_name}`}
                        icon={<FaEye className="h-6 w-6" />}
                        size="3xl"
                        footer={
                            <button
                                type="button"
                                onClick={() => setDetailLeave(null)}
                                className="rounded-xl bg-gray-100 py-2.5  px-5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                            >
                                Close
                            </button>
                        }
                    >
                        <div className="space-y-4">
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
                                <h3 className="text-xl font-black tracking-tight text-slate-800">{detailLeave.employee_name}</h3>
                                <p className="text-blue-600 mt-1 font-semibold text-sm">{detailLeave.leave_name} · {formatDays(detailLeave.total_days)} Days</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Start Date</label>
                                    <div className="text-sm font-medium text-gray-800">{fmt(detailLeave.start_date)}</div>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">End Date</label>
                                    <div className="text-sm font-medium text-gray-800">{fmt(detailLeave.end_date)}</div>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Applied On</label>
                                    <div className="text-sm font-medium text-gray-800">{fmt(detailLeave.applied_at)}</div>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Payment Type</label>
                                    <div className="text-sm font-medium text-gray-800">{detailLeave.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Reason / Description</label>
                                <div className="text-sm italic leading-relaxed text-gray-700">"{detailLeave.reason || 'No reason provided.'}"</div>
                            </div>
                            {detailLeave.approval_remarks && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Approval Remarks</label>
                                    <div className="text-sm text-emerald-800">{detailLeave.approval_remarks}</div>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}

                {approveLeave && (
                    <Modal
                        isOpen={!!approveLeave}
                        onClose={() => {
                            setApproveLeave(null);
                            setApproveRemarks('');
                            setApproveForm({
                                start_date: '',
                                end_date: '',
                                is_half_day: false,
                                half_day_type: 'first_half',
                            });
                        }}
                        title="Approve / Edit Leave"
                        subtitle={approveLeave.employee_name}
                        icon={<FaCheck className="h-6 w-6" />}
                        size="lg"
                        footer={
                            <div className="flex gap-3 w-full justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setApproveLeave(null);
                                        setApproveRemarks('');
                                        setApproveForm({
                                            start_date: '',
                                            end_date: '',
                                            is_half_day: false,
                                            half_day_type: 'first_half',
                                        });
                                    }}
                                    className="flex px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitApprove}
                                    disabled={submitting}
                                    className="flex px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                    {submitting ? 'Approving...' : 'Confirm Approve'}
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm leading-relaxed">Approve this leave request for <span className="font-bold text-gray-800">{approveLeave.employee_name}</span>. You can adjust the date range or convert it to a half-day before approving.</p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Date Range</label>
                                <DateRangePickerField
                                    value={{
                                        start: approveForm.start_date,
                                        end: approveForm.is_half_day ? approveForm.start_date : approveForm.end_date,
                                    }}
                                    onChange={(range) => {
                                        const nextStart = range?.start || '';
                                        const nextEnd = approveForm.is_half_day ? nextStart : (range?.end || nextStart);

                                        setApproveForm((prev) => ({
                                            ...prev,
                                            start_date: nextStart,
                                            end_date: nextEnd,
                                        }));
                                    }}
                                    placeholder="Select leave date range"
                                    mode="both"
                                    initialTab="single"
                                    showQuickSelect={false}
                                    buttonClassName="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={approveForm.is_half_day}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setApproveForm((prev) => ({
                                                ...prev,
                                                is_half_day: checked,
                                                end_date: checked ? prev.start_date : prev.end_date,
                                                half_day_type: prev.half_day_type || 'first_half',
                                            }));
                                        }}
                                    />
                                    Convert to half-day
                                </label>
                                {approveForm.is_half_day && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'first_half', label: 'First Half' },
                                            { value: 'second_half', label: 'Second Half' },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setApproveForm((prev) => ({ ...prev, half_day_type: option.value }))}
                                                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${approveForm.half_day_type === option.value
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Approval Remarks (Optional)</label>
                                <textarea
                                    placeholder="Optional approval remarks..."
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                                    value={approveRemarks}
                                    onChange={(e) => setApproveRemarks(e.target.value)}
                                />
                            </div>
                        </div>
                    </Modal>
                )}

                {rejectLeave && (
                    <Modal
                        isOpen={!!rejectLeave}
                        onClose={() => setRejectLeave(null)}
                        title="Reject Leave"
                        subtitle={rejectLeave.employee_name}
                        icon={<FaTrash className="h-6 w-6" />}
                        size="md"
                        footer={
                            <div className="flex gap-3 justify-end w-full">
                                <button
                                    type="button"
                                    onClick={() => setRejectLeave(null)}
                                    className="flex px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitReject}
                                    disabled={submitting}
                                    className="flex px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                    {submitting ? 'Rejecting...' : 'Reject Request'}
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm leading-relaxed">Please provide a reason for rejecting <span className="font-bold text-gray-800">{rejectLeave.employee_name}</span>'s request.</p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                                <textarea
                                    placeholder="Rejection reason (Required)..."
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-24"
                                    value={rejectRemarks}
                                    onChange={(e) => setRejectRemarks(e.target.value)}
                                />
                            </div>
                        </div>
                    </Modal>
                )}
            </div>

            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 right-8 z-[100] flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20"
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bulk Actions</span>
                            <span className="text-sm font-black text-slate-800">{selectedIds.length} Selected</span>
                        </div>
                        <div className="h-10 w-px bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setSelectedIds([]); setIsSelectionMode(false); }}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Close
                            </button>
                            <ManagementButton
                                tone="green"
                                variant="solid"
                                leftIcon={<FaCheck />}
                                onClick={() => { setBulkApproveRemarks(''); setShowBulkApproveModal(true); }}
                                disabled={approveAccess.disabled}
                                className={`shadow-lg shadow-green-200`}
                                title={approveAccess.disabled ? reviewMessage : ""}
                            >
                                Approve All
                            </ManagementButton>
                            <ManagementButton
                                tone="red"
                                variant="solid"
                                leftIcon={<FaTimes />}
                                onClick={() => { setBulkRejectRemarks(''); setShowBulkRejectModal(true); }}
                                disabled={rejectAccess.disabled}
                                className={`shadow-lg shadow-red-200`}
                                title={rejectAccess.disabled ? reviewMessage : ""}
                            >
                                Reject All
                            </ManagementButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showBulkApproveModal && (
                <Modal
                    isOpen={showBulkApproveModal}
                    onClose={() => { setShowBulkApproveModal(false); setBulkApproveRemarks(''); }}
                    title="Bulk Approve Leaves"
                    subtitle={`${selectedIds.length} leave request${selectedIds.length > 1 ? 's' : ''} selected`}
                    icon={<FaCheck className="h-6 w-6" />}
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowBulkApproveModal(false); setBulkApproveRemarks(''); }}
                                className="flex px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkApprove}
                                disabled={submitting}
                                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                {submitting ? 'Approving...' : `Confirm Approve ${selectedIds.length}`}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            You are about to approve <span className="font-bold text-gray-800">{selectedIds.length} leave request{selectedIds.length > 1 ? 's' : ''}</span>. This action cannot be undone.
                        </p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Approval Remarks <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                placeholder="Add optional remarks for all selected leave requests..."
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                                value={bulkApproveRemarks}
                                onChange={(e) => setBulkApproveRemarks(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {showBulkRejectModal && (
                <Modal
                    isOpen={showBulkRejectModal}
                    onClose={() => { setShowBulkRejectModal(false); setBulkRejectRemarks(''); }}
                    title="Bulk Reject Leaves"
                    subtitle={`${selectedIds.length} leave request${selectedIds.length > 1 ? 's' : ''} selected`}
                    icon={<FaTimes className="h-6 w-6" />}
                    size="md"
                    footer={
                        <div className="flex gap-3 w-full justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowBulkRejectModal(false); setBulkRejectRemarks(''); }}
                                className="flex px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkReject}
                                disabled={submitting}
                                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                {submitting ? 'Rejecting...' : `Confirm Reject ${selectedIds.length}`}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            You are about to reject <span className="font-bold text-gray-800">{selectedIds.length} leave request{selectedIds.length > 1 ? 's' : ''}</span>. This action cannot be undone.
                        </p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Provide a reason for rejecting all selected leave requests..."
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-24"
                                value={bulkRejectRemarks}
                                onChange={(e) => setBulkRejectRemarks(e.target.value)}
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </ManagementHub>
    );
};

export default LeaveManagement;
