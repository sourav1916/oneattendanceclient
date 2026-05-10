import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft, FaChevronRight, FaClock, FaUser, FaSearch,
  FaCheckCircle, FaCalendarAlt, FaBuilding,
  FaUmbrellaBeach, FaMoneyBillWave, FaHourglassHalf,
  FaHistory, FaTimesCircle, FaChevronDown, FaTimes
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
  { value: 'unmarked', label: 'Unmarked' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'paid_leave', label: 'Paid Leave' },
  { value: 'half_day', label: 'Half Day' },
  { value: '', label: 'All' },
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatTime = (t) => {
  if (!t) return 'Not Marked';
  try {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return t; }
};

const formatDate = (dateStr) => {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const getExactPunchTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  if (typeof value === 'object') return value?.time ? String(value.time).slice(0, 5) : '';
  return '';
};

const formatMins = (m) => {
  if (!m) return "0m";
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-emerald-500 text-white shadow-emerald-200', dot: 'bg-emerald-500' },
  half_day: { label: 'Half Day', color: 'bg-sky-500 text-white shadow-sky-200', dot: 'bg-sky-500' },
  absent: { label: 'Absent', color: 'bg-rose-500 text-white shadow-rose-200', dot: 'bg-rose-500' },
  paid_leave: { label: 'Paid Leave', color: 'bg-violet-500 text-white shadow-violet-200', dot: 'bg-violet-500' },
  unmarked: { label: 'Unmarked', color: 'bg-slate-500 text-white shadow-slate-200', dot: 'bg-slate-500' },
};

// ─── UNIFIED ATTENDANCE MODAL ──────────────────────────────────────────────────
const ManageAttendanceModal = ({ employee, initialTab, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'present');
  const [loading, setLoading] = useState(false);

  // Form States
  const [punchIn, setPunchIn] = useState(getExactPunchTime(employee?.punch_in));
  const [punchOut, setPunchOut] = useState(getExactPunchTime(employee?.punch_out));
  const [isOt, setIsOt] = useState(employee?.is_ot || false);
  const [isDeductible, setIsDeductible] = useState(employee?.is_deductible || false);

  // Present-tab override states (null = auto from calculation)
  const [otOverride, setOtOverride] = useState(null);       // null | true | false
  const [halfDayOverride, setHalfDayOverride] = useState(null);
  const [deductOverride, setDeductOverride] = useState(null);

  const [notes, setNotes] = useState('');
  const [halfSession, setHalfSession] = useState('first');

  // Leave tab states
  const [leaveSubTab, setLeaveSubTab] = useState('paid');  // 'paid' | 'unpaid'
  const [companyLeaves, setCompanyLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [includeHoliday, setIncludeHoliday] = useState(false);

  // Ensure state stays synced when employee or tab changes
  useEffect(() => {
    setActiveTab(initialTab || 'present');
    setPunchIn(getExactPunchTime(employee?.punch_in));
    setPunchOut(getExactPunchTime(employee?.punch_out));
    setIsOt(employee?.is_ot || false);
    setIsDeductible(employee?.is_deductible || false);
    // Reset overrides when employee changes
    setOtOverride(null);
    setHalfDayOverride(null);
    setDeductOverride(null);
    // Reset leave state
    setLeaveSubTab('paid');
    setSelectedLeave(null);
    setIncludeWeekend(false);
    setIncludeHoliday(false);
  }, [employee, initialTab]);

  // Fetch company leave types when leave tab is active
  useEffect(() => {
    if (activeTab !== 'paid_leave') return;
    if (companyLeaves.length > 0) return; // already loaded
    const fetchLeaves = async () => {
      setLeavesLoading(true);
      try {
        const companyId = JSON.parse(localStorage.getItem('company'))?.id;
        const res = await apiCall('/leave/company', 'GET', null, companyId);
        const data = await res.json();
        if (data.success) setCompanyLeaves(data.data.filter(l => l.is_active));
      } catch (e) {
        console.error('Failed to load leave types', e);
      } finally {
        setLeavesLoading(false);
      }
    };
    fetchLeaves();
  }, [activeTab]);

  // Reset overrides to auto whenever punch times change
  useEffect(() => {
    setOtOverride(null);
    setHalfDayOverride(null);
    setDeductOverride(null);
  }, [punchIn, punchOut]);

  // Calculation Logic
  const metrics = useMemo(() => {
    const toMins = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const formatMins = (m) => {
      const hrs = Math.floor(m / 60);
      const mins = m % 60;
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const sIn = toMins('09:00'); // Assume 9 AM shift start
    const sOut = toMins('18:00'); // Assume 6 PM shift end
    const pIn = toMins(punchIn);
    const pOut = toMins(punchOut);

    const expectedMins = 540; // 9 hours
    const actualMins = punchIn && punchOut ? (pOut >= pIn ? pOut - pIn : (1440 - pIn) + pOut) : 0;
    const diff = actualMins - expectedMins;

    return {
      expected: formatMins(expectedMins),
      actual: formatMins(actualMins),
      grace: '15m',
      window: '09:00 AM - 06:00 PM',
      isOvertime: diff > 0,
      isDeductible: diff < 0,
      isHalfDay: actualMins > 0 && actualMins < (expectedMins / 2 + 30),
      diffLabel: diff >= 0 ? formatMins(diff) : formatMins(Math.abs(diff)),
      status: diff >= 0 ? 'Within scheduled time' : 'Below scheduled time',
      statusColor: diff >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
    };
  }, [punchIn, punchOut]);

  const TABS = [
    { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'half_day', label: 'Half Day', icon: FaHourglassHalf, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'fine', label: 'Deduction', icon: FaMoneyBillWave, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'ot', label: 'Overtime', icon: FaClock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'paid_leave', label: 'Leave', icon: FaUmbrellaBeach, color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  const handleApply = async () => {
    setLoading(true);
    let payload = { 
      employee_id: employee.employee_id, 
      date: employee.date, 
      type: 'attendance',
      status: activeTab,
      notes: notes
    };

    if (activeTab === 'present') {
      if (!punchIn || !punchOut) {
        toast.error('Punch In/Out are required');
        setLoading(false);
        return;
      }
      payload = {
        ...payload,
        punch_in: punchIn,
        punch_out: punchOut,
        is_overtime: otOverride !== null ? otOverride : metrics.isOvertime,
        is_half_day: halfDayOverride !== null ? halfDayOverride : metrics.isHalfDay,
        is_deductible: deductOverride !== null ? deductOverride : metrics.isDeductible
      };
    } else if (activeTab === 'half_day') {
      if (!punchIn) {
        toast.error('Punch In is required');
        setLoading(false);
        return;
      }
      payload = { 
        ...payload, 
        punch_in: punchIn, 
        punch_out: punchOut || null, 
        half_day_session: halfSession 
      };
    } else if (activeTab === 'fine') {
      payload = { 
        ...payload, 
        is_deductible: isDeductible 
      };
    } else if (activeTab === 'ot') {
      payload = { 
        ...payload, 
        is_overtime: isOt 
      };
    } else if (activeTab === 'paid_leave') {
      if (leaveSubTab === 'paid') {
        if (!selectedLeave) {
          toast.error('Please select a leave type');
          setLoading(false);
          return;
        }
        payload = {
          ...payload,
          status: 'paid_leave',
          leave_id: selectedLeave.id,
          leave_code: selectedLeave.code,
          value1: 'paid',
          value2: selectedLeave.code
        };
      } else {
        payload = {
          ...payload,
          status: 'unpaid_leave',
          value1: 'unpaid',
          include_weekend: includeWeekend,
          include_holiday: includeHoliday
        };
      }
    }

    await onSubmit(payload);
    setLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'present':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <TimePickerField label="Punch In" value={punchIn} onChange={setPunchIn} />
              <TimePickerField label="Punch Out" value={punchOut} onChange={setPunchOut} />
            </div>

            <div className={`rounded-2xl border p-4 ${metrics.statusColor} transition-colors duration-500`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider">{metrics.status}</span>
                <span className="text-[11px] font-black">{metrics.diffLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex justify-between border-b border-current/10 pb-1">
                  <span className="text-[10px] opacity-70 font-bold uppercase">Expected work</span>
                  <span className="text-[11px] font-black">{metrics.expected}</span>
                </div>
                <div className="flex justify-between border-b border-current/10 pb-1">
                  <span className="text-[10px] opacity-70 font-bold uppercase">Actual time</span>
                  <span className="text-[11px] font-black">{metrics.actual}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] opacity-70 font-bold uppercase">Grace</span>
                  <span className="text-[11px] font-black">{metrics.grace}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] opacity-70 font-bold uppercase">Shift window</span>
                  <span className="text-[11px] font-black">{metrics.window}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Overtime',
                  autoVal: metrics.isOvertime,
                  override: otOverride,
                  setOverride: setOtOverride,
                  icon: FaClock,
                  color: 'orange'
                },
                {
                  label: 'Half Day',
                  autoVal: metrics.isHalfDay,
                  override: halfDayOverride,
                  setOverride: setHalfDayOverride,
                  icon: FaHourglassHalf,
                  color: 'blue'
                },
                {
                  label: 'Deductible',
                  autoVal: metrics.isDeductible,
                  override: deductOverride,
                  setOverride: setDeductOverride,
                  icon: FaMoneyBillWave,
                  color: 'rose'
                }
              ].map(card => {
                const isOverridden = card.override !== null;
                const active = isOverridden ? card.override : card.autoVal;
                const handleToggle = () => {
                  if (!isOverridden) {
                    // First click: override to opposite of auto
                    card.setOverride(!card.autoVal);
                  } else {
                    // Second click on same value: revert to auto
                    if (card.override === card.autoVal) {
                      card.setOverride(null);
                    } else {
                      card.setOverride(null);
                    }
                  }
                };
                return (
                  <div
                    key={card.label}
                    onClick={handleToggle}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer select-none
                      ${active ? `bg-${card.color}-50 border-${card.color}-200 ring-1 ring-${card.color}-100` : 'bg-white border-slate-100 hover:border-slate-200'}
                      ${isOverridden ? 'ring-2 ring-offset-1 ring-indigo-300' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[11px] font-black text-slate-800">{card.label}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-tighter mt-0.5 ${
                          isOverridden ? 'text-indigo-500' : 'text-slate-400'
                        }`}>
                          {isOverridden ? 'Override' : 'Auto'}
                        </p>
                      </div>
                      <div className={`h-6 w-10 rounded-full p-1 transition-colors duration-300 ${active ? `bg-${card.color}-500` : 'bg-slate-200'}`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'half_day':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Session</label>
              <div className="grid grid-cols-2 gap-3">
                {['first', 'second'].map(s => (
                  <ManagementButton key={s} tone="blue" variant={halfSession === s ? "solid" : "soft"} fullWidth onClick={() => setHalfSession(s)}>
                    {s === 'first' ? '1st Half' : '2nd Half'}
                  </ManagementButton>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TimePickerField label="Punch In" value={punchIn} onChange={setPunchIn} />
              <TimePickerField label="Punch Out (Opt)" value={punchOut} onChange={setPunchOut} />
            </div>
          </div>
        );
      case 'absent':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-300">
            <div className="h-20 w-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-sm">
              <FaTimesCircle size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Mark as Absent</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">This will record the employee as absent for the entire day.</p>
            </div>
          </div>
        );
      case 'fine':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {employee.calculations?.late_minutes > 0 && (
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex gap-4">
                <div className="h-10 w-10 shrink-0 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                  <FaMoneyBillWave size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900">Late Arrival Detected</h4>
                  <p className="text-xs text-rose-700/70 font-medium">Employee was late by {formatMins(employee.calculations.late_minutes)}.</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsDeductible(!isDeductible)}>
              <span className="text-sm font-bold text-gray-800">Apply Deduction</span>
              <div className={`h-6 w-11 rounded-full p-1 transition-colors duration-300 ${isDeductible ? 'bg-rose-500' : 'bg-slate-200'}`}>
                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDeductible ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        );
      case 'ot':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {employee.calculations?.overtime_minutes > 0 && (
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex gap-4">
                <div className="h-10 w-10 shrink-0 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <FaClock size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-orange-900">Overtime Calculation</h4>
                  <p className="text-xs text-orange-700/70 font-medium">
                    Calculated OT: {formatMins(employee.calculations.overtime_minutes)}.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsOt(!isOt)}>
              <span className="text-sm font-bold text-gray-800">Approve Overtime</span>
              <div className={`h-6 w-11 rounded-full p-1 transition-colors duration-300 ${isOt ? 'bg-orange-500' : 'bg-slate-200'}`}>
                <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isOt ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        );
      case 'paid_leave': {
        const paidLeaves = companyLeaves.filter(l => l.is_paid);
        const unpaidLeaves = companyLeaves.filter(l => !l.is_paid);
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sub-tab switcher */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'paid', label: '💳 Paid Leave' },
                { id: 'unpaid', label: '🔴 Unpaid Leave' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setLeaveSubTab(tab.id); setSelectedLeave(null); }}
                  className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all duration-200 ${
                    leaveSubTab === tab.id
                      ? tab.id === 'paid'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PAID LEAVE */}
            {leaveSubTab === 'paid' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Select Leave Type</label>
                {leavesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-7 w-7 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
                  </div>
                ) : paidLeaves.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <FaUmbrellaBeach size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">No paid leave types configured for this company</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {paidLeaves.map(leave => (
                      <div
                        key={leave.id}
                        onClick={() => setSelectedLeave(selectedLeave?.id === leave.id ? null : leave)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedLeave?.id === leave.id
                            ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-100'
                            : 'bg-white border-slate-100 hover:border-violet-200 hover:bg-violet-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                            selectedLeave?.id === leave.id ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {leave.code}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{leave.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Max {leave.max_balance} days
                              {leave.allow_half_day ? ' · Half-day allowed' : ''}
                              {leave.exclude_weekends ? ' · Weekends excluded' : ''}
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selectedLeave?.id === leave.id ? 'bg-violet-600 border-violet-600' : 'border-slate-200'
                        }`}>
                          {selectedLeave?.id === leave.id && (
                            <FaCheckCircle size={10} className="text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* UNPAID LEAVE */}
            {leaveSubTab === 'unpaid' && (
              <div className="space-y-4">
                {/* Warning banner */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex gap-3 items-start">
                  <FaTimesCircle className="text-rose-400 mt-0.5 shrink-0" size={15} />
                  <div>
                    <p className="text-xs font-black text-rose-800 mb-0.5">Unpaid Leave</p>
                    <p className="text-[11px] text-rose-700/80 font-medium leading-relaxed">
                      This will result in a salary deduction for the day. Mark any applicable exclusions below.
                    </p>
                  </div>
                </div>

                {/* Weekend & Holiday toggles */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Day Classification</label>
                  {[
                    {
                      key: 'weekend',
                      label: 'Weekend',
                      sub: 'Employee is off on weekends — mark day accordingly',
                      state: includeWeekend,
                      setState: setIncludeWeekend,
                      color: 'sky'
                    },
                    {
                      key: 'holiday',
                      label: 'Public Holiday',
                      sub: 'This is a declared company or national holiday',
                      state: includeHoliday,
                      setState: setIncludeHoliday,
                      color: 'amber'
                    }
                  ].map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => opt.setState(!opt.state)}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all select-none ${
                        opt.state
                          ? `bg-${opt.color}-50 border-${opt.color}-200 ring-1 ring-${opt.color}-100`
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.sub}</p>
                      </div>
                      <div className={`h-6 w-11 rounded-full p-1 transition-colors duration-300 ${
                        opt.state ? `bg-${opt.color}-500` : 'bg-slate-200'
                      }`}>
                        <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          opt.state ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      default: return null;
    }
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab);


  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Manage Attendance"
      subtitle={employee.name}
      size="4xl"
      footer={
        <>
          <ManagementButton tone="slate" variant="soft" onClick={onClose}>Cancel</ManagementButton>
          <ManagementButton
            tone={activeTabMeta.color.split('-')[1]}
            loading={loading}
            onClick={handleApply}
          >
            Confirm {activeTabMeta.label}
          </ManagementButton>
        </>
      }
    >
      <div className="flex max-h-[500px] -m-6 flex-col overflow-hidden">
        {/* Top Nav */}
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
                <div className={`shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-colors ${isActive ? tab.bg : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
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
            <hr className="border-slate-100" />
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Notes / Reason (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add any details or reasoning..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── EMPLOYEE ATTENDANCE CARD ──────────────────────────────────────────────────
const EmployeeAttendanceCard = ({ emp, onAction }) => {
  const statusCfg = STATUS_CONFIG[emp.status];
  return (
    <ManagementCard
      title={emp.name}
      subtitle={`[${emp.employee_code}]`}
      accent={statusCfg ? statusCfg.dot.replace('bg-', '') : 'slate'}
      icon={<FaUser className="text-slate-500" />}
      badge={
        <div className="flex items-center gap-2">
          {statusCfg && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onAction(emp, 'logs'); }}
            className="p-1.5 rounded-lg bg-white/80 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shadow-sm"
            title="View Logs"
          >
            <FaHistory size={11} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1 text-xs text-indigo-500 font-semibold">
            <FaCalendarAlt size={9} />
            <span>{formatDate(emp.date)} | {emp.day_label}</span>
            {emp.shift && emp.shift !== 'No Shift' && (
              <><span className="text-gray-300 mx-1">·</span><FaBuilding size={9} className="text-gray-400" /><span className="text-gray-500">{emp.shift}</span></>
            )}
          </div>
          <p className="text-xs text-gray-700 font-semibold">
            Duty Time : <span className="font-black">{emp.duty_hours}</span>
          </p>
          <div className="flex gap-3 text-xs">
            <span>
              Punch In:{' '}
              <span className={emp.punch_in ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                {emp.punch_in ? formatTime(emp.punch_in) : 'Not Marked'}
              </span>
            </span>
            <span className="text-gray-300">|</span>
            <span>
              Punch Out:{' '}
              <span className={emp.punch_out ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                {emp.punch_out ? formatTime(emp.punch_out) : 'Not Marked'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {emp.is_deductible ? (
              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Deductible</span>
            ) : emp.calculations?.late_minutes > 0 ? (
              <p className="text-[10px] text-rose-500 font-bold tracking-tight">Late: {formatMins(emp.calculations.late_minutes)}</p>
            ) : null}
            
            {emp.calculations?.overtime_minutes > 0 ? (
              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">OT</span>
            ) : emp.calculations?.overtime_minutes > 0 ? (
              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">Pending OT: {(emp.calculations.overtime_minutes / 60).toFixed(1)}h</span>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 shrink-0 md:w-80">
          <ManagementButton size="sm" tone="emerald" variant={emp.status === 'present' ? 'solid' : 'soft'} onClick={() => onAction(emp, 'present')}>Present</ManagementButton>
          <ManagementButton size="sm" tone="blue" variant={emp.status === 'half_day' ? 'solid' : 'soft'} onClick={() => onAction(emp, 'half_day')}>Half Day</ManagementButton>
          <ManagementButton size="sm" tone="rose" variant={emp.status === 'absent' ? 'solid' : 'soft'} onClick={() => onAction(emp, 'absent')}>Absent</ManagementButton>
          <ManagementButton size="sm" tone="slate" variant={emp.is_deductible ? 'solid' : 'outline'} onClick={() => onAction(emp, 'fine')}>Deduct</ManagementButton>
          <ManagementButton size="sm" tone="amber" variant={emp.is_ot ? 'solid' : 'outline'} onClick={() => onAction(emp, 'ot')}>OT</ManagementButton>
          <ManagementButton size="sm" tone="violet" variant={emp.status === 'paid_leave' ? 'solid' : 'outline'} onClick={() => onAction(emp, 'paid_leave')}>Leave</ManagementButton>
        </div>
      </div>
    </ManagementCard>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const UnmarkedAttendance = () => {
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
  const [dayStatus, setDayStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const lastRequestKeyRef = useRef('');

  const fetchAttendance = useCallback(async () => {
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
            user_id: emp.user_id,
            name: emp.name,
            employee_code: emp.employee_code,
            designation: emp.designation,
            shift: emp.shift ? `${formatTime(emp.shift.start_time)} - ${formatTime(emp.shift.end_time)}` : 'No Shift',
            department: emp.designation ? emp.designation.replace(/_/g, ' ').toUpperCase() : '',
            date: displayDate,
            day_label: displayDate ? new Date(`${displayDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }) : '',
            duty_hours: emp.shift ? formatMinutes(emp.shift.expected_work_minutes) : '00 Hours 00 Minutes',
            punch_in: att?.punch_in?.time || null,
            punch_out: att?.punch_out?.time || null,
            status: att?.day_status || 'unmarked',
            is_deductible: att?.is_deductible || false,
            is_ot: att?.is_overtime || false,
            ot_flag: att?.is_overtime || false,
            calculations: att?.calculations || null,
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
        throw new Error(result.message || 'Failed to fetch attendance data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, pagination.page, pagination.limit, search, dayStatus, selectedEmployee, updatePagination]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAttendance]);

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

  function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')} Hours ${String(m).padStart(2, '0')} Minutes`;
  }

  const displayDate = useMemo(() => {
    if (dateFilter.date) return formatDate(dateFilter.date);
    if (dateFilter.month && dateFilter.year) return `${dateFilter.month}/${dateFilter.year}`;
    if (dateFilter.from_date && dateFilter.to_date) return `${formatDate(dateFilter.from_date)} - ${formatDate(dateFilter.to_date)}`;
    return 'Select Date';
  }, [dateFilter]);

  const handleAction = (emp, action) => {
    setModal({ type: action, emp });
  };

  const handleSubmit = async (payload, empId) => {
    setSaving(true);
    try {
      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const response = await apiCall('/attendance/mark', 'POST', payload, companyId);
      const result = await response.json();
      if (result.success) {
        toast.success('Attendance updated successfully!');
        setModal(null);
        fetchAttendance();
      } else {
        throw new Error(result.message || 'Failed to update attendance');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance');
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
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fetching employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <FaUser size={30} />
              </div>
              <p className="text-slate-600 font-black">No employees found</p>
              <p className="text-slate-400 text-sm mt-1">Try changing the date or search query</p>
            </div>
          ) : (
            <>
              {employees.map(emp => (
                <EmployeeAttendanceCard key={emp.id} emp={emp} onAction={handleAction} />
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
        {modal && modal.type !== 'logs' && (
          <ManageAttendanceModal
            key={modal.emp.id}
            employee={modal.emp}
            initialTab={modal.type}
            onClose={() => setModal(null)}
            onSubmit={(payload) => handleSubmit(payload, modal.emp.id)}
          />
        )}
        {modal?.type === 'logs' && (
          <AttendanceLogsModal
            id={modal.emp.id}
            type="attendance"
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnmarkedAttendance;
