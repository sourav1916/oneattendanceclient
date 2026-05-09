import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHistory, FaSpinner, FaClock, FaUser, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaComment } from 'react-icons/fa';
import apiCall from '../utils/api';
import ModalScrollLock from './ModalScrollLock';
import { toast } from 'react-toastify';
import { formatMinutes } from '../utils/attendanceTime';

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed': return { className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: FaCheckCircle, text: 'Approved' };
    case 'rejected': return { className: 'bg-rose-50 text-rose-700 border-rose-100', icon: FaTimesCircle, text: 'Rejected' };
    case 'pending': return { className: 'bg-amber-50 text-amber-700 border-amber-100', icon: FaClock, text: 'Pending' };
    default: return { className: 'bg-slate-50 text-slate-700 border-slate-100', icon: FaInfoCircle, text: status || 'Unknown' };
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '---';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatTime = (timeString) => {
  if (!timeString) return '---';
  const parsed = new Date(`1970-01-01T${timeString}`);
  if (isNaN(parsed)) return timeString;
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatLogData = (data) => {
  if (!data) return '';
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  }
  return String(data);
};

const AttendanceLogsModal = ({ id, type, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchedKeyRef = useRef('');

  useEffect(() => {
    const fetchLogs = async () => {
      const requestKey = `${id}-${type}`;
      if (lastFetchedKeyRef.current === requestKey) return;

      setLoading(true);
      setError(null);
      lastFetchedKeyRef.current = requestKey;

      try {
        const companyId = JSON.parse(localStorage.getItem('company'))?.id;
        const response = await apiCall(`/attendance/logs?id=${id}&type=${type}`, 'GET', null, companyId);
        const data = await response.json();

        if (data.success) {
          setLogs(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch logs');
          toast.error(data.message || 'Failed to fetch logs');
        }
      } catch (err) {
        console.error('Fetch logs error:', err);
        setError('Error connecting to the server');
        lastFetchedKeyRef.current = '';
      } finally {
        setLoading(false);
      }
    };

    if (id && type) {
      fetchLogs();
    }
  }, [id, type]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-900/40"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200 m-auto min-h-[70vh] min-h-[50vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
              <FaHistory size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Attendance Logs</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Change history for {type} log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-500" />
              <p className="text-sm font-medium">Fetching history logs...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <FaTimesCircle size={32} />
              </div>
              <p className="text-slate-600 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Close
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <FaHistory size={32} />
              </div>
              <p className="text-slate-500 font-medium">No history logs available for this record.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {logs.map((log, index) => {
                const style = getStatusBadge(log.status);
                const StatusIcon = style.icon;
                const punchIn = log.attendance?.punch_in;
                const punchOut = log.attendance?.punch_out;
                const metrics = log.shift?.metrics;
                const flags = log.shift?.flags;

                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Log Header */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${style.className}`}>
                          <StatusIcon size={12} />
                          {style.text.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <FaClock size={11} className="text-slate-400" />
                          {formatDateTime(log.verified_at || log.created?.at || log.updated_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By:</span>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FaUser size={7} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">{log.verified_by?.name || log.created?.by?.name || "System"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Log Content */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Side: Punches */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Punches</h4>
                          <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Punch In</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-800">{formatTime(punchIn?.time)}</span>
                              {punchIn?.method && (
                                <span className="text-[8px] font-black bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-500 uppercase">{punchIn.method}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Punch Out</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-800">{formatTime(punchOut?.time)}</span>
                              {punchOut?.method && (
                                <span className="text-[8px] font-black bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-500 uppercase">{punchOut.method}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Metrics & Flags */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Metrics</h4>
                          <div className="h-px flex-1 bg-slate-100"></div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Worked</span>
                            <span className="text-xs font-bold text-emerald-600">{formatMinutes(metrics?.worked_minutes || 0)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Late</span>
                            <span className="text-xs font-bold text-rose-600">{formatMinutes(flags?.deductible?.minutes || 0)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Overtime</span>
                            <span className="text-xs font-bold text-indigo-600">{formatMinutes(flags?.overtime?.minutes || 0)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Half Day</span>
                            <span className="text-xs font-bold text-amber-600">{flags?.half_day?.enabled ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remark Footer */}
                    {log.remark && (
                      <div className="px-4 py-2 bg-amber-50/50 border-t border-slate-100 flex items-start gap-2">
                        <FaComment className="mt-1 text-amber-400 shrink-0" size={10} />
                        <p className="text-[11px] font-medium text-slate-600 italic">"{log.remark}"</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AttendanceLogsModal;
