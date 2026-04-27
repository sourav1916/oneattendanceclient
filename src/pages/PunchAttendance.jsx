import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFingerprint, FaClock, FaCoffee, FaSignInAlt, FaSignOutAlt,
  FaMapMarkerAlt, FaCamera, FaIdCard, FaWifi, FaHandPaper,
  FaTimesCircle, FaCalendarAlt, FaHistory,
  FaPause, FaPlay
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import { fetchCurrentAttendanceStatus } from '../utils/attendanceStatus';
import { getPreciseLocation } from '../utils/geolocation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTENDANCE_ICONS = {
  gps: FaMapMarkerAlt,
  face: FaCamera,
  qr: FaIdCard,
  fingerprint: FaFingerprint,
  ip: FaWifi,
  manual: FaHandPaper
};

const STATUS_CONFIG = {
  WORKING:  { label: 'Working',  color: 'emerald', icon: FaPlay },
  ON_BREAK: { label: 'On Break', color: 'amber',   icon: FaPause },
  OFF_DUTY: { label: 'Off Duty', color: 'slate',   icon: FaTimesCircle }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PunchAttendance = () => {
  const { attendanceMethods, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState(null);
  const [activeMode, setActiveMode]       = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [allowedActions, setAllowedActions] = useState([]);
  const [todaySummary, setTodaySummary]   = useState(null);

  const isPunchedIn   = currentStatus === 'WORKING' || currentStatus === 'ON_BREAK';
  const isBreakActive = currentStatus === 'ON_BREAK';

  // ─── Init active tab & mode ────────────────────────────────────────────────
  useEffect(() => {
    if (attendanceMethods?.length > 0) {
      const first = attendanceMethods[0];
      setActiveTab(first.method);
      if (first.is_manual)      setActiveMode('manual');
      else if (first.is_auto)   setActiveMode('auto');
    }
  }, [attendanceMethods]);

  useEffect(() => {
    if (!activeTab || !attendanceMethods) return;
    const m = attendanceMethods.find(m => m.method === activeTab);
    if (!m) return;
    if (activeMode === 'manual' && !m.is_manual)
      setActiveMode(m.is_auto ? 'auto' : null);
    else if (activeMode === 'auto' && !m.is_auto)
      setActiveMode(m.is_manual ? 'manual' : null);
    else if (!activeMode) {
      if (m.is_manual)      setActiveMode('manual');
      else if (m.is_auto)   setActiveMode('auto');
    }
  }, [activeTab, attendanceMethods, activeMode]);

  // ─── Fetch status ──────────────────────────────────────────────────────────
  const fetchCurrentStatus = useCallback(async (forceRefresh = false) => {
    setLoadingStatus(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const data = await fetchCurrentAttendanceStatus(company?.id, { forceRefresh });
      if (data.success) {
        setCurrentStatus(data.data.status);
        setAllowedActions(data.data.allowed_actions || []);
        setTodaySummary(data.data.today_summary);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error fetching attendance status');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => { fetchCurrentStatus(); }, [fetchCurrentStatus]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getIcon = (key) => ATTENDANCE_ICONS[key] || FaFingerprint;

  const getPublicIP = async () => {
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const d = await r.json();
      return d.ip;
    } catch { return ''; }
  };

  const callAttendanceAPI = async (endpoint, actionName) => {
    setLoadingAction(actionName);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const method  = activeTab || 'gps';
      const mode    = activeMode || 'manual';
      const payload = { attendance_method: method, attendance_mode: mode };
      if (method === 'gps') { const loc = await getPreciseLocation(); Object.assign(payload, loc); }
      if (method === 'ip')  { payload.ip_address = await getPublicIP(); }
      const response = await apiCall(endpoint, 'POST', payload, company?.id);
      const data = await response.json();
      if (response.ok && data.success) { await fetchCurrentStatus(true); return true; }
      toast.error(data.message || `Failed to ${actionName.replace('-', ' ')}`);
      return false;
    } catch (err) {
      console.error(err);
      if (err.code === 1) toast.error('Location permission denied. Please enable location.');
      else toast.error(`Error: ${err.message}`);
      return false;
    } finally { setLoadingAction(null); }
  };

  const handlePunchIn  = async () => { if (await callAttendanceAPI('/attendance/punch-in',   'punch-in'))  toast.success('Successfully Punched In!'); };
  const handlePunchOut = async () => { if (await callAttendanceAPI('/attendance/punch-out',  'punch-out')) toast.success('Successfully Punched Out!'); };
  const handleBreakIn  = async () => { if (await callAttendanceAPI('/attendance/break-in',   'break-in'))  toast.info('Break Started'); };
  const handleBreakOut = async () => { if (await callAttendanceAPI('/attendance/break-out',  'break-out')) toast.success('Break Ended — Welcome back!'); };

  const isAllowed = (a) => allowedActions.includes(a);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!attendanceMethods || attendanceMethods.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-[10px] flex items-center justify-center mx-auto mb-5">
            <FaTimesCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-500 text-sm">No attendance methods are assigned to your profile. Contact your company administrator.</p>
        </motion.div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.OFF_DUTY;
  const StatusIcon = statusConfig.icon;
  const currentMethod = attendanceMethods.find(m => m.method === activeTab);
  const manualEnabled = currentMethod?.is_manual === 1;
  const autoEnabled   = currentMethod?.is_auto   === 1;

  // ─── Action button helper ──────────────────────────────────────────────────
  const ActionBtn = ({ label, icon: BtnIcon, action, handler, gradient, shadow, loadKey }) => {
    const allowed = isAllowed(action);
    const loading = loadingAction === loadKey;
    return (
      <motion.button
        whileHover={{ scale: allowed ? 1.02 : 1, y: allowed ? -2 : 0 }}
        whileTap={{ scale: allowed ? 0.97 : 1 }}
        onClick={handler}
        disabled={!allowed || !!loadingAction}
        className={`
          relative flex flex-col items-center justify-center gap-3
          w-full py-8 sm:py-10 rounded-[10px] sm:rounded-3xl font-bold text-white text-base sm:text-lg
          transition-all duration-300 overflow-hidden
          ${allowed ? `${gradient} ${shadow}` : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
        `}
      >
        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
            <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${allowed ? 'bg-white/20' : 'bg-slate-200'}`}>
          <BtnIcon className="w-6 h-6" />
        </div>
        <span>{label}</span>
      </motion.button>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/80 w-fit px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <FaCalendarAlt className="w-3 h-3 text-indigo-500 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{currentDate}</span>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${loadingStatus ? 'bg-slate-50 border-slate-200 text-slate-500' : `bg-${statusConfig.color}-50 border-${statusConfig.color}-100 text-${statusConfig.color}-700`}`}>
          {loadingStatus ? (
            <>
              <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <StatusIcon className="w-3 h-3" />
              <span className="text-xs font-bold uppercase tracking-wide">{statusConfig.label}</span>
            </>
          )}
        </div>
      </div>

        {/* ── Main Card ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl rounded-[10px] sm:rounded-3xl shadow-xl shadow-indigo-100/40 border border-slate-200/60 overflow-hidden"
        >
          {/* Method Tabs — icon-only on xs, icon+label on sm+ */}
          <div className="flex gap-1 p-3 bg-slate-50/70 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {attendanceMethods.map((m) => {
              const TabIcon = getIcon(m.method);
              const isActive = activeTab === m.method;
              return (
                <button
                  key={m.method}
                  onClick={() => setActiveTab(m.method)}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 font-semibold text-sm flex-shrink-0
                    ${isActive
                      ? 'bg-white text-indigo-600 shadow-md border border-slate-200/80 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                >
                  <TabIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-300'}`} />
                  <span className="hidden xs:inline capitalize">{m.method}</span>
                  {/* Fallback: show label on sm+ always */}
                  <span className="xs:hidden sm:inline capitalize">{m.method}</span>
                </button>
              );
            })}
          </div>

          {/* Validation Mode bar */}
          {activeTab && (
            <div className="px-4 sm:px-6 py-3 bg-indigo-50/30 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode:</span>
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => manualEnabled && setActiveMode('manual')}
                  disabled={!manualEnabled}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${activeMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                    ${!manualEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >Manual</button>
                <button
                  onClick={() => autoEnabled && setActiveMode('auto')}
                  disabled={!autoEnabled}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${activeMode === 'auto' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                    ${!autoEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >Auto</button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                {/* Shift Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <FaClock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-tight">Shift Actions</h3>
                      <p className="text-xs text-slate-500 hidden sm:block">Start or end your work session</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionBtn
                      label="Punch In" icon={FaSignInAlt} action="PUNCH_IN" handler={handlePunchIn}
                      gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                      shadow="shadow-lg shadow-emerald-200" loadKey="punch-in"
                    />
                    <ActionBtn
                      label="Punch Out" icon={FaSignOutAlt} action="PUNCH_OUT" handler={handlePunchOut}
                      gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                      shadow="shadow-lg shadow-rose-200" loadKey="punch-out"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Break Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                      <FaCoffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-tight">Break Time</h3>
                      <p className="text-xs text-slate-500 hidden sm:block">Manage your rest periods</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionBtn
                      label="Start Break" icon={FaCoffee} action="BREAK_START" handler={handleBreakIn}
                      gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                      shadow="shadow-lg shadow-amber-200" loadKey="break-in"
                    />
                    <ActionBtn
                      label="End Break" icon={FaSignInAlt} action="BREAK_END" handler={handleBreakOut}
                      gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                      shadow="shadow-lg shadow-indigo-200" loadKey="break-out"
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Status Bar */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0
                ${currentStatus === 'WORKING' ? 'bg-emerald-500' : currentStatus === 'ON_BREAK' ? 'bg-amber-500' : 'bg-slate-400'}
                animate-pulse`}
              />
              <span className="text-xs text-slate-500">
                Status: <span className="font-bold text-slate-800">{statusConfig.label}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Method</span>
              <span className="text-xs font-bold text-indigo-600 px-1.5 py-0.5 bg-white rounded-md shadow-sm capitalize">{activeTab}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Help tip ────────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 pb-4"
        >
          <FaHandPaper className="w-3 h-3" />
          Ensure you are within the designated area for <span className="font-semibold uppercase">{activeTab}</span> validation
        </motion.p>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(30px,-50px) scale(1.1); }
          66%       { transform: translate(-20px,20px) scale(0.9); }
        }
        .animate-float { animation: float 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @media (min-width: 480px) { .xs\\:inline { display: inline; } .xs\\:hidden { display: none; } }
      `}</style>
    </div>
  );
};

export default PunchAttendance;
