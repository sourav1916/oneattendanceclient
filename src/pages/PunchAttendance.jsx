import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaFingerprint, FaClock, FaCoffee, FaSignInAlt, FaSignOutAlt,
  FaMapMarkerAlt, FaCamera, FaIdCard, FaWifi, FaHandPaper,
  FaCheckCircle, FaTimesCircle, FaUser, FaBuilding, FaGlobe,
  FaSearch, FaTimes, FaEye, FaArrowUp, FaArrowDown,
  FaChartBar, FaRegClock, FaCalendarAlt, FaExclamationCircle,
  FaBolt
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Pagination, { usePagination } from "../components/PaginationComponent";

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTENDANCE_ICONS = {
  gps: FaMapMarkerAlt, face: FaCamera, qr: FaIdCard,
  fingerprint: FaFingerprint, ip: FaWifi, manual: FaHandPaper,
};

const ACTION_CONFIG = {
  'punch-in':  { endpoint: '/attendance/punch-in',  allowedAction: 'PUNCH_IN',  label: 'Punch In',    sub: 'Start shift',  icon: FaSignInAlt,  cls: 'punch-in'  },
  'punch-out': { endpoint: '/attendance/punch-out', allowedAction: 'PUNCH_OUT', label: 'Punch Out',   sub: 'End shift',    icon: FaSignOutAlt, cls: 'punch-out' },
  'break-in':  { endpoint: '/attendance/break-in',  allowedAction: 'BREAK_IN',  label: 'Break',       sub: 'Start break',  icon: FaCoffee,     cls: 'break-in'  },
  'break-out': { endpoint: '/attendance/break-out', allowedAction: 'BREAK_OUT', label: 'Resume',      sub: 'End break',    icon: FaRegClock,   cls: 'break-out' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date, type = 'datetime') => {
  if (!date) return '—';
  const d = new Date(date);
  if (type === 'time') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (type === 'date') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const titleCase = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

const getPunchBadge = (type) => {
  const map = {
    in:          { label: 'Check In',    color: 'green' },
    out:         { label: 'Check Out',   color: 'red'   },
    break_start: { label: 'Break Start', color: 'amber' },
    break_end:   { label: 'Break End',   color: 'blue'  },
  };
  return map[type?.toLowerCase()] || { label: titleCase(type), color: 'gray' };
};

const getStatusBadge = (status) => {
  const map = {
    approved: { label: 'Approved', color: 'green' },
    pending:  { label: 'Pending',  color: 'amber' },
    rejected: { label: 'Rejected', color: 'red'   },
  };
  return map[status?.toLowerCase()] || { label: status || 'Unknown', color: 'gray' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Skeleton = ({ rows = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="att-skeleton" style={{ height: 48, opacity: 1 - i * 0.15 }} />
    ))}
  </div>
);

const StatusBar = ({ isPunchedIn, isBreakActive, lastAction, lastPunch, activeTab }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className={`att-status-dot ${isPunchedIn ? (isBreakActive ? 'amber' : 'green') : 'gray'}`} />
      <span className="att-mono" style={{ fontSize: 11, color: isPunchedIn ? (isBreakActive ? '#d97706' : '#059669') : '#475569', fontWeight: 500 }}>
        {isPunchedIn ? (isBreakActive ? 'ON BREAK' : 'ACTIVE') : 'OFF DUTY'}
      </span>
    </div>
    {activeTab && (
      <>
        <span style={{ color: '#e2e8f0' }}>│</span>
        <span className="att-mono" style={{ fontSize: 11, color: '#475569' }}>
          METHOD: <span style={{ color: '#64748b' }}>{activeTab.toUpperCase()}</span>
        </span>
      </>
    )}
    {lastPunch && (
      <>
        <span style={{ color: '#e2e8f0' }}>│</span>
        <span className="att-mono" style={{ fontSize: 11, color: '#94a3b8' }}>
          LAST: <span style={{ color: '#475569' }}>{lastAction} {fmt(lastPunch.time, 'time')}</span>
        </span>
      </>
    )}
  </div>
);

const ModeSelector = ({ currentMethod, activeMode, setActiveMode }) => {
  if (!currentMethod) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="att-mono" style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em' }}>MODE</span>
      <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 3, gap: 2, border: '1px solid #e5e7eb' }}>
        <button className={`att-mode-btn ${activeMode === 'manual' ? 'active' : ''}`}
          onClick={() => currentMethod.is_manual && setActiveMode('manual')}
          disabled={!currentMethod.is_manual}>MANUAL</button>
        <button className={`att-mode-btn ${activeMode === 'auto' ? 'active' : ''}`}
          onClick={() => currentMethod.is_auto && setActiveMode('auto')}
          disabled={!currentMethod.is_auto}>AUTO</button>
      </div>
    </div>
  );
};

const ActionButton = ({ actionKey, allowedActions, loadingAction, onAction }) => {
  const cfg = ACTION_CONFIG[actionKey];
  const Icon = cfg.icon;
  const isAllowed = allowedActions.includes(cfg.allowedAction);
  const isLoading = loadingAction === actionKey;

  return (
    <button
      className={`att-btn-action ${cfg.cls}`}
      disabled={!isAllowed || !!loadingAction}
      onClick={() => onAction(actionKey)}
      style={{ flex: 1 }}
    >
      <div className="att-btn-icon">
        {isLoading ? <span className="att-spinner" style={{ color: 'currentColor' }} /> : <Icon />}
      </div>
      <span style={{ fontSize: 12, letterSpacing: '0.02em' }}>{cfg.label}</span>
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{cfg.sub}</span>
    </button>
  );
};

const RecordModal = ({ record, onClose }) => {
  if (!record) return null;
  const punch = getPunchBadge(record.punch_type);
  const status = getStatusBadge(record.status);

  const rows = [
    { label: 'Punch Time', value: fmt(record.punch_time, 'datetime') + (record.punch_time ? ` (${fmt(record.punch_time, 'time')})` : '') },
    { label: 'Type', value: <span className={`att-badge ${punch.color}`}>{punch.label}</span> },
    { label: 'Status', value: <span className={`att-badge ${status.color}`}>{status.label}</span> },
    { label: 'Method', value: `${record.attendance?.method || '—'} / ${record.attendance?.mode || '—'}` },
    { label: 'Company', value: record.company?.name || '—' },
    { label: 'Employee', value: `${record.employee?.code || '—'} · ${titleCase(record.employee?.designation)}` },
    { label: 'IP Address', value: record.location?.ip_address || '—' },
    record.location?.latitude && { label: 'Coordinates', value: `${record.location.latitude}, ${record.location.longitude}` },
  ].filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div className="att-modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div className="att-modal"
          initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }} onClick={e => e.stopPropagation()}>
          <div className="att-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`att-badge ${punch.color}`}>{punch.label}</span>
              <span className="att-mono" style={{ fontSize: 12, color: '#64748b' }}>
                {fmt(record.punch_time, 'datetime')}
              </span>
            </div>
            <button className="att-close-btn" onClick={onClose}><FaTimes size={14} /></button>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rows.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span className="att-mono" style={{ fontSize: 10, color: '#9ca3af', width: 110, flexShrink: 0, paddingTop: 2, letterSpacing: '0.05em' }}>
                  {label.toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: '#4b5563' }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { attendanceMethods, user } = useAuth();
  const company = useMemo(() => JSON.parse(localStorage.getItem('company') ?? 'null'), []);

  // ── Punch state ──
  const [activeTab, setActiveTab] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [allowedActions, setAllowedActions] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [lastPunch, setLastPunch] = useState(null);

  const isPunchedIn = allowedActions.includes('PUNCH_OUT') || allowedActions.includes('BREAK_IN');
  const isBreakActive = allowedActions.includes('BREAK_OUT');

  // ── History state ──
  const [attendance, setAttendance] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('punch_time');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [histError, setHistError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  const { pagination, updatePagination, goToPage } = usePagination(1, 10);

  // ── Init tab ──
  useEffect(() => {
    if (attendanceMethods?.length > 0) {
      const first = attendanceMethods.find(m => m.is_manual === 1) || attendanceMethods[0];
      setActiveTab(first.method);
      setActiveMode(first.is_manual ? 'manual' : first.is_auto ? 'auto' : null);
    }
  }, [attendanceMethods]);

  // ── Sync mode on tab change ──
  useEffect(() => {
    if (!activeTab || !attendanceMethods) return;
    const cur = attendanceMethods.find(m => m.method === activeTab);
    if (!cur) return;
    if (activeMode === 'manual' && !cur.is_manual) setActiveMode(cur.is_auto ? 'auto' : null);
    else if (activeMode === 'auto' && !cur.is_auto) setActiveMode(cur.is_manual ? 'manual' : null);
    else if (!activeMode) setActiveMode(cur.is_manual ? 'manual' : cur.is_auto ? 'auto' : null);
  }, [activeTab, attendanceMethods]); // activeMode intentionally excluded

  // ── Fetch current status ──
  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await apiCall('/attendance/current-status', 'GET', null, company?.id);
        const data = await res.json();
        if (res.ok && data.success) {
          setAllowedActions(data.data.allowed_actions ?? []);
          if (data.data.last_punch) {
            setLastPunch({ type: data.data.last_punch.punch_type, time: data.data.last_punch.punch_time });
            setLastAction(data.data.last_punch.punch_type === 'in' ? 'Punched In' : 'Punched Out');
          }
        }
      } catch (e) {
        toast.error('Could not load attendance status.');
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []); // eslint-disable-line

  // ── Helpers ──
  const getCurrentLocation = useCallback(() =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
        reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }), []);

  const getPublicIP = useCallback(async () => {
    try { const r = await fetch('https://api.ipify.org?format=json'); return (await r.json()).ip; }
    catch { return ''; }
  }, []);

  const refreshStatus = useCallback(async () => {
    const r = await apiCall('/attendance/current-status', 'GET', null, company?.id);
    const d = await r.json();
    if (r.ok && d.success) setAllowedActions(d.data.allowed_actions ?? []);
  }, [company?.id]);

  // ── Single action handler ──
  const handleAction = useCallback(async (actionKey) => {
    const cfg = ACTION_CONFIG[actionKey];
    if (!cfg) return;
    setLoadingAction(actionKey);
    try {
      const method = activeTab || 'gps';
      const mode = activeMode || 'manual';
      const payload = { attendance_method: method, attendance_mode: mode };
      if (method === 'gps') { const loc = await getCurrentLocation(); Object.assign(payload, loc); }
      if (method === 'ip') { payload.ip_address = await getPublicIP(); }

      const res = await apiCall(cfg.endpoint, 'POST', payload, company?.id);
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshStatus();
        const time = new Date().toISOString();
        setLastPunch({ type: actionKey.includes('in') ? 'in' : 'out', time });
        setLastAction(cfg.label);
        const toastFn = actionKey === 'break-in' ? toast.info : toast.success;
        toastFn(`${cfg.label} recorded`);
        // Refresh history too
        fetchHistory(pagination.page, false);
      } else {
        toast.error(data.message || `Failed: ${cfg.label}`);
      }
    } catch (e) {
      if (e.code === 1) toast.error('Location permission denied.');
      else toast.error(e.message);
    } finally {
      setLoadingAction(null);
    }
  }, [activeTab, activeMode, company?.id, getCurrentLocation, getPublicIP, refreshStatus, pagination.page]);

  // ── History fetch ──
  const fetchHistory = useCallback(async (page = pagination.page, resetLoad = true) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    if (resetLoad) setHistLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await apiCall(`/attendance/my?${params}`, 'GET');
      if (!res.ok) throw new Error('Failed to fetch history');
      const result = await res.json();
      if (result.success) {
        setAttendance(result.data || []);
        updatePagination({
          page: result.page || page, limit: result.limit || pagination.limit,
          total: result.total || 0,
          total_pages: result.total_pages || Math.ceil((result.total || 0) / pagination.limit),
          is_last_page: result.page === result.total_pages,
        });
        setHistError(null);
      } else throw new Error(result.message);
    } catch (e) {
      setHistError(e.message);
      toast.error(e.message);
    } finally {
      setHistLoading(false);
      setIsInitialLoad(false);
      fetchInProgress.current = false;
    }
  }, [pagination.limit, debouncedSearch, updatePagination]);

  useEffect(() => {
    if (!initialFetchDone.current) { fetchHistory(1, true); initialFetchDone.current = true; }
  }, [fetchHistory]);

  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current) fetchHistory(pagination.page, true);
  }, [pagination.page]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!isInitialLoad) { if (pagination.page !== 1) goToPage(1); else fetchHistory(1, true); }
  }, [debouncedSearch]); // eslint-disable-line

  // ── Sorted records ──
  const sorted = useMemo(() => [...attendance].sort((a, b) => {
    const av = sortField === 'punch_time' ? new Date(a.punch_time).getTime() : a[sortField];
    const bv = sortField === 'punch_time' ? new Date(b.punch_time).getTime() : b[sortField];
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
  }), [attendance, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const stats = useMemo(() => ({
    total: attendance.length,
    approved: attendance.filter(a => a.status === 'approved').length,
    pending: attendance.filter(a => a.status === 'pending').length,
    checkIns: attendance.filter(a => a.punch_type === 'in').length,
    checkOuts: attendance.filter(a => a.punch_type === 'out').length,
  }), [attendance]);

  const currentMethod = attendanceMethods?.find(m => m.method === activeTab);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // ── No access guard ──
  if (!attendanceMethods || attendanceMethods.length === 0) {
    return (
      <>
        <div className="att-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="att-card" style={{ padding: 32, textAlign: 'center', maxWidth: 360 }}>
            <FaTimesCircle style={{ fontSize: 32, color: '#f43f5e', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Access Restricted</p>
            <p style={{ fontSize: 13, color: '#475569' }}>No attendance methods assigned. Contact your administrator.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Punch Attendance
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your work session and review punches
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {user?.name}
            </p>
          </div>

          <StatusBar
            isPunchedIn={isPunchedIn}
            isBreakActive={isBreakActive}
            lastAction={lastAction}
            lastPunch={lastPunch}
            activeTab={activeTab}
          />
        </motion.div>

        {/* PUNCH PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 mb-4"
        >

          {/* Tabs */}
          <div className="flex flex-wrap justify-between items-center p-4 border-b">
            <div className="flex gap-2 flex-wrap">
              {attendanceMethods.map(m => {
                const Icon = ATTENDANCE_ICONS[m.method] || FaFingerprint;
                return (
                  <button
                    key={m.method}
                    onClick={() => setActiveTab(m.method)}
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all
                      ${activeTab === m.method
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600'
                      }`}
                  >
                    <Icon size={10} /> {m.method}
                  </button>
                );
              })}
            </div>

            {activeTab && (
              <ModeSelector
                currentMethod={currentMethod}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
              />
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {Object.keys(ACTION_CONFIG).map(key => (
              <button
                key={key}
                onClick={() => handleAction(key)}
                disabled={!allowedActions.includes(ACTION_CONFIG[key].allowedAction)}
                className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl text-white
                bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
                transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.03]
                disabled:opacity-50"
              >
                {loadingAction === key
                  ? <FaSpinner className="animate-spin" />
                  : React.createElement(ACTION_CONFIG[key].icon)
                }
                <span className="text-sm">{ACTION_CONFIG[key].label}</span>
                <span className="text-xs opacity-80">{ACTION_CONFIG[key].sub}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Approved', value: stats.approved },
            { label: 'Pending', value: stats.pending },
            { label: 'Check-ins', value: stats.checkIns },
            { label: 'Check-outs', value: stats.checkOuts },
          ].map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-all">
              <p className="text-xl font-bold text-purple-600">{s.value}</p>
              <p className="text-xs text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search attendance..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl shadow-lg
            focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-3">Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Method</th>
                <th>Company</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {sorted.map(r => {
                const punch = getPunchBadge(r.punch_type);
                const status = getStatusBadge(r.status);

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer"
                    onClick={() => setSelectedRecord(r)}
                  >
                    <td className="p-3">{fmt(r.punch_time)}</td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs bg-gray-100`}>
                        {punch.label}
                      </span>
                    </td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs bg-gray-100`}>
                        {status.label}
                      </span>
                    </td>

                    <td>{r.attendance?.method}/{r.attendance?.mode}</td>
                    <td>{r.company?.name}</td>

                    <td>
                      <FaEye />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* PAGINATION */}
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={p => goToPage(p)}
          />
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4">Attendance Details</h2>
              <p><b>Time:</b> {fmt(selectedRecord.punch_time)}</p>
              <p><b>Status:</b> {selectedRecord.status}</p>
              <p><b>Type:</b> {selectedRecord.punch_type}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
