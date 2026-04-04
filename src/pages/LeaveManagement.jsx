import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

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
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
  },
};

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const INPUT =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition placeholder:text-slate-400';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
      {initials(name)}
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 bg-white whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-sm border-b border-slate-50 align-middle ${className}`}>
      {children}
    </td>
  );
}

function SkelRow({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-3 bg-slate-200 rounded animate-pulse"
            style={{ width: `${55 + i * 8}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function Modal({ open, onClose, title, footer, children, maxW = 'max-w-lg' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <ModalScrollLock />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${maxW}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
              <h3 className="pr-3 text-sm font-bold text-slate-800 sm:text-base">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-300 transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar sm:px-6">
              <div className="flex flex-col gap-4">{children}</div>
            </div>
            {footer && (
              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {footer}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
  );
}

// ─── Action Menu (Three-dot vertical) ─────────────────────────────────────────
function ActionMenu({ leave, activeId, menuId, onToggle, onView, onEdit, onApprove, onReject }) {
  const canAct = (l) => l.status === 'pending';
  const canEdit = (l) => ['pending', 'approved'].includes(l.status);
  const isOpen = activeId === menuId;

  return (
    <div className="relative" data-leave-action-menu>
      <button
        onClick={(e) => onToggle(e, menuId)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:text-violet-600 active:scale-95"
        title="More actions"
      >
        {/* Vertical three dots */}
        <span className="flex flex-col items-center justify-center gap-[3px]">
          <span className="w-[3px] h-[3px] rounded-full bg-current" />
          <span className="w-[3px] h-[3px] rounded-full bg-current" />
          <span className="w-[3px] h-[3px] rounded-full bg-current" />
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 top-full z-30 mt-1.5 w-40 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onView(leave)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-violet-600"
            >
              <span>👁</span> View Details
            </button>
            {canEdit(leave) && (
              <button
                onClick={() => onEdit(leave)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <span>✏️</span> Edit Leave
              </button>
            )}
            {canAct(leave) && (
              <>
                <button
                  onClick={() => onApprove(leave)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
                >
                  <span>✓</span> Approve
                </button>
                <button
                  onClick={() => onReject(leave)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <span>✕</span> Reject
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ultra Compact Mobile Card (280px+) ─────────────────────────────────────────
function MobileLeaveCard({
  leave,
  activeActionMenu,
  onToggleMenu,
  onView,
  onEdit,
  onApprove,
  onReject,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-visible rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
    >
      {/* Header row: Avatar + Name + Menu */}
      <div className="flex items-start gap-2">
        <Avatar name={leave.employee_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold leading-tight text-slate-800 break-words pr-1">
              {leave.employee_name}
            </h3>
            <div className="flex-shrink-0">
              <ActionMenu
                leave={leave}
                activeId={activeActionMenu}
                menuId={`mobile-${leave.id}`}
                onToggle={onToggleMenu}
                onView={onView}
                onEdit={onEdit}
                onApprove={onApprove}
                onReject={onReject}
              />
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-400 break-words mt-0.5">
            {leave.employee_code}
            {leave.designation ? ` · ${leave.designation}` : ''}
          </p>
        </div>
      </div>

      {/* Status + Quick Info Row */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1">
        <StatusBadge status={leave.status} />
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
          📅 {parseFloat(leave.total_days)}d
        </span>
      </div>

      {/* Leave Type Card */}
      <div className="mt-2.5 rounded-xl bg-slate-50 p-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex flex-shrink-0 items-center justify-center rounded-lg bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm border border-slate-100">
            {leave.leave_code}
          </span>
          <span className="text-xs font-semibold text-slate-700 break-words">
            {leave.leave_name}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] text-slate-400">
          <span>{leave.is_paid ? '💰 Paid' : '🚫 Unpaid'}</span>
          {leave.approved_by_name && (
            <span className="truncate">✓ {leave.approved_by_name}</span>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="mt-2.5 rounded-xl bg-violet-50 px-2 py-1.5 text-[10px] font-semibold text-violet-700 break-words">
        📅 {fmt(leave.start_date)} → {fmt(leave.end_date)}
      </div>

      {/* Remarks (if any) */}
      {leave.approval_remarks && (
        <div className="mt-2 rounded-xl bg-slate-50 px-2 py-1.5 text-[9px] italic text-slate-500 break-words">
          “{leave.approval_remarks}”
        </div>
      )}

      {/* Footer with applied date */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <span className="text-[9px] font-medium text-slate-400">
          Applied: {fmt(leave.applied_at?.split(' ')[0])}
        </span>
        <button
          onClick={() => onView(leave)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
        >
          Quick View
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { pagination, updatePagination, goToPage } = usePagination(1, 10);
  const [resultMeta, setResultMeta] = useState({ total: 0, total_pages: 1 });
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Modal states
  const [detailLeave, setDetailLeave] = useState(null);
  const [approveLeave, setApproveLeave] = useState(null);
  const [rejectLeave, setRejectLeave] = useState(null);
  const [editLeave, setEditLeave] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Form state
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [editForm, setEditForm] = useState({});
  const [deletedAttachments, setDeletedAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const searchTimer = useRef(null);
  // Track the last fetch params to avoid duplicate calls
  const lastFetchRef = useRef({ search: null, status: null, page: null });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      clearTimeout(searchTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLeaves = useCallback(
    async (s = '', st = '', p = 1) => {
      // Deduplicate: skip if same params as last fetch
      const key = `${s}|${st}|${p}`;
      if (lastFetchRef.current.key === key && !loading) return;
      lastFetchRef.current.key = key;

      setLoading(true);
      try {
        const companyId = getCompanyId();
        const params = new URLSearchParams({
          page: p.toString(),
          limit: pagination.limit.toString(),
        });
        if (s) params.append('search', s);
        if (st) params.append('status', st);
        const response = await apiCall(
          `/leave/emp-leaves?${params}`,
          'GET',
          null,
          companyId
        );
        const result = await response.json();

        if (!isMounted.current) return;
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load leaves');
        }

        const rows = result.data || [];
        const total = Number(
          result.meta?.total ?? result.total ?? rows.length ?? 0
        );
        const totalPages = Number(
          result.meta?.total_pages ??
            result.last_page ??
            Math.max(1, Math.ceil(total / pagination.limit))
        );

        setLeaves(rows);
        setResultMeta({ total, total_pages: totalPages });
        updatePagination({
          page: p,
          limit: pagination.limit,
          total_pages: totalPages,
          is_last_page: p >= totalPages,
        });
      } catch (error) {
        if (isMounted.current) toast.error(error.message || 'Failed to load leaves');
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [pagination.limit, updatePagination, loading]
  );

  const prevFetchTrigger = useRef({ page: null, status: null });
  useEffect(() => {
    const prev = prevFetchTrigger.current;
    if (prev.page === pagination.page && prev.status === statusFilter) return;
    prevFetchTrigger.current = { page: pagination.page, status: statusFilter };
    fetchLeaves(search, statusFilter, pagination.page);
  }, [pagination.page, statusFilter, search, fetchLeaves]);

  // ── Global click/escape to close action menu ───────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('[data-leave-action-menu]')) setActiveActionMenu(null);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setActiveActionMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // ── Search debounce ────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      lastFetchRef.current.key = null; // force fetch
      if (pagination.page !== 1) {
        prevFetchTrigger.current = { page: null, status: statusFilter };
        goToPage(1);
      } else {
        fetchLeaves(val, statusFilter, 1);
      }
    }, 420);
  };

  const handleStatusFilter = (val) => {
    if (val === statusFilter) return;
    setStatusFilter(val);
    lastFetchRef.current.key = null;
    if (pagination.page !== 1) {
      prevFetchTrigger.current = { page: null, status: val };
      goToPage(1);
    }
  };

  const toggleActionMenu = useCallback((e, id) => {
    e.stopPropagation();
    setActiveActionMenu((cur) => (cur === id ? null : id));
  }, []);

  // ── Action helpers ─────────────────────────────────────────────────────────
  const handleView = useCallback((leave) => {
    setActiveActionMenu(null);
    setDetailLeave(leave);
  }, []);

  const handleEdit = useCallback((leave) => {
    setActiveActionMenu(null);
    setEditLeave(leave);
    setEditForm({
      leave_config_id: leave.leave_config_id,
      start_date: leave.start_date,
      end_date: leave.end_date,
      is_half_day: leave.is_half_day ? 1 : 0,
      half_day_type: leave.half_day_type || 'first_half',
      reason: leave.reason || '',
    });
    setDeletedAttachments([]);
  }, []);

  const handleApproveOpen = useCallback((leave) => {
    setActiveActionMenu(null);
    setApproveLeave(leave);
    setApproveRemarks('');
  }, []);

  const handleRejectOpen = useCallback((leave) => {
    setActiveActionMenu(null);
    setRejectLeave(leave);
    setRejectRemarks('');
  }, []);

  // ── Approve ────────────────────────────────────────────────────────────────
  const submitApprove = async () => {
    if (!approveLeave) return;
    setSubmitting(true);
    try {
      const response = await apiCall(
        '/leave/approve',
        'POST',
        { id: approveLeave.id, remarks: approveRemarks },
        getCompanyId()
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || 'Failed to approve');
      toast.success('Leave approved successfully');
      setApproveLeave(null);
      setApproveRemarks('');
      lastFetchRef.current.key = null;
      fetchLeaves(search, statusFilter, pagination.page);
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
      const response = await apiCall(
        '/leave/reject',
        'POST',
        { id: rejectLeave.id, remarks: rejectRemarks },
        getCompanyId()
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || 'Failed to reject');
      toast.success('Leave rejected');
      setRejectLeave(null);
      setRejectRemarks('');
      lastFetchRef.current.key = null;
      fetchLeaves(search, statusFilter, pagination.page);
    } catch (error) {
      toast.error(error.message || 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const submitEdit = async () => {
    if (!editLeave) return;
    if (!editForm.start_date || !editForm.end_date) {
      toast.warn('Dates are required');
      return;
    }
    setSubmitting(true);
    try {
      const body = { ...editForm, deleted_attachments: deletedAttachments };
      const response = await apiCall(
        `/leave/update/${editLeave.id}`,
        'PUT',
        body,
        getCompanyId()
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || 'Failed to update');
      toast.success('Leave updated');
      setEditLeave(null);
      lastFetchRef.current.key = null;
      fetchLeaves(search, statusFilter, pagination.page);
    } catch (error) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = resultMeta.total || leaves.length;
  const stats = [
    { label: 'Total', val: totalItems, icon: '📋', bg: 'bg-white', text: 'text-slate-700' },
    {
      label: 'Approved',
      val: leaves.filter((l) => l.status === 'approved').length,
      icon: '✅',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Rejected',
      val: leaves.filter((l) => l.status === 'rejected').length,
      icon: '❌',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    },
    {
      label: 'Pending',
      val: leaves.filter((l) => l.status === 'pending').length,
      icon: '⏳',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  ];

  const statusOptions = ['', 'approved', 'rejected', 'pending', 'cancelled'];
  const visibleFrom = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const visibleTo = Math.min(pagination.page * pagination.limit, totalItems);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage !== pagination.page) goToPage(newPage);
    },
    [pagination.page, goToPage]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100/80 p-2 sm:p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Page Header ── */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="flex items-start gap-2.5 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-violet-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0">
              🏖️
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">
                HR Operations
              </span>
              <h1 className="mt-1 text-base sm:text-2xl font-extrabold tracking-tight text-slate-800">
                Leave Management
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">HR · Employee Leaves</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-500">
              🗂 {totalItems} records
            </span>
            <button
              onClick={() => {
                lastFetchRef.current.key = null;
                fetchLeaves(search, statusFilter, pagination.page);
              }}
              className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-500 shadow-sm transition hover:border-violet-300 hover:text-violet-600"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards - Responsive Grid ── */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4 sm:mb-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${s.bg} border border-slate-200 rounded-2xl p-2.5 shadow-sm flex items-center gap-2 sm:p-4`}
            >
              <span className="text-base sm:text-xl">{s.icon}</span>
              <div className="min-w-0">
                <div className={`text-lg font-extrabold ${s.text} sm:text-2xl`}>{s.val}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Info ── */}
        <div className="mb-3 grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, code, type…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] sm:text-xs font-medium text-slate-500 shadow-sm flex items-center justify-center whitespace-nowrap">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                Loading…
              </span>
            ) : (
              `${visibleFrom}–${visibleTo} of ${totalItems}`
            )}
          </div>
        </div>

        {/* ── Status Filter Pills - Scrollable on very small screens ── */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {statusOptions.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => handleStatusFilter(s)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap
                ${statusFilter === s
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
                }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>

        {/* ── Main Card ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div>
              <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Requests
              </h2>
              <p className="mt-0.5 text-[9px] sm:text-xs text-slate-500">
                {statusFilter
                  ? `Filtered by ${statusFilter}`
                  : 'All leave requests'}
              </p>
            </div>
            {!loading && leaves.length > 0 && (
              <div className="text-[9px] sm:text-[11px] font-medium text-slate-400">
                {visibleFrom} to {visibleTo} of {totalItems}
              </div>
            )}
          </div>

          {/* ═══════════════════
            DESKTOP TABLE (md+)
          ═══════════════════ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <colgroup>
                <col className="w-[35%] lg:w-[26%]" />
                <col className="w-[30%] lg:w-[22%]" />
                <col className="w-[18%] lg:w-[14%]" />
                <col className="hidden lg:table-column lg:w-[16%]" />
                <col className="hidden lg:table-column lg:w-[8%]" />
                <col className="hidden xl:table-column xl:w-[10%]" />
                <col className="hidden xl:table-column xl:w-[12%]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Leave Type</Th>
                  <Th>Status</Th>
                  <Th className="hidden lg:table-cell">Duration</Th>
                  <Th className="hidden lg:table-cell">Days</Th>
                  <Th className="hidden xl:table-cell">Applied</Th>
                  <Th className="hidden xl:table-cell">Approved By</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkelRow key={i} cols={8} />)
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="text-4xl mb-3 opacity-30">📭</div>
                      <div className="text-slate-600 font-bold text-sm">No leaves found</div>
                      <div className="text-slate-400 text-xs mt-1">
                        Try adjusting your search or filters
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                      <Td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={leave.employee_name} />
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-800 text-sm">
                              {leave.employee_name}
                            </div>
                            <div className="truncate text-[11px] text-slate-400 font-medium">
                              {leave.employee_code}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 flex-shrink-0">
                            {leave.leave_code}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-700 text-sm">
                              {leave.leave_name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {leave.is_paid ? 'Paid' : 'Unpaid'}
                              <span className="lg:hidden">
                                {' · '}
                                {parseFloat(leave.total_days)}d
                              </span>
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <StatusBadge status={leave.status} />
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <div className="text-xs font-semibold text-slate-700">
                          {fmt(leave.start_date)}
                        </div>
                        <div className="text-xs text-slate-400">
                          → {fmt(leave.end_date)}
                        </div>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <span className="bg-violet-50 text-violet-600 text-xs font-bold px-2.5 py-1 rounded-lg inline-block">
                          {parseFloat(leave.total_days)}d
                        </span>
                      </Td>
                      <Td className="hidden xl:table-cell">
                        <span className="text-xs text-slate-600 font-medium">
                          {fmt(leave.applied_at?.split(' ')[0])}
                        </span>
                      </Td>
                      <Td className="hidden xl:table-cell">
                        <div className="text-xs text-slate-600 font-medium truncate">
                          {leave.approved_by_name || '—'}
                        </div>
                        {leave.approval_remarks && (
                          <div
                            className="text-xs text-slate-400 italic truncate max-w-[120px]"
                            title={leave.approval_remarks}
                          >
                            "{leave.approval_remarks}"
                          </div>
                        )}
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end">
                          <ActionMenu
                            leave={leave}
                            activeId={activeActionMenu}
                            menuId={`d-${leave.id}`}
                            onToggle={toggleActionMenu}
                            onView={handleView}
                            onEdit={handleEdit}
                            onApprove={handleApproveOpen}
                            onReject={handleRejectOpen}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ═══════════════════
            MOBILE CARDS (< md)
            Optimized for 280px-400px
          ═══════════════════ */}
          <div className="grid grid-cols-1 gap-3 p-3 md:hidden sm:p-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-slate-200 rounded w-2/3 animate-pulse" />
                      <div className="h-2 bg-slate-100 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-7 bg-violet-50 rounded-xl animate-pulse" />
                </div>
              ))
            ) : leaves.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3 opacity-30">📭</div>
                <div className="text-slate-600 font-bold text-sm">No leaves found</div>
                <div className="text-slate-400 text-[10px] mt-1">Try adjusting your filters</div>
              </div>
            ) : (
              leaves.map((leave) => (
                <MobileLeaveCard
                  key={leave.id}
                  leave={leave}
                  activeActionMenu={activeActionMenu}
                  onToggleMenu={toggleActionMenu}
                  onView={handleView}
                  onEdit={handleEdit}
                  onApprove={handleApproveOpen}
                  onReject={handleRejectOpen}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Pagination ── */}
        {!loading && leaves.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={totalItems}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            variant={isMobileViewport ? 'minimal' : 'default'}
            showInfo={!isMobileViewport}
          />
        )}

        {/* ══════════════════════════
          MODALS (all modals remain unchanged but optimized)
        ══════════════════════════ */}

        {/* Detail Modal */}
        <Modal
          open={!!detailLeave}
          onClose={() => setDetailLeave(null)}
          title="Leave Details"
          maxW="max-w-4xl"
        >
          {detailLeave && (
            <>
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 rounded-xl p-3 sm:p-4">
                <Avatar name={detailLeave.employee_name} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">
                    {detailLeave.employee_name}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                    {detailLeave.employee_code}
                    {detailLeave.designation ? ` · ${detailLeave.designation}` : ''}
                  </div>
                </div>
                <StatusBadge status={detailLeave.status} />
              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Leave Type',
                    val: `${detailLeave.leave_code} · ${detailLeave.leave_name}`,
                  },
                  { label: 'Paid', val: detailLeave.is_paid ? '💰 Yes' : '🚫 No' },
                  { label: 'Start Date', val: fmt(detailLeave.start_date) },
                  { label: 'End Date', val: fmt(detailLeave.end_date) },
                  {
                    label: 'Total Days',
                    val: `${parseFloat(detailLeave.total_days)} day(s)`,
                  },
                  {
                    label: 'Half Day',
                    val: detailLeave.is_half_day
                      ? `Yes (${detailLeave.half_day_type || '—'})`
                      : 'No',
                  },
                  {
                    label: 'Applied At',
                    val: fmt(detailLeave.applied_at?.split(' ')[0]),
                  },
                  { label: 'Approved By', val: detailLeave.approved_by_name || '—' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 break-words">{val}</div>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Reason
                  </div>
                  <div className="text-sm text-slate-700 break-words">{detailLeave.reason || '—'}</div>
                </div>
                {detailLeave.approval_remarks && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Remarks
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm italic text-slate-500 break-words">
                      "{detailLeave.approval_remarks}"
                    </div>
                  </div>
                )}
              </div>

              {detailLeave.attachments?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Attachments ({detailLeave.attachments.length})
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {detailLeave.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group block"
                      >
                        <img
                          src={a.file_url}
                          alt="attachment"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-lg">
                          🔗
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal>

        {/* Approve Modal */}
        <Modal
          open={!!approveLeave}
          onClose={() => setApproveLeave(null)}
          title="✅ Approve Leave"
          maxW="max-w-4xl"
          footer={
            <>
              <button
                onClick={() => setApproveLeave(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:border-slate-300 transition bg-white"
              >
                Cancel
              </button>
              <button
                onClick={submitApprove}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Spinner />} Approve
              </button>
            </>
          }
        >
          {approveLeave && (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <Avatar name={approveLeave.employee_name} />
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm">
                    {approveLeave.employee_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {approveLeave.leave_name} · {fmt(approveLeave.start_date)} →{' '}
                    {fmt(approveLeave.end_date)}
                  </div>
                </div>
              </div>
              <Field label="Remarks (optional)">
                <textarea
                  rows={3}
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  placeholder="Add approval remarks…"
                  className={`${INPUT} resize-none`}
                />
              </Field>
            </>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          open={!!rejectLeave}
          onClose={() => setRejectLeave(null)}
          title="❌ Reject Leave"
          maxW="max-w-4xl"
          footer={
            <>
              <button
                onClick={() => setRejectLeave(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:border-slate-300 transition bg-white"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Spinner />} Reject
              </button>
            </>
          }
        >
          {rejectLeave && (
            <>
              <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4">
                <Avatar name={rejectLeave.employee_name} />
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm">
                    {rejectLeave.employee_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {rejectLeave.leave_name} · {fmt(rejectLeave.start_date)} →{' '}
                    {fmt(rejectLeave.end_date)}
                  </div>
                </div>
              </div>
              <Field label="Reason for Rejection *">
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Explain why this leave is being rejected…"
                  className={`${INPUT} resize-none`}
                />
              </Field>
            </>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          open={!!editLeave}
          onClose={() => setEditLeave(null)}
          title="✏️ Edit Leave"
          maxW="max-w-4xl"
          footer={
            <>
              <button
                onClick={() => setEditLeave(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:border-slate-300 transition bg-white"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Spinner />} Save Changes
              </button>
            </>
          }
        >
          {editLeave && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Start Date">
                  <input
                    type="date"
                    value={editForm.start_date || ''}
                    className={INPUT}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, start_date: e.target.value }))
                    }
                  />
                </Field>
                <Field label="End Date">
                  <input
                    type="date"
                    value={editForm.end_date || ''}
                    className={INPUT}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, end_date: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Half Day">
                <div className="flex gap-2">
                  {[
                    { val: 0, label: 'No' },
                    { val: 1, label: 'Yes' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() =>
                        setEditForm((f) => ({ ...f, is_half_day: opt.val }))
                      }
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition
                        ${editForm.is_half_day === opt.val
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-violet-300'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
              {editForm.is_half_day === 1 && (
                <Field label="Half Day Type">
                  <select
                    value={editForm.half_day_type}
                    className={INPUT}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, half_day_type: e.target.value }))
                    }
                  >
                    <option value="first_half">First Half</option>
                    <option value="second_half">Second Half</option>
                  </select>
                </Field>
              )}
              <Field label="Reason">
                <textarea
                  rows={3}
                  value={editForm.reason || ''}
                  className={`${INPUT} resize-none`}
                  placeholder="Reason for leave…"
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, reason: e.target.value }))
                  }
                />
              </Field>
              {editLeave.attachments?.length > 0 && (
                <Field label="Attachments — tap to mark for deletion">
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {editLeave.attachments.map((a) => {
                      const removed = deletedAttachments.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() =>
                            setDeletedAttachments((d) =>
                              removed
                                ? d.filter((x) => x !== a.id)
                                : [...d, a.id]
                            )
                          }
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition
                            ${removed
                              ? 'border-rose-400 opacity-50'
                              : 'border-slate-200 hover:border-rose-300'
                            }`}
                        >
                          <img
                            src={a.file_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {removed && (
                            <div className="absolute inset-0 bg-rose-500/60 flex items-center justify-center text-white font-bold text-xs">
                              ✕ Remove
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {deletedAttachments.length > 0 && (
                    <p className="text-xs text-rose-500 font-semibold mt-1">
                      ⚠ {deletedAttachments.length} attachment(s) will be deleted on save
                    </p>
                  )}
                </Field>
              )}
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default LeaveManagement;
