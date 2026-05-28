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
  FaComment,
  FaInfoCircle,
  FaTimes,
  FaSpinner,
  FaHourglassHalf,
  FaPlay,
  FaPause,
  FaCog,
  FaUsers
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination, { usePagination } from '../components/PaginationComponent';
import apiCall from '../utils/api';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ActionMenu from '../components/ActionMenu';
import AdvancedDateFilter from '../components/AdvancedDateFilter';
import { RefreshButton } from '../components/common';
import { FaBriefcase } from 'react-icons/fa';
import AttendanceTypeTabs, { getAttendanceTypeConfig, normalizeAttendanceType, ATTENDANCE_TYPE_CONFIG } from '../components/AttendanceTypeTabs';
import AttendanceLogsModal from '../components/AttendanceLogsModal';
import Modal from '../components/Modal';

// ─── Constants ───────────────────────────────────────────────────────────────

// Configuration moved to shared AttendanceTypeTabs component

// ─── API Integration ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const fetchMyAttendanceAPI = async ({ companyId, page = 1, limit = ITEMS_PER_PAGE, params = {} }) => {
  const queryParams = new URLSearchParams({
    page,
    limit,
    ...params,
  }).toString();

  return apiCall(`/attendance/my/past-punches?${queryParams}`, 'GET', null, companyId);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const Placeholder = () => <span className="text-red-500 font-bold">---</span>;

const fmt = (str) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";


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

const normalizePunchRecord = (record) => {
  if (!record || typeof record !== 'object') return null;

  const normalizeNestedPunch = (value) => {
    if (!value || typeof value !== 'object') return null;
    return {
      time: value.time || null,
      method: value.method || null,
      lat: value.latitude ?? value.lat ?? null,
      lng: value.longitude ?? value.lng ?? null,
      ip: value.ip_address ?? value.ip ?? null,
    };
  };

  const calcs = record.calculations || {};
  const shiftData = record.shift || {};

  return {
    ...record,
    date: record.punch_date || record.attendance_date || record.date,
    attendance_date: record.punch_date || record.attendance_date || record.date,
    break_start: normalizeNestedPunch(record.break_start),
    break_end: normalizeNestedPunch(record.break_end),
    punch_in: normalizeNestedPunch(record.punch_in),
    punch_out: normalizeNestedPunch(record.punch_out),
    // Map new structure to old format for UI compatibility
    shift: {
      ...shiftData,
      worked_minutes: calcs.worked_minutes ?? shiftData.worked_minutes ?? 0,
      break_minutes: calcs.break_minutes ?? shiftData.break_minutes ?? 0,
      shift_start_time: shiftData.start_time || shiftData.shift_start_time,
      shift_end_time: shiftData.end_time || shiftData.shift_end_time,
    },
    flags: record.flags || {
      overtime: {
        enabled: record.is_overtime === 1 || record.is_overtime === true,
        minutes: calcs.overtime_minutes || 0
      },
      deductible: {
        enabled: record.is_deductible === 1 || record.is_deductible === true,
        minutes: (calcs.late_minutes || 0) + (calcs.early_leave_minutes || 0) + (calcs.extra_break_minutes || 0),
        breakdown: {
          late_minutes: calcs.late_minutes || 0,
          early_leave_minutes: calcs.early_leave_minutes || 0,
          extra_break_minutes: calcs.extra_break_minutes || 0
        }
      },
      half_day: {
        enabled: record.day_status === 'half_day'
      }
    }
  };
};

const normalizeHistoryRecords = (records, activeType) => {
  const normalizedType = normalizeAttendanceType(activeType);
  const typeConfig = getAttendanceTypeConfig(normalizedType);
  const uniqueRecords = new Map();

  (Array.isArray(records) ? records : []).forEach((record) => {
    const normalizedRecord = normalizePunchRecord(record);
    if (!normalizedRecord) return;

    const startTime = normalizedRecord?.[typeConfig.startKey]?.time || '';
    const endTime = normalizedRecord?.[typeConfig.endKey]?.time || '';
    const key = normalizedRecord.id ?? `${normalizedRecord.date || 'record'}-${startTime}-${endTime}`;

    uniqueRecords.set(key, {
      ...(uniqueRecords.get(key) || {}),
      ...normalizedRecord,
      type: normalizedType,
    });
  });

  return Array.from(uniqueRecords.values());
};

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
                    <span className="text-sm font-bold text-gray-800">{record.attendance_date || record.date || <Placeholder />}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{startData?.time || <Placeholder />}</span>
                      {startData?.method && (
                        <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-tight">{startData.method}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{endData?.time || <Placeholder />}</span>
                      {endData?.method && (
                        <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-tight">{endData.method}</span>
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
                <h3 className="truncate font-bold text-gray-800 text-base">{record.attendance_date || record.date || <Placeholder />}</h3>
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
                {startData?.method && (
                  <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-tight">{startData.method}</span>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">{typeConfig.endLabel}</span>
                <span className="text-xs font-bold text-gray-700 truncate block">{endData?.time || <Placeholder />}</span>
                {endData?.method && (
                  <span className="text-[9px] text-indigo-400 uppercase font-bold tracking-tight">{endData.method}</span>
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
  const activeType = normalizeAttendanceType(searchParams.get('type') || 'attendance');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

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

  const [dateFilter, setDateFilter] = useState({ date: '', month: '', year: '', from_date: '', to_date: '' });

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);
  const fetchLock = useRef(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      if (dateFilter.date) params.date = dateFilter.date;
      if (dateFilter.month) params.month = dateFilter.month;
      if (dateFilter.year) params.year = dateFilter.year;
      if (dateFilter.from_date) params.from_date = dateFilter.from_date;
      if (dateFilter.to_date) params.to_date = dateFilter.to_date;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await fetchMyAttendanceAPI({
        companyId: company?.id,
        page: params.page,
        limit: params.limit,
        params,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const normalizedRecords = normalizeHistoryRecords(data.data || [], activeType);
        setRecords(normalizedRecords);
        setTotalRecords(data.meta?.total ?? normalizedRecords.length ?? 0);
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
  }, [pagination.page, pagination.limit, dateFilter, debouncedSearch, activeType]);

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
      {/* Header */}
      <div className="mb-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              <FaHistory size={11} />
              Attendance history
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
              Attendance History
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review attendance logs, breaks, and daily activity in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <FaBriefcase className="text-indigo-500" />
              <span className="font-medium text-slate-700">{records.length}</span>
              <span className="text-slate-500">records</span>
            </div>
            <RefreshButton
              type="button"
              loading={loading}
              onClick={loadData}
              title="Refresh attendance history"
            >
              Refresh
            </RefreshButton>
          </div>
        </div>
      </div>



      <div className="space-y-4">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Search by code, status, mode..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-medium min-h-[42px]"
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
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between xsm:flex-col">

              <div className="flex items-center gap-2 ">
                <AdvancedDateFilter
                  value={dateFilter}
                  onChange={(val) => setDateFilter(val)}
                  buttonClassName="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all min-w-[200px]"
                  tabOptions={["date", "month", "range"]}
                />

                {/* Attendance / Break icon-only toggle */}
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-0.5">
                  {Object.values(ATTENDANCE_TYPE_CONFIG).map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeType === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveType(tab.value)}
                        title={tab.label}
                        className={`w-12 h-9 flex items-center justify-center rounded-lg transition-all ${isActive
                          ? tab.activeClassName
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <TabIcon size={15} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 xsm:w-full justify-end">
                <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
              </div>
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
      </div>

      {modalOpen && selectedRecord && (
        <DetailsModal record={selectedRecord} onClose={closeModal} />
      )}

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
  const activeType = normalizeAttendanceType(record.record_type || record.activeType || 'attendance');
  const isAttendance = activeType === 'attendance';
  const isBreak = activeType === 'break';
  const typeConfig = getAttendanceTypeConfig(activeType);
  const startData = record[typeConfig.startKey];
  const endData = record[typeConfig.endKey];

  const shift = record.shift || {};
  const flags = record.flags || {};
  const isOvertime = flags.overtime?.enabled || record.is_overtime === 1 || false;
  const isHalfDay = flags.half_day?.enabled || record.day_status === 'half_day' || false;
  const isDeductible = flags.deductible?.enabled || record.is_deductible === 1 || false;

  const reviewerLabel = record.reviewed_by_name || record.reviewed_by || 'System';

  const formatMins = (m) => {
    if (m === null || m === undefined) return "0m";
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Modal
      isOpen={!!record}
      onClose={onClose}
      title={record.attendance_date || record.date || "Attendance Details"}
      subtitle={`Detailed ${typeConfig.label.toLowerCase()} log overview`}
      icon={<FaInfoCircle className="h-6 w-6" />}
      size="4xl"
      footer={
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        {/* Employee Info (New Section) */}
        <div className="border-b border-slate-100 pb-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <FaUsers className="text-blue-500" /> Employee Information
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</label>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{record.name || user?.full_name || "—"}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Code</label>
              <p className="mt-0.5 text-sm font-semibold text-slate-600">{record.employee_code || "—"}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Designation</label>
              <p className="mt-0.5 text-sm font-semibold text-slate-600 truncate">{fmt(record.designation)}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Day Status</label>
              <p className="mt-0.5 text-sm font-bold text-emerald-600 uppercase tracking-tighter">{record.day_status || "—"}</p>
            </div>
          </div>
        </div>

        {/* Basic Info (Attendance/Break Log) */}
        <div className="border-b border-slate-100 pb-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <typeConfig.icon className="text-indigo-500" /> {typeConfig.label} Log
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</label>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{record.attendance_date || record.date || <Placeholder />}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${style.className}`}>
                  <StatusIcon size={12} />
                  {style.text.toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{typeConfig.startLabel}</label>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{startData?.time || <Placeholder />}</p>
              {startData?.method && <p className="text-[9px] font-bold uppercase text-indigo-400">{fmt(startData.method)}</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{typeConfig.endLabel}</label>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{endData?.time || <Placeholder />}</p>
              {endData?.method && <p className="text-[9px] font-bold uppercase text-indigo-400">{fmt(endData.method)}</p>}
            </div>
          </div>
        </div>

        {record.remark && (
          <div className="border-b border-slate-100 pb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FaComment className="text-indigo-500" /> Remarks
            </h3>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700 italic">
              "{record.remark}"
            </p>
          </div>
        )}

        {/* System Metadata */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-4">
          <div className="flex items-start gap-4 border-b border-slate-200 pb-4">
            <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 flex-shrink-0">
              <FaMapMarkerAlt size={14} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Device & Location Punches</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Punch In</p>
                  <p className="text-xs font-semibold text-slate-700">IP: {startData?.ip || "—"}</p>
                  <p className="text-xs font-semibold text-slate-700">GPS: {startData?.lat && startData?.lng ? `${startData.lat}, ${startData.lng}` : "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Punch Out</p>
                  <p className="text-xs font-semibold text-slate-700">IP: {endData?.ip || "—"}</p>
                  <p className="text-xs font-semibold text-slate-700">GPS: {endData?.lat && endData?.lng ? `${endData.lat}, ${endData.lng}` : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 flex-shrink-0">
              <FaCog size={14} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">System Audit</span>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">ID: {record.id || <Placeholder />}</span>
                <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">Reviewed By: {reviewerLabel}</span>
                {record.verified_at && <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">Verified At: {record.verified_at}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};


export default AttendanceHistory;
