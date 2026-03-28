import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFingerprint, FaClock, FaCoffee, FaSignInAlt, FaSignOutAlt,
  FaMapMarkerAlt, FaCamera, FaIdCard, FaWifi, FaHandPaper,
  FaCheckCircle, FaTimesCircle, FaCalendarAlt
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

  // Toggle states
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [lastAction, setLastAction] = useState(null);

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
        payload.mask_ip = ip;
      }

      const response = await apiCall(endpoint, 'POST', payload, company?.id);

      const data = await response.json();

      if (response.ok && data.success) {
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
      setIsPunchedIn(true);
      setLastAction('Punched In');
      toast.success("Successfully Punched In!");
    }
  };

  const handlePunchOut = async () => {
    const success = await callAttendanceAPI('/attendance/punch-out', 'punch-out');
    if (success) {
      setIsPunchedIn(false);
      setIsBreakActive(false); // Reset break if punching out
      setLastAction('Punched Out');
      toast.success("Successfully Punched Out!");
    }
  };

  const handleBreakIn = async () => {
    const success = await callAttendanceAPI('/attendance/break-in', 'break-in');
    if (success) {
      setIsBreakActive(true);
      setLastAction('On Break');
      toast.info("Break Started");
    }
  };

  const handleBreakOut = async () => {
    const success = await callAttendanceAPI('/attendance/break-out', 'break-out');
    if (success) {
      setIsBreakActive(false);
      setLastAction('Break Ended');
      toast.success("Break Ended - Welcome back!");
    }
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/30 font-sans">
      {/* Animated Background Elements (Matches Home.jsx) */}
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

            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPunchedIn ? 'active' : 'inactive'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-sm ${isPunchedIn
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                >
                  {isPunchedIn ? <FaCheckCircle className="w-4 h-4" /> : <FaTimesCircle className="w-4 h-4" />}
                  <span className="text-sm font-bold uppercase tracking-wide">
                    {isPunchedIn ? 'Logged In' : 'Off Duty'}
                  </span>
                </motion.div>
              </AnimatePresence>

              {isBreakActive && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl shadow-sm"
                >
                  <FaCoffee className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wide">On Break</span>
                </motion.div>
              )}
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePunchIn}
                      disabled={isPunchedIn || loadingAction === 'punch-in'}
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePunchOut}
                      disabled={!isPunchedIn || loadingAction === 'punch-out'}
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBreakIn}
                      disabled={!isPunchedIn || isBreakActive || loadingAction === 'break-in'}
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
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBreakOut}
                      disabled={!isBreakActive || loadingAction === 'break-out'}
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
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-sm text-slate-500 font-medium">Last Action: <span className="text-slate-900 font-bold">{lastAction || 'Pending Registration'}</span></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Method</span>
              <span className="text-xs font-extra-bold text-indigo-600 px-2 py-0.5 bg-white rounded-lg shadow-sm">{activeTab}</span>
            </div>
          </div>
        </motion.div>

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

