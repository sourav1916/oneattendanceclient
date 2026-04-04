import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaPaperclip,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaCalendarCheck,
  FaEllipsisV,
  FaInfoCircle,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const request = async (endpoint, method = 'GET', body = null) => {
  const response = await apiCall(endpoint, method, body, getCompanyId());
  const result = await response.json();
  if (!response.ok || !result?.success) throw new Error(result?.message || 'Request failed');
  return result;
};

const StatusBadge = ({ status }) => {
  const styles = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}>
      {status || 'pending'}
    </span>
  );
};

const LeaveTypeBadge = ({ name, isPaid }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
    {name} {!isPaid && '(Unpaid)'}
  </span>
);

// Format leave type name for display
const formatLeaveTypeName = (key) => {
  const nameMap = {
    sick_leave: 'Sick Leave',
    casual_leave: 'Casual Leave',
    annual_leave: 'Annual Leave',
    maternity_leave: 'Maternity Leave',
    work_from_home: 'Work From Home',
    compensatory_off: 'Compensatory Off',
  };
  return nameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Leave Balance Card Component
const LeaveBalanceCard = ({ type, balance }) => {
  const percentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
  const displayName = formatLeaveTypeName(type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-white p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm capitalize">
            {displayName}
          </h3>
          <p className="text-xs text-gray-400">{type.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-600">{balance.remaining}</p>
          <p className="text-xs text-gray-500">remaining</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Used: {balance.used}</span>
          <span>Total: {balance.total}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Leave Card Component for Mobile
const LeaveCard = ({ leave, onViewDetails, onEdit, onDelete, deletingId }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl bg-white p-4 shadow-md border border-gray-100"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <LeaveTypeBadge name={leave.leave_type_name} isPaid={leave.is_paid} />
          <p className="mt-1 text-xs text-gray-400">
            Applied: {formatDate(leave.applied_at)}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 transition hover:bg-gray-100"
          >
            <FaEllipsisV className="text-gray-500" size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => {
                  onViewDetails(leave);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-t-xl px-4 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
              >
                <FaEye size={12} /> View Details
              </button>
              {leave.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      onEdit(leave);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-purple-600 transition hover:bg-purple-50"
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(leave.id);
                      setShowMenu(false);
                    }}
                    disabled={deletingId === leave.id}
                    className="flex w-full items-center gap-2 rounded-b-xl px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === leave.id ? (
                      <FaSpinner className="animate-spin" size={12} />
                    ) : (
                      <FaTrash size={12} />
                    )}
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Duration:</span>
          <span className="text-xs font-medium text-gray-700">
            {leave.total_days} day(s)
            {leave.is_half_day && ` (${leave.half_day_type === 'first_half' ? 'First Half' : 'Second Half'})`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">From:</span>
          <span className="text-xs text-gray-700">{formatDate(leave.start_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">To:</span>
          <span className="text-xs text-gray-700">{formatDate(leave.end_date)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Status:</span>
          <StatusBadge status={leave.status} />
        </div>
        <div className="mt-2 rounded-lg bg-gray-50 p-2">
          <p className="line-clamp-2 text-xs text-gray-600">{leave.reason}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 text-white">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/20">
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const LeaveFormModal = ({ open, title, leaveTypes, initialLeave, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    leave_config_id: '',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_type: 'first_half',
    reason: '',
    attachments: [],
    deleted_attachments: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (!initialLeave) {
      setForm({
        leave_config_id: '',
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: 'first_half',
        reason: '',
        attachments: [],
        deleted_attachments: [],
      });
      return;
    }

    setForm({
      leave_config_id: String(initialLeave.leave_type_id || ''),
      start_date: initialLeave.start_date || '',
      end_date: initialLeave.end_date || '',
      is_half_day: Boolean(initialLeave.is_half_day),
      half_day_type: initialLeave.half_day_type || 'first_half',
      reason: initialLeave.reason || '',
      attachments: [],
      deleted_attachments: [],
    });
  }, [initialLeave, open]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      body.append('leave_config_id', form.leave_config_id);
      body.append('start_date', form.start_date);
      body.append('end_date', form.end_date);
      body.append('is_half_day', form.is_half_day ? '1' : '0');
      body.append('reason', form.reason);
      if (form.is_half_day) body.append('half_day_type', form.half_day_type);
      if (initialLeave) body.append('deleted_attachments', JSON.stringify(form.deleted_attachments));
      form.attachments.forEach((file) => body.append('attachments', file));

      await request(
        initialLeave ? `/leave/update/${initialLeave.id}` : '/leave/apply',
        'POST',
        body
      );

      toast.success(initialLeave ? 'Leave updated successfully' : 'Leave application submitted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Unable to save leave');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Leave Type</label>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={form.leave_config_id}
            onChange={(e) => setForm((prev) => ({ ...prev, leave_config_id: e.target.value }))}
            required
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} {!type.is_paid && '(Unpaid)'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Start Date</label>
            <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.start_date} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">End Date</label>
            <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.end_date} onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))} required />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_half_day} onChange={(e) => setForm((prev) => ({ ...prev, is_half_day: e.target.checked }))} />
            Half Day
          </label>
          {form.is_half_day && (
            <select className="rounded-lg border px-3 py-2" value={form.half_day_type} onChange={(e) => setForm((prev) => ({ ...prev, half_day_type: e.target.value }))}>
              <option value="first_half">First Half</option>
              <option value="second_half">Second Half</option>
            </select>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">Reason</label>
          <textarea
            rows={4}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Please provide a reason for your leave..."
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            required
          />
        </div>

        {initialLeave?.attachments?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Current Attachments</p>
            {initialLeave.attachments.map((file) => {
              const marked = form.deleted_attachments.includes(file.id);
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      deleted_attachments: marked
                        ? prev.deleted_attachments.filter((id) => id !== file.id)
                        : [...prev.deleted_attachments, file.id],
                    }))
                  }
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${marked ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <FaPaperclip />
                    {file.original_name}
                  </span>
                  <span className="text-xs font-semibold">{marked ? 'Marked for delete' : 'Keep'}</span>
                </button>
              );
            })}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-gray-500">Add Attachments</label>
          <input type="file" multiple onChange={(e) => setForm((prev) => ({ ...prev, attachments: Array.from(e.target.files || []) }))} className="w-full" />
          <p className="mt-1 text-xs text-gray-400">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 font-medium text-white disabled:opacity-50">
            {saving ? <FaSpinner className="inline animate-spin" /> : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-gray-200 py-2 font-medium text-gray-700">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

const MyLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { pagination, updatePagination, goToPage } = usePagination(1, 10);
  const [resultMeta, setResultMeta] = useState({ total: 0, total_pages: 1 });
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [viewLeave, setViewLeave] = useState(null);
  const [editLeave, setEditLeave] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadLeaves = useCallback(async (targetPage = pagination.page) => {
    setLoading(true);
    try {
      const result = await request(
        `/leave/my-applications?page=${targetPage}&limit=${pagination.limit}`
      );
      const rows = result.data || [];
      const total = Number(result.meta?.total ?? result.total ?? rows.length ?? 0);
      const totalPages = Number(
        result.meta?.total_pages ??
        result.last_page ??
        Math.max(1, Math.ceil(total / pagination.limit))
      );

      setLeaves(result.data || []);
      setResultMeta({ total, total_pages: totalPages });
      updatePagination({
        page: result.meta?.page || targetPage,
        limit: result.meta?.limit || pagination.limit,
        total,
        total_pages: totalPages,
        is_last_page: (result.meta?.page || targetPage) >= totalPages,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [pagination.page, pagination.limit, updatePagination]);

  const loadLeaveTypes = useCallback(async () => {
    try {
      const result = await request('/leave/company?page=1&limit=100');
      setLeaveTypes((result.data || []).map((row) => ({ id: row.id, name: row.name, is_paid: row.is_paid })));
    } catch (error) {
      console.error('Failed to load leave types:', error);
    }
  }, []);

  const loadBalances = useCallback(async () => {
    try {
      const result = await request('/leave/my-balance');
      // The API returns data as an object with leave types as keys
      setBalances(result.data || {});
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  }, []);

  // Initial load - only once
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadLeaveTypes(),
        loadBalances(),
        loadLeaves(1)
      ]);
    };
    loadInitialData();
  }, []); // Empty dependency array - runs once on mount

  // Handle page changes
  useEffect(() => {
    if (!isInitialLoad) {
      loadLeaves(pagination.page);
    }
  }, [pagination.page, isInitialLoad, loadLeaves]);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate statistics
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (status !== 'all' && leave.status !== status) return false;
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        String(leave.leave_type_name || '').toLowerCase().includes(term) ||
        String(leave.reason || '').toLowerCase().includes(term)
      );
    });
  }, [leaves, search, status]);

  const removeLeave = async (id) => {
    setDeletingId(id);
    try {
      await request(`/leave/delete/${id}`, 'DELETE');
      toast.success('Leave deleted successfully');
      await loadLeaves(pagination.page);
      await loadBalances();
    } catch (error) {
      toast.error(error.message || 'Failed to delete leave');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (nextPage) => {
    goToPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 md:text-3xl">
              <FaCalendarAlt className="text-purple-500" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Leaves
              </span>
            </h1>
            <p className="text-sm text-gray-500">Manage your leave applications</p>
          </div>
          <button
            type="button"
            onClick={() => setShowApply(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 font-semibold text-white shadow-lg transition hover:from-purple-700 hover:to-pink-700"
          >
            <FaPlus />
            Apply Leave
          </button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-4">
            <div className="mb-1 flex items-center gap-2">
              <FaCalendarCheck className="text-purple-500 text-sm sm:text-base" />
              <p className="text-xs text-gray-500 uppercase">Total</p>
            </div>
            <p className="text-xl font-bold text-gray-800 sm:text-2xl">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-4">
            <div className="mb-1 flex items-center gap-2">
              <FaSpinner className="text-yellow-500 text-sm sm:text-base" />
              <p className="text-xs text-gray-500 uppercase">Pending</p>
            </div>
            <p className="text-xl font-bold text-yellow-600 sm:text-2xl">{stats.pending}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-4">
            <div className="mb-1 flex items-center gap-2">
              <FaEye className="text-green-500 text-sm sm:text-base" />
              <p className="text-xs text-gray-500 uppercase">Approved</p>
            </div>
            <p className="text-xl font-bold text-green-600 sm:text-2xl">{stats.approved}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-4">
            <div className="mb-1 flex items-center gap-2">
              <FaTimes className="text-red-500 text-sm sm:text-base" />
              <p className="text-xs text-gray-500 uppercase">Rejected</p>
            </div>
            <p className="text-xl font-bold text-red-600 sm:text-2xl">{stats.rejected}</p>
          </div>
        </motion.div>

        {/* Leave Balance Section */}
        {Object.keys(balances).length >= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaCalendarCheck className="text-purple-500" /> Leave Balance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(balances).map(([type, balance]) => (
                <LeaveBalanceCard key={type} type={type} balance={balance} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-2xl bg-white p-4 shadow-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search leaves by type or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-48"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Leaves List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-2xl bg-white shadow-md"
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <FaSpinner className="text-3xl text-purple-500 animate-spin" />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-10 text-center">
              <FaInfoCircle className="mx-auto mb-3 text-4xl text-gray-300" />
              <p className="text-gray-500">No leaves found</p>
              <p className="mt-1 text-xs text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              {!isMobileViewport && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Leave Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">End Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applied On</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLeaves.map((leave) => (
                        <tr key={leave.id} className="transition hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <LeaveTypeBadge name={leave.leave_type_name} isPaid={leave.is_paid} />
                            <p className="mt-1 text-xs text-gray-500">{leave.total_days} day(s)</p>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(leave.start_date)}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(leave.end_date)}</td>
                          <td className="px-4 py-3 text-sm">
                            {leave.total_days} day(s)
                            {leave.is_half_day && ` (${leave.half_day_type === 'first_half' ? 'First Half' : 'Second Half'})`}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={leave.status} /></td>
                          <td className="px-4 py-3 text-sm">{formatDateTime(leave.applied_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewLeave(leave)}
                                className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-600 transition hover:bg-blue-100"
                              >
                                <FaEye className="inline mr-1" size={12} /> View
                              </button>
                              {leave.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setEditLeave(leave)}
                                    className="rounded-lg bg-purple-50 px-3 py-1.5 text-sm text-purple-600 transition hover:bg-purple-100"
                                  >
                                    <FaEdit className="inline mr-1" size={12} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeLeave(leave.id)}
                                    disabled={deletingId === leave.id}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                  >
                                    {deletingId === leave.id ? (
                                      <FaSpinner className="inline animate-spin" size={12} />
                                    ) : (
                                      <><FaTrash className="inline mr-1" size={12} /> Delete</>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Card View */}
              {isMobileViewport && (
                <div className="space-y-3 p-4">
                  <AnimatePresence>
                    {filteredLeaves.map((leave) => (
                      <LeaveCard
                        key={leave.id}
                        leave={leave}
                        onViewDetails={setViewLeave}
                        onEdit={setEditLeave}
                        onDelete={removeLeave}
                        deletingId={deletingId}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Pagination */}
        {!loading && leaves.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Pagination
              currentPage={pagination.page}
              totalItems={resultMeta.total || leaves.length}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              variant={isMobileViewport ? 'minimal' : 'default'}
              showInfo={!isMobileViewport}
            />
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <Modal open={!!viewLeave} title="Leave Details" onClose={() => setViewLeave(null)}>
        {viewLeave && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Leave Type</p>
                <LeaveTypeBadge name={viewLeave.leave_type_name} isPaid={viewLeave.is_paid} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <StatusBadge status={viewLeave.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-medium">{formatDate(viewLeave.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="font-medium">{formatDate(viewLeave.end_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium">
                  {viewLeave.total_days} day(s)
                  {viewLeave.is_half_day && ` (${viewLeave.half_day_type === 'first_half' ? 'First Half' : 'Second Half'})`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Applied On</p>
                <p className="font-medium">{formatDateTime(viewLeave.applied_at)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reason</p>
              <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{viewLeave.reason || 'N/A'}</div>
            </div>
            {viewLeave.approval_remarks && (
              <div>
                <p className="text-xs text-gray-500">Remarks</p>
                <div className="mt-1 rounded-lg bg-yellow-50 p-3 text-sm text-gray-700">{viewLeave.approval_remarks}</div>
              </div>
            )}
            {viewLeave.attachments?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Attachments</p>
                {viewLeave.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-purple-600 transition hover:bg-gray-100"
                  >
                    <FaPaperclip />
                    <span className="truncate">{file.original_name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <LeaveFormModal
        open={showApply}
        title="Apply Leave"
        leaveTypes={leaveTypes}
        initialLeave={null}
        onClose={() => setShowApply(false)}
        onSuccess={() => {
          goToPage(1);
          loadBalances();
          loadLeaves(1);
        }}
      />

      <LeaveFormModal
        open={!!editLeave}
        title="Edit Leave"
        leaveTypes={leaveTypes}
        initialLeave={editLeave}
        onClose={() => setEditLeave(null)}
        onSuccess={() => {
          loadLeaves(pagination.page);
          loadBalances();
        }}
      />
    </div>
  );
};

export default MyLeave;