import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFingerprint, FaClock, FaCoffee, FaSignInAlt, FaSignOutAlt,
  FaMapMarkerAlt, FaCamera, FaIdCard, FaWifi, FaHandPaper,
  FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaHistory,
  FaHourglassHalf, FaPause, FaPlay
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
  WORKING: {
    label: 'Working',
    color: 'emerald',
    icon: FaPlay
  },
  ON_BREAK: {
    label: 'On Break',
    color: 'amber',
    icon: FaPause
  },
  OFF_DUTY: {
    label: 'Off Duty',
    color: 'slate',
    icon: FaTimesCircle
  }
};

// ─── Animation Variables ─────────────────────────────────────────────────────

const floatAnimation = {
  float: {
    translate: ["0px 0px", "30px -50px", "-20px 20px", "0px 0px"],
    scale: [1, 1.1, 0.9, 1],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" }
  }
};

const PunchAttendance = () => {
  const { attendanceMethods, user } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Status state from API
  const [currentStatus, setCurrentStatus] = useState(null);
  const [allowedActions, setAllowedActions] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);

  // Derived states
  const isPunchedIn = currentStatus === 'WORKING' || currentStatus === 'ON_BREAK';
  const isBreakActive = currentStatus === 'ON_BREAK';

  useEffect(() => {
    if (attendanceMethods && attendanceMethods.length > 0) {
      const firstMethod = attendanceMethods[0];
      setActiveTab(firstMethod.method);

      // Set default mode
      if (firstMethod.is_manual) setActiveMode('manual');
      else if (firstMethod.is_auto) setActiveMode('auto');
    }
  }, [attendanceMethods]);

  useEffect(() => {
    if (activeTab && attendanceMethods) {
      const currentMethod = attendanceMethods.find(m => m.method === activeTab);
      if (currentMethod) {
        // If current mode is not available in new tab, switch
        if (activeMode === 'manual' && !currentMethod.is_manual) {
          setActiveMode(currentMethod.is_auto ? 'auto' : null);
        } else if (activeMode === 'auto' && !currentMethod.is_auto) {
          setActiveMode(currentMethod.is_manual ? 'manual' : null);
        } else if (!activeMode) {
          if (currentMethod.is_manual) setActiveMode('manual');
          else if (currentMethod.is_auto) setActiveMode('auto');
        }
      }
    }
  }, [activeTab, attendanceMethods, activeMode]);

  // ─── Fetch Current Status ────────────────────────────────────────────────
  const fetchCurrentStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const response = await apiCall('/attendance/current-status', 'GET', null, company?.id);
      const data = await response.json();

      if (response.ok && data.success) {
        setCurrentStatus(data.data.status);
        setAllowedActions(data.data.allowed_actions || []);
        setTodaySummary(data.data.today_summary);
      } else {
        toast.error(data.message || 'Failed to fetch attendance status');
      }
    } catch (error) {
      console.error('Status fetch error:', error);
      toast.error('Error fetching attendance status');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch status on mount
  useEffect(() => {
    fetchCurrentStatus();
  }, [fetchCurrentStatus]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getIcon = (key) => ATTENDANCE_ICONS[key] || FaFingerprint;

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const getPublicIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("IP fetch failed:", error);
      return "";
    }
  };

  const callAttendanceAPI = async (endpoint, actionName) => {
    setLoadingAction(actionName);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const method = activeTab || "gps";
      const mode = activeMode || "manual";

      // ─── Build Request Payload ──────────────────────────────────────────
      const payload = {
        attendance_method: method,
        attendance_mode: mode
      };

      // Add GPS specific data
      if (method === 'gps') {
        const location = await getCurrentLocation();
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
      }

      // Add IP specific data 
      if (method === 'ip') {
        const ip = await getPublicIP();
        payload.ip_address = ip;
      }

      const response = await apiCall(endpoint, 'POST', payload, company?.id);

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh status after successful action
        await fetchCurrentStatus();
        return true;
      } else {
        toast.error(data.message || `Failed to ${actionName.replace('-', ' ')}`);
        return false;
      }
    } catch (error) {
      console.error(`${actionName} error:`, error);
      if (error.code === 1) {
        toast.error("Location permission denied. Please enable location to mark attendance.");
      } else {
        toast.error(`Error: ${error.message}`);
      }
      return false;
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePunchIn = async () => {
    const success = await callAttendanceAPI('/attendance/punch-in', 'punch-in');
    if (success) {
      toast.success("Successfully Punched In!");
    }
  };

  const handlePunchOut = async () => {
    const success = await callAttendanceAPI('/attendance/punch-out', 'punch-out');
    if (success) {
      toast.success("Successfully Punched Out!");
    }
  };

  const handleBreakIn = async () => {
    const success = await callAttendanceAPI('/attendance/break-in', 'break-in');
    if (success) {
      toast.info("Break Started");
    }
  };

  const handleBreakOut = async () => {
    const success = await callAttendanceAPI('/attendance/break-out', 'break-out');
    if (success) {
      toast.success("Break Ended - Welcome back!");
    }
  };

  // ─── Check if action is allowed ──────────────────────────────────────────
  const isActionAllowed = (action) => {
    return allowedActions.includes(action);
  };

  // ─── Format time ─────────────────────────────────────────────────────────
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // ─── Punch Helpers ─────────────────────────────────────────────

  const getPunchLabel = (type) => {
    switch (type) {
      case 'in':
        return 'Punch In';
      case 'out':
        return 'Punch Out';
      case 'break_start':
        return 'Break Start';
      case 'break_end':
        return 'Break End';
      default:
        return type;
    }
  };

  const getPunchStyle = (type) => {
    switch (type) {
      case 'in':
        return {
          color: 'bg-emerald-100 text-emerald-600',
          icon: <FaSignInAlt className="w-5 h-5" />
        };
      case 'out':
        return {
          color: 'bg-rose-100 text-rose-600',
          icon: <FaSignOutAlt className="w-5 h-5" />
        };
      case 'break_start':
        return {
          color: 'bg-amber-100 text-amber-600',
          icon: <FaPause className="w-5 h-5" />
        };
      case 'break_end':
        return {
          color: 'bg-indigo-100 text-indigo-600',
          icon: <FaPlay className="w-5 h-5" />
        };
      default:
        return {
          color: 'bg-slate-100 text-slate-600',
          icon: <FaClock className="w-5 h-5" />
        };
    }
  };


  const formatHours = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (!attendanceMethods || attendanceMethods.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md mx-4"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <FaTimesCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-slate-500">You don't have any attendance methods assigned to your profile. Please contact your company administrator.</p>
        </motion.div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.OFF_DUTY;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/30 font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 to-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 bg-white/60 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <FaCalendarAlt className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{currentDate}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mark your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Attendance</span>
              </h1>
              <p className="text-slate-500 mt-2 text-lg">Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span></p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <AnimatePresence mode="wait">
                {loadingStatus ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl border bg-slate-50 border-slate-200"
                  >
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-slate-500">Loading...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentStatus}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-sm bg-${statusConfig.color}-50 border-${statusConfig.color}-100 text-${statusConfig.color}-700`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {statusConfig.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-200/60 overflow-hidden"
        >
          {/* Method Tabs */}
          <div className="flex gap-2 p-4 bg-slate-50/50 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {attendanceMethods.map((m) => {
              const Icon = getIcon(m.method);
              const isActive = activeTab === m.method;
              return (
                <button
                  key={m.method}
                  onClick={() => setActiveTab(m.method)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl whitespace-nowrap transition-all duration-300 font-bold text-sm ${isActive
                    ? 'bg-white text-indigo-600 shadow-md border-slate-200 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-slate-300'}`} />
                  <span className="capitalize">{m.method}</span>
                </button>
              );
            })}
          </div>

          {/* Internal Method Options */}
          {activeTab && (
            (() => {
              const currentMethod = attendanceMethods.find(m => m.method === activeTab);
              if (!currentMethod) return null;

              const manualEnabled = currentMethod.is_manual === 1;
              const autoEnabled = currentMethod.is_auto === 1;

              return (
                <div className="px-8 py-4 bg-indigo-50/30 border-b border-slate-100 flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Validation Mode:</span>
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    <button
                      onClick={() => manualEnabled && setActiveMode('manual')}
                      disabled={!manualEnabled}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMode === 'manual'
                        ? 'bg-white text-indigo-600 shadow-sm outline outline-1 outline-indigo-100'
                        : 'text-slate-500 hover:text-slate-700'
                        } ${!manualEnabled ? 'opacity-40 grayscale cursor-not-allowed border-none shadow-none bg-transparent' : ''}`}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => autoEnabled && setActiveMode('auto')}
                      disabled={!autoEnabled}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeMode === 'auto'
                        ? 'bg-white text-indigo-600 shadow-sm outline outline-1 outline-indigo-100'
                        : 'text-slate-500 hover:text-slate-700'
                        } ${!autoEnabled ? 'opacity-40 grayscale cursor-not-allowed border-none shadow-none bg-transparent' : ''}`}
                    >
                      Auto
                    </button>
                  </div>
                </div>
              );
            })()
          )}

          {/* Action Content */}
          <div className="p-8 sm:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                {/* Punch Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <FaClock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800">Shift Actions</h3>
                      <p className="text-slate-500 text-sm">Start or end your formal work session</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: isActionAllowed('PUNCH_IN') ? 1.02 : 1, y: isActionAllowed('PUNCH_IN') ? -2 : 0 }}
                      whileTap={{ scale: isActionAllowed('PUNCH_IN') ? 0.98 : 1 }}
                      onClick={handlePunchIn}
                      disabled={!isActionAllowed('PUNCH_IN') || loadingAction === 'punch-in'}
                      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-3xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {loadingAction === 'punch-in' && (
                        <div className="absolute inset-0 bg-emerald-600/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-disabled:bg-slate-200">
                        <FaSignInAlt className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">Punch In</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: isActionAllowed('PUNCH_OUT') ? 1.02 : 1, y: isActionAllowed('PUNCH_OUT') ? -2 : 0 }}
                      whileTap={{ scale: isActionAllowed('PUNCH_OUT') ? 0.98 : 1 }}
                      onClick={handlePunchOut}
                      disabled={!isActionAllowed('PUNCH_OUT') || loadingAction === 'punch-out'}
                      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-3xl transition-all duration-300 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-200 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {loadingAction === 'punch-out' && (
                        <div className="absolute inset-0 bg-rose-600/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-disabled:bg-slate-200">
                        <FaSignOutAlt className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">Punch Out</span>
                    </motion.button>
                  </div>
                </div>

                {/* Break Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                      <FaCoffee className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800">Break Time</h3>
                      <p className="text-slate-500 text-sm">Manage your rest periods during work</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: isActionAllowed('BREAK_START') ? 1.02 : 1, y: isActionAllowed('BREAK_START') ? -2 : 0 }}
                      whileTap={{ scale: isActionAllowed('BREAK_START') ? 0.98 : 1 }}
                      onClick={handleBreakIn}
                      disabled={!isActionAllowed('BREAK_START') || loadingAction === 'break-in'}
                      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-3xl transition-all duration-300 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {loadingAction === 'break-in' && (
                        <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-disabled:bg-slate-200">
                        <FaCoffee className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">Start Break</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: isActionAllowed('BREAK_END') ? 1.02 : 1, y: isActionAllowed('BREAK_END') ? -2 : 0 }}
                      whileTap={{ scale: isActionAllowed('BREAK_END') ? 0.98 : 1 }}
                      onClick={handleBreakOut}
                      disabled={!isActionAllowed('BREAK_END') || loadingAction === 'break-out'}
                      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-3xl transition-all duration-300 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-200 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {loadingAction === 'break-out' && (
                        <div className="absolute inset-0 bg-indigo-600/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-disabled:bg-slate-200">
                        <FaSignInAlt className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">End Break</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Status Bar */}
          <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${currentStatus === 'WORKING' ? 'bg-emerald-500' : currentStatus === 'ON_BREAK' ? 'bg-amber-500' : 'bg-slate-400'} animate-pulse`}></div>
              <span className="text-sm text-slate-500 font-medium">Current Status: <span className="text-slate-900 font-bold">{statusConfig.label}</span></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Method</span>
              <span className="text-xs font-extra-bold text-indigo-600 px-2 py-0.5 bg-white rounded-lg shadow-sm">{activeTab}</span>
            </div>
          </div>
        </motion.div>

        {/* Today's Activity Summary */}
        {todaySummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-200/60 overflow-hidden"
          >
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <FaHistory className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">Today's Activity</h2>
                  <p className="text-slate-500 text-sm">Your attendance summary for today</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Total Hours</span>
                  <FaClock className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-3xl font-extrabold text-emerald-700">
                  {formatHours(todaySummary.total_worked_hours)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Break Time</span>
                  <FaCoffee className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-extrabold text-amber-700">
                  {todaySummary.total_break_minutes} min
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Total Punches</span>
                  <FaCheckCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-3xl font-extrabold text-indigo-700">
                  {todaySummary.total_punches}
                </p>
              </div>
            </div>

            {/* Punch History */}
            {/* Punch History */}
            {todaySummary.punches && todaySummary.punches.length > 0 && (
              <div className="px-8 pb-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FaHourglassHalf className="w-4 h-4 text-indigo-500" />
                  Punch History
                </h3>

                <div className="space-y-3">
                  {[...todaySummary.punches]
                    .sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time))
                    .map((punch, index) => {
                      const style = getPunchStyle(punch.punch_type);

                      return (
                        <motion.div
                          key={punch.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow"
                        >
                          {/* Left */}
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.color}`}>
                              {style.icon}
                            </div>

                            <div>
                              <p className="font-bold text-slate-800 capitalize">
                                {getPunchLabel(punch.punch_type)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {punch.attendance_method} • {punch.attendance_mode}
                              </p>
                            </div>
                          </div>

                          {/* Right */}
                          <div className="text-right">
                            <p className="font-bold text-slate-700">
                              {formatTime(punch.punch_time)}
                            </p>

                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${punch.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : punch.status === 'rejected'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}>
                              {punch.status}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* Floating Help Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-400 text-xs flex items-center justify-center gap-1">
            <FaHandPaper className="w-3 h-3" />
            Ensure you are within the designated area for {activeTab?.toUpperCase()} validation
          </p>
        </motion.div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-float {
          animation: float 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default PunchAttendance;