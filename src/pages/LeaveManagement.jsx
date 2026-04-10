import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEye, FaEdit, FaCheck, FaTrash, FaTh, FaListUl, FaEllipsisV, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

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

const INPUT =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400';

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text} border ${s.border}`}
    >
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

// ─── Custom Action Menu (No ref warnings) ─────────────────────────────────────
function CustomActionMenu({
  leave,
  isOpen,
  onToggle,
  onView,
  onEdit,
  onApprove,
  onReject,
  editDisabled = false,
  approveDisabled = false,
  rejectDisabled = false,
  editMessage = '',
  reviewMessage = '',
}) {
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getNormalizedStatus = (l) => String(l?.status || '').toLowerCase();
  const canAct = (l) => getNormalizedStatus(l) === 'pending';
  const canEdit = (l) => ['pending'].includes(getNormalizedStatus(l));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleAction = (action) => {
    setDropdownOpen(false);
    action();
  };

  const actions = [];

  // View Details - always available
  actions.push({
    label: 'View Details',
    icon: <FaEye size={13} />,
    onClick: () => handleAction(() => onView(leave)),
    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
  });

  // Edit - only for pending
  if (canEdit(leave)) {
    actions.push({
      label: 'Edit Leave',
      icon: <FaEdit size={13} />,
      onClick: () => handleAction(() => onEdit(leave)),
      disabled: editDisabled,
      title: editDisabled ? editMessage : '',
      className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
    });
  }

  // Approve/Reject - only for pending
  if (canAct(leave)) {
    actions.push({
      label: 'Approve',
      icon: <FaCheck size={13} />,
      onClick: () => handleAction(() => onApprove(leave)),
      disabled: approveDisabled,
      title: approveDisabled ? reviewMessage : '',
      className: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
    });
    actions.push({
      label: 'Reject',
      icon: <FaTrash size={13} />,
      onClick: () => handleAction(() => onReject(leave)),
      disabled: rejectDisabled,
      title: rejectDisabled ? reviewMessage : '',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
      >
        <FaEllipsisV size={12} className="text-gray-500" />
      </button>
      
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="py-1">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.title}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : action.className || 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={leave.employee_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-800 text-sm truncate">{leave.employee_name}</h3>
            <CustomActionMenu
              leave={leave}
              onView={onView}
              onEdit={onEdit}
              onApprove={onApprove}
              onReject={onReject}
              editDisabled={editDisabled}
              approveDisabled={approveDisabled}
              rejectDisabled={rejectDisabled}
              editMessage={editMessage}
              reviewMessage={reviewMessage}
            />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{leave.employee_code}</p>
        </div>
      </div>

      {/* Status and Days */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={leave.status} />
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
          📅 {parseFloat(leave.total_days)} days
        </span>
      </div>

      {/* Leave Type */}
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

      {/* Date Range */}
      <div className="bg-blue-50 rounded-xl p-2 mb-3 text-xs font-semibold text-blue-700 text-center">
        📅 {fmt(leave.start_date)} → {fmt(leave.end_date)}
      </div>

      {/* Remarks */}
      {leave.approval_remarks && (
        <div className="bg-gray-50 rounded-xl p-2 mb-3 text-xs italic text-gray-500">
          "{leave.approval_remarks}"
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">Applied: {fmt(leave.applied_at?.split(' ')[0])}</span>
        <button
          onClick={() => onView(leave)}
          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}

// ─── InfoItem Component ───────────────────────────────────────────────────────
const InfoItem = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
      {icon}{label}
    </label>
    <div className="text-gray-800 font-medium text-sm">{value}</div>
  </div>
);

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
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const { pagination, updatePagination, goToPage } = usePagination(1, 10);

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
  const [submitting, setSubmitting] = useState(false);
  
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
      const total = Number(result.meta?.total ?? result.total ?? rows.length ?? 0);
      const totalPages = Number(result.meta?.total_pages ?? result.last_page ?? Math.max(1, Math.ceil(total / pagination.limit)));

      setLeaves(rows);
      updatePagination({
        page: page,
        limit: pagination.limit,
        total: total,
        total_pages: totalPages,
        is_last_page: page >= totalPages,
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
  }, [pagination.page]);

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
    if (updateAccess.disabled) return;
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
  }, [updateAccess.disabled]);

  const handleApproveOpen = useCallback((leave) => {
    if (approveAccess.disabled) return;
    setApproveLeave(leave);
    setApproveRemarks('');
  }, [approveAccess.disabled]);

  const handleRejectOpen = useCallback((leave) => {
    if (rejectAccess.disabled) return;
    setRejectLeave(leave);
    setRejectRemarks('');
  }, [rejectAccess.disabled]);

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
      setApproveRemarks('');
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
      setRejectRemarks('');
      fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
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
      const body = {
        id: editLeave.id,
        leave_config_id: editForm.leave_config_id,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        is_half_day: editForm.is_half_day,
        ...(editForm.is_half_day === 1 && { half_day_type: editForm.half_day_type }),
        reason: editForm.reason || '',
        attachments: [],
        deleted_attachments: deletedAttachments,
      };
      const response = await apiCall('/leave/application-update', 'PUT', body, getCompanyId());
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update');
      toast.success('Leave updated');
      setEditLeave(null);
      fetchLeaves(pagination.page, debouncedSearch, statusFilter, true);
    } catch (error) {
      toast.error(error.message || 'Failed to update');
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
  const visibleFrom = totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const visibleTo = Math.min(pagination.page * pagination.limit, totalItems);

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
          {stats.map((s, idx) => {
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
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
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
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
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
                          {fmt(leave.applied_at?.split(' ')[0])}
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
                      <td className="px-6 py-4 text-right">
                        <CustomActionMenu
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
        {!loading && leaves.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={totalItems}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            variant="default"
            showInfo={true}
          />
        )}

        {/* ────────────────────────────────────────────────────────────────────── */}
        {/* MODALS */}
        {/* ────────────────────────────────────────────────────────────────────── */}

        {/* Detail Modal */}
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FaEye /> Leave Details
                  </h2>
                  <button onClick={() => setDetailLeave(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                    ✕
                  </button>
                </div>
                <div className="p-6">
                  {/* Employee Info */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <Avatar name={detailLeave.employee_name} />
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{detailLeave.employee_name}</h3>
                      <p className="text-gray-500 text-sm">{detailLeave.employee_code}</p>
                    </div>
                    <div className="ml-auto">
                      <StatusBadge status={detailLeave.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <InfoItem icon={<span>📋</span>} label="Leave Type" value={`${detailLeave.leave_code} - ${detailLeave.leave_name}`} />
                    <InfoItem icon={<span>💰</span>} label="Paid Status" value={detailLeave.is_paid ? 'Paid Leave' : 'Unpaid Leave'} />
                    <InfoItem icon={<span>📅</span>} label="Start Date" value={fmt(detailLeave.start_date)} />
                    <InfoItem icon={<span>📅</span>} label="End Date" value={fmt(detailLeave.end_date)} />
                    <InfoItem icon={<span>📊</span>} label="Total Days" value={`${parseFloat(detailLeave.total_days)} days`} />
                    <InfoItem icon={<span>⏰</span>} label="Half Day" value={detailLeave.is_half_day ? `Yes (${detailLeave.half_day_type})` : 'No'} />
                    <InfoItem icon={<span>📨</span>} label="Applied On" value={fmt(detailLeave.applied_at?.split(' ')[0])} />
                    <InfoItem icon={<span>👤</span>} label="Approved By" value={detailLeave.approved_by_name || '—'} />
                  </div>

                  {detailLeave.reason && (
                    <div className="mt-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-700">{detailLeave.reason}</div>
                    </div>
                  )}

                  {detailLeave.approval_remarks && (
                    <div className="mt-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-xl text-gray-500 italic">"{detailLeave.approval_remarks}"</div>
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

        {/* Approve Modal */}
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

        {/* Reject Modal */}
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
      </div>
    </div>
  );
};

export default LeaveManagement;