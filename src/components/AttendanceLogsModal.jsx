import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaHistory, FaSpinner, FaClock, FaUser, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaComment } from 'react-icons/fa';
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

const formatLabel = (value) => {
  if (!value) return '--';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const getLogsPayload = (payload) => {
  const responseData = payload?.data;

  if (Array.isArray(payload?.logs)) {
    return {
      logs: payload.logs,
      summary: payload.summary || null,
      pagination: payload.pagination || payload.meta || null,
      filters: payload.filters || null
    };
  }

  if (Array.isArray(responseData?.logs)) {
    return {
      logs: responseData.logs,
      summary: responseData.summary || null,
      pagination: responseData.meta || responseData.pagination || null,
      filters: responseData.filters || null
    };
  }

  if (Array.isArray(responseData)) {
    return {
      logs: responseData,
      summary: payload.summary || null,
      pagination: payload.pagination || null,
      filters: payload.filters || null
    };
  }

  return {
    logs: [],
    summary: responseData?.summary || payload?.summary || null,
    pagination: responseData?.meta || responseData?.pagination || payload?.pagination || null,
    filters: responseData?.filters || payload?.filters || null
  };
};

const AttendanceLogsModal = ({ id, type, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(null);
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
          const payload = getLogsPayload(data);
          setLogs(payload.logs);
          setSummary(payload.summary);
          setPagination(payload.pagination);
          setFilters(payload.filters);
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
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
              <FaHistory size={15} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Attendance Logs</h2>
              <p className="text-[11px] font-medium text-slate-500">Change history for {type} log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
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
            <div className="space-y-3 pb-2">
              {summary && (
                <div className="rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Summary</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {summary.employee?.name || 'Employee'} {summary.employee?.employee_code ? `(${summary.employee.employee_code})` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {summary.type || type}
                      {summary.attendance_date ? ` - ${summary.attendance_date}` : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Record</p>
                      <p className="text-xs font-black text-slate-800">{summary.attendance_id || '--'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Latest Activity</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{summary.latest_activity?.activity || '--'}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {summary.latest_activity?.updated_by || 'System'}
                        {summary.latest_activity?.time ? ` - ${formatTime(summary.latest_activity.time)}` : ''}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Logs</p>
                      <p className="text-xs font-black text-slate-800">{logs.length}</p>
                      <p className="text-[10px] text-slate-500">
                        {pagination?.current_page ? `Page ${pagination.current_page}` : 'Page 1'}
                        {pagination?.total_pages ? ` of ${pagination.total_pages}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {filters && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                  <span className="text-[10px] font-black tracking-widest text-slate-400">Activity Logs Against this record</span>
                  {filters.attendance_id && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      Attendance #{filters.attendance_id}
                    </span>
                  )}
                  {pagination?.total !== undefined && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      {pagination.total} total
                    </span>
                  )}
                  {pagination?.current_page && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      Page {pagination.current_page}{pagination.total_pages ? ` of ${pagination.total_pages}` : ''}
                    </span>
                  )}
                </div>
              )}

              {logs.map((log, index) => {
                const rawLogType = log.log_type || log.type || log.activity_type;
                const style = getStatusBadge(log.status || rawLogType);
                const StatusIcon = style.icon;
                const activityLabel = log.activity || log.action || formatLabel(rawLogType);
                const actorName = log.updated_by || log.verified_by?.name || log.created_by?.name || log.created?.by?.name || 'System';
                const actorRole = log.created_by?.role || log.verified_by?.role || log.created?.by?.role;
                const logType = (rawLogType || '').toLowerCase();
                const typeTone = logType === 'start' || logType === 'punch_in'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : logType === 'end' || logType === 'punch_out'
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : 'bg-slate-50 text-slate-700 border-slate-100';

                return (
                  <motion.div
                    key={log.log_id || log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${style.className}`}>
                          <StatusIcon size={12} />
                          {style.text.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${typeTone}`}>
                          {formatLabel(rawLogType)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <FaClock size={11} className="text-slate-400" />
                          {log.time ? formatTime(log.time) : formatDateTime(log.updated_at || log.verified_at || log.created?.at || log.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <div className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FaUser size={7} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 max-w-[140px] truncate">{actorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                        <div className="min-w-[150px]">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Activity: </span>
                          <span className="font-bold text-slate-800">{activityLabel}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Method: </span>
                          <span className="font-semibold text-slate-700">{formatLabel(log.method)}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Role: </span>
                          <span className="font-semibold text-slate-700">{formatLabel(actorRole)}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 uppercase tracking-wider">ID: </span>
                          <span className="font-semibold text-slate-700">{log.log_id || log.id || '--'}</span>
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
