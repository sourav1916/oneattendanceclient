import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    FaEye, FaEdit, FaCheck, FaTrash, FaSpinner, FaTimes, FaPlus,
    FaCloudUploadAlt, FaCog, FaSearch, FaFilter, FaCalendarAlt,
    FaClock, FaUser, FaClipboardList, FaChartBar
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall, { uploadFile } from '../utils/api';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';

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

const LeaveManagement = () => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);

    // Modal states
    const [detailLeave, setDetailLeave] = useState(null);
    const [approveLeave, setApproveLeave] = useState(null);
    const [rejectLeave, setRejectLeave] = useState(null);

    const [approveRemarks, setApproveRemarks] = useState('');
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Permission Access
    const approveAccess = checkActionAccess('leaveManagement', 'approve');
    const rejectAccess = checkActionAccess('leaveManagement', 'reject');
    const reviewMessage = getAccessMessage(approveAccess.disabled ? approveAccess : rejectAccess);

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

    const submitApprove = async () => {
        if (!approveLeave) return;
        setSubmitting(true);
        try {
            const companyId = JSON.parse(localStorage.getItem('company'))?.id;
            const response = await apiCall('/leave/approve', 'PUT', { id: approveLeave.id, remarks: approveRemarks }, companyId);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Failed to approve');
            toast.success('Leave approved successfully');
            setApproveLeave(null);
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

    const ActionMenuButtons = (leave) => {
        const isPending = leave.status === 'pending';
        return [
            { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setDetailLeave(leave), className: 'text-slate-700 hover:text-blue-600 hover:bg-blue-50' },
            ...(isPending ? [
                { label: 'Approve', icon: <FaCheck size={13} />, onClick: () => { setApproveLeave(leave); setApproveRemarks(''); }, disabled: approveAccess.disabled, title: approveAccess.disabled ? reviewMessage : '', className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' },
                { label: 'Reject', icon: <FaTrash size={13} />, onClick: () => { setRejectLeave(leave); setRejectRemarks(''); }, disabled: rejectAccess.disabled, title: rejectAccess.disabled ? reviewMessage : '', className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' }
            ] : [])
        ];
    };

    const columns = [
        {
            key: 'employee',
            label: 'Employee',
            render: (leave) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {leave.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{leave.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{leave.employee_code}</div>
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
        >
            <div className="space-y-6">
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
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="">All Leave Types</option>
                                {leaveTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
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
                                eyebrow={<div className="flex items-center gap-2"><StatusBadge status={leave.status} /> <span className="text-[10px] font-bold text-slate-400"># {leave.id}</span></div>}
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
                <AnimatePresence>
                    {detailLeave && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setDetailLeave(null)}>
                            <ModalScrollLock />
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5 } }} exit={{ scale: 0.9, opacity: 0, y: 20, transition: { duration: 0.3 } }} className="relative bg-white backdrop-blur-xl w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 sm:px-8 py-5 sticky top-0 z-[10]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-200">
                                            <FaEye className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Leave Details</h2>
                                            <div className="flex items-center gap-2 mt-0.5"><span className="text-sm text-slate-500">{detailLeave.employee_name}</span> <StatusBadge status={detailLeave.status} /></div>
                                        </div>
                                    </div>
                                    <button onClick={() => setDetailLeave(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 px-6 sm:px-8 py-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <h3 className="text-2xl font-black text-slate-800">{detailLeave.employee_name}</h3>
                                        <p className="text-blue-600 mt-1 font-semibold text-sm">{detailLeave.leave_name} · {formatDays(detailLeave.total_days)} Days</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Start Date</label>
                                            <div className="text-gray-800 font-medium">{fmt(detailLeave.start_date)}</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">End Date</label>
                                            <div className="text-gray-800 font-medium">{fmt(detailLeave.end_date)}</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Applied On</label>
                                            <div className="text-gray-800 font-medium">{fmt(detailLeave.applied_at)}</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Payment Type</label>
                                            <div className="text-gray-800 font-medium">{detailLeave.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Reason / Description</label>
                                        <div className="text-gray-700 text-sm italic leading-relaxed">"{detailLeave.reason || 'No reason provided.'}"</div>
                                    </div>
                                    {detailLeave.approval_remarks && (
                                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                                            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-2">Approval Remarks</label>
                                            <div className="text-emerald-800 text-sm">{detailLeave.approval_remarks}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 px-6 sm:px-8 py-5 border-t border-gray-100">
                                    <button type="button" onClick={() => setDetailLeave(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">Close</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {approveLeave && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setApproveLeave(null)}>
                            <ModalScrollLock />
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5 } }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white backdrop-blur-xl w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 sticky top-0 z-[10]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-green-200">
                                            <FaCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Approve Leave</h2>
                                            <p className="text-sm text-slate-500">{approveLeave.employee_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setApproveLeave(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 px-6 py-6">
                                    <p className="text-gray-600 text-sm leading-relaxed">Are you sure you want to approve this leave request for <span className="font-bold text-gray-800">{approveLeave.employee_name}</span>?</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Approval Remarks (Optional)</label>
                                        <textarea placeholder="Optional approval remarks..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-24" value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
                                    <button type="button" onClick={() => setApproveLeave(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                    <button type="button" onClick={submitApprove} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                        {submitting ? 'Approving...' : 'Confirm Approve'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {rejectLeave && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setRejectLeave(null)}>
                            <ModalScrollLock />
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', duration: 0.5 } }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white backdrop-blur-xl w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 sticky top-0 z-[10]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-200">
                                            <FaTrash className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Reject Leave</h2>
                                            <p className="text-sm text-slate-500">{rejectLeave.employee_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setRejectLeave(null)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                                        <FaTimes className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 px-6 py-6">
                                    <p className="text-gray-600 text-sm leading-relaxed">Please provide a reason for rejecting <span className="font-bold text-gray-800">{rejectLeave.employee_name}</span>'s request.</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                                        <textarea placeholder="Rejection reason (Required)..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-24" value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
                                    <button type="button" onClick={() => setRejectLeave(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                    <button type="button" onClick={submitReject} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {submitting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                        {submitting ? 'Rejecting...' : 'Reject Request'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ManagementHub>
    );
};

export default LeaveManagement;
