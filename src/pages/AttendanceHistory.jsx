import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
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
import { FaBriefcase } from 'react-icons/fa';
import AttendanceTypeTabs, { getAttendanceTypeConfig } from '../components/AttendanceTypeTabs';
import AttendanceLogsModal from '../components/AttendanceLogsModal';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Constants ───────────────────────────────────────────────────────────────

// Configuration moved to shared AttendanceTypeTabs component

// ─── API Integration ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const fetchMyAttendanceAPI = async ({ companyId, page = 1, limit = ITEMS_PER_PAGE, params = {}, activeSubTab = 'today' }) => {
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...params,
  }).toString();

  const endpoint = activeSubTab === 'today'
    ? `/attendance/my/today-punches?${queryParams}`
    : `/attendance/my/past-punches?${queryParams}`;

  return apiCall(endpoint, 'GET', null, companyId);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const Placeholder = () => <span className="text-red-500 font-bold">---</span>;

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
  if (!ds) return <Placeholder />;
  const d = new Date(ds);
  if (isNaN(d)) {
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

const RecordTable = ({ records, onViewDetails, activeActionMenu, onToggleActionMenu, activeType, onLogs }) => {
  const typeConfig = getAttendanceTypeConfig(activeType);
  return (
    <div className="overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-600 font-bold tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">{typeConfig.startLabel}</th>
              <th className="px-6 py-4">{typeConfig.endLabel}</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 w-12 pr-4 text-right">
                <FaCog className="ml-auto h-4 w-4" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record, index) => {
              const approvalStyle = getApprovalStyle(record.status);
              const ApprovalIcon = approvalStyle.icon;
              const startData = record[typeConfig.startKey];
              const endData = record[typeConfig.endKey];

              return (
                <motion.tr
                  key={record.id || index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onViewDetails(record)}
                  className="group hover:bg-indigo-50/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-800">{record.date || <Placeholder />}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{startData?.time || <Placeholder />}</span>
                      {startData?.method && startData.method !== 'manual' && (
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{startData.method}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{endData?.time || <Placeholder />}</span>
                      {endData?.method && endData.method !== 'manual' && (
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{endData.method}</span>
                      )}
                    </div>
                  </td>
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
                        },
                        {
                          label: 'Logs',
                          icon: <FaHistory size={12} />,
                          onClick: () => onLogs(record),
                          className: 'text-slate-600 hover:bg-slate-50'
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
};

const RecordCards = ({ records, onViewDetails, activeActionMenu, onToggleActionMenu, activeType, onLogs }) => {
  const typeConfig = getAttendanceTypeConfig(activeType);
  return (
    <ManagementGrid viewMode="card">
      {records.map((record, index) => {
        const approvalStyle = getApprovalStyle(record.status);
        const ApprovalIcon = approvalStyle.icon;
        const startData = record[typeConfig.startKey];
        const endData = record[typeConfig.endKey];

        return (
          <motion.div
            key={record.id || index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onViewDetails(record)}
            className="group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-200 cursor-pointer"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-gray-800 text-base">{record.date || <Placeholder />}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{typeConfig.label} Log</p>
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
                    },
                    {
                      label: 'Logs',
                      icon: <FaHistory size={12} />,
                      onClick: () => onLogs(record),
                      className: 'text-slate-600 hover:bg-slate-50'
                    }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">{typeConfig.startLabel}</span>
                <span className="text-xs font-bold text-gray-700 truncate block">{startData?.time || <Placeholder />}</span>
                {startData?.method && startData.method !== 'manual' && (
                  <span className="text-[9px] text-gray-400 uppercase font-bold">{startData.method}</span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">{typeConfig.endLabel}</span>
                <span className="text-xs font-bold text-gray-700 truncate block">{endData?.time || <Placeholder />}</span>
                {endData?.method && endData.method !== 'manual' && (
                  <span className="text-[9px] text-gray-400 uppercase font-bold">{endData.method}</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </ManagementGrid>
  );
};

// AttendanceTypeTabs moved to shared component

// ─── Main Component ───────────────────────────────────────────────────────────

const AttendanceHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = searchParams.get('subtab') || 'today';
  const activeType = searchParams.get('type') || 'work';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [todaySummary, setTodaySummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [logsModalRecord, setLogsModalRecord] = useState(null);
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

  const setActiveSubTab = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set('subtab', tab);
    setSearchParams(params);
    goToPage(1);
  };

  const setActiveType = (type) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    setSearchParams(params);
    goToPage(1);
  };

  const loadData = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        type: activeType
      };

      if (activeSubTab === 'past') {
        if (dateFilter.from_date) params.from_date = dateFilter.from_date;
        if (dateFilter.to_date) params.to_date = dateFilter.to_date;
        if (debouncedSearch) params.search = debouncedSearch;
      } else {
        if (debouncedSearch) params.search = debouncedSearch;
      }

      const response = await fetchMyAttendanceAPI({
        companyId: company?.id,
        page: params.page,
        limit: params.limit,
        params,
        activeSubTab
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRecords(data.data || []);
        setTotalRecords(data.meta?.total || 0);
        if (activeSubTab === 'today' && data.summary) {
          setTodaySummary(data.summary);
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
  }, [pagination.page, pagination.limit, dateFilter, debouncedSearch, activeSubTab, activeType]);

  useEffect(() => {
    if (searchTerm === debouncedSearch) return;
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetails = (record) => {
    setSelectedRecord({ ...record, activeType });
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
      {/* Compact Sub Tab & Type Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSubTab('today')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${activeSubTab === 'today'
              ? 'bg-white text-indigo-600 shadow-sm scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <FaHistory size={12} className={activeSubTab === 'today' ? 'text-indigo-500' : ''} />
            Today
          </button>
          <button
            onClick={() => setActiveSubTab('past')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${activeSubTab === 'past'
              ? 'bg-white text-violet-600 shadow-sm scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <FaCalendarAlt size={12} className={activeSubTab === 'past' ? 'text-violet-500' : ''} />
            Past
          </button>
        </div>

        <div className="flex items-center gap-2">
          <AttendanceTypeTabs value={activeType} onChange={setActiveType} />
        </div>
      </div>

      <div className="space-y-4">
        {activeSubTab === 'today' ? (
          <div className="space-y-6 p-2 lg:p-0 max-w-7xl mx-auto">
            {loading && records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FaSpinner className="animate-spin text-4xl mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Fetching today's logs...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {todaySummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {[
                      { label: 'Hours Worked', value: formatHours(todaySummary.total_worked_hours), from: 'from-emerald-50', to: 'to-teal-50', textColor: 'text-emerald-700', icon: <FaClock className="text-emerald-500" /> },
                      { label: 'Break Taken', value: `${todaySummary.total_break_minutes}m`, from: 'from-amber-50', to: 'to-orange-50', textColor: 'text-amber-700', icon: <FaCoffee className="text-amber-500" /> },
                      { label: 'Total Punches', value: todaySummary.total_punches, from: 'from-indigo-50', to: 'to-blue-50', textColor: 'text-indigo-700', icon: <FaCheckCircle className="text-indigo-500" /> },
                    ].map(s => (
                      <div key={s.label} className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-inner`}>
                          {s.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                          <p className={`text-xl font-extrabold ${s.textColor}`}>{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                      <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                      <h3 className="text-lg font-extrabold text-slate-800">Today's Logs</h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                        {totalRecords} Records
                      </span>
                    </div>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
                  </div>

                  {records.length > 0 ? (
                    viewMode === 'table' ? (
                      <RecordTable
                        records={records}
                        onViewDetails={openDetails}
                        activeActionMenu={activeActionMenu}
                        onToggleActionMenu={toggleActionMenu}
                        activeType={activeType}
                        onLogs={setLogsModalRecord}
                      />
                    ) : (
                      <RecordCards
                        records={records}
                        onViewDetails={openDetails}
                        activeActionMenu={activeActionMenu}
                        onToggleActionMenu={toggleActionMenu}
                        activeType={activeType}
                        onLogs={setLogsModalRecord}
                      />
                    )
                  ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                      <FaHistory className="mx-auto text-4xl text-slate-200 mb-3" />
                      <p className="text-slate-400 font-medium">No {activeType} records found for today.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2 mb-2"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                <div className="relative flex-1 w-full">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search by code, status, mode..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-medium"
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

              <div className="flex items-center justify-between gap-3 w-full md:w-auto">
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
                    buttonClassName="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all min-w-[200px]"
                  />
                </div>
                <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
              </div>
            </motion.div>

            {loading && records.length === 0 ? (
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
                  activeType={activeType}
                  onLogs={setLogsModalRecord}
                />
              ) : (
                <RecordCards
                  records={records}
                  onViewDetails={openDetails}
                  activeActionMenu={activeActionMenu}
                  onToggleActionMenu={toggleActionMenu}
                  activeType={activeType}
                  onLogs={setLogsModalRecord}
                />
              )
            ) : (
              <div className="rounded-xl bg-white py-20 text-center shadow-sm border border-gray-100">
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

      <AnimatePresence>
        {modalOpen && selectedRecord && (
          <DetailsModal record={selectedRecord} onClose={closeModal} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logsModalRecord && (
          <AttendanceLogsModal
            id={logsModalRecord.id}
            type={logsModalRecord.type || activeType}
            onClose={() => setLogsModalRecord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailsModal = ({ record, onClose }) => {
  const style = getApprovalStyle(record.status);
  const StatusIcon = style.icon;
  const activeType = record.activeType || 'work';
  const typeConfig = getAttendanceTypeConfig(activeType);
  const startData = record[typeConfig.startKey];
  const endData = record[typeConfig.endKey];

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ModalScrollLock />
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 18 }}
        transition={{ type: "spring", damping: 25, stiffness: 280 }}
        className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 m-auto flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-200">
              <FaClock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{record.date || <Placeholder />}</h2>
              <p className="text-sm text-slate-500">{typeConfig.label} Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-6 p-2 lg:p-0">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date</span>
              <p className="font-bold text-slate-800 text-sm">{record.date || <Placeholder />}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full ${style.className} px-3 py-1 text-[10px] font-bold border`}>
                <StatusIcon size={12} />
                {style.text.toUpperCase()}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{typeConfig.startLabel}</span>
              <p className="font-bold text-slate-800 text-sm">{startData?.time || <Placeholder />}</p>
              {startData?.method && startData.method !== 'manual' && (
                <p className="text-[10px] text-slate-400 uppercase font-bold">{startData.method}</p>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{typeConfig.endLabel}</span>
              <p className="font-bold text-slate-800 text-sm">{endData?.time || <Placeholder />}</p>
              {endData?.method && endData.method !== 'manual' && (
                <p className="text-[10px] text-slate-400 uppercase font-bold">{endData.method}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-4">
            {((startData && startData.method !== 'manual' && (startData.ip || startData.lat || startData.lng)) ||
              (endData && endData.method !== 'manual' && (endData.ip || endData.lat || endData.lng))) && (
                <div className="flex items-start gap-4 border-b border-slate-200 pb-4">
                  <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 flex-shrink-0">
                    <FaMapMarkerAlt size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Location & Device</span>
                    <div className="space-y-1">
                      {startData && startData.method !== 'manual' && (
                        <>
                          {startData.ip && <p className="text-sm font-semibold text-slate-700 leading-tight break-all">Start IP: {startData.ip}</p>}
                          {(startData.lat || startData.lng) && <p className="text-sm font-semibold text-slate-700 leading-tight break-all">Start GPS: {startData.lat || 'N/A'}, {startData.lng || 'N/A'}</p>}
                        </>
                      )}
                      {endData && endData.method !== 'manual' && (
                        <>
                          {endData.ip && <p className="text-sm font-semibold text-slate-700 leading-tight break-all">End IP: {endData.ip}</p>}
                          {(endData.lat || endData.lng) && <p className="text-sm font-semibold text-slate-700 leading-tight break-all">End GPS: {endData.lat || 'N/A'}, {endData.lng || 'N/A'}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 flex-shrink-0">
                <FaCog size={14} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">System Metadata</span>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">ID: {record.id || <Placeholder />}</span>
                  <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">TYPE: {activeType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AttendanceHistory;
