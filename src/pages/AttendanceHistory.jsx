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
  FaTimesCircle,
  FaHourglassStart,
  FaMapMarkerAlt,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaCoffee,
  FaWifi,
  FaTimes,
  FaListUl,
  FaSpinner,
  FaCheck,
  FaBan
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import apiCall from '../utils/api';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ActionMenu from '../components/ActionMenu';
import { DatePickerField } from '../components/DatePicker';

// ─── API Integration ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const fetchAttendanceAPI = async ({ companyId, page = 1, limit = ITEMS_PER_PAGE, dateParams = {} }) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  Object.entries(dateParams || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await apiCall(`/attendance/my?${queryParams.toString()}`, 'GET', null, companyId);

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || 'Failed to fetch attendance');
  }

  return json; // { success, message, total, page, limit, total_pages, data: PunchRecord[] }
};

const formatFilterLabel = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

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
      else if (inPunch) status = 'Present';

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
      const apiStatus = sorted[0]?.status || 'pending';

      return {
        id: sorted[0]?.id || date,
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        clock_in: inPunch ? formatTimestamp(inPunch.punch_time) : '--:-- --',
        clock_out: outPunch ? formatTimestamp(outPunch.punch_time) : '--:-- --',
        status,
        api_status: apiStatus,
        location: location || 'N/A',
        worked_hours: workedHours,
        breaks: breakStarts.length,
        method,
        mode,
        punches: sorted,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTimestamp = (iso) => {
  if (!iso) return '--:-- --';
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTimeFull = (iso) => {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
      return { icon: FaCheckCircle, className: 'bg-green-100 text-green-700 border border-green-200', text: 'Approved' };
    case 'rejected':
      return { icon: FaBan, className: 'bg-red-100 text-red-700 border border-red-200', text: 'Rejected' };
    case 'pending':
    default:
      return { icon: FaClock, className: 'bg-yellow-100 text-yellow-700 border border-yellow-200', text: 'Pending' };
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
  const apiStatusStyle = getApiStatusBadge(record.api_status);
  const ApiStatusIcon = apiStatusStyle.icon;

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
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize ${apiStatusStyle.className}`}>
                    <ApiStatusIcon size={11} />
                    {apiStatusStyle.text}
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
                    const punchStatusStyle = getApiStatusBadge(punch.status);
                    const PunchStatusIcon = punchStatusStyle.icon;
                    
                    return (
                      <div
                        key={punch.id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <PunchIcon className={`text-sm ${color}`} />
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${punchStatusStyle.className}`}>
                            <PunchStatusIcon size={8} />
                            {punchStatusStyle.text}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilterLabel, setDateFilterLabel] = useState('Filter by date');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);
  const [totalRecords, setTotalRecords] = useState(0);
  const fetchInProgressRef = useRef(false);
  const attendanceDateFilterRef = useRef({});

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

  // ── Fetch from API with server-side pagination ───────────────────────────
  const fetchAttendance = useCallback(async (dateParams = attendanceDateFilterRef.current) => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const result = await fetchAttendanceAPI({
        companyId: company?.id,
        page: pagination.page,
        limit: pagination.limit,
        dateParams
      });

      const daily = deriveDailyRecords(result.data || []);
      setRecords(daily);
      setTotalRecords(result.total || 0);
      
      updatePagination({
        page: result.page || pagination.page,
        limit: result.limit || pagination.limit,
        total: result.total || 0,
        total_pages: result.total_pages || 1,
        is_last_page: result.page === result.total_pages
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load attendance.');
    } finally {
      fetchInProgressRef.current = false;
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, updatePagination]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance, pagination.page]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (pagination.page !== 1) {
      goToPage(1);
    } else {
      fetchAttendance();
    }
  }, [debouncedSearch]);

  const handleDateFilterApply = useCallback((result) => {
    let nextParams = {};
    let nextLabel = 'Filter by date';

    if (typeof result === 'string' && result) {
      nextParams = { date: result };
      nextLabel = formatFilterLabel(result);
    } else if (result?.start && result?.end) {
      nextParams = { from_date: result.start, to_date: result.end };
      nextLabel = result.start === result.end
        ? formatFilterLabel(result.start)
        : `${formatFilterLabel(result.start)} - ${formatFilterLabel(result.end)}`;
    }

    attendanceDateFilterRef.current = nextParams;
    setDateFilterLabel(nextLabel);

    if (pagination.page !== 1) {
      goToPage(1);
    } else {
      fetchAttendance(nextParams);
    }
  }, [fetchAttendance, goToPage, pagination.page]);

  const clearDateFilter = useCallback(() => {
    attendanceDateFilterRef.current = {};
    setDateFilterLabel('Filter by date');

    if (pagination.page !== 1) {
      goToPage(1);
    } else {
      fetchAttendance({});
    }
  }, [fetchAttendance, goToPage, pagination.page]);

  // Filter records client-side for search and date
  const filteredRecords = useMemo(() => {
    const filter = attendanceDateFilterRef.current;
    const hasDateFilter = filter && (filter.date || filter.from_date || filter.to_date);
    const query = debouncedSearch.toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !debouncedSearch ||
        record.date.includes(debouncedSearch) ||
        record.status.toLowerCase().includes(query) ||
        record.location?.toLowerCase().includes(query) ||
        record.day.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (!hasDateFilter) return true;

      const recordDate = new Date(`${record.date}T00:00:00`);
      if (Number.isNaN(recordDate.getTime())) return false;

      if (filter.date) {
        const selected = new Date(`${filter.date}T00:00:00`);
        return recordDate.toDateString() === selected.toDateString();
      }

      const start = new Date(`${filter.from_date}T00:00:00`);
      const end = new Date(`${filter.to_date}T23:59:59.999`);
      return recordDate >= start && recordDate <= end;
    });
  }, [records, debouncedSearch, dateFilterLabel]);

  // ── Responsive columns ────────────────────────────────────────────────────
  const isTinyViewport = windowWidth < 450;
  const showDay = windowWidth >= 480;
  const showWorked = windowWidth >= 640;
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

  const toggleActionMenu = (menuId) => {
    setActiveActionMenu((current) => (current === menuId ? null : menuId));
  };

  // Handle actions
  const handleViewDetails = (record) => {
    openDetails(record);
    setActiveActionMenu(null);
  };

  // ── Initial skeleton ──────────────────────────────────────────────────────
  if (loading && records.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl p-3 sm:p-6">
        <SkeletonLoader />
      </div>
    );
  }

  const displayRecords = filteredRecords;

  return (
    <div className="min-h-screen p-3 font-sans md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <h1 className="flex items-center gap-2 text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-extrabold text-gray-800 md:text-3xl">
            <FaHistory className="text-purple-600" />
            Attendance History
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3">
            {loading && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-600 shadow-sm sm:px-4 sm:text-xs">
                <FaSpinner className="animate-spin" size={12} />
                Loading...
              </span>
            )}
            <div className="rounded-full bg-white px-4 py-2 text-xs text-gray-600 shadow-md sm:px-5 sm:text-sm">
              <FaCalendarAlt className="mr-2 inline text-slate-400" />
              {totalRecords} record{totalRecords !== 1 ? 's' : ''}
            </div>
          </div>
        </motion.div>

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-3"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by date, status, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-12 shadow-lg outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerField
              value=""
              onChange={handleDateFilterApply}
              placeholder={dateFilterLabel}
              buttonClassName="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 xsm:px-2.5 xsm:py-1.5 xsm:text-[11px]"
              wrapperClassName="w-auto"
              popoverClassName="w-[min(92vw,24rem)]"
              initialTab="quick"
              mode="both"
            />
            {dateFilterLabel !== 'Filter by date' && (
              <button
                type="button"
                onClick={clearDateFilter}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 xsm:px-2.5 xsm:py-1.5 xsm:text-[11px]"
                title="Clear date filter"
                aria-label="Clear date filter"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
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

        {/* View Toggle */}
        {!loading && displayRecords.length > 0 && (
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{displayRecords.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalRecords}</span> attendance records
              {debouncedSearch && <span className="ml-1 text-slate-600">· "{debouncedSearch}"</span>}
              {dateFilterLabel !== 'Filter by date' && <span className="ml-1 text-blue-600">· {dateFilterLabel}</span>}
            </p>
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        )}

        {/* ── Desktop Table ───────────────────────────────────────────────── */}
        {displayRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${viewMode === 'table' ? 'overflow-visible' : 'hidden'} rounded-2xl bg-white shadow-xl`}
          >
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    {showDay && <th className="px-5 py-4">Day</th>}
                    <th className="px-5 py-4">Clock In</th>
                    {showClockOut && <th className="px-5 py-4">Clock Out</th>}
                    {showWorked && <th className="px-5 py-4">Worked</th>}
                    <th className="px-5 py-4">Status</th>
                    {showLocation && <th className="px-5 py-4">Location</th>}
                    {showApiStatus && <th className="px-5 py-4">Approval</th>}
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {displayRecords.map((record, index) => {
                    const style = getStatusBadge(record.status);
                    const StatusIcon = style.icon;
                    const apiStatusStyle = getApiStatusBadge(record.api_status);
                    const ApiStatusIcon = apiStatusStyle.icon;

                    return (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                      >
                        <td className="px-5 py-4 font-medium text-gray-800">{formatDateFull(record.date)}</td>
                        {showDay && <td className="px-5 py-4 text-gray-400">{record.day}</td>}
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
                        {showWorked && <td className="px-5 py-4 text-gray-600">{record.worked_hours}</td>}
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
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${apiStatusStyle.className}`}>
                              <ApiStatusIcon size={10} />
                              {apiStatusStyle.text}
                            </span>
                          </td>
                        )}
                        <td className="px-5 py-4 text-center">
                          <ActionMenu
                            menuId={record.id}
                            activeId={activeActionMenu}
                            onToggle={(e, id) => toggleActionMenu(id)}
                            actions={[
                              {
                                label: 'View Details',
                                icon: <FaEye size={14} />,
                                onClick: () => handleViewDetails(record),
                                className: 'text-blue-700 hover:bg-blue-50'
                              }
                            ]}
                          />
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
        {displayRecords.length > 0 && (
          <ManagementGrid viewMode={viewMode}>
            {displayRecords.map((record) => {
              const style = getStatusBadge(record.status);
              const StatusIcon = style.icon;
              const apiStatusStyle = getApiStatusBadge(record.api_status);
              const ApiStatusIcon = apiStatusStyle.icon;

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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
                        <StatusIcon size={11} />
                        {record.status}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${apiStatusStyle.className}`}>
                        <ApiStatusIcon size={8} />
                        {apiStatusStyle.text}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600 max-[390px]:text-xs">
                    <div className="flex min-w-0 items-center gap-1">
                      <FaSignInAlt className="text-emerald-500 shrink-0" />
                      <span className="truncate">{record.clock_in}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <FaSignOutAlt className="text-red-400 shrink-0" />
                      <span className="truncate">{record.clock_out}</span>
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
        {!loading && displayRecords.length === 0 && (
          <motion.div
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="rounded-2xl bg-white py-16 text-center shadow-md"
          >
            <FaCalendarAlt className="mx-auto mb-4 text-5xl text-gray-200" />
            <p className="text-lg font-semibold text-gray-500">No attendance records found</p>
            <p className="mt-1 text-sm text-gray-400">
              {debouncedSearch
                ? 'Try adjusting your search.'
                : dateFilterLabel !== 'Filter by date'
                  ? `Try adjusting ${dateFilterLabel.toLowerCase()}.`
                  : 'No data available yet.'}
            </p>
          </motion.div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalRecords > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={totalRecords}
            itemsPerPage={pagination.limit}
            onPageChange={goToPage}
            showInfo={!isTinyViewport}
            onLimitChange={changeLimit}
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
