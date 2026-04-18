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
    const [statusFilter, setStatusFilter] = useState('');
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

    const fetchLeaves = useCallback(async (page = pagination.page, searchVal = debouncedSearch, statusVal = statusFilter, resetLoading = true) => {
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
            if (statusVal) params.append('status', statusVal);

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
    }, [pagination.limit, updatePagination, debouncedSearch, statusFilter]);

    useEffect(() => {
        if (!isInitialLoad) fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
    }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

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
            render: (leave) => <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-xs">{parseFloat(leave.total_days)}d</span>
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
                {!loading && leaves.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((s) => (
                            <div key={s.label} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">{s.val}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[s.color].iconWrap}`}>
                                    <s.icon size={18} />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by employee name, code, or leave type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none shadow-sm transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[400px]">
                            {['', 'approved', 'rejected', 'pending', 'cancelled'].map((s) => (
                                <button
                                    key={s || 'all'}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                                        statusFilter === s
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                                    }`}
                                >
                                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Requests'}
                                </button>
                            ))}
                        </div>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                </motion.div>

                {/* Data View */}
                {pagination.total === 0 && !loading ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaClipboardList size={24} /></div>
                        <p className="text-slate-500 font-bold">No leave requests found</p>
                        <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">{search ? `We couldn't find anything matching "${search}"` : "Employee leave applications will appear here."}</p>
                    </motion.div>
                ) : viewMode === 'table' ? (
                    <ManagementTable
                        rows={leaves}
                        columns={columns}
                        rowKey={(row) => row.id}
                        onRowClick={(row) => setDetailLeave(row)}
                        getActions={ActionMenuButtons}
                        accent="blue"
                    />
                ) : (
                    <ManagementGrid>
                        {leaves.map((leave) => (
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
                                            <p className="text-sm font-black text-blue-600">{parseFloat(leave.total_days)} Days</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && setDetailLeave(null)}>
                            <ModalScrollLock />
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white shrink-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <StatusBadge status={detailLeave.status} />
                                        <button onClick={() => setDetailLeave(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes size={18} /></button>
                                    </div>
                                    <h2 className="text-3xl font-black">{detailLeave.employee_name}</h2>
                                    <p className="text-blue-100 mt-1 font-medium">{detailLeave.leave_name} · {parseFloat(detailLeave.total_days)} Days</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                                            <p className="font-bold text-slate-700">{fmt(detailLeave.start_date)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</p>
                                            <p className="font-bold text-slate-700">{fmt(detailLeave.end_date)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied On</p>
                                            <p className="font-bold text-slate-700">{fmt(detailLeave.applied_at)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Type</p>
                                            <p className="font-bold text-slate-700">{detailLeave.is_paid ? 'Paid Leave' : 'Unpaid Leave'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Description</p>
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm text-slate-600 italic leading-relaxed">
                                            "{detailLeave.reason || 'No reason provided.'}"
                                        </div>
                                    </div>
                                    {detailLeave.approval_remarks && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approval Remarks</p>
                                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-sm text-emerald-700">
                                                {detailLeave.approval_remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 border-t border-slate-50 flex gap-3 shrink-0">
                                    <ManagementButton tone="slate" variant="ghost" className="flex-1" onClick={() => setDetailLeave(null)}>Close</ManagementButton>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {approveLeave && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && setApproveLeave(null)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">✓</div>
                                <h3 className="text-xl font-bold text-slate-800">Approve Leave?</h3>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">Are you sure you want to approve this leave request for <span className="font-bold text-slate-700">{approveLeave.employee_name}</span>?</p>
                                <textarea placeholder="Optional approval remarks..." className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none h-24" value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)} />
                                <div className="flex gap-3 mt-8">
                                    <ManagementButton tone="slate" variant="ghost" className="flex-1" onClick={() => setApproveLeave(null)}>Cancel</ManagementButton>
                                    <ManagementButton tone="green" variant="solid" className="flex-1" onClick={submitApprove} loading={submitting}>Confirm</ManagementButton>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {rejectLeave && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && setRejectLeave(null)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">×</div>
                                <h3 className="text-xl font-bold text-slate-800">Reject Leave?</h3>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">Please provide a reason for rejecting <span className="font-bold text-slate-700">{rejectLeave.employee_name}</span>'s request.</p>
                                <textarea placeholder="Rejection reason (Required)..." className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none h-24" value={rejectRemarks} onChange={(e) => setRejectRemarks(e.target.value)} />
                                <div className="flex gap-3 mt-8">
                                    <ManagementButton tone="slate" variant="ghost" className="flex-1" onClick={() => setRejectLeave(null)}>Cancel</ManagementButton>
                                    <ManagementButton tone="red" variant="solid" className="flex-1" onClick={submitReject} loading={submitting}>Reject Request</ManagementButton>
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
