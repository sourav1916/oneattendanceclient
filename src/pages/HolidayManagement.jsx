import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import usePermissionAccess from '../hooks/usePermissionAccess';

// ==================== ICONS (inline SVG to avoid FA sizing issues) ====================
const Icon = {
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  Dots: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const MASTER_HOLIDAY_CACHE_TTL = 5 * 60 * 1000;
const COMPANY_HOLIDAY_CACHE_TTL = 30 * 1000;
const masterHolidayRequestCache = new Map();
const companyHolidayRequestCache = new Map();

const getMasterHolidayCacheKey = (year, month) => `${year}-${month}`;
const getCompanyHolidayCacheKey = (companyId) => `${companyId ?? 'none'}`;

const getCachedHolidayRequest = (cache, key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (cached.data && cached.expiresAt > Date.now()) return { type: 'data', value: cached.data };
  if (cached.promise) return { type: 'promise', value: cached.promise };
  cache.delete(key);
  return null;
};

const clearCompanyHolidayRequestCache = () => {
  companyHolidayRequestCache.clear();
};

// ==================== API SERVICE ====================
const holidayService = {
  getMasterHolidays: async (year, month) => {
    const cacheKey = getMasterHolidayCacheKey(year, month);
    const cached = getCachedHolidayRequest(masterHolidayRequestCache, cacheKey);
    if (cached?.type === 'data') return cached.value;
    if (cached?.type === 'promise') return cached.value;

    try {
      const requestPromise = (async () => {
        const response = await apiCall(`/holiday/master-holidays?year=${year}&month=${month}`, 'GET');
        const data = await response.json();
        const holidays = data.success ? data.data : [];
        masterHolidayRequestCache.set(cacheKey, {
          data: holidays,
          expiresAt: Date.now() + MASTER_HOLIDAY_CACHE_TTL
        });
        return holidays;
      })().catch((error) => {
        masterHolidayRequestCache.delete(cacheKey);
        throw error;
      });

      masterHolidayRequestCache.set(cacheKey, { promise: requestPromise });
      return await requestPromise;
    } catch (error) {
      console.error('Failed to fetch master holidays:', error);
      return [];
    }
  },
  getCompanyHolidays: async (companyId) => {
    if (!companyId) return [];

    const cacheKey = getCompanyHolidayCacheKey(companyId);
    const cached = getCachedHolidayRequest(companyHolidayRequestCache, cacheKey);
    if (cached?.type === 'data') return cached.value;
    if (cached?.type === 'promise') return cached.value;

    try {
      const requestPromise = (async () => {
        const response = await apiCall('/holiday/company/list', 'GET', null, companyId);
        const data = await response.json();
        const holidays = data.success ? data.data : [];
        companyHolidayRequestCache.set(cacheKey, {
          data: holidays,
          expiresAt: Date.now() + COMPANY_HOLIDAY_CACHE_TTL
        });
        return holidays;
      })().catch((error) => {
        companyHolidayRequestCache.delete(cacheKey);
        throw error;
      });

      companyHolidayRequestCache.set(cacheKey, { promise: requestPromise });
      return await requestPromise;
    } catch (error) {
      console.error('Failed to fetch company holidays:', error);
      return [];
    }
  },
  createHoliday: async (payload, companyId) => {
    try {
      const response = await apiCall('/holiday/create', 'POST', payload, companyId);
      clearCompanyHolidayRequestCache();
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Internal Server Error' };
    }
  },
  updateHoliday: async (payload, companyId) => {
    try {
      const response = await apiCall('/holiday/update', 'PUT', payload, companyId);
      clearCompanyHolidayRequestCache();
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Internal Server Error' };
    }
  },
  deleteHoliday: async (id, companyId) => {
    try {
      const response = await apiCall('/holiday/delete', 'DELETE', { id }, companyId);
      clearCompanyHolidayRequestCache();
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Internal Server Error' };
    }
  }
};

// ==================== HELPERS ====================
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const toCalendarDate = (value) => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return null;
};

const formatDate = (date) => {
  const d = toCalendarDate(date);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isSameDay = (a, b) => {
  const left = toCalendarDate(a);
  const right = toCalendarDate(b);
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Holiday type config
const HOLIDAY_CONFIG = {
  master_observance: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', text: 'text-amber-700', badge: 'Observance', badgeBg: 'bg-amber-100 text-amber-700' },
  master_optional: { bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-400', text: 'text-teal-700', badge: 'Optional', badgeBg: 'bg-teal-100 text-teal-700' },
  master_mandatory: { bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-400', text: 'text-rose-700', badge: 'National', badgeBg: 'bg-rose-100 text-rose-700' },
  company: { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', text: 'text-violet-700', badge: 'Corporate', badgeBg: 'bg-violet-100 text-violet-700' },
};

const getHolidayConfig = (holiday) => {
  if (!holiday) return null;
  if (holiday.source === 'company') return HOLIDAY_CONFIG.company;
  if (holiday.type === 'Observance') return HOLIDAY_CONFIG.master_observance;
  if (holiday.is_optional === 1) return HOLIDAY_CONFIG.master_optional;
  return HOLIDAY_CONFIG.master_mandatory;
};

// ==================== MODAL WRAPPER ====================
const Modal = ({ children, onClose, danger = false, panelClassName = 'sm:max-w-md' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    style={{ backgroundColor: 'rgba(15,15,25,0.65)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`bg-white w-full rounded-t-[10px] sm:rounded-xl shadow-2xl overflow-hidden ${panelClassName}`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

// ==================== CREATE HOLIDAY MODAL ====================
const CreateHolidayModal = ({ selectedDates, onClose, onCreateSuccess, initialName, submitDisabled = false, submitTitle = '' }) => {
  const [name, setName] = useState(initialName || '');
  const [isOptional, setIsOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 300);
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Holiday name is required'); return; }
    setLoading(true);
    const company = JSON.parse(localStorage.getItem('company') || '{}');
    const results = await Promise.all(selectedDates.map(date =>
      holidayService.createHoliday({ name: name.trim(), date: formatDate(date), is_optional: isOptional ? 1 : 0, company_id: company?.id }, company?.id)
    ));
    const ok = results.filter(r => r.success).length;
    if (ok > 0) { toast.success(`${ok} holiday${ok > 1 ? 's' : ''} created!`); onCreateSuccess(); onClose(); }
    else toast.error('Failed to create holiday');
    setLoading(false);
  };

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-0.5">New Holiday</p>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Add to Calendar</h2>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <Icon.Calendar />
            {selectedDates.length === 1 ? formatDate(selectedDates[0]) : `${selectedDates.length} dates selected`}
          </p>
        </div>
        <button onClick={onClose} className="mt-1 p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <Icon.X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Holiday Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Diwali, Republic Day…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all group">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isOptional ? 'bg-violet-500 border-violet-500' : 'border-gray-300 group-hover:border-violet-400'}`}>
            {isOptional && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <input type="checkbox" checked={isOptional} onChange={e => setIsOptional(e.target.checked)} className="sr-only" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Optional Holiday</p>
            <p className="text-xs text-gray-500 mt-0.5">Employees can choose to observe this day</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || submitDisabled}
          title={submitDisabled ? submitTitle : ''}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Icon.Spinner /> Creating…</> : <><Icon.Plus /> Create Holiday{selectedDates.length > 1 ? 's' : ''}</>}
        </button>
      </form>
    </Modal>
  );
};

// ==================== UPDATE HOLIDAY MODAL ====================
const UpdateHolidayModal = ({ holiday, onClose, onUpdateSuccess, submitDisabled = false, submitTitle = '' }) => {
  const [name, setName] = useState(holiday.name || '');
  const [isOptional, setIsOptional] = useState(holiday.is_optional === 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Holiday name is required'); return; }
    setLoading(true);
    const company = JSON.parse(localStorage.getItem('company') || '{}');
    const result = await holidayService.updateHoliday({ id: holiday.id, name: name.trim(), date: holiday.date, is_optional: isOptional ? 1 : 0 }, company?.id);
    if (result.success) { toast.success('Holiday updated!'); onUpdateSuccess(); onClose(); }
    else toast.error(result.error || 'Failed to update holiday');
    setLoading(false);
  };

  return (
    <Modal onClose={onClose}>
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-0.5">Edit Holiday</p>
          <h2 className="text-xl font-bold text-gray-900">Update Details</h2>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"><Icon.Calendar />{holiday.date}</p>
        </div>
        <button onClick={onClose} className="mt-1 p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"><Icon.X /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Holiday Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent focus:bg-white transition-all"
          />
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all group">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isOptional ? 'bg-violet-500 border-violet-500' : 'border-gray-300 group-hover:border-violet-400'}`}>
            {isOptional && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <input type="checkbox" checked={isOptional} onChange={e => setIsOptional(e.target.checked)} className="sr-only" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Optional Holiday</p>
            <p className="text-xs text-gray-500 mt-0.5">Employees can choose to observe this day</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading || submitDisabled}
          title={submitDisabled ? submitTitle : ''}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-200 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Icon.Spinner /> Updating…</> : <><Icon.Check /> Save Changes</>}
        </button>
      </form>
    </Modal>
  );
};

// ==================== DELETE CONFIRMATION MODAL ====================
const DeleteModal = ({ holiday, onClose, onDeleteSuccess, submitDisabled = false, submitTitle = '' }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDelete = async () => {
    setLoading(true);
    const company = JSON.parse(localStorage.getItem('company') || '{}');
    const result = await holidayService.deleteHoliday(holiday.id, company?.id);
    if (result.success) { toast.success('Holiday deleted'); onDeleteSuccess(); onClose(); }
    else toast.error(result.error || 'Failed to delete');
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} danger panelClassName="sm:max-w-lg sm:max-h-[90vh]">
      <div className="flex flex-col justify-center p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-5 text-red-500">
          <Icon.Trash />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Holiday?</h2>
        <p className="text-sm text-gray-500 mb-1">You're about to remove</p>
        <p className="text-base font-bold text-gray-800 mb-1">"{holiday.name}"</p>
        <p className="text-xs text-gray-400 mb-7">{holiday.date} · This cannot be undone</p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || submitDisabled}
            title={submitDisabled ? submitTitle : ''}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg shadow-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Icon.Spinner /> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ==================== ACTION MENU ====================
const ActionMenu = ({
  date,
  holidayInfo,
  onAction,
  onClose,
  createDisabled = false,
  updateDisabled = false,
  deleteDisabled = false,
  createMessage = '',
  updateMessage = '',
  deleteMessage = '',
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const isCompany = holidayInfo?.source === 'company';
  const canCreate = !holidayInfo || holidayInfo.source === 'master';

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -4 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1"
      onClick={e => e.stopPropagation()}
    >
      {canCreate && (
        <button
          onClick={() => { onAction(date, holidayInfo, 'create'); onClose(); }}
          disabled={createDisabled}
          title={createDisabled ? createMessage : ''}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
            <Icon.Plus />
          </span>
          {holidayInfo ? 'Add Corporate' : 'Add Holiday'}
        </button>
      )}
      {isCompany && (
        <>
          <button
            onClick={() => { onAction(date, holidayInfo, 'update'); onClose(); }}
            disabled={updateDisabled}
            title={updateDisabled ? updateMessage : ''}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Icon.Edit />
            </span>
            Edit Holiday
          </button>
          <div className="mx-3 h-px bg-gray-100" />
          <button
            onClick={() => { onAction(date, holidayInfo, 'delete'); onClose(); }}
            disabled={deleteDisabled}
            title={deleteDisabled ? deleteMessage : ''}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="w-7 h-7 rounded-lg bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
              <Icon.Trash />
            </span>
            Delete
          </button>
        </>
      )}
    </motion.div>
  );
};

// ==================== CALENDAR CELL ====================
const CalendarCell = ({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  holidayInfo,
  onAction,
  onMonthNavigate,
  createDisabled,
  updateDisabled,
  deleteDisabled,
  createMessage,
  updateMessage,
  deleteMessage,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = getHolidayConfig(holidayInfo);

  const handleCellClick = () => {
    if (!isCurrentMonth) onMonthNavigate(date);
  };

  return (
    <div
      onClick={handleCellClick}
      className={`
        relative min-h-[80px] sm:min-h-[100px] p-2 sm:p-2.5 flex flex-col gap-1 border-r border-b border-gray-100 transition-colors
        ${!isCurrentMonth ? 'bg-gray-50/60 cursor-pointer' : 'bg-white'}
        ${isToday ? 'ring-2 ring-inset ring-violet-400 z-10' : ''}
        ${holidayInfo && isCurrentMonth ? config.bg : ''}
      `}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span className={`
          text-xs sm:text-sm font-semibold leading-none
          ${!isCurrentMonth ? 'text-gray-300' : isToday ? 'text-violet-600' : 'text-gray-700'}
          ${isToday ? 'w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold' : ''}
        `}>
          {dayNumber}
        </span>

        {/* Action menu trigger — only for current month */}
        {isCurrentMonth && (
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
              className={`p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 ${menuOpen ? 'bg-gray-200 opacity-100' : 'hover:bg-gray-100/80'} text-gray-400 hover:text-gray-600`}
              style={{ opacity: menuOpen ? 1 : undefined }}
            >
              <Icon.Dots />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <ActionMenu
                  date={date}
                  holidayInfo={holidayInfo}
                  onAction={onAction}
                  onClose={() => setMenuOpen(false)}
                  createDisabled={createDisabled}
                  updateDisabled={updateDisabled}
                  deleteDisabled={deleteDisabled}
                  createMessage={createMessage}
                  updateMessage={updateMessage}
                  deleteMessage={deleteMessage}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Holiday info */}
      {holidayInfo && isCurrentMonth && (
        <div className="flex-1 mt-0.5">
          <div className={`flex items-start gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${config.dot}`} />
            <div className="min-w-0">
              <p className={`text-[10px] sm:text-xs font-semibold leading-snug truncate ${config.text}`}>
                {holidayInfo.name}
              </p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full ${config.badgeBg}`}>
                {config.badge}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Small dot for non-current month holidays */}
      {holidayInfo && !isCurrentMonth && (
        <div className="w-1 h-1 rounded-full bg-gray-300 mt-1" />
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const HolidayManagementCalendar = () => {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [currentDate, setCurrentDate] = useState(() => toCalendarDate(new Date()) || new Date());
  const [allHolidays, setAllHolidays] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'update' | 'delete'
  const [modalData, setModalData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchLock = useRef(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = useMemo(() => toCalendarDate(new Date()) || new Date(), []);
  const createAccess = checkActionAccess('holidayManagement', 'create');
  const updateAccess = checkActionAccess('holidayManagement', 'update');
  const deleteAccess = checkActionAccess('holidayManagement', 'delete');
  const createMessage = getAccessMessage(createAccess);
  const updateMessage = getAccessMessage(updateAccess);
  const deleteMessage = getAccessMessage(deleteAccess);

  // Fetch holidays for current month
  useEffect(() => {
    let active = true;
    const key = `${currentYear}-${currentMonth}`;

    const fetchHolidays = async () => {
      // Skip cache only when not a forced refresh (refreshKey > 0 means invalidate)
      if (allHolidays[key] && refreshKey === 0) { setIsLoading(false); return; }
      // Reset lock so a fresh request always runs after a refresh
      fetchLock.current = null;
      setIsLoading(true);
      const company = JSON.parse(localStorage.getItem('company') || '{}');
      const activePromise = (async () => {
        const [masterData, companyData] = await Promise.all([
          holidayService.getMasterHolidays(currentYear, currentMonth + 1),
          holidayService.getCompanyHolidays(company?.id)
        ]);
        const map = {};
        masterData.forEach(h => { map[h.date] = { ...h, source: 'master' }; });
        companyData.forEach(h => {
          const d = new Date(h.date);
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            map[h.date] = { ...h, source: 'company' };
          }
        });
        return map;
      })();
      fetchLock.current = { key, promise: activePromise };
      try {
        const data = await activePromise;
        if (active) setAllHolidays(prev => ({ ...prev, [key]: data }));
      } catch (e) { console.error(e); fetchLock.current = null; }
      finally { if (active) setIsLoading(false); }
    };

    fetchHolidays();
    return () => { active = false; };
  }, [currentYear, currentMonth, refreshKey]);

  const getHolidayForDate = useCallback((date) => {
    const key = `${currentYear}-${currentMonth}`;
    return (allHolidays[key] || {})[formatDate(date)] || null;
  }, [allHolidays, currentYear, currentMonth]);

  const handleAction = useCallback((date, holiday, action) => {
    if (action === 'create' && createAccess.disabled) return;
    if (action === 'update' && updateAccess.disabled) return;
    if (action === 'delete' && deleteAccess.disabled) return;
    if (action === 'create') {
      setModalData({ dates: [date], initialName: holiday?.name || '' });
      setActiveModal('create');
    } else if (action === 'update') {
      setModalData(holiday);
      setActiveModal('update');
    } else if (action === 'delete') {
      setModalData(holiday);
      setActiveModal('delete');
    }
  }, [createAccess.disabled, deleteAccess.disabled, updateAccess.disabled]);

  const closeModal = useCallback(() => { setActiveModal(null); setModalData(null); }, []);

  const handleRefresh = useCallback(() => {
    // Increment refreshKey to force the fetch useEffect to re-run even if
    // currentYear/currentMonth hasn't changed (same month after CUD ops).
    setAllHolidays({});
    setRefreshKey(k => k + 1);
  }, []);

  const changeMonth = (delta) => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  // Build grid
  const grid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
    const cells = [];
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    for (let i = 0; i < total; i++) {
      let date, dayNumber, isCurrentMonth;
      if (i < firstDay) {
        dayNumber = prevMonthDays - (firstDay - i - 1);
        date = new Date(currentYear, currentMonth - 1, dayNumber);
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        dayNumber = i - (firstDay + daysInMonth) + 1;
        date = new Date(currentYear, currentMonth + 1, dayNumber);
        isCurrentMonth = false;
      } else {
        dayNumber = i - firstDay + 1;
        date = new Date(currentYear, currentMonth, dayNumber);
        isCurrentMonth = true;
      }
      cells.push({ date, dayNumber, isCurrentMonth, isToday: isSameDay(date, today), holidayInfo: getHolidayForDate(date) });
    }
    return cells;
  }, [currentYear, currentMonth, today, getHolidayForDate]);

  const handleMonthNavigate = useCallback((date) => {
    const d = toCalendarDate(date);
    if (d) setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  // Stats
  const stats = useMemo(() => {
    const key = `${currentYear}-${currentMonth}`;
    const map = allHolidays[key] || {};
    const vals = Object.values(map);
    return {
      total: vals.length,
      mandatory: vals.filter(h => h.source === 'master' && h.is_optional !== 1 && h.type !== 'Observance').length,
      optional: vals.filter(h => h.is_optional === 1).length,
      corporate: vals.filter(h => h.source === 'company').length,
    };
  }, [allHolidays, currentYear, currentMonth]);

  const isCurrentMonthToday = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Holiday Calendar</h1>
            <p className="text-xs text-gray-400 mt-1">Manage corporate and national holidays for your organization.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-white' },
            { label: 'National', value: stats.mandatory, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Optional', value: stats.optional, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Corporate', value: stats.corporate, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 sm:p-4 border border-gray-100 shadow-sm`}>
              <p className={`text-lg sm:text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-[9px] sm:text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── Consolidated Filter & View Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6"
        >
          {/* Left Section: Month Nav */}
          <div className="flex items-center justify-between lg:justify-start gap-4 flex-1">
            <button
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-colors"
            >
              <Icon.ChevronLeft />
            </button>
            <div className="text-center min-w-[140px]">
              <h2 className="text-lg font-bold text-slate-800">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-colors"
            >
              <Icon.ChevronRight />
            </button>
          </div>

          {/* Right Section: Controls */}
          <div className="flex items-center gap-3 justify-end">
            {!isCurrentMonthToday && (
              <button
                onClick={() => setCurrentDate(toCalendarDate(new Date()) || new Date())}
                className="px-4 py-2.5 text-sm font-bold text-violet-600 bg-white rounded-xl border border-violet-200 hover:bg-violet-50 transition-all shadow-sm active:scale-95"
              >
                Today
              </button>
            )}
          </div>
        </motion.div>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative">
            <div className="grid grid-cols-7 group">
              {grid.map((cell, i) => (
                <CalendarCell
                  key={i}
                  {...cell}
                  onAction={handleAction}
                  onMonthNavigate={handleMonthNavigate}
                  createDisabled={createAccess.disabled}
                  updateDisabled={updateAccess.disabled}
                  deleteDisabled={deleteAccess.disabled}
                  createMessage={createMessage}
                  updateMessage={updateMessage}
                  deleteMessage={deleteMessage}
                />
              ))}
            </div>

            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-b-2xl"
                >
                  <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100">
                    <Icon.Spinner />
                    <span className="text-xs font-semibold text-gray-600">Loading holidays…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center pb-4">
          {[
            { dot: 'bg-rose-400', label: 'National / Mandatory' },
            { dot: 'bg-teal-400', label: 'Optional' },
            { dot: 'bg-amber-400', label: 'Observance' },
            { dot: 'bg-violet-500', label: 'Corporate' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'create' && modalData && (
          <CreateHolidayModal
            selectedDates={modalData.dates}
            initialName={modalData.initialName}
            onClose={closeModal}
            onCreateSuccess={handleRefresh}
            submitDisabled={createAccess.disabled}
            submitTitle={createAccess.disabled ? createMessage : ''}
          />
        )}
        {activeModal === 'update' && modalData && (
          <UpdateHolidayModal
            holiday={modalData}
            onClose={closeModal}
            onUpdateSuccess={handleRefresh}
            submitDisabled={updateAccess.disabled}
            submitTitle={updateAccess.disabled ? updateMessage : ''}
          />
        )}
        {activeModal === 'delete' && modalData && (
          <DeleteModal
            holiday={modalData}
            onClose={closeModal}
            onDeleteSuccess={handleRefresh}
            submitDisabled={deleteAccess.disabled}
            submitTitle={deleteAccess.disabled ? deleteMessage : ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HolidayManagementCalendar;
