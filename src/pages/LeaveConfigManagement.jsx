import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaSearch,
  FaCalendarCheck,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaLayerGroup,
  FaRegClock,
  FaCoins,
  FaUmbrellaBeach,
  FaEllipsisV,
  FaEye,
  FaInfoCircle,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import ModalScrollLock from '../components/ModalScrollLock';
import Pagination, { usePagination } from '../components/PaginationComponent';
import usePermissionAccess from '../hooks/usePermissionAccess';

// ─── Constants ────────────────────────────────────────────────────────────────

// ACCRUAL_TYPES now fetched from API constants

const DEFAULT_FORM = {
  code: '',
  name: '',
  is_paid: true,
  allow_half_day: false,
  accrual_type: 'none',
  accrual_rate: 0,
  max_balance: 0,
  carry_forward_limit: 0,
  allow_negative_balance: false,
  exclude_weekends: true,
  is_comp_off: false,
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const getCompanyId = () => {
  try { return JSON.parse(localStorage.getItem('company'))?.id; } catch { return null; }
};

const fetchConstants = async () => {
  const res = await apiCall('/constants/', 'GET', null, getCompanyId());
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch constants');
  return json.data;
};


const createLeaveType = async (body) => {
  const res = await apiCall('/leave/create', 'POST', body, getCompanyId());
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to create leave type');
  return json;
};

const updateLeaveType = async (body) => {
  const res = await apiCall('/leave/update', 'PUT', body, getCompanyId());
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update leave type');
  return json;
};

const deleteLeaveTypeAPI = async (id) => {
  const res = await apiCall('/leave/delete', 'DELETE', { id }, getCompanyId());
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to delete leave type');
  return json;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Badge components ─────────────────────────────────────────────────────────

const PaidBadge = ({ isPaid }) =>
  isPaid ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
      <FaCheckCircle size={10} /> Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 border border-red-200">
      <FaTimesCircle size={10} /> Unpaid
    </span>
  );

const ActiveBadge = ({ isActive }) =>
  isActive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
      Inactive
    </span>
  );

const BoolCell = ({ value }) =>
  value ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
      <FaCheck size={9} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-gray-200">
      <FaTimes size={9} /> No
    </span>
  );

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const ToggleSwitch = ({ checked, onChange, label, sublabel }) => (
  <div className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-violet-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// ─── 3-dot Action Menu ────────────────────────────────────────────────────────

const ActionMenu = ({
  record,
  onView,
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
  editMessage = '',
  deleteMessage = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <FaEllipsisV size={13} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-50 min-w-[148px] rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onView(record); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-slate-50"
            >
              <FaEye size={13} className="text-slate-400" /> View Details
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(record); }}
              disabled={editDisabled}
              title={editDisabled ? editMessage : ''}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaEdit size={13} className="text-slate-400" /> Edit
            </button>
            <div className="mx-3 my-1 border-t border-gray-100" />
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(record); }}
              disabled={deleteDisabled}
              title={deleteDisabled ? deleteMessage : ''}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTrash size={13} className="text-red-400" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonLoader = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-4 w-1/3 rounded-lg bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-200" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="h-3 rounded bg-gray-100" />
          <div className="h-3 rounded bg-gray-100" />
          <div className="h-3 rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

// ─── View Details Modal ───────────────────────────────────────────────────────

const modalVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { opacity: 0, scale: 0.93, y: 24, transition: { duration: 0.2 } },
};

const InfoItem = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
    <div className="text-sm font-medium text-gray-800">{value ?? '—'}</div>
  </div>
);

const ViewDetailsModal = ({ record, onClose, onEdit, editDisabled = false, editTitle = '' }) => {
  if (!record) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <ModalScrollLock />
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <FaEye className="text-violet-200" /> Leave Type Details
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/20">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6 custom-scrollbar">
            {/* Title row */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                  {record.code}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{record.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">Created {formatDate(record.created_at)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PaidBadge isPaid={record.is_paid} />
                    <ActiveBadge isActive={record.is_active} />
                    {record.is_comp_off && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200">Comp Off</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <InfoItem label="Max Balance" value={`${record.max_balance} days`} />
              <InfoItem label="Carry Forward" value={`${record.carry_forward_limit} days`} />
              <InfoItem label="Accrual Type" value={<span className="capitalize">{record.accrual_type}</span>} />
              {record.accrual_type !== 'none' && (
                <InfoItem label="Accrual Rate" value={`${record.accrual_rate} days`} />
              )}
              <InfoItem label="Half Day" value={<BoolCell value={record.allow_half_day} />} />
              <InfoItem label="Negative Balance" value={<BoolCell value={record.allow_negative_balance} />} />
              <InfoItem label="Exclude Weekends" value={<BoolCell value={record.exclude_weekends} />} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                Close
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onEdit(record); }}
                disabled={editDisabled}
                title={editDisabled ? editTitle : ''}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaEdit className="mr-1.5 inline" /> Edit
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ leaveType, onConfirm, onClose, loading, submitDisabled = false, submitTitle = '' }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
    onClick={onClose}
  >
    <ModalScrollLock />
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      className="flex w-full max-w-lg max-h-[90vh] flex-col justify-center overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-center">
        <div className="rounded-full bg-red-100 p-4">
          <FaTrash className="text-2xl text-red-500" />
        </div>
      </div>
      <h3 className="mb-1 text-center text-lg font-bold text-gray-800">Delete Leave Type</h3>
      <p className="mb-6 text-center text-sm text-gray-500">
        Are you sure you want to delete <span className="font-semibold text-gray-700">"{leaveType?.name}"</span>? This cannot be undone.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={loading || submitDisabled} title={submitDisabled ? submitTitle : ''} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Form Modal ───────────────────────────────────────────────────────────────

const FormModal = ({
  editRecord,
  onClose,
  onSaved,
  leaveTypeOptions,
  accrualTypeOptions,
  existingCodes,
  submitDisabled = false,
  submitTitle = '',
}) => {
  const isEdit = !!editRecord;
  const [form, setForm] = useState(isEdit ? { ...editRecord } : { ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  // When a preset leave type is selected from constants, auto-fill code + name
  const handleLeaveTypeSelect = (e) => {
    const selected = leaveTypeOptions.find((o) => o.value === e.target.value);
    if (selected) {
      set('code', selected.value.toUpperCase());
      set('name', selected.label);
    }
  };

  // Filter out options whose codes are already used in existing records
  const availableLeaveTypeOptions = leaveTypeOptions.filter(
    (opt) => !existingCodes?.has(opt.value.toUpperCase())
  );

  const validate = () => {
    const e = {};
    if (!form.code?.trim()) e.code = 'Code is required';
    if (form.code?.trim().length > 10) e.code = 'Max 10 characters';
    if (!form.name?.trim()) e.name = 'Name is required';
    if (Number(form.max_balance) < 0) e.max_balance = 'Must be ≥ 0';
    if (form.accrual_type && form.accrual_type !== 'none' && Number(form.accrual_rate) <= 0)
      e.accrual_rate = 'Rate must be > 0 when accrual is active';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        accrual_rate: Number(form.accrual_rate),
        max_balance: Number(form.max_balance),
        carry_forward_limit: Number(form.carry_forward_limit),
      };
      if (isEdit) {
        await updateLeaveType(payload);
        toast.success('Leave type updated successfully');
      } else {
        const { code, name, is_paid, allow_half_day, accrual_type, accrual_rate,
          max_balance, carry_forward_limit, allow_negative_balance, exclude_weekends, is_comp_off } = payload;
        await createLeaveType({ code, name, is_paid, allow_half_day, accrual_type, accrual_rate, max_balance, carry_forward_limit, allow_negative_balance, exclude_weekends, is_comp_off });
        toast.success('Leave type created successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-4 bg-white ${errors[field]
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-slate-400 focus:ring-slate-200'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
        exit={{ opacity: 0, scale: 0.93, y: 24, transition: { duration: 0.2 } }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {isEdit ? <FaEdit className="text-violet-200" /> : <FaPlus className="text-violet-200" />}
            {isEdit ? 'Edit Leave Type' : 'Create Leave Type'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/20">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-170px)] overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-6">

          {/* Preset leave type selector (from constants API) — only on create */}
          {!isEdit && leaveTypeOptions.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Select from Standard Types</h3>
              {availableLeaveTypeOptions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">All standard leave types have already been added.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableLeaveTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        set('code', opt.value.toUpperCase());
                        set('name', opt.label);
                      }}
                      title={opt.description}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        form.code === opt.value.toUpperCase()
                          ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-violet-50 hover:border-violet-300'
                      }`}
                    >
                      <span className="font-bold">{opt.value}</span> — {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Basic Info (read-only — populated from quick-select above) */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Selected Leave Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Code <span className="text-red-400">*</span></label>
                <div className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-gray-50 ${form.code ? 'text-gray-800 font-semibold border-gray-200' : 'text-gray-400 border-gray-200'}`}>
                  {form.code || 'Select a type above'}
                </div>
                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Name <span className="text-red-400">*</span></label>
                <div className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-gray-50 ${form.name ? 'text-gray-800 font-semibold border-gray-200' : 'text-gray-400 border-gray-200'}`}>
                  {form.name || 'Select a type above'}
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Balance Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Max Balance (days)</label>
                <input type="number" min={0} value={form.max_balance} onChange={(e) => set('max_balance', e.target.value)} className={inputCls('max_balance')} />
                {errors.max_balance && <p className="mt-1 text-xs text-red-500">{errors.max_balance}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Carry Forward Limit (days)</label>
                <input type="number" min={0} value={form.carry_forward_limit} onChange={(e) => set('carry_forward_limit', e.target.value)} className={inputCls('carry_forward_limit')} />
              </div>
            </div>
          </div>

          {/* Accrual */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Accrual</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Accrual Type</label>
                <select value={form.accrual_type} onChange={(e) => set('accrual_type', e.target.value)} className={inputCls('accrual_type')}>
                  {accrualTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Accrual Rate (days)</label>
                <input
                  type="number" min={0} step={0.5} value={form.accrual_rate}
                  disabled={!form.accrual_type || form.accrual_type === 'none'}
                  onChange={(e) => set('accrual_rate', e.target.value)}
                  className={`${inputCls('accrual_rate')} ${!form.accrual_type || form.accrual_type === 'none' ? '!bg-gray-50 cursor-not-allowed text-gray-400' : ''}`}
                />
                {errors.accrual_rate && <p className="mt-1 text-xs text-red-500">{errors.accrual_rate}</p>}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Rules & Policies</h3>
            <div className="space-y-2.5">
              <ToggleSwitch checked={form.is_paid} onChange={(v) => set('is_paid', v)} label="Paid Leave" sublabel="Employees are compensated during this leave" />
              <ToggleSwitch checked={form.allow_half_day} onChange={(v) => set('allow_half_day', v)} label="Allow Half Day" sublabel="Employees can apply for half day" />
              <ToggleSwitch checked={form.allow_negative_balance} onChange={(v) => set('allow_negative_balance', v)} label="Allow Negative Balance" sublabel="Leave can exceed available balance" />
              <ToggleSwitch checked={form.exclude_weekends} onChange={(v) => set('exclude_weekends', v)} label="Exclude Weekends" sublabel="Weekends not counted in leave duration" />
              <ToggleSwitch checked={form.is_comp_off} onChange={(v) => set('is_comp_off', v)} label="Compensatory Off" sublabel="Earned by working on holidays/weekends" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || submitDisabled} title={submitDisabled ? submitTitle : ''} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-medium text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Leave Type'}
            </button>
          </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const LeaveConfigManagement = () => {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);
  const [accrualTypeOptions, setAccrualTypeOptions] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [formModal, setFormModal] = useState({ open: false, record: null });
  const [viewModal, setViewModal] = useState({ open: false, record: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, record: null });
  const [deleting, setDeleting] = useState(false);
  const constantsLoadedRef = useRef(false);
  const initialFetchStartedRef = useRef(false);
  const fetchInProgress = useRef(false);

  const { pagination, updatePagination, goToPage } = usePagination(1, ITEMS_PER_PAGE);
  const createAccess = checkActionAccess('leaveConfig', 'create');
  const updateAccess = checkActionAccess('leaveConfig', 'update');
  const deleteAccess = checkActionAccess('leaveConfig', 'delete');
  const createMessage = getAccessMessage(createAccess);
  const updateMessage = getAccessMessage(updateAccess);
  const deleteMessage = getAccessMessage(deleteAccess);

  // Responsive column visibility
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );


  // Window resize listener
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch constants for leave type options - Guarded for single execution
  useEffect(() => {
    if (constantsLoadedRef.current) return;
    constantsLoadedRef.current = true;

    fetchConstants()
      .then((data) => {
        const typeOpts = (data.leave_types || []).map((item) => ({
          value: item.value.value,
          label: item.value.label,
          description: item.value.description,
        }));
        setLeaveTypeOptions(typeOpts);

        const accrualOpts = (data.accrual_types || []).map((item) => ({
          value: item.value.value,
          label: item.value.label,
        }));
        setAccrualTypeOptions(accrualOpts);
      })
      .catch(() => { }); // non-critical
  }, []);

  const loadRecords = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);
    setError(null);

    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      if (search) params.append("search", search);

      const response = await apiCall(`/leave/company?${params.toString()}`, 'GET', null, company?.id);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch leave types');
      }
      const result = await response.json();

      if (result.success) {
        const fetchedRecords = result.data || [];
        setRecords(fetchedRecords);
        updatePagination({
          page: result.current_page || page,
          limit: result.per_page || ITEMS_PER_PAGE,
          total: result.total ?? fetchedRecords.length,
          total_pages: result.last_page || Math.ceil((result.total || fetchedRecords.length) / ITEMS_PER_PAGE),
          is_last_page: result.current_page === result.last_page || (result.current_page >= (result.last_page || 1))
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load leave types');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      fetchInProgress.current = false;
    }
  }, [pagination.page, debouncedSearch, updatePagination]);

  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current) {
      loadRecords(pagination.page, debouncedSearch, true);
    }
  }, [pagination.page]); // eslint-disable-line

  useEffect(() => {
    if (!isInitialLoad) {
      if (pagination.page !== 1) goToPage(1);
      else loadRecords(1, debouncedSearch, true);
    }
  }, [debouncedSearch]); // eslint-disable-line

  // Initial data load - Guarded for single execution
  useEffect(() => {
    const company = JSON.parse(localStorage.getItem('company'));
    if (company?.id && !initialFetchStartedRef.current) {
      initialFetchStartedRef.current = true;
      loadRecords(1, "", true);
    } else if (!company?.id && isInitialLoad) {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [loadRecords, isInitialLoad]); // eslint-disable-line

  const handlePageChange = (page) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLeaveTypeAPI(deleteModal.record.id);
      toast.success('Leave type deleted');
      setDeleteModal({ open: false, record: null });
      loadRecords(pagination.page, debouncedSearch, false);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    if (createAccess.disabled) return;
    setFormModal({ open: true, record: null });
  };

  const openEditModal = (record) => {
    if (updateAccess.disabled) return;
    setFormModal({ open: true, record });
  };

  const openDeleteModal = (record) => {
    if (deleteAccess.disabled) return;
    setDeleteModal({ open: true, record });
  };

  // Responsive: progressively hide columns so the table NEVER overflows
  // At 768px only Code, Name, Type, Max Balance, Actions remain (5 cols = fits fine)
  const showStatus = windowWidth >= 1140;
  const showCarryFwd = windowWidth >= 1060;
  const showAccrual = windowWidth >= 960;
  const showHalfDay = windowWidth >= 880;
  const showWeekends = windowWidth >= 800;

  if (loading && records.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <FaSpinner className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 font-sans md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-800 md:text-3xl">
            <FaUmbrellaBeach className="text-slate-500" />
            Leave Configuration
          </h1>

          <div className="flex items-center gap-3">
            {loading && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 shadow-sm">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-blue-400" />
                Syncing…
              </span>
            )}
            <div className="rounded-full bg-white px-5 py-2 text-sm text-gray-600 shadow-md">
              <FaLayerGroup className="mr-2 inline text-slate-400" />
              {pagination.total} type{pagination.total !== 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              disabled={createAccess.disabled}
              title={createAccess.disabled ? createMessage : ''}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-violet-700 hover:to-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaPlus size={12} /> New Leave Type
            </button>
          </div>
        </motion.div>

        {/* ── Search ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, or accrual type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-md outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-700 text-sm">
            <FaExclamationCircle />
            {error}
            <button type="button" onClick={loadRecords} className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium hover:bg-red-200">Retry</button>
          </div>
        )}

        {/* ── Desktop Table (md+) ── */}
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden rounded-2xl border border-gray-100 bg-white shadow-xl md:block"
          >
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Max Balance</th>
                  {showCarryFwd && <th className="px-5 py-4">Carry Fwd</th>}
                  {showAccrual && <th className="px-5 py-4">Accrual</th>}
                  {showHalfDay && <th className="px-5 py-4">Half Day</th>}
                  {showWeekends && <th className="px-5 py-4">Weekends</th>}
                  {showStatus && <th className="px-5 py-4">Status</th>}
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition duration-150 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {record.code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{record.name}</td>
                    <td className="px-5 py-4"><PaidBadge isPaid={record.is_paid} /></td>
                    <td className="px-5 py-4 text-gray-600">{record.max_balance} days</td>
                    {showCarryFwd && <td className="px-5 py-4 text-gray-600">{record.carry_forward_limit} days</td>}
                    {showAccrual && (
                      <td className="px-5 py-4">
                        <span className="capitalize text-gray-600">{record.accrual_type}</span>
                        {record.accrual_type !== 'none' && (
                          <span className="ml-1 text-xs text-gray-400">({record.accrual_rate}d)</span>
                        )}
                      </td>
                    )}
                    {showHalfDay && <td className="px-5 py-4"><BoolCell value={record.allow_half_day} /></td>}
                    {showWeekends && (
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${record.exclude_weekends ? 'text-amber-600' : 'text-gray-400'}`}>
                          {record.exclude_weekends ? 'Excluded' : 'Included'}
                        </span>
                      </td>
                    )}
                    {showStatus && <td className="px-5 py-4"><ActiveBadge isActive={record.is_active} /></td>}
                    <td className="px-5 py-4">
                      <ActionMenu
                        record={record}
                        onView={(r) => setViewModal({ open: true, record: r })}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        editDisabled={updateAccess.disabled}
                        deleteDisabled={deleteAccess.disabled}
                        editMessage={updateMessage}
                        deleteMessage={deleteMessage}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {records.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                      {record.code}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800">{record.name}</h3>
                      <p className="mt-0.5 text-xs text-gray-400">{formatDate(record.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaidBadge isPaid={record.is_paid} />
                    <ActionMenu
                      record={record}
                      onView={(r) => setViewModal({ open: true, record: r })}
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                      editDisabled={updateAccess.disabled}
                      deleteDisabled={deleteAccess.disabled}
                      editMessage={updateMessage}
                      deleteMessage={deleteMessage}
                    />
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
                    <FaLayerGroup className="text-slate-400" />
                    Max: <strong className="ml-1 text-gray-800">{record.max_balance}d</strong>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
                    <FaRegClock className="text-slate-400" />
                    Carry: <strong className="ml-1 text-gray-800">{record.carry_forward_limit}d</strong>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
                    <FaCalendarCheck className="text-slate-400" />
                    <span className="capitalize">{record.accrual_type}</span>
                    {record.accrual_type !== 'none' && <span className="text-gray-400 ml-1">({record.accrual_rate}d)</span>}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
                    <FaCoins className="text-amber-400" />
                    Half day: <span className="ml-1"><BoolCell value={record.allow_half_day} /></span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <ActiveBadge isActive={record.is_active} />
                  {record.exclude_weekends && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">Excl. Weekends</span>
                  )}
                  {record.allow_negative_balance && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 border border-orange-200">Neg. Balance</span>
                  )}
                  {record.is_comp_off && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">Comp Off</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {records.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total || records.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            variant="default"
            showInfo={true}
          />
        )}

        {/* ── Empty State ── */}
        {!loading && records.length === 0 && (
          <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="rounded-2xl bg-white py-16 text-center shadow-md">
            <FaUmbrellaBeach className="mx-auto mb-4 text-5xl text-gray-200" />
            <p className="text-lg font-semibold text-gray-500">No leave types found</p>
            <p className="mt-1 text-sm text-gray-400 mb-6">
              {debouncedSearch ? 'Try adjusting your search.' : 'Get started by creating your first leave type.'}
            </p>
            {!debouncedSearch && (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={createAccess.disabled}
                title={createAccess.disabled ? createMessage : ''}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaPlus size={12} /> Create Leave Type
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewModal.open && (
          <ViewDetailsModal
            key="view-modal"
            record={viewModal.record}
            onClose={() => setViewModal({ open: false, record: null })}
            onEdit={openEditModal}
            editDisabled={updateAccess.disabled}
            editTitle={updateMessage}
          />
        )}
        {formModal.open && (
          <FormModal
            key="form-modal"
            editRecord={formModal.record}
            leaveTypeOptions={leaveTypeOptions}
            accrualTypeOptions={accrualTypeOptions}
            existingCodes={new Set(records.map((r) => r.code?.toUpperCase()))}
            onClose={() => setFormModal({ open: false, record: null })}
            onSaved={() => {
              setFormModal({ open: false, record: null });
              loadRecords(pagination.page, debouncedSearch, false);
            }}
            submitDisabled={formModal.record ? updateAccess.disabled : createAccess.disabled}
            submitTitle={formModal.record ? updateMessage : createMessage}
          />
        )}
        {deleteModal.open && (
          <DeleteModal
            key="delete-modal"
            leaveType={deleteModal.record}
            onClose={() => setDeleteModal({ open: false, record: null })}
            onConfirm={handleDelete}
            loading={deleting}
            submitDisabled={deleteAccess.disabled}
            submitTitle={deleteMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaveConfigManagement;
