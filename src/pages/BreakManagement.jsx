import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft, FaChevronRight, FaClock, FaUser, FaSearch,
  FaCalendarAlt, FaBuilding, FaTrash, FaHistory,
  FaPlus, FaPlay, FaStop, FaChevronDown, FaCoffee, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import TimePickerField from '../components/TimePicker';
import { ManagementCard, ManagementButton, EmployeeSelect } from '../components/common';
import AttendanceLogsModal from '../components/AttendanceLogsModal';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import AdvancedDateFilter from '../components/AdvancedDateFilter';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all', label: 'Day Status...' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'paid_leave', label: 'Paid Leave' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'unmarked', label: 'Unmarked' },
];

const StatusSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm outline-none focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex items-center justify-between cursor-pointer"
      >
        <span className={value === 'all' ? "text-gray-400" : "font-medium text-gray-800"}>
          {selectedOption ? selectedOption.label : 'Day Status...'}
        </span>
        <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BREAK_TYPES = ['Lunch', 'Short', 'Tea', 'Personal'];
const BREAK_LIMIT_MINS = 60;

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const formatDate = (dateStr) => {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  } catch { return dateStr; }
};

const formatMins = (m) => {
  if (!m) return '0 min';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const calcDur = (start, end) => {
  if (!start || !end) return null;
  const toMins = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const d = toMins(end) - toMins(start);
  return d > 0 ? d : null;
};

const nowTime = () => new Date().toTimeString().slice(0, 5);

const totalBreakMins = (breaks) =>
  breaks.reduce((acc, b) => acc + (b.dur || 0), 0);

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-emerald-500 text-white' },
  half_day: { label: 'Half Day', color: 'bg-sky-500 text-white' },
  absent: { label: 'Absent', color: 'bg-rose-500 text-white' },
  paid_leave: { label: 'Paid Leave', color: 'bg-violet-500 text-white' },
  unmarked: { label: 'Unmarked', color: 'bg-slate-500 text-white' },
};

// ─── UNIFIED BREAK MODAL ──────────────────────────────────────────────────────
const ManageBreaksModal = ({ employee, initialTab, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'live');
  const [loading, setLoading] = useState(false);

  const [breakType, setBreakType] = useState('Lunch');
  const [breakStart, setBreakStart] = useState(nowTime());
  const [breakEnd, setBreakEnd] = useState('');
  const [duration, setDuration] = useState('');

  const [liveAction, setLiveAction] = useState(employee.on_break ? 'end' : 'start');
  const [liveType, setLiveType] = useState('Short');
  const [liveTime, setLiveTime] = useState(nowTime());
  
  const [notes, setNotes] = useState('');

  const TABS = [
    { id: 'live', label: 'Live Track', icon: FaPlay, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'manual', label: 'Manual Add', icon: FaPlus, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'history', label: 'History', icon: FaHistory, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  const handleManualSubmit = async () => {
    if (!breakStart) return toast.error('Start time required');
    setLoading(true);
    await onSubmit({
      employee_id: employee.employee_id,
      date: employee.date,
      type: 'break',
      status: 'manual',
      value1: breakType,
      punch_in: breakStart,
      punch_out: breakEnd || null,
      value2: String(duration ? Number(duration) : (calcDur(breakStart, breakEnd) || '')),
      notes: notes,
    });
    setLoading(false);
  };

  const handleLiveBreakSubmit = async () => {
    if (!liveTime) return toast.error('Time required');
    setLoading(true);
    await onSubmit({
      employee_id: employee.employee_id,
      date: employee.date,
      type: 'break',
      status: 'live',
      value1: liveType,
      value2: liveAction,
      punch_in: liveTime,
      notes: notes,
    });
    setLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'live':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2.5">Quick Action</label>
              <div className="grid grid-cols-2 gap-3">
                {['start', 'end'].map((a) => (
                  <ManagementButton key={a} tone={a === 'start' ? 'emerald' : 'rose'} variant={liveAction === a ? 'solid' : 'soft'} fullWidth onClick={() => setLiveAction(a)}>
                    {a === 'start' ? '▶ Start Break' : '⏹ End Break'}
                  </ManagementButton>
                ))}
              </div>
            </div>
            {liveAction === 'start' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2.5">Break Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {BREAK_TYPES.map((t) => (
                    <ManagementButton key={t} size="sm" tone="blue" variant={liveType === t ? 'solid' : 'soft'} fullWidth onClick={() => setLiveType(t)}>
                      {t}
                    </ManagementButton>
                  ))}
                </div>
              </div>
            )}
            <TimePickerField label={liveAction === 'start' ? 'Start Time' : 'End Time'} value={liveTime} onChange={setLiveTime} />
          </div>
        );
      case 'manual':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2.5">Break Type</label>
              <div className="grid grid-cols-4 gap-2">
                {BREAK_TYPES.map((t) => (
                  <ManagementButton key={t} size="sm" tone="amber" variant={breakType === t ? 'solid' : 'soft'} fullWidth onClick={() => setBreakType(t)}>
                    {t}
                  </ManagementButton>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TimePickerField label="Start" value={breakStart} onChange={setBreakStart} />
              <TimePickerField label="End (Opt)" value={breakEnd} onChange={setBreakEnd} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Duration (mins)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Auto-calculated if end set"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {employee.breaks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No break records found</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {employee.breaks.map((b, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">☕ {b.type} Break</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.start} – {b.end || 'ongoing'}</p>
                    </div>
                    <span className="text-sm font-black text-orange-500">{b.dur ? formatMins(b.dur) : '…'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Manage Breaks"
      subtitle={employee.name}
      size="4xl"
      footer={
        <>
          <ManagementButton tone="slate" variant="soft" onClick={onClose}>Cancel</ManagementButton>
          {activeTab !== 'history' && (
            <ManagementButton
              tone={activeTab === 'live' ? 'emerald' : 'amber'}
              loading={loading}
              onClick={activeTab === 'live' ? handleLiveBreakSubmit : handleManualSubmit}
            >
              Confirm {activeTabMeta.label}
            </ManagementButton>
          )}
        </>
      }
    >
      <div className="flex max-h-[500px] -m-6 flex-col overflow-hidden">
        <div className="w-full shrink-0 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center p-2 gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 group ${isActive
                  ? `bg-white shadow-sm border border-slate-200 ${tab.color}`
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                  }`}
              >
                <div className={`shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-colors ${isActive ? tab.bg : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  <Icon size={12} />
                </div>
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {renderContent()}
            {activeTab !== 'history' && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any details..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── EMPLOYEE BREAK CARD ──────────────────────────────────────────────────────
const EmployeeBreakCard = ({ emp, onAction }) => {
  const total = emp.total_break_mins;
  const over = total > BREAK_LIMIT_MINS;
  const barPct = Math.min(100, Math.round((total / BREAK_LIMIT_MINS) * 100));
  const statusCfg = STATUS_CONFIG[emp.status];

  return (
    <ManagementCard
      title={emp.name}
      subtitle={`[${emp.employee_code}]`}
      accent={emp.on_break ? 'orange' : 'slate'}
      icon={<FaUser className="text-slate-500" />}
      badge={
        <div className="flex items-center gap-1.5">
          {statusCfg && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          )}
          {emp.on_break && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-white animate-pulse">
              On Break
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAction(emp, 'attendance_logs'); }}
            className="p-1.5 rounded-lg bg-white/80 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shadow-sm ml-0.5"
            title="View Attendance Logs"
          >
            <FaHistory size={11} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-1 text-xs text-indigo-500 font-semibold flex-wrap">
            <FaCalendarAlt size={9} />
            <span>{emp.date} | {emp.day_label}</span>
            {emp.department && (
              <><span className="text-gray-300 mx-1">·</span><FaBuilding size={9} className="text-gray-400" /><span className="text-gray-500">{emp.department}</span></>
            )}
          </div>
          <div className="flex gap-5 flex-wrap text-xs">
            <span className="text-gray-700 font-semibold">Total Breaks: <span className="font-black text-gray-900">{emp.breaks.length}</span></span>
            <span className="text-gray-700 font-semibold">Break Time: <span className={`font-black ${over ? 'text-rose-500' : 'text-orange-500'}`}>{formatMins(total)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Break usage</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : 'bg-orange-400'}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`text-[10px] font-black whitespace-nowrap ${over ? 'text-rose-500' : 'text-gray-600'}`}>{formatMins(total)} / {BREAK_LIMIT_MINS} min</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2 shrink-0 md:w-80">
          <ManagementButton size="sm" tone="amber" variant="soft" fullWidth onClick={() => onAction(emp, 'add_break')}><FaPlus size={9} className="mr-1" /> Add Break</ManagementButton>
          <ManagementButton size="sm" tone={emp.on_break ? 'rose' : 'emerald'} variant={emp.on_break ? 'solid' : 'soft'} fullWidth onClick={() => onAction(emp, 'live_break')}>
            {emp.on_break ? <FaStop size={9} className="mr-1" /> : <FaPlay size={9} className="mr-1" />}
            {emp.on_break ? 'End Break' : 'Start Break'}
          </ManagementButton>
          <ManagementButton size="sm" tone="blue" variant="soft" fullWidth onClick={() => onAction(emp, 'break_history')}><FaHistory size={9} className="mr-1" /> History</ManagementButton>
          <ManagementButton size="sm" tone="rose" variant="outline" fullWidth onClick={() => onAction(emp, 'clear_all')}><FaTrash size={9} className="mr-1" /> Clear</ManagementButton>
        </div>
      </div>
    </ManagementCard>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const BreakManagement = () => {
  const [dateFilter, setDateFilter] = useState({
    date: new Date().toISOString().slice(0, 10),
    month: '',
    year: '',
    from_date: '',
    to_date: '',
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);
  const [search, setSearch] = useState('');
  const [dayStatus, setDayStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const lastRequestKeyRef = useRef('');

  const fetchBreaks = useCallback(async () => {
    const requestKey = `${pagination.page}-${pagination.limit}-${search}-${dayStatus}-${selectedEmployee}-${JSON.stringify(dateFilter)}`;
    if (requestKey === lastRequestKeyRef.current && !loading) return;
    lastRequestKeyRef.current = requestKey;

    setLoading(true);
    try {
      let fromDate = '', toDate = '';
      if (dateFilter.date) {
        fromDate = toDate = dateFilter.date;
      } else if (dateFilter.from_date && dateFilter.to_date) {
        fromDate = dateFilter.from_date;
        toDate = dateFilter.to_date;
      } else if (dateFilter.month && dateFilter.year) {
        fromDate = `${dateFilter.year}-${String(dateFilter.month).padStart(2, '0')}-01`;
        toDate = new Date(dateFilter.year, dateFilter.month, 0).toISOString().slice(0, 10);
      }

      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const statusParam = dayStatus === 'all' ? '' : `&day_status=${dayStatus}`;
      const empParam = selectedEmployee ? `&employee_id=${selectedEmployee}` : '';
      const response = await apiCall(
        `/attendance/list?from_date=${fromDate}&to_date=${toDate}&page=${pagination.page}&limit=${pagination.limit}&search=${search}${statusParam}${empParam}`,
        'GET',
        null,
        companyId
      );
      const result = await response.json();
      if (result.success) {
        const mapped = result.data.map(emp => {
          const att = emp.attendances && emp.attendances[0];
          const displayDate = att?.attendance_date || dateFilter.date || dateFilter.from_date || '';
          return {
            id: emp.id,
            employee_id: emp.employee_id,
            name: emp.name,
            employee_code: emp.employee_code,
            department: emp.designation ? emp.designation.replace(/_/g, ' ').toUpperCase() : '',
            date: displayDate,
            day_label: displayDate ? new Date(`${displayDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }) : '',
            status: att?.day_status || 'unmarked',
            breaks: att?.breaks || [],
            total_break_mins: att?.calculations?.break_minutes || 0,
            on_break: att?.punch_in && !att?.punch_out && att?.day_status === 'on_break',
            attendance_record: att
          };
        });
        setEmployees(mapped);
        updatePagination({
          total: result.meta.total,
          total_pages: result.meta.total_pages,
          page: result.meta.page,
          limit: result.meta.limit
        });
      } else {
        throw new Error(result.message || 'Failed to fetch break data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load break data');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, pagination.page, pagination.limit, search, dayStatus, selectedEmployee, updatePagination]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBreaks();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchBreaks]);

  const handleDateChange = (val) => {
    setDateFilter(val);
    goToPage(1);
  };

  const handleSearch = (val) => {
    setSearch(val);
    goToPage(1);
  };

  const handleStatusChange = (status) => {
    setDayStatus(status);
    goToPage(1);
  };

  const handleEmployeeChange = (id) => {
    setSelectedEmployee(id);
    goToPage(1);
  };

  const displayDate = useMemo(() => {
    if (dateFilter.date) return formatDate(dateFilter.date);
    if (dateFilter.month && dateFilter.year) return `${dateFilter.month}/${dateFilter.year}`;
    if (dateFilter.from_date && dateFilter.to_date) return `${formatDate(dateFilter.from_date)} - ${formatDate(dateFilter.to_date)}`;
    return 'Select Date';
  }, [dateFilter]);

  const handleAction = (emp, action, extra = null) => {
    if (action === 'clear_all') {
      if (!window.confirm(`Clear all breaks for ${emp.name}?`)) return;
      toast.info('Feature pending API update');
      return;
    }
    setModal({ type: action, emp });
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const response = await apiCall('/attendance/mark', 'POST', payload, companyId);
      const result = await response.json();
      if (result.success) {
        toast.success('Updated successfully!');
        setModal(null);
        fetchBreaks();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6"
        >
          {/* 1. Search Field */}
          <div className="w-full lg:w-1/3 xl:w-2/5 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by name, code or email..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-11 text-sm font-medium text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-gray-600"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          {/* 2. Filters Wrapper */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 lg:gap-4 w-full lg:w-auto lg:flex-1 lg:justify-end">
            {/* Day Status Select */}
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <StatusSelect
                value={dayStatus}
                onChange={handleStatusChange}
                options={STATUS_OPTIONS}
              />
            </div>

            {/* Employee Select */}
            <div className="w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-56">
              <EmployeeSelect
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                placeholder="Specific Employee..."
              />
            </div>

            {/* Advanced Date Filter */}
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <AdvancedDateFilter
                value={dateFilter}
                onChange={handleDateChange}
                buttonClassName="w-full sm:w-auto inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                placeholder="Pick Date"
              />
            </div>
          </div>


        </motion.div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fetching data...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><FaCoffee size={30} /></div>
              <p className="text-slate-600 font-black">No break records found</p>
              <p className="text-slate-400 text-sm mt-1">Try changing the date or search query</p>
            </div>
          ) : (
            <>
              {employees.map(emp => (
                <EmployeeBreakCard key={emp.id} emp={emp} onAction={handleAction} />
              ))}
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={goToPage}
                onLimitChange={changeLimit}
              />
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && !['attendance_logs', 'clear_all'].includes(modal.type) && (
          <ManageBreaksModal
            employee={modal.emp}
            initialTab={modal.type === 'break_history' ? 'history' : modal.type === 'add_break' ? 'manual' : 'live'}
            onClose={() => setModal(null)}
            onSubmit={handleUpdate}
          />
        )}
        {modal?.type === 'attendance_logs' && (
          <AttendanceLogsModal id={modal.emp.id} type="attendance" onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BreakManagement;
