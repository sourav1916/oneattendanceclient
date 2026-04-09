import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaEye,
  FaHistory,
  FaHourglassEnd,
  FaHourglassStart,
  FaMapMarkerAlt,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaStickyNote,
  FaTimes,
  FaTimesCircle,
  FaCoffee,
  FaWifi,
  FaTh,
  FaListUl
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import apiCall from '../utils/api';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

// ─── API Integration ─────────────────────────────────────────────────────────

const FETCH_LIMIT = 200;
const ITEMS_PER_PAGE = 8;

const fetchAttendanceAPI = async ({ companyId }) => {
  const response = await apiCall(`/attendance/my?page=1&limit=${FETCH_LIMIT}`, 'GET', null, companyId);

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || 'Failed to fetch attendance');
  }

  return json; // { success, message, total, page, limit, total_pages, data: PunchRecord[] }
};

// ─── Data Transformation ──────────────────────────────────────────────────────
const deriveDailyRecords = (punches) => {
  const byDate = {};

  punches.forEach((punch) => {
    const date = punch.punch_time.split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(punch);
  });

  return Object.entries(byDate)
    .map(([date, dayPunches]) => {
      const sorted = [...dayPunches].sort(
        (a, b) => new Date(a.punch_time) - new Date(b.punch_time)
      );

      const inPunch = sorted.find((p) => p.punch_type === 'in');
      const outPunch = [...sorted].reverse().find((p) => p.punch_type === 'out');
      const breakStarts = sorted.filter((p) => p.punch_type === 'break_start');
      const breakEnds = sorted.filter((p) => p.punch_type === 'break_end');

      // Calculate worked hours (in → out, minus breaks)
      let workedMs = 0;
      if (inPunch && outPunch) {
        workedMs = new Date(outPunch.punch_time) - new Date(inPunch.punch_time);

        // Subtract each break window
        const maxBreaks = Math.min(breakStarts.length, breakEnds.length);
        for (let i = 0; i < maxBreaks; i++) {
          const breakDuration =
            new Date(breakEnds[i].punch_time) - new Date(breakStarts[i].punch_time);
          if (breakDuration > 0) workedMs -= breakDuration;
        }
      }

      const workedHours =
        workedMs > 0 ? `${(workedMs / 3_600_000).toFixed(1)} hrs` : inPunch ? 'In progress' : '0 hrs';

      // Derive status
      let status = 'Absent';
      if (inPunch && outPunch) status = 'Present';
      else if (inPunch) status = 'Present'; // clocked in, not yet out

      // Location from first available punch
      const locPunch = inPunch || sorted[0];
      const location =
        locPunch?.location?.ip_address ||
        (locPunch?.location?.latitude ? 'GPS Tracked' : null) ||
        (sorted[0]?.attendance?.mode === 'manual' ? 'Manual Entry' : 'Remote');

      // Method / mode
      const method = sorted[0]?.attendance?.method || '-';
      const mode = sorted[0]?.attendance?.mode || '-';

      // API-level status (pending / approved / rejected)
      const apiStatus = sorted[0]?.status || '-';

      return {
        id: sorted[0]?.id,
        date,
        day: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        clock_in: inPunch ? formatTimestamp(inPunch.punch_time) : '--:-- --',
        clock_out: outPunch ? formatTimestamp(outPunch.punch_time) : '--:-- --',
        status,
        api_status: apiStatus,
        location,
        worked_hours: workedHours,
        breaks: breakStarts.length,
        method,
        mode,
        punches: sorted, // raw punches for detail modal
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTimestamp = (iso) => {
  if (!iso) return '--:-- --';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTimeFull = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return { icon: FaCheckCircle, className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
    case 'absent':
      return { icon: FaTimesCircle, className: 'bg-red-100 text-red-800 border border-red-200' };
    case 'late':
      return { icon: FaClock, className: 'bg-amber-100 text-amber-800 border border-amber-200' };
    case 'half day':
      return { icon: FaHourglassStart, className: 'bg-orange-100 text-orange-800 border border-orange-200' };
    case 'holiday':
      return { icon: FaCalendarAlt, className: 'bg-purple-100 text-purple-800 border border-purple-200' };
    default:
      return { icon: FaExclamationCircle, className: 'bg-gray-100 text-gray-700 border border-gray-200' };
  }
};

const getApiStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  }
};

const punchTypeLabel = (type) => {
  switch (type) {
    case 'in': return { label: 'Clock In', color: 'text-emerald-600', icon: FaSignInAlt };
    case 'out': return { label: 'Clock Out', color: 'text-red-500', icon: FaSignOutAlt };
    case 'break_start': return { label: 'Break Start', color: 'text-amber-500', icon: FaCoffee };
    case 'break_end': return { label: 'Break End', color: 'text-blue-500', icon: FaCoffee };
    default: return { label: type, color: 'text-gray-500', icon: FaClock };
  }
};

// ─── Info Item ────────────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {icon}
      {label}
    </label>
    <div className="text-sm font-medium text-gray-800">{value || '-'}</div>
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

const modalVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { opacity: 0, scale: 0.93, y: 24, transition: { duration: 0.2 } },
};

const DetailsModal = ({ record, onClose }) => {
  if (!record) return null;

  const statusStyle = getStatusBadge(record.status);
  const StatusIcon = statusStyle.icon;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
        onClick={onClose}
      >
        <ModalScrollLock />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <FaEye className="text-slate-300" />
              Attendance Details
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/20">
              <FaTimes size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Date & Status Row */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5 max-[390px]:flex-col">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{formatDateFull(record.date)}</h3>
                <p className="mt-0.5 text-sm text-gray-400">{record.day}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusStyle.className}`}>
                    <StatusIcon size={11} />
                    {record.status}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${getApiStatusBadge(record.api_status)}`}>
                    {record.api_status}
                  </span>
                </div>
              </div>
              <div className="min-w-[90px] rounded-xl border border-gray-100 bg-gray-50 p-3 text-center max-[390px]:w-full max-[390px]:min-w-0">
                <FaChartLine className="mx-auto mb-1 text-lg text-slate-500" />
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Worked</p>
                <p className="font-bold text-gray-800">{record.worked_hours}</p>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoItem icon={<FaSignInAlt className="text-emerald-500" />} label="Clock In" value={record.clock_in} />
              <InfoItem icon={<FaSignOutAlt className="text-red-400" />} label="Clock Out" value={record.clock_out} />
              <InfoItem icon={<FaMapMarkerAlt className="text-blue-500" />} label="Location" value={record.location} />
              <InfoItem icon={<FaCoffee className="text-amber-500" />} label="Breaks" value={record.breaks > 0 ? `${record.breaks} break(s)` : 'None'} />
              <InfoItem icon={<FaWifi className="text-slate-400" />} label="Method" value={`${record.method} / ${record.mode}`} />
            </div>

            {/* Punch Timeline */}
            {record.punches?.length > 0 && (
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Punch Timeline</h4>
                <div className="space-y-2">
                  {record.punches.map((punch) => {
                    const { label, color, icon: PunchIcon } = punchTypeLabel(punch.punch_type);
                    return (
                      <div
                        key={punch.id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <PunchIcon className={`text-sm ${color}`} />
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getApiStatusBadge(punch.status)}`}>
                            {punch.status}
                          </span>
                        </div>
                        <span className="break-words text-sm text-gray-500">{formatDateTimeFull(punch.punch_time)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

// ─── Main Component ───────────────────────────────────────────────────────────

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]); // client-side search pool
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const { pagination, updatePagination, goToPage } = usePagination(1, ITEMS_PER_PAGE);
  const initialFetchStartedRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Resize ───────────────────────────────────────────────────────────────
  // ── Fetch from real API ───────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const result = await fetchAttendanceAPI({
        companyId: company?.id,
      });

      const daily = deriveDailyRecords(result.data || []);
      setAllRecords(daily);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load attendance.');
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }

  }, []);

  useEffect(() => {
    if (initialFetchStartedRef.current) return;
    initialFetchStartedRef.current = true;
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Client-side search + pagination ──────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!debouncedSearch) {
      return allRecords;
    }

    const query = debouncedSearch.toLowerCase();
    return allRecords.filter(
      (record) =>
        record.date.includes(debouncedSearch)
        || record.status.toLowerCase().includes(query)
        || record.location?.toLowerCase().includes(query)
        || record.day.toLowerCase().includes(query)
    );
  }, [allRecords, debouncedSearch]);

  useEffect(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    setRecords(filteredRecords.slice(startIndex, startIndex + pagination.limit));
    updatePagination({
      page: pagination.page,
      limit: pagination.limit,
      total: filteredRecords.length,
      total_pages: Math.ceil(filteredRecords.length / pagination.limit) || 1,
      is_last_page: pagination.page >= (Math.ceil(filteredRecords.length / pagination.limit) || 1)
    });
  }, [filteredRecords, pagination.page, pagination.limit, updatePagination]);

  useEffect(() => {
    if (pagination.page !== 1) {
      goToPage(1);
    }
  }, [debouncedSearch, goToPage, pagination.page]);

  // ── Responsive columns ────────────────────────────────────────────────────
  const showClockOut = windowWidth >= 1024;
  const showLocation = windowWidth >= 1280;
  const showApiStatus = windowWidth >= 1440;

  const openDetails = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  // ── Initial skeleton ──────────────────────────────────────────────────────
  if (loading && allRecords.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl p-3 sm:p-6">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 font-sans md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-800 md:text-3xl">
            <FaHistory className="text-slate-500" />
            Attendance History
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3">
            {loading && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-600 shadow-sm sm:px-4 sm:text-xs">
                <span className="inline-block h-2 w-2 animate-ping rounded-full bg-blue-400" />
                Syncing…
              </span>
            )}
            <div className="rounded-full bg-white px-4 py-2 text-xs text-gray-600 shadow-md sm:px-5 sm:text-sm">
              <FaCalendarAlt className="mr-2 inline text-slate-400" />
              {pagination.total} record{pagination.total !== 1 ? 's' : ''}
            </div>
          </div>
        </motion.div>

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by date, status, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-md outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-red-700">
            <FaExclamationCircle />
            {error}
            <button
              type="button"
              onClick={() => fetchAttendance()}
              className="ml-auto rounded-lg bg-red-100 px-3 py-1 text-xs font-medium hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Desktop Table ───────────────────────────────────────────────── */}
        {records.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${viewMode === 'table' ? 'overflow-hidden' : 'hidden'} rounded-2xl border border-gray-100 bg-white shadow-xl`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Day</th>
                    <th className="px-5 py-4">Clock In</th>
                    {showClockOut && <th className="px-5 py-4">Clock Out</th>}
                    <th className="px-5 py-4">Worked</th>
                    <th className="px-5 py-4">Status</th>
                    {showLocation && <th className="px-5 py-4">Location</th>}
                    {showApiStatus && <th className="px-5 py-4">Approval</th>}
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {records.map((record, index) => {
                    const style = getStatusBadge(record.status);
                    const StatusIcon = style.icon;

                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="transition duration-150 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4 font-medium text-gray-800">{formatDateFull(record.date)}</td>
                        <td className="px-5 py-4 text-gray-400">{record.day}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1">
                            <FaSignInAlt className="text-emerald-500" />
                            {record.clock_in}
                          </span>
                        </td>
                        {showClockOut && (
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1">
                              <FaSignOutAlt className="text-red-400" />
                              {record.clock_out}
                            </span>
                          </td>
                        )}
                        <td className="px-5 py-4 text-gray-600">{record.worked_hours}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
                            <StatusIcon size={11} />
                            {record.status}
                          </span>
                        </td>
                        {showLocation && (
                          <td className="px-5 py-4 text-gray-500 text-xs">{record.location}</td>
                        )}
                        {showApiStatus && (
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getApiStatusBadge(record.api_status)}`}>
                              {record.api_status}
                            </span>
                          </td>
                        )}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => openDetails(record)}
                            className="rounded-xl bg-slate-50 px-3 py-1.5 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <FaEye className="mr-1 inline text-xs" />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Mobile Cards ────────────────────────────────────────────────── */}
        {records.length > 0 && (
          <ManagementGrid viewMode={viewMode}>
            {records.map((record) => {
              const style = getStatusBadge(record.status);
              const StatusIcon = style.icon;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group max-[390px]:p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-2 max-[390px]:flex-col">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-gray-800">{formatDateFull(record.date)}</h3>
                      <p className="text-xs text-gray-400">{record.day}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 max-[390px]:w-full max-[390px]:flex-row max-[390px]:items-center max-[390px]:justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
                        <StatusIcon size={11} />
                        {record.status}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getApiStatusBadge(record.api_status)}`}>
                        {record.api_status}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600 max-[390px]:text-xs">
                    <div className="flex min-w-0 items-center gap-1">
                      <FaSignInAlt className="text-emerald-500" />
                      {record.clock_in}
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <FaSignOutAlt className="text-red-400" />
                      {record.clock_out}
                    </div>
                    <div className="col-span-2 flex min-w-0 items-start gap-1">
                      <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="min-w-0 break-words text-xs">{record.location}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <FaChartLine className="shrink-0 text-slate-400" />
                      <span className="min-w-0 break-words">{record.worked_hours}</span>
                    </div>
                    {record.breaks > 0 && (
                      <div className="flex min-w-0 items-center gap-1">
                        <FaCoffee className="shrink-0 text-amber-400" />
                        <span className="min-w-0 break-words">{record.breaks} break(s)</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetails(record)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 max-[390px]:text-xs"
                  >
                    <FaEye />
                    View Full Details
                  </button>
                </motion.div>
              );
            })}
          </ManagementGrid>
        )}

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        {!loading && records.length === 0 && (
          <motion.div
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="rounded-2xl bg-white py-16 text-center shadow-md"
          >
            <FaCalendarAlt className="mx-auto mb-4 text-5xl text-gray-200" />
            <p className="text-lg font-semibold text-gray-500">No attendance records found</p>
            <p className="mt-1 text-sm text-gray-400">
              {debouncedSearch ? 'Try adjusting your search.' : 'No data available yet.'}
            </p>
          </motion.div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={goToPage}
            variant={isTinyViewport ? 'minimal' : 'default'}
            showInfo={!isTinyViewport}
          />
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && selectedRecord && (
          <DetailsModal record={selectedRecord} onClose={closeModal} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceHistory;
