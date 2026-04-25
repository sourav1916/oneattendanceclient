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
  FaInfoCircle,
  FaUpload,
  FaCog
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall, { uploadFile } from '../utils/api';
import ModalScrollLock from '../components/ModalScrollLock';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ActionMenu from '../components/ActionMenu';
import { DateRangePickerField } from '../components/DatePicker';

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');
const formatDays = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
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
  if (!file) return false;
  const url = typeof file === 'string' ? file : (file.url || file.file_url || '');
  const name = file.name || file.original_name || (url ? url.split('/').pop() : '');
  const fileType = String(file.type || file.file_type || '').toLowerCase();
  const fileExtension = getFileExtension(name);
  return fileType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension) || (url && /\.(jpg|jpeg|png|webp|gif)$/i.test(url));
};

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

const normalizeBalanceKey = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

const findBalanceForLeaveType = (leaveType, balances) => {
  if (!leaveType) return null;

  const candidates = [
    leaveType.id,
    leaveType.code,
    leaveType.name,
    formatLeaveTypeName(leaveType.code || ''),
    leaveType.code ? leaveType.code.replace(/_/g, ' ') : '',
  ]
    .filter(Boolean)
    .map(normalizeBalanceKey);

  for (const [key, balance] of Object.entries(balances || {})) {
    const normalizedKey = normalizeBalanceKey(key);
    const normalizedName = normalizeBalanceKey(balance?.name || balance?.code || balance?.leave_type_name || '');
    if (candidates.includes(normalizedKey) || (normalizedName && candidates.includes(normalizedName))) {
      return { key, balance };
    }
  }

  return null;
};

const getRequestedDays = (startDate, endDate, isHalfDay) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  if (isHalfDay && start.toDateString() === end.toDateString()) {
    return 0.5;
  }
  return dayCount;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl bg-white p-4 shadow-md border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onClick={() => onViewDetails(leave)}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <LeaveTypeBadge name={leave.leave_type_name} isPaid={leave.is_paid} />
          <p className="mt-1 text-xs text-gray-400">
            Applied: {formatDate(leave.applied_at)}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            menuId={`leave-card-${leave.id}`}
            actions={[
              {
                label: 'View Details',
                icon: <FaEye size={12} />,
                onClick: () => onViewDetails(leave),
                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
              },
              ...(leave.status === 'pending'
                ? [
                  {
                    label: 'Edit',
                    icon: <FaEdit size={12} />,
                    onClick: () => onEdit(leave),
                    className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
                  },
                  {
                    label: 'Delete',
                    icon: deletingId === leave.id ? (
                      <FaSpinner className="animate-spin" size={12} />
                    ) : (
                      <FaTrash size={12} />
                    ),
                    onClick: () => onDelete(leave.id),
                    disabled: deletingId === leave.id,
                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
                  },
                ]
                : []),
            ]}
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Duration:</span>
          <span className="text-xs font-medium text-gray-700">
            {formatDays(leave.total_days)} day(s)
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

const Modal = ({ open, title, subtitle, onClose, children }) => {
  useEffect(() => {
    if (open) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalStyle = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
        height: document.body.style.height
      };

      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.paddingRight = originalStyle.paddingRight;
        document.body.style.height = originalStyle.height;
        document.documentElement.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-white">
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition hover:bg-white/20">
            <FaTimes />
          </button>
        </div>
        <div className="max-h-[82vh] overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};

const LeaveFormModal = ({ open, title, leaveTypes, balances, initialLeave, onClose, onSuccess }) => {
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
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const isEditing = Boolean(initialLeave);

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((type) => String(type.id) === String(form.leave_config_id)) || null,
    [leaveTypes, form.leave_config_id]
  );
  const selectedLeaveBalance = useMemo(
    () => findBalanceForLeaveType(selectedLeaveType, balances),
    [balances, selectedLeaveType]
  );
  const remainingDays = toNumber(selectedLeaveBalance?.balance?.remaining);
  const selectedDays = getRequestedDays(form.start_date, form.end_date, form.is_half_day);
  const overBalance = Boolean(selectedLeaveType && selectedLeaveBalance && selectedDays > remainingDays);
  const balanceLabel = selectedLeaveType
    ? `${formatDays(remainingDays)} left`
    : 'Choose a leave type';

  const handleDateChange = (range) => {
    if (!range) return;
    setForm((prev) => ({
      ...prev,
      start_date: range.start || '',
      end_date: range.end || '',
    }));
  };

  const handleAttachmentChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter(isAllowedAttachment);
    const invalidFiles = selectedFiles.filter((file) => !isAllowedAttachment(file));

    if (invalidFiles.length > 0) {
      toast.error('Only JPG/JPEG images and PDF files are allowed');
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = validFiles.map(file => uploadFile(file).then(url => ({
        url,
        name: file.name,
        type: file.type,
        size: file.size
      })));
      const uploadedFiles = await Promise.all(uploadPromises);

      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles],
      }));
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload one or more files");
    } finally {
      setIsUploading(false);
    }
  };

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

  useEffect(() => {
    const nextPreviews = form.attachments.map((att) => ({
      key: att.url || `${att.name}-${att.size}`,
      name: att.name,
      isImage: isImageAttachment(att),
      url: att.url,
    }));

    setAttachmentPreviews(nextPreviews);
  }, [form.attachments]);

  const submit = async (event) => {
    event.preventDefault();
    if (overBalance) {
      toast.error(`Selected date range exceeds your ${formatDays(remainingDays)} day balance for ${selectedLeaveType?.name || 'this leave type'}.`);
      return;
    }
    setSaving(true);
    try {
      let method;
      let endpoint;
      const payload = {
        leave_config_id: form.leave_config_id,
        start_date: form.start_date,
        end_date: form.end_date,
        is_half_day: form.is_half_day ? 1 : 0,
        reason: form.reason,
        attachments: form.attachments.map(a => a.url),
      };

      if (form.is_half_day) payload.half_day_type = form.half_day_type;

      if (initialLeave) {
        method = 'PUT';
        endpoint = '/leave/application-update';
        payload.id = initialLeave.id;
        payload.deleted_attachments = form.deleted_attachments;
      } else {
        method = 'POST';
        endpoint = '/leave/apply';
      }

      await request(endpoint, method, payload);

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
    <Modal
      open={open}
      title={title}
      subtitle={isEditing ? 'Edit the request and keep it within your remaining balance.' : 'Create a new request and stay within your remaining balance.'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">Mode</p>
            <p className="mt-0.5 text-sm font-semibold text-purple-700">{isEditing ? 'Edit request' : 'New request'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Balance</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-800">{balanceLabel}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Available balance</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">
                  {selectedLeaveType ? selectedLeaveType.name : 'Select a leave type'}
                </p>
                <p className="truncate text-[11px] text-gray-500">
                  {selectedLeaveType?.code ? `Code ${selectedLeaveType.code}` : 'Balance comes from the list API'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className={`text-2xl font-bold ${remainingDays <= 1 ? 'text-rose-600' : 'text-purple-600'}`}>
                  {selectedLeaveType ? formatDays(remainingDays) : '0'}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">day(s) left</p>
              </div>
            </div>
            {selectedLeaveBalance?.balance && (
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>Used {formatDays(selectedLeaveBalance.balance.used ?? 0)}</span>
                <span>Total {formatDays(selectedLeaveBalance.balance.total ?? 0)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Leave Type</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              value={form.leave_config_id}
              onChange={(e) => setForm((prev) => ({ ...prev, leave_config_id: e.target.value }))}
              required
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}{type.code ? ` (${type.code})` : ''} {!type.is_paid && '(Unpaid)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:items-start">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.is_half_day}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    is_half_day: checked,
                    half_day_type: checked ? "first_half" : "",
                  }));
                }}
              />
              Half day
            </label>

            <div className="mt-3 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="half_day_type"
                  value="first_half"
                  checked={form.half_day_type === "first_half"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_half_day: true,
                      half_day_type: e.target.value,
                    }))
                  }
                />
                First Half
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="half_day_type"
                  value="second_half"
                  checked={form.half_day_type === "second_half"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_half_day: true,
                      half_day_type: e.target.value,
                    }))
                  }
                />
                Second Half
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Date Range</label>
              <span className={`text-[11px] font-medium ${overBalance ? 'text-rose-600' : 'text-gray-400'}`}>
                {selectedDays ? `${formatDays(selectedDays)} day(s) selected` : 'Select within balance'}
              </span>
            </div>
            <DateRangePickerField
              value={{ start: form.start_date, end: form.end_date }}
              onChange={handleDateChange}
              placeholder="Select leave dates"
              buttonClassName="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              popoverClassName="mt-2"
              initialTab="single"
              mode="range"
              showQuickSelect={false}
              minDate={new Date()}
              maxDays={selectedLeaveType ? Math.max(0, remainingDays) : null}
            />
            {selectedLeaveType && (
              <p className={`mt-2 text-[11px] ${overBalance ? 'text-rose-600' : 'text-gray-500'}`}>
                {overBalance
                  ? `Selected range exceeds the available ${formatDays(remainingDays)} day balance.`
                  : 'The picker will stop at your current balance.'}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reason
          </label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            placeholder="Please provide a reason for your leave..."
            value={form.reason}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                reason: e.target.value,
              }))
            }
            required
          />
        </div>



        {initialLeave?.attachments?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Attachments</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {initialLeave.attachments.map((file) => {
                const marked = form.deleted_attachments.includes(file.id);
                const isImage = isImageAttachment(file);
                return (
                  <div key={file.id} className={`group relative overflow-hidden rounded-lg border transition-all ${marked ? 'border-red-200 opacity-60' : 'border-gray-200'}`}>
                    <div className="flex aspect-square items-center justify-center bg-gray-50">
                      {isImage ? (
                        <img
                          src={file.file_url}
                          alt={file.original_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100?text=Error';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FaPaperclip size={24} />
                          <span className="px-2 text-center text-[10px] line-clamp-2">{file.original_name}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          deleted_attachments: marked
                            ? prev.deleted_attachments.filter((id) => id !== file.id)
                            : [...prev.deleted_attachments, file.id],
                        }))
                      }
                      className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all ${marked ? 'bg-red-500/80 text-white' : 'bg-black/0 text-transparent hover:bg-black/40 hover:text-white'}`}
                    >
                      {marked ? (
                        <>
                          <FaPlus className="rotate-45" />
                          <span className="text-[10px] font-bold">Restore</span>
                        </>
                      ) : (
                        <>
                          <FaTrash size={14} />
                          <span className="text-[10px] font-bold">Remove</span>
                        </>
                      )}
                    </button>

                    <div className="border-t bg-gray-50 px-2 py-1 text-[10px] truncate text-gray-500">
                      {file.original_name || (file.file_url ? file.file_url.split('/').pop() : 'Attachment')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Modern File Upload ── */}
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Add Attachments</label>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-purple-400', 'bg-purple-50'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
              const dt = e.dataTransfer;
              if (dt?.files) handleAttachmentChange({ target: { files: dt.files } });
            }}
            className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-white px-4 py-5 text-center transition-colors hover:border-purple-300 hover:bg-purple-50/40"
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleAttachmentChange}
              disabled={isUploading}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />

            {/* Upload icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white">
              <FaUpload className="text-sm text-gray-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop files here or <span className="text-purple-600">click to browse</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-400">JPG, JPEG, PNG, WEBP and PDF files only</p>
            </div>
          </div>

          {/* Uploading indicator */}
          {isUploading && (
            <div className="mt-2 flex items-center gap-2 text-purple-600">
              <FaSpinner className="animate-spin text-xs" />
              <span className="text-xs font-medium">Uploading files…</span>
            </div>
          )}

          {/* Preview Grid */}
          {attachmentPreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {attachmentPreviews.map((preview, index) => (
                <div key={preview.key} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {/* Thumbnail */}
                  <div className="h-full w-full">
                    {preview.isImage ? (
                      <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center">
                        <FaPaperclip className="text-lg text-orange-400" />
                        <span className="line-clamp-2 break-all text-[10px] text-gray-500">{preview.name}</span>
                      </div>
                    )}
                  </div>

                  {/* File name footer */}
                  <div className="absolute bottom-0 left-0 right-0 truncate border-t border-gray-200 bg-white/90 px-1.5 py-1 text-[9px] text-gray-500 backdrop-blur-sm">
                    {preview.name}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== index),
                      }))
                    }
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <FaTimes size={8} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving || isUploading} className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-sm font-medium text-white disabled:opacity-50">
            {saving ? <FaSpinner className="inline animate-spin" /> : 'Save'}
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
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'
  );
  const [visibleColumns, setVisibleColumns] = useState(() => ({
    showLeaveType: true,
    showStartDate: window.innerWidth >= 540,
    showEndDate: window.innerWidth >= 768,
    showDuration: window.innerWidth >= 640,
    showStatus: true,
    showAppliedOn: window.innerWidth >= 1024,
  }));
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const [resultMeta, setResultMeta] = useState({ total: 0, total_pages: 1 });
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
      setLeaveTypes((result.data || []).map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code || row.leave_code || row.type || '',
        is_paid: row.is_paid,
      })));
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
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVisibleColumns({
          showLeaveType: true,
          showStartDate: window.innerWidth >= 540,
          showEndDate: window.innerWidth >= 768,
          showDuration: window.innerWidth >= 640,
          showStatus: true,
          showAppliedOn: window.innerWidth >= 1024,
        });
      }, 150);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
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

        <div className="mb-4 flex justify-end">
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
        </div>

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
          className="rounded-2xl bg-white shadow-xl overflow-visible"
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
              {viewMode === 'table' && (
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                      <tr>
                        {visibleColumns.showLeaveType && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Leave Type</th>}
                        {visibleColumns.showStartDate && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Start Date</th>}
                        {visibleColumns.showEndDate && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">End Date</th>}
                        {visibleColumns.showDuration && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>}
                        {visibleColumns.showStatus && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>}
                        {visibleColumns.showAppliedOn && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applied On</th>}
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase"><FaCog className="w-4 h-4 mx-auto" /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLeaves.map((leave) => (
                        <tr key={leave.id} className="cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50" onClick={() => setViewLeave(leave)}>
                          {visibleColumns.showLeaveType && (
                            <td className="px-4 py-3">
                              <LeaveTypeBadge name={leave.leave_type_name} isPaid={leave.is_paid} />
                              <p className="mt-1 text-xs text-gray-500">{formatDays(leave.total_days)} day(s)</p>
                            </td>
                          )}
                          {visibleColumns.showStartDate && <td className="px-4 py-3 text-sm">{formatDate(leave.start_date)}</td>}
                          {visibleColumns.showEndDate && <td className="px-4 py-3 text-sm">{formatDate(leave.end_date)}</td>}
                          {visibleColumns.showDuration && (
                            <td className="px-4 py-3 text-sm">
                              {formatDays(leave.total_days)} day(s)
                              {leave.is_half_day && ` (${leave.half_day_type === 'first_half' ? 'First Half' : 'Second Half'})`}
                            </td>
                          )}
                          {visibleColumns.showStatus && <td className="px-4 py-3"><StatusBadge status={leave.status} /></td>}
                          {visibleColumns.showAppliedOn && <td className="px-4 py-3 text-sm">{formatDateTime(leave.applied_at)}</td>}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center">
                              <ActionMenu
                                menuId={`leave-table-${leave.id}`}
                                actions={[
                                  {
                                    label: 'View Details',
                                    icon: <FaEye size={12} />,
                                    onClick: () => setViewLeave(leave),
                                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                                  },
                                  ...(leave.status === 'pending'
                                    ? [
                                      {
                                        label: 'Edit',
                                        icon: <FaEdit size={12} />,
                                        onClick: () => setEditLeave(leave),
                                        className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
                                      },
                                      {
                                        label: 'Delete',
                                        icon: deletingId === leave.id ? (
                                          <FaSpinner className="animate-spin" size={12} />
                                        ) : (
                                          <FaTrash size={12} />
                                        ),
                                        onClick: () => removeLeave(leave.id),
                                        disabled: deletingId === leave.id,
                                        className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
                                      },
                                    ]
                                    : []),
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4">
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
                </ManagementGrid>
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
              showInfo={viewMode !== 'card'}
              onLimitChange={changeLimit}
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
                  {formatDays(viewLeave.total_days)} day(s)
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
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attachments</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {viewLeave.attachments.map((file) => {
                    const isImage = isImageAttachment(file);
                    return (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:border-purple-300 hover:shadow-md"
                      >
                        <div className="relative aspect-square flex items-center justify-center">
                          {isImage ? (
                            <img
                              src={file.file_url}
                              alt={file.original_name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Error';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <FaPaperclip size={24} />
                              <span className="px-2 text-center text-[10px] font-medium line-clamp-2">{file.original_name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all group-hover:bg-black/20 group-hover:text-white">
                            <FaEye size={20} />
                          </div>
                        </div>
                        <div className="border-t bg-white px-2 py-1.5">
                          <p className="truncate text-[10px] font-medium text-gray-600">{file.original_name || (file.file_url ? file.file_url.split('/').pop() : 'Attachment')}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <LeaveFormModal
        open={showApply}
        title="Apply Leave"
        leaveTypes={leaveTypes}
        balances={balances}
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
        balances={balances}
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
