import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaEye,
  FaHistory,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaCoffee,
  FaWifi,
  FaTimes,
  FaSpinner,
  FaHourglassHalf,
  FaPlay,
  FaPause,
  FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import apiCall from '../utils/api';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ActionMenu from '../components/ActionMenu';
import { DateRangePickerField } from '../components/DatePicker';

// ─── API Integration ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const fetchMyAttendanceAPI = async ({ companyId, page = 1, limit = ITEMS_PER_PAGE, params = {} }) => {
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...params,
  }).toString();
  return apiCall(`/attendance/my?${queryParams}`, 'GET', null, companyId);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatHours = (h) => {
  if (!h) return '0h 0m';
  const hr = Math.floor(h);
  return `${hr}h ${Math.round((h - hr) * 60)}m`;
};

const getPunchLabel = (t) => ({ 
  in: 'Punch In', out: 'Punch Out', 
  punch_in: 'Punch In', punch_out: 'Punch Out',
  break_start: 'Break Start', break_end: 'Break End',
  start_break: 'Break Start', end_break: 'Break End'
}[t] || t);

const getPunchStyle = (t) => {
  const type = t?.toLowerCase();
  if (type === 'in' || type === 'punch_in') 
    return { color: 'bg-emerald-100 text-emerald-600', icon: <FaSignInAlt className="w-4 h-4" /> };
  if (type === 'out' || type === 'punch_out') 
    return { color: 'bg-rose-100 text-rose-600', icon: <FaSignOutAlt className="w-4 h-4" /> };
  if (type === 'break_start' || type === 'start_break') 
    return { color: 'bg-amber-100 text-amber-600', icon: <FaPause className="w-4 h-4" /> };
  if (type === 'break_end' || type === 'end_break') 
    return { color: 'bg-indigo-100 text-indigo-600', icon: <FaPlay className="w-4 h-4" /> };
  return { color: 'bg-slate-100 text-slate-600', icon: <FaClock className="w-4 h-4" /> };
};

const formatDateTimeFull = (ds) => {
  if (!ds) return 'N/A';
  const d = new Date(ds);
  if (isNaN(d)) {
    // Check if it's just a time string like "13:14:25"
    if (/^\d{2}:\d{2}:\d{2}$/.test(ds)) return ds;
    return ds;
  }
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getApprovalStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': 
    case 'completed': return { className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: FaCheckCircle, text: 'Approved' };
    case 'rejected': return { className: 'bg-rose-50 text-rose-700 border-rose-100', icon: FaTimesCircle, text: 'Rejected' };
    default: return { className: 'bg-amber-50 text-amber-700 border-amber-100', icon: FaClock, text: 'Pending' };
  }
};

// ─── Shared Rendering Components ───────────────────────────────────────────

const RecordTable = ({ records, onViewDetails, activeActionMenu, onToggleActionMenu, showPunchTime, showType, showMethod }) => (
  <div className="overflow-hidden rounded-[10px] bg-white border border-gray-100 shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-600">
          <tr>
            {showPunchTime && <th className="px-4 lg:px-6 py-4 font-semibold tracking-wider">Punch Time</th>}
            {showType && <th className="px-4 lg:px-6 py-4 font-semibold tracking-wider">Type</th>}
            {showMethod && <th className="px-4 lg:px-6 py-4 font-semibold tracking-wider">Method</th>}
            <th className="px-4 lg:px-6 py-4 font-semibold tracking-wider">Status</th>
            <th className="px-4 lg:px-6 py-4 w-12 pr-4 text-right">
              <FaCog className="ml-auto h-4 w-4" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map((record, index) => {
            const approvalStyle = getApprovalStyle(record.status);
            const ApprovalIcon = approvalStyle.icon;
            const displayType = record.punch_type || record.type;
            return (
              <motion.tr
                key={record.id || index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group hover:bg-indigo-50/30 transition-colors"
            >
                {showPunchTime && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-700">{formatDateTimeFull(record.punch_time)}</span>
                  </td>
                )}
                {showType && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 capitalize">
                      {getPunchLabel(displayType)}
                    </span>
                  </td>
                )}
                {showMethod && (
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500 uppercase">{record.method || record.attendance_method || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400">{record.location?.ip_address || record.ip_address || record.meta?.method || 'N/A'}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${approvalStyle.className}`}>
                    <ApprovalIcon size={12} />
                    {approvalStyle.text}
                  </span>
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <ActionMenu
                    menuId={record.id || index}
                    activeId={activeActionMenu}
                    onToggle={(e, id) => onToggleActionMenu(id)}
                    actions={[
                      {
                        label: 'View Details',
                        icon: <FaEye size={12} />,
                        onClick: () => onViewDetails(record),
                        className: 'text-blue-600 hover:bg-blue-50'
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
  </div>
);

const RecordCards = ({ records, onViewDetails, activeActionMenu, onToggleActionMenu }) => (
  <ManagementGrid viewMode="card">
    {records.map((record, index) => {
      const approvalStyle = getApprovalStyle(record.status);
      const ApprovalIcon = approvalStyle.icon;
      const displayType = record.punch_type || record.type;
      return (
        <motion.div
          key={record.id || index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="group relative rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-200"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-gray-800 text-base">{getPunchLabel(displayType)}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{formatDateTimeFull(record.punch_time)}</p>
            </div>
            <div className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border ${approvalStyle.className}`}>
                <ApprovalIcon size={10} />
                {approvalStyle.text}
              </span>
              <ActionMenu
                menuId={record.id || index}
                activeId={activeActionMenu}
                onToggle={(e, id) => onToggleActionMenu(id)}
                actions={[
                  {
                    label: 'View Details',
                    icon: <FaEye size={12} />,
                    onClick: () => onViewDetails(record),
                    className: 'text-blue-600 hover:bg-blue-50'
                  }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
             <div className="bg-gray-50 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Method</span>
                <span className="text-xs font-bold text-gray-700 truncate block">{record.method || record.attendance_method || record.meta?.method || 'N/A'}</span>
             </div>
             <div className="bg-gray-50 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Status</span>
                <span className="text-xs font-bold text-gray-700">{approvalStyle.text}</span>
             </div>
          </div>

        </motion.div>
      );
    })}
  </ManagementGrid>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AttendanceHistory = () => {
  const [activeSubTab, setActiveSubTab] = useState('today');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [todaySummary, setTodaySummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const [dateFilter, setDateFilter] = useState({ from_date: '', to_date: '' });
  const [dateFilterLabel, setDateFilterLabel] = useState('Filter by date');

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);
  const fetchLock = useRef(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showPunchTime = windowWidth > 480;
  const showType = windowWidth >= 640;
  const showMethod = windowWidth >= 900;

  // ─── Unified Data Fetching ─────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      
      // Pagination only for history
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      // Filters only applied for past activity search
      if (activeSubTab === 'past') {
        if (dateFilter.from_date) params.from_date = dateFilter.from_date;
        if (dateFilter.to_date) params.to_date = dateFilter.to_date;
        if (debouncedSearch) params.search = debouncedSearch;
      }

      const response = await fetchMyAttendanceAPI({
        companyId: company?.id,
        page: params.page,
        limit: params.limit,
        params
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // 1. Map History
        setRecords(data.history || []);
        setTotalRecords(data.meta?.total || 0);

        // 2. Map Today's Summary
        const t = data.today;
        if (t) {
          const combinedPunches = [
            ...(t.work_sessions || []).map(s => ({ ...s, punch_type: s.type, punch_time: `${t.date} ${s.time}`, method: s.meta?.method || 'N/A' })),
            ...(t.break_sessions || []).map(s => ({ ...s, punch_type: s.type, punch_time: `${t.date} ${s.time}`, method: s.meta?.method || 'N/A' }))
          ].sort((a, b) => new Date(a.punch_time) - new Date(b.punch_time));

          setTodaySummary({
            total_worked_hours: (t.summary?.work_minutes || 0) / 60,
            total_break_minutes: t.summary?.break_minutes || 0,
            total_punches: combinedPunches.length,
            punches: combinedPunches,
            status: t.status,
            date: t.date
          });
        }
      } else {
        toast.error(data.message || 'Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
      toast.error('Error connecting to the server');
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  }, [pagination.page, pagination.limit, dateFilter, debouncedSearch, activeSubTab]);

  useEffect(() => {
    // Only set timeout if searchTerm is different from current debounced value
    if (searchTerm === debouncedSearch) return;
    
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetails = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const toggleActionMenu = (recordId) => {
    setActiveActionMenu((current) => (current === recordId ? null : recordId));
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const isTinyViewport = window.innerWidth < 480;

  return (
    <div>
      {/* Sub Tab Switcher */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 p-4 rounded-3xl border border-slate-100">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
          <button
            onClick={() => setActiveSubTab('today')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
              activeSubTab === 'today'
                ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FaHistory className={activeSubTab === 'today' ? 'text-indigo-500' : ''} />
            Today's Activity
          </button>
          <button
            onClick={() => setActiveSubTab('past')}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
              activeSubTab === 'past'
                ? 'bg-white text-violet-600 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FaCalendarAlt className={activeSubTab === 'past' ? 'text-violet-500' : ''} />
            Past Activity
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeSubTab === 'today' ? (
          /* ── Today's Activity Tab ────────────────────────────────────────── */
          <div className="space-y-6 max-w-7xl mx-auto">
            {loading && !todaySummary ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Fetching today's logs...</p>
              </div>
            ) : todaySummary ? (
              <div className="space-y-8">
                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {[
                    { label: 'Hours Worked', value: formatHours(todaySummary.total_worked_hours), from: 'from-emerald-50', to: 'to-teal-50', textColor: 'text-emerald-700', icon: <FaClock className="text-emerald-500" /> },
                    { label: 'Break Taken', value: `${todaySummary.total_break_minutes}m`, from: 'from-amber-50', to: 'to-orange-50', textColor: 'text-amber-700', icon: <FaCoffee className="text-amber-500" /> },
                    { label: 'Total Punches', value: todaySummary.total_punches, from: 'from-indigo-50', to: 'to-blue-50', textColor: 'text-indigo-700', icon: <FaCheckCircle className="text-indigo-500" /> },
                  ].map(s => (
                    <div key={s.label} className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4`}>
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-inner`}>
                        {s.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                        <p className={`text-xl font-extrabold ${s.textColor}`}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Content based on View Mode */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                      <h3 className="text-lg font-extrabold text-slate-800">Today's Logs</h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                        {todaySummary.punches?.length || 0} Punches
                      </span>
                    </div>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
                  </div>

                  {todaySummary.punches?.length > 0 ? (
                    viewMode === 'table' ? (
                      <RecordTable
                        records={todaySummary.punches}
                        onViewDetails={openDetails}
                        activeActionMenu={activeActionMenu}
                        onToggleActionMenu={toggleActionMenu}
                        showPunchTime={showPunchTime}
                        showType={showType}
                        showMethod={showMethod}
                      />
                    ) : (
                      <RecordCards
                        records={todaySummary.punches}
                        onViewDetails={openDetails}
                        activeActionMenu={activeActionMenu}
                        onToggleActionMenu={toggleActionMenu}
                      />
                    )
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                      <FaHistory className="mx-auto text-4xl text-slate-200 mb-3" />
                      <p className="text-slate-400 font-medium">No punches recorded yet today.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                 <FaHistory className="mx-auto text-5xl text-slate-100 mb-4" />
                 <p className="text-slate-500 font-bold">No summary available for today.</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Past Activity Tab ───────────────────────────────────────────── */
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6"
            >
              {/* Left Section: Search & Result Info */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search by code, status, mode..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-medium"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <FaTimes size={14} />
                    </button>
                  )}
                </div>
                {!loading && records.length > 0 && (
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block border-l pl-4 border-gray-200">
                    <span className="text-slate-900">{records.length}</span> / {totalRecords} Records
                  </p>
                )}
              </div>

              {/* Right Section: Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative">
                  <DateRangePickerField
                    value={dateFilter}
                    onChange={(val) => {
                      const updated = {
                        from_date: val.start,
                        to_date: val.end
                      };
                      setDateFilter(updated);
                      if (val.start && val.end) {
                        setDateFilterLabel(`${val.start} - ${val.end}`);
                      } else {
                        setDateFilterLabel('Filter by date');
                      }
                    }}
                    placeholder={dateFilterLabel}
                    buttonClassName="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all min-w-[200px]"
                  />
                </div>
                <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
              </div>
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FaSpinner className="animate-spin text-4xl mb-4 text-violet-500" />
                <p className="text-sm font-medium">Loading history logs...</p>
              </div>
            ) : records.length > 0 ? (
              viewMode === 'table' ? (
                <RecordTable
                  records={records}
                  onViewDetails={openDetails}
                  activeActionMenu={activeActionMenu}
                  onToggleActionMenu={toggleActionMenu}
                  showPunchTime={showPunchTime}
                  showType={showType}
                  showMethod={showMethod}
                />
              ) : (
                <RecordCards
                  records={records}
                  onViewDetails={openDetails}
                  activeActionMenu={activeActionMenu}
                  onToggleActionMenu={toggleActionMenu}
                />
              )
            ) : (
              <div className="rounded-3xl bg-white py-20 text-center shadow-sm border border-gray-100">
                <FaCalendarAlt className="mx-auto mb-4 text-6xl text-gray-100" />
                <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Records Found</h3>
                <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters.</p>
              </div>
            )}

            {!loading && totalRecords > 0 && (
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

const DetailsModal = ({ record, onClose }) => {
    const style = getApprovalStyle(record.status);
    const StatusIcon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg overflow-hidden rounded-[30px] bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className={`relative px-8 py-10 text-white ${record.status === 'approved' || record.status === 'completed' ? 'bg-emerald-500' : record.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                    <button onClick={onClose} className="absolute right-6 top-6 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-all">
                        <FaTimes size={18} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                            <FaClock size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">{record.employee_code || 'My Log'}</h2>
                            <p className="text-white/80 font-bold opacity-80 uppercase text-xs tracking-widest mt-1">Punch Log Details</p>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-8">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Punch Time</span>
                            <p className="font-bold text-gray-800 text-sm">{formatDateTimeFull(record.punch_time)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Punch Type</span>
                            <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 uppercase">{getPunchLabel(record.punch_type || record.type)}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Method</span>
                            <p className="font-bold text-gray-800 text-sm uppercase">{record.method || record.attendance_method || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Status</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full ${style.className} px-3 py-1 text-[10px] font-bold border border-current/10`}>
                                <StatusIcon size={12} />
                                {style.text.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm flex-shrink-0">
                                <FaMapMarkerAlt size={16} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Location / IP Address</span>
                                <p className="text-sm font-bold text-gray-700 leading-tight break-all">{record.location?.ip_address || record.ip_address || 'No IP Data Recorded'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 border-t border-gray-200/50 pt-4">
                           <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm flex-shrink-0">
                                <FaCog size={16} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">System Metadata</span>
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100">ID: {record.id || 'N/A'}</span>
                                    {(record.device_info || record.attendance_mode || record.meta?.method) && (
                                      <span className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 border border-gray-100 uppercase">
                                        MODE: {record.attendance_mode || record.device_info || record.meta?.method}
                                      </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="mt-8 w-full rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white shadow-xl shadow-gray-200 transition-all hover:bg-black active:scale-[0.98]">
                        Dismiss Details
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AttendanceHistory;
