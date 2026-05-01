import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHistory, FaSpinner, FaClock, FaUser, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import apiCall from '../utils/api';
import ModalScrollLock from './ModalScrollLock';
import { toast } from 'react-toastify';

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
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
              <table className="w-full text-sm text-left text-slate-600 min-w-[650px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Start Punch</th>
                    <th className="px-4 py-3">End Punch</th>
                    <th className="px-4 py-3">Updated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, index) => {
                    const style = getStatusBadge(log.status);
                    const StatusIcon = style.icon;

                    return (
                      <tr key={log.id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <FaClock size={11} className="text-slate-400" />
                            {formatDateTime(log.updated_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${style.className}`}>
                            <StatusIcon size={10} />
                            {style.text.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-700">{formatTime(log.start?.time)}</span>
                            {log.start?.method && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase font-bold">{log.start.method}</span>
                            )}
                          </div>
                          {log.start?.data && <div className="text-[10px] text-slate-500 truncate" title={formatLogData(log.start.data)}>{formatLogData(log.start.data)}</div>}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-700">{formatTime(log.end?.time)}</span>
                            {log.end?.method && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase font-bold">{log.end.method}</span>
                            )}
                          </div>
                          {log.end?.data && <div className="text-[10px] text-slate-500 truncate" title={formatLogData(log.end.data)}>{formatLogData(log.end.data)}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(log.updated_by?.name || log.updated_by?.id) ? (
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <FaUser size={8} />
                              </div>
                              <span className="text-xs font-semibold text-slate-700">{log.updated_by?.name || `ID: ${log.updated_by?.id}`}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AttendanceLogsModal;
