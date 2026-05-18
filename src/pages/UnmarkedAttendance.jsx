import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft, FaChevronRight, FaClock, FaUser, FaSearch,
  FaCheckCircle, FaCalendarAlt, FaBuilding,
  FaUmbrellaBeach, FaMoneyBillWave, FaHourglassHalf,
  FaHistory, FaTimesCircle, FaChevronDown, FaTimes, FaCheck,
  FaUsers, FaUserCheck, FaUserTimes, FaUserClock
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import TimePickerField from '../components/TimePicker';
import { ManagementCard, ManagementButton, EmployeeSelect, RefreshButton } from '../components/common';
import AttendanceLogsModal from '../components/AttendanceLogsModal';
import TimeDurationPickerField from '../components/TimeDurationPicker';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import AdvancedDateFilter from '../components/AdvancedDateFilter';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'paid_leave', label: 'Paid Leave' },
  { value: 'unmarked', label: 'Unmarked' },
];

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
  half_day: { label: 'Half Day', color: 'bg-sky-500 text-white', dot: 'bg-sky-500' },
  absent: { label: 'Absent', color: 'bg-rose-500 text-white', dot: 'bg-rose-500' },
  paid_leave: { label: 'Paid Leave', color: 'bg-violet-500 text-white', dot: 'bg-violet-500' },
  leave: { label: 'Leave', color: 'bg-violet-500 text-white', dot: 'bg-violet-500' },
  unmarked: { label: 'Unmarked', color: 'bg-slate-400 text-white', dot: 'bg-slate-400' },
};

const BULK_ATTENDANCE_ACTIONS = [
  { id: 'actual_data', label: 'Actual Data', tone: 'slate', toneClass: 'bg-slate-500 text-white' },
  { id: 'paid_leave', label: 'Paid Leave', tone: 'violet', toneClass: 'bg-violet-500 text-white' },
  { id: 'absent', label: 'Absent', tone: 'rose', toneClass: 'bg-rose-500 text-white' },
  { id: 'present', label: 'Present', tone: 'emerald', toneClass: 'bg-emerald-500 text-white' },
  { id: 'half_day', label: 'Half Day', tone: 'sky', toneClass: 'bg-sky-500 text-white' },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const formatTime = (t) => {
  if (!t) return null;
  try {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return t; }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

const formatMins = (m) => {
  if (!m || m === 0) return '0m';
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

const formatMinutes = (mins) => {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
};

const getExactPunchTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  if (typeof value === 'object' && value?.time) return String(value.time).slice(0, 5);
  return '';
};

const toMinutes = (timeStr) => {
  const exactTime = getExactPunchTime(timeStr);
  if (!exactTime) return null;
  const [hours, minutes] = exactTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return (hours * 60) + minutes;
};

const toTimeString = (minutes) => {
  const safeMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
};

const parseHToMinutes = (str) => {
  if (!str) return null;
  const normalized = String(str).trim();
  const colonMatch = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  const hMatch = normalized.match(/(\d+)\s*h/i);
  const mMatch = normalized.match(/(\d+)\s*m/i);
  let totalMinutes = 0;
  if (hMatch) totalMinutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) totalMinutes += parseInt(mMatch[1], 10);
  if (!hMatch && !mMatch) {
    const num = parseInt(normalized, 10);
    return isNaN(num) ? null : num;
  }
  return totalMinutes;
};

const hasApiValue = (value) => value !== undefined && value !== null;

const toApiBoolean = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === '' || value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return Boolean(value);
};

const readApiFlag = (...values) => {
  const value = values.find(hasApiValue);
  return toApiBoolean(value);
};

const getDeductibleFlag = (source) => readApiFlag(
  source?.is_deductible,
  source?.flags?.deductible?.enabled
);

const getOvertimeFlag = (source) => readApiFlag(
  source?.is_overtime,
  source?.is_ot,
  source?.flags?.overtime?.enabled
);

const getHalfDayWindow = (shiftStart, shiftEnd, session = 'first') => {
  const startMins = toMinutes(shiftStart) ?? 9 * 60;
  const endMins = toMinutes(shiftEnd) ?? 18 * 60;
  const duration = endMins >= startMins ? endMins - startMins : (24 * 60 - startMins) + endMins;
  const halfDuration = Math.max(1, Math.round(duration / 2));
  const midPoint = startMins + halfDuration;

  if (session === 'second') {
    return {
      punchIn: toTimeString(midPoint),
      punchOut: toTimeString(startMins + duration),
    };
  }

  return {
    punchIn: toTimeString(startMins),
    punchOut: toTimeString(midPoint),
  };
};

const normalizeAttendanceRecord = (record) => {
  if (!record || typeof record !== 'object') return null;

  const punchInTime = getExactPunchTime(record.punch_in?.time || record.punch_in || record.start_time);
  const punchOutTime = getExactPunchTime(record.punch_out?.time || record.punch_out || record.end_time);
  const flags = record.flags || {};
  const calculations = record.calculations || {};
  const dayStatus = record.day_status || record.status || 'unmarked';
  const overtimeMinutes = flags.overtime?.minutes ?? calculations.overtime_minutes ?? 0;
  const deductibleMinutes = flags.deductible?.minutes ?? (
    (calculations.late_minutes || 0) +
    (calculations.early_leave_minutes || 0) +
    (calculations.extra_break_minutes || 0)
  );

  const isOvertime = readApiFlag(record.is_overtime, flags.overtime?.enabled);
  const isDeductible = readApiFlag(record.is_deductible, flags.deductible?.enabled);

  return {
    ...record,
    attendance_id: record.attendance_id ?? record.id ?? null,
    day_status: dayStatus,
    punch_in: punchInTime || null,
    punch_out: punchOutTime || null,
    is_overtime: isOvertime,
    is_deductible: isDeductible,
    flags: {
      overtime: { enabled: isOvertime, minutes: overtimeMinutes },
      deductible: { enabled: isDeductible, minutes: deductibleMinutes },
      half_day: { enabled: flags.half_day?.enabled ?? dayStatus === 'half_day' },
    },
  };
};

const pickPrimaryAttendance = (attendances = []) => {
  const normalized = attendances.map(normalizeAttendanceRecord).filter(Boolean);
  if (normalized.length === 0) return null;
  return normalized[0];
};

const pickPunchAttendance = (attendances = []) => {
  const normalized = attendances.map(normalizeAttendanceRecord).filter(Boolean);
  return normalized.find(att => att.punch_in || att.punch_out) || null;
};

const mapApiEmployee = (emp, fallbackDate) => {
  const attendances = emp.attendances || [];
  const att = pickPrimaryAttendance(attendances);
  const punchAtt = pickPunchAttendance(attendances);
  const displayDate = att?.attendance_date || fallbackDate || '';
  const flags = att?.flags || {};

  // ✅ Only use the actual is_overtime / is_deductible flags from API — not derived from calculations
  const isOvertime = getOvertimeFlag(att);
  const isDeductible = getDeductibleFlag(att);

  const primaryPunchIn = att?.punch_in || null;
  const primaryPunchOut = att?.punch_out || null;
  const displayPunchIn = primaryPunchIn || punchAtt?.punch_in || null;
  const displayPunchOut = primaryPunchOut || punchAtt?.punch_out || null;

  // ✅ FIX: read half_day_session (API field) with half_day_type as fallback
  const halfDayType = att?.half_day_session || att?.half_day_type || null;

  return {
    id: emp.employee_id,
    employee_id: emp.employee_id,
    user_id: emp.user_id,
    company_id: emp.company_id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    employee_code: emp.employee_code,
    designation: emp.designation || '',
    department: emp.designation ? emp.designation.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '',
    status: emp.status,
    joining_date: emp.joining_date,

    shift_start: emp.shift?.start_time || null,
    shift_end: emp.shift?.end_time || null,
    shift_label: emp.shift
      ? `${formatTime(emp.shift.start_time) || '—'} – ${formatTime(emp.shift.end_time) || '—'}`
      : 'No Shift',
    expected_work_minutes: emp.shift?.expected_work_minutes || 0,
    grace_minutes: emp.shift?.grace_minutes || 0,

    date: displayDate,
    day_label: displayDate
      ? new Date(`${displayDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
      : '',

    attendances: attendances,
    attendance_id: att?.attendance_id || null,
    day_status: att?.day_status || 'unmarked',
    half_day_type: halfDayType,
    is_verified: att?.is_verified || false,
    is_deductible: isDeductible,
    is_overtime: isOvertime,
    is_ot: isOvertime,
    flags,
    remark: att?.remark || '',
    has_punch_data: Boolean(primaryPunchIn || primaryPunchOut),
    primary_punch_in: primaryPunchIn,
    primary_punch_out: primaryPunchOut,
    punch_in: displayPunchIn,
    punch_out: displayPunchOut,
    calculations: att?.calculations || {
      worked_minutes: 0,
      break_minutes: 0,
      extra_break_minutes: 0,
      late_minutes: 0,
      early_leave_minutes: 0,
      overtime_minutes: 0,
    },
    attendance_record: att,
  };
};

const buildMarkPayload = (emp, action, options = {}) => {
  const {
    punchIn = emp.punch_in || emp.shift_start || '09:00',
    punchOut = emp.punch_out || emp.shift_end || '18:00',
    halfDayType = 'first_half',
    notes = '',
    isOvertime = false,
    isDeductible = false,
    leaveType = 'paid',
    leaveTypeValue = null,
    leaveDayOvertime = null,
  } = options;

  const base = {
    employee_id: emp.employee_id,
    date: emp.date,
    type: 'attendance',
    notes,
  };

  switch (action) {
    case 'present':
      return {
        ...base,
        status: 'present',
        start_time: getExactPunchTime(punchIn) || '09:00',
        end_time: getExactPunchTime(punchOut) || '18:00',
        is_overtime: isOvertime,
        is_deductible: isDeductible,
      };

    case 'half_day':
      return {
        ...base,
        status: 'half_day',
        start_time: getExactPunchTime(punchIn) || '09:00',
        end_time: getExactPunchTime(punchOut) || '18:00',
        half_day_type: halfDayType === 'second_half' ? 'second_half' : 'first_half',
      };

    case 'absent':
      return { ...base, status: 'absent' };

    case 'allow_deductible':
      return {
        ...base,
        status: emp.day_status,
        start_time: getExactPunchTime(emp.punch_in || emp.shift_start) || '09:00',
        end_time: getExactPunchTime(emp.punch_out || emp.shift_end) || '18:00',
        is_deductible: true,
        is_overtime: getOvertimeFlag(emp),
      };
    case 'remove_deductible':
      return {
        ...base,
        status: emp.day_status,
        start_time: getExactPunchTime(emp.punch_in || emp.shift_start) || '09:00',
        end_time: getExactPunchTime(emp.punch_out || emp.shift_end) || '18:00',
        is_deductible: false,
        is_overtime: getOvertimeFlag(emp),
      };

    case 'allow_overtime':
      return {
        ...base,
        status: emp.day_status,
        start_time: getExactPunchTime(emp.punch_in || emp.shift_start) || '09:00',
        end_time: getExactPunchTime(emp.punch_out || emp.shift_end) || '18:00',
        is_overtime: true,
        is_deductible: getDeductibleFlag(emp),
      };
    case 'remove_overtime':
      return {
        ...base,
        status: emp.day_status,
        start_time: getExactPunchTime(emp.punch_in || emp.shift_start) || '09:00',
        end_time: getExactPunchTime(emp.punch_out || emp.shift_end) || '18:00',
        is_overtime: false,
        is_deductible: getDeductibleFlag(emp),
      };

    case 'paid_leave':
    case 'leave':
      return {
        ...base,
        status: 'leave',
        leave_type: leaveType,
        ...(leaveType === 'paid' && leaveTypeValue ? { leave_type_value: leaveTypeValue } : {}),
        leave_day_overtime: leaveDayOvertime,
      };

    case 'actual_data':
      return {
        ...base,
        status: 'present',
        start_time: getExactPunchTime(emp.shift_start) || '09:00',
        end_time: getExactPunchTime(emp.shift_end) || '18:00',
        is_overtime: getOvertimeFlag(emp),
        is_deductible: getDeductibleFlag(emp),
      };

    default:
      return { ...base, status: action };
  }
};

const buildBulkApprovePayload = (employees, action, notes, options = {}) => {
  if (!Array.isArray(employees) || employees.length === 0) return null;

  const firstDate = employees[0]?.date || employees[0]?.attendance_record?.attendance_date || '';
  const sameDate = employees.every((emp) => {
    const empDate = emp?.date || emp?.attendance_record?.attendance_date || '';
    return empDate === firstDate;
  });

  if (!firstDate || !sameDate) {
    throw new Error('Please select employees from the same attendance date');
  }

  const modeMap = {
    actual_data: 'actual',
    present: 'present',
    half_day: 'half_day',
    paid_leave: 'leave',
    absent: 'absent',
  };

  const payload = {
    attendance_date: firstDate,
    employee_ids: employees.map((emp) => emp.employee_id),
    attendance_type: 'attendance',
    mode: modeMap[action] || action,
    notes: notes || '',
  };

  if (action === 'half_day') {
    payload.half_day_type = options.halfDayType === 'second_half' ? 'second_half' : 'first_half';
  }

  if (action === 'paid_leave') {
    payload.leave_type = options.leaveType === 'unpaid' ? 'unpaid' : 'paid';
    if (payload.leave_type === 'paid' && options.leaveTypeValue) {
      payload.leave_type_value = options.leaveTypeValue;
    }
  }

  return payload;
};

// ─── STATUS SELECT ─────────────────────────────────────────────────────────────
const StatusSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={ref}>
      <div
        onClick={() => setIsOpen(o => !o)}
        className="w-full min-w-[200px] px-4 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl text-sm outline-none focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all flex items-center justify-between cursor-pointer"
      >
        <span className={!value ? 'text-gray-400' : 'font-medium text-gray-800'}>
          {selected?.label || 'Day Status...'}
        </span>
        <FaChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {options.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
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

// ─── SUMMARY COUNTS BAR ────────────────────────────────────────────────────────
const SummaryBar = ({ counts }) => {
  if (!counts) return null;
  const items = [
    { label: 'Total', value: counts.total_employees, icon: FaUsers, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Present', value: counts.present, icon: FaUserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Absent', value: counts.absent, icon: FaUserTimes, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Half Day', value: counts.half_day, icon: FaUserClock, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Leave', value: counts.leave, icon: FaUmbrellaBeach, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Unmarked', value: counts.unmarked, icon: FaUser, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${item.bg} border border-white`}>
            <Icon className={item.color} size={13} />
            <div>
              <p className={`text-base font-black leading-none ${item.color}`}>{item.value ?? 0}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── DEDUCTIBLE / OVERTIME ACTION MODAL ───────────────────────────────────────
const FlagActionModal = ({ employee, flagType, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const isDeductible = flagType === 'deductible';
  const currentlyEnabled = isDeductible
    ? getDeductibleFlag(employee)
    : getOvertimeFlag(employee);

  const action = currentlyEnabled
    ? (isDeductible ? 'remove_deductible' : 'remove_overtime')
    : (isDeductible ? 'allow_deductible' : 'allow_overtime');

  const config = isDeductible
    ? {
      label: 'Deduction',
      icon: FaMoneyBillWave,
      color: 'rose',
      allowLabel: 'Allow Deduction',
      removeLabel: 'Remove Deduction',
      allowDesc: 'Mark this attendance as having a salary deduction applied.',
      removeDesc: 'Remove the deduction flag from this attendance record.',
      deductMins: (employee?.calculations?.late_minutes || 0) +
        (employee?.calculations?.early_leave_minutes || 0) +
        (employee?.calculations?.extra_break_minutes || 0),
    }
    : {
      label: 'Overtime',
      icon: FaClock,
      color: 'orange',
      allowLabel: 'Allow Overtime',
      removeLabel: 'Remove Overtime',
      allowDesc: 'Mark this attendance as having overtime hours eligible for compensation.',
      removeDesc: 'Remove the overtime flag from this attendance record.',
      otMins: employee?.calculations?.overtime_minutes || 0,
    };

  const Icon = config.icon;
  const colorMap = {
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', icon: 'bg-rose-100 text-rose-600', title: 'text-rose-900', desc: 'text-rose-700/70', badge: 'bg-rose-100 text-rose-700', btn: 'rose' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600', title: 'text-orange-900', desc: 'text-orange-700/70', badge: 'bg-orange-100 text-orange-700', btn: 'amber' },
  };
  const c = colorMap[config.color];

  const handleApply = async () => {
    setLoading(true);
    try {
      const payload = buildMarkPayload(employee, action, { notes });
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={currentlyEnabled ? config.removeLabel : config.allowLabel}
      subtitle={employee?.name}
      size="md"
      footer={
        <>
          <ManagementButton tone="slate" variant="soft" onClick={onClose}>Cancel</ManagementButton>
          <ManagementButton tone={c.btn} loading={loading} onClick={handleApply}>
            {currentlyEnabled ? config.removeLabel : config.allowLabel}
          </ManagementButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status card */}
        <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex gap-3 items-start`}>
          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon size={18} />
          </div>
          <div>
            <h4 className={`text-sm font-black ${c.title}`}>
              {currentlyEnabled ? `Remove ${config.label}` : `Allow ${config.label}`}
            </h4>
            <p className={`text-xs font-medium mt-0.5 ${c.desc}`}>
              {currentlyEnabled ? config.removeDesc : config.allowDesc}
            </p>
          </div>
        </div>

        {/* Current status info */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">
              {STATUS_CONFIG[employee?.day_status]?.label || 'Unknown'} ·{' '}
              {employee?.punch_in ? formatTime(employee.punch_in) : '—'} → {employee?.punch_out ? formatTime(employee.punch_out) : '—'}
            </p>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${currentlyEnabled ? `${c.badge}` : 'bg-slate-200 text-slate-500'}`}>
            {currentlyEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Calculated minutes hint */}
        {isDeductible && config.deductMins > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5">
            <FaMoneyBillWave size={12} className="text-rose-500 shrink-0" />
            <p className="text-xs font-bold text-rose-700">
              Calculated deductible time: <strong>{formatMins(config.deductMins)}</strong>
              {employee?.calculations?.late_minutes > 0 && ` (Late: ${formatMins(employee.calculations.late_minutes)})`}
              {employee?.calculations?.early_leave_minutes > 0 && ` (Early out: ${formatMins(employee.calculations.early_leave_minutes)})`}
              {employee?.calculations?.extra_break_minutes > 0 && ` (Extra break: ${formatMins(employee.calculations.extra_break_minutes)})`}
            </p>
          </div>
        )}
        {!isDeductible && config.otMins > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-2.5">
            <FaClock size={12} className="text-orange-500 shrink-0" />
            <p className="text-xs font-bold text-orange-700">
              Calculated overtime: <strong>{formatMins(config.otMins)}</strong>
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Notes / Reason (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Add any details or reasoning..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── MANAGE ATTENDANCE MODAL (4 tabs only) ─────────────────────────────────────
const ManageAttendanceModal = ({ employee, initialTab, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'present');
  const [loading, setLoading] = useState(false);
  const [punchIn, setPunchIn] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [notes, setNotes] = useState('');

  // ✅ half_day_type is now correctly populated from half_day_session via mapApiEmployee
  const defaultHalfSession = employee?.half_day_type === 'second_half' ? 'second' : 'first';
  const [halfSession, setHalfSession] = useState(defaultHalfSession);

  // Leave tab
  const [leaveSubTab, setLeaveSubTab] = useState('paid');
  const [leaveConfigs, setLeaveConfigs] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const fetchStartedRef = useRef(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isOvertimeWork, setIsOvertimeWork] = useState(false);
  const [overtimeDuration, setOvertimeDuration] = useState('');

  // Sync state when employee changes
  useEffect(() => {
    setActiveTab(initialTab || 'present');
    const hasRowPunchData = Boolean(employee?.has_punch_data);
    const rowPunchIn = getExactPunchTime(employee?.primary_punch_in || employee?.attendance_record?.punch_in || employee?.attendance_record?.start_time);
    const rowPunchOut = getExactPunchTime(employee?.primary_punch_out || employee?.attendance_record?.punch_out || employee?.attendance_record?.end_time);
    const shiftIn = getExactPunchTime(employee?.shift_start) || '09:00';
    const shiftOut = getExactPunchTime(employee?.shift_end) || '18:00';
    const defaultIn = hasRowPunchData ? (rowPunchIn || shiftIn) : shiftIn;
    const defaultOut = hasRowPunchData ? (rowPunchOut || shiftOut) : shiftOut;
    setPunchIn(defaultIn);
    setPunchOut(defaultOut);
    setNotes('');
    // ✅ half_day_type correctly reads second_half from API via mapApiEmployee fix
    setHalfSession(employee?.half_day_type === 'second_half' ? 'second' : 'first');
    setLeaveSubTab('paid');
    setSelectedLeave(null);
    setIsOvertimeWork(false);
    setOvertimeDuration('');
  }, [employee?.employee_id, initialTab]);

  // Auto-calculate half day punch times
  useEffect(() => {
    if (activeTab !== 'half_day') return;
    const { punchIn: autoPunchIn, punchOut: autoPunchOut } = getHalfDayWindow(
      employee?.shift_start,
      employee?.shift_end,
      halfSession === 'second' ? 'second' : 'first'
    );
    setPunchIn(autoPunchIn);
    setPunchOut(autoPunchOut);
  }, [activeTab, halfSession, employee?.shift_start, employee?.shift_end]);

  // Fetch leave types
  useEffect(() => {
    if (activeTab !== 'paid_leave') return;
    if (leaveConfigs.length > 0 || leavesLoading || fetchStartedRef.current) return;
    const fetchLeaves = async () => {
      fetchStartedRef.current = true;
      setLeavesLoading(true);
      try {
        const companyId = JSON.parse(localStorage.getItem('company'))?.id;
        const res = await apiCall('/leave/company?is_paid=true', 'GET', null, companyId);
        const data = await res.json();
        if (data.success) setLeaveConfigs((data.data || []).filter(l => l.is_active));
      } catch (e) {
        console.error('Failed to load leave types', e);
      } finally {
        setLeavesLoading(false);
      }
    };
    fetchLeaves();
  }, [activeTab]);

  // Live calculation for present tab
  const metrics = useMemo(() => {
    const toMins = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const shiftStart = employee?.shift_start || '09:00';
    const shiftEnd = employee?.shift_end || '18:00';
    const expectedMins = employee?.expected_work_minutes || 540;
    const graceMins = employee?.grace_minutes || 15;
    const pIn = toMins(punchIn);
    const pOut = toMins(punchOut);
    const actualMins = (punchIn && punchOut)
      ? (pOut >= pIn ? pOut - pIn : (1440 - pIn) + pOut)
      : 0;
    const diff = actualMins - expectedMins;
    return {
      expected: formatMins(expectedMins),
      actual: formatMins(actualMins),
      grace: `${graceMins}m`,
      window: `${formatTime(shiftStart) || '09:00 AM'} – ${formatTime(shiftEnd) || '06:00 PM'}`,
      isOvertime: diff > graceMins,
      isDeductible: diff < -graceMins,
      diffMins: Math.abs(diff),
      diffLabel: formatMins(Math.abs(diff)),
      status: diff >= -graceMins ? 'Within scheduled time' : 'Below scheduled time',
      statusColor: diff >= -graceMins
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-rose-50 text-rose-700 border-rose-100',
    };
  }, [punchIn, punchOut, employee]);

  const TABS = [
    { id: 'present', label: 'Present', icon: FaCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'half_day', label: 'Half Day', icon: FaHourglassHalf, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'absent', label: 'Absent', icon: FaTimesCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'paid_leave', label: 'Leave', icon: FaUmbrellaBeach, color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  const handleApply = async () => {
    setLoading(true);
    try {
      let options = { notes, punchIn, punchOut };

      if (activeTab === 'present') {
        if (!punchIn || !punchOut) { toast.error('Punch In & Out are required'); return; }
        options.isOvertime = metrics.isOvertime;
        options.isDeductible = metrics.isDeductible;
      }

      if (activeTab === 'half_day') {
        if (!punchIn || !punchOut) { toast.error('Punch In & Out are required'); return; }
        options.halfDayType = halfSession === 'second' ? 'second_half' : 'first_half';
      }

      if (activeTab === 'paid_leave') {
        if (leaveSubTab === 'paid') {
          if (!selectedLeave) { toast.error('Please select a leave type'); return; }
          options.leaveType = 'paid';
          options.leaveTypeValue = selectedLeave.type === 'leave'
            ? selectedLeave.data?.code
            : selectedLeave.type === 'weekend' ? 'Weekend' : 'Holiday';
        } else {
          options.leaveType = 'unpaid';
          options.leaveTypeValue = null;
        }

        if (isOvertimeWork) {
          const mins = parseHToMinutes(overtimeDuration);
          if (!mins || mins <= 0) {
            toast.error('Please enter a valid overtime duration (e.g. 1h 30m)');
            return;
          }
          options.leaveDayOvertime = mins;
        } else {
          options.leaveDayOvertime = null;
        }
      }

      const payload = buildMarkPayload(employee, activeTab, options);
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab);
  const toneMap = { present: 'emerald', half_day: 'blue', absent: 'rose', paid_leave: 'violet' };
  const toneColor = toneMap[activeTab] || 'indigo';
  const shiftPunchIn = getExactPunchTime(employee?.shift_start) || '09:00';
  const shiftPunchOut = getExactPunchTime(employee?.shift_end) || '18:00';

  const renderContent = () => {
    switch (activeTab) {
      case 'present':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <TimePickerField label="Punch In" value={punchIn} initialValue={shiftPunchIn} onChange={setPunchIn} />
              <TimePickerField label="Punch Out" value={punchOut} initialValue={shiftPunchOut} onChange={setPunchOut} />
            </div>
            <div className={`rounded-2xl border p-4 transition-colors ${metrics.statusColor}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider">{metrics.status}</span>
                <span className="text-[11px] font-black">{metrics.diffLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
                {[
                  ['Expected work', metrics.expected],
                  ['Actual time', metrics.actual],
                  ['Grace period', metrics.grace],
                  ['Shift window', metrics.window],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-current/10 pb-1">
                    <span className="opacity-70 font-bold uppercase">{k}</span>
                    <span className="font-black">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Overtime', val: metrics.isOvertime, color: 'orange', auto: true },
                { label: 'Deductible', val: metrics.isDeductible, color: 'rose', auto: true },
              ].map(c => (
                <div
                  key={c.label}
                  className={`p-4 rounded-2xl border select-none
                    ${c.val ? `bg-${c.color}-50 border-${c.color}-200` : 'bg-white border-slate-100'}`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black text-slate-800">{c.label}</p>
                    <div className={`h-5 w-9 rounded-full p-0.5 ${c.val ? `bg-${c.color}-500` : 'bg-slate-200'}`}>
                      <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${c.val ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                    Auto-detected: {c.val ? 'Yes' : 'No'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'half_day':
        return (
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Session</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'first', label: '1st Half (Morning)', desc: 'Shift start → Midpoint' },
                  { id: 'second', label: '2nd Half (Afternoon)', desc: 'Midpoint → Shift end' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setHalfSession(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${halfSession === s.id
                      ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100'
                      : 'bg-white border-slate-100 hover:border-sky-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-black text-slate-800">{s.label}</p>
                      {halfSession === s.id && (
                        <div className="h-4 w-4 rounded-full bg-sky-500 flex items-center justify-center">
                          <FaCheck size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Shows correct session from API response */}
            {employee?.half_day_type && (
              <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
                <FaCheckCircle size={11} className="text-sky-500 shrink-0" />
                <p className="text-[10px] font-bold text-sky-700">
                  Current record: <strong>{employee.half_day_type === 'second_half' ? '2nd Half' : '1st Half'}</strong> — defaulted above
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Auto calculated from shift</p>
              <p className="mt-1 text-xs font-semibold text-sky-700">
                {halfSession === 'first'
                  ? 'Punch In uses shift start, Punch Out uses the midpoint.'
                  : 'Punch In uses the midpoint, Punch Out uses shift end.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TimePickerField label="Punch In" value={punchIn} initialValue={shiftPunchIn} onChange={setPunchIn} />
              <TimePickerField label="Punch Out" value={punchOut} initialValue={shiftPunchOut} onChange={setPunchOut} />
            </div>
          </div>
        );

      case 'absent':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
              <FaTimesCircle size={40} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Mark as Absent</h3>
              <p className="text-sm text-gray-500 max-w-xs mt-1">This will record the employee as absent for the selected date.</p>
            </div>
          </div>
        );

      case 'paid_leave':
        return (
          <div className="space-y-4">
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {[{ id: 'paid', label: '💳 Paid Leave' }, { id: 'unpaid', label: '🔴 Unpaid Leave' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setLeaveSubTab(tab.id); setSelectedLeave(null); }}
                  className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all ${leaveSubTab === tab.id
                    ? tab.id === 'paid' ? 'bg-violet-600 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/60'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {leaveSubTab === 'paid' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Leave Type</p>
                {leavesLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 border-2 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {leaveConfigs.map(leave => {
                      const isSelected = selectedLeave?.type === 'leave' && selectedLeave?.data?.id === leave.id;
                      return (
                        <div
                          key={leave.id}
                          onClick={() => setSelectedLeave({ type: 'leave', data: leave })}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-100' : 'bg-white border-slate-100 hover:border-violet-200'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {leave.code}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{leave.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Max {leave.max_balance}d</p>
                            </div>
                          </div>
                          {isSelected && <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center"><FaCheck size={9} className="text-white" /></div>}
                        </div>
                      );
                    })}
                    {[
                      { id: 'weekend', label: 'Weekend', icon: FaCalendarAlt, color: 'sky' },
                      { id: 'holiday', label: 'Holiday', icon: FaUmbrellaBeach, color: 'amber' },
                    ].map(opt => {
                      const isSelected = selectedLeave?.type === opt.id;
                      const Icon = opt.icon;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedLeave({ type: opt.id })}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? `bg-${opt.color}-50 border-${opt.color}-300 ring-2 ring-${opt.color}-100` : 'bg-white border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? `bg-${opt.color}-500 text-white` : 'bg-slate-100 text-slate-500'}`}>
                              <Icon size={14} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                          </div>
                          {isSelected && (
                            <div className={`h-5 w-5 rounded-full bg-${opt.color}-500 flex items-center justify-center`}>
                              <FaCheck size={9} className="text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {leaveSubTab === 'unpaid' && (
              <div className="p-6 bg-rose-50/30 rounded-2xl border-2 border-dashed border-rose-200 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                  <FaHistory size={20} className="text-rose-600" />
                </div>
                <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight mb-1">Confirm Unpaid Leave</h4>
                <p className="text-[11px] text-rose-600/70 font-medium leading-relaxed max-w-[240px]">
                  This will mark the employee as absent and deduct from payroll. No additional options needed.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isOvertimeWork ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                  <FaClock size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Overtime Work</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Add extra hours to this leave day</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOvertimeWork(!isOvertimeWork)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOvertimeWork ? 'bg-orange-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isOvertimeWork ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <AnimatePresence>
              {isOvertimeWork && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/30 space-y-3">
                    <TimeDurationPickerField
                      label="Overtime Duration"
                      mode="duration"
                      value={overtimeDuration}
                      onChange={setOvertimeDuration}
                      placeholder="Select duration"
                    />
                    <p className="text-[10px] font-medium text-orange-600/70">
                      Select the total duration of overtime work.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      default: return null;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Manage Attendance"
      subtitle={employee?.name}
      size="4xl"
      footer={
        <>
          <ManagementButton tone="slate" variant="soft" onClick={onClose}>Cancel</ManagementButton>
          <ManagementButton tone={toneColor} loading={loading} onClick={handleApply}>
            Confirm {activeTabMeta?.label}
          </ManagementButton>
        </>
      }
    >
      <div className="flex max-h-[520px] -m-6 flex-col overflow-hidden">
        <div className="w-full shrink-0 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center p-2 gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap group ${isActive ? `bg-white shadow-sm border border-slate-200 ${tab.color}` : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}`}
              >
                <div className={`shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-colors ${isActive ? tab.bg : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                  <Icon size={12} />
                </div>
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          {renderContent()}
          <hr className="border-slate-100" />
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Notes / Reason (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any details or reasoning..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── BULK ATTENDANCE MODAL ─────────────────────────────────────────────────────
const BulkAttendanceModal = ({ employees: bulkEmps, action, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [halfSession, setHalfSession] = useState('first');
  const [leaveSubTab, setLeaveSubTab] = useState('paid');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveConfigs, setLeaveConfigs] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const fetchStartedRef = useRef(false);

  const actionMeta = BULK_ATTENDANCE_ACTIONS.find(a => a.id === action);
  if (!actionMeta) return null;

  useEffect(() => {
    setNotes('');
    setHalfSession('first');
    setLeaveSubTab('paid');
    setSelectedLeave(null);
  }, [action]);

  useEffect(() => {
    if (action !== 'paid_leave') return;
    if (leaveConfigs.length > 0 || leavesLoading || fetchStartedRef.current) return;
    const fetchLeaves = async () => {
      fetchStartedRef.current = true;
      setLeavesLoading(true);
      try {
        const companyId = JSON.parse(localStorage.getItem('company'))?.id;
        const res = await apiCall('/leave/company?is_paid=true', 'GET', null, companyId);
        const data = await res.json();
        if (data.success) setLeaveConfigs((data.data || []).filter((l) => l.is_active));
      } catch (e) {
        console.error('Failed to load leave types', e);
      } finally {
        setLeavesLoading(false);
      }
    };
    fetchLeaves();
  }, [action, leaveConfigs.length]);

  const handleConfirm = async () => {
    if (action === 'paid_leave' && leaveSubTab === 'paid' && !selectedLeave) {
      toast.error('Please select a paid leave value');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ action, employees: bulkEmps, notes, halfSession, leaveSubTab, selectedLeave });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Bulk Attendance Update"
      subtitle={`${bulkEmps.length} employee${bulkEmps.length > 1 ? 's' : ''} selected`}
      size="4xl"
      footer={
        <>
          <ManagementButton tone="slate" variant="soft" onClick={onClose}>Cancel</ManagementButton>
          <ManagementButton tone={actionMeta.tone} loading={loading} onClick={handleConfirm}>
            Apply to All
          </ManagementButton>
        </>
      }
    >
      <div className="flex max-h-[500px] -m-6 flex-col overflow-hidden">
        <div className="shrink-0 bg-slate-50/50 border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${actionMeta.toneClass}`}>
              {actionMeta.label}
            </span>
            <span className="text-xs font-semibold text-slate-500">Applied to all selected records.</span>
          </div>
          <span className="text-xs font-black text-slate-400">{bulkEmps.length} selected</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Selected Records</p>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {bulkEmps.map(emp => (
                <div key={emp.employee_id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.employee_code} · {formatDate(emp.date)}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_CONFIG[emp.day_status]?.color || 'bg-slate-100 text-slate-700'}`}>
                    {STATUS_CONFIG[emp.day_status]?.label || 'Unmarked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {action === 'half_day' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Half Day Session</label>
              <div className="grid grid-cols-2 gap-3">
                <ManagementButton tone="sky" variant={halfSession === 'first' ? 'solid' : 'soft'} onClick={() => setHalfSession('first')}>First Half</ManagementButton>
                <ManagementButton tone="sky" variant={halfSession === 'second' ? 'solid' : 'soft'} onClick={() => setHalfSession('second')}>Second Half</ManagementButton>
              </div>
            </div>
          )}

          {action === 'paid_leave' && (
            <div className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Leave Type</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <ManagementButton tone="violet" variant={leaveSubTab === 'paid' ? 'solid' : 'soft'} onClick={() => setLeaveSubTab('paid')}>Paid</ManagementButton>
                  <ManagementButton tone="rose" variant={leaveSubTab === 'unpaid' ? 'solid' : 'soft'} onClick={() => setLeaveSubTab('unpaid')}>Unpaid</ManagementButton>
                </div>
              </div>

              {leaveSubTab === 'paid' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Paid Leave Value</p>
                  {leavesLoading ? (
                    <div className="rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm font-semibold text-slate-500">Loading leave types...</div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        {leaveConfigs.map((leave) => {
                          const isSelected = selectedLeave?.type === 'leave' && selectedLeave?.data?.id === leave.id;
                          return (
                            <button
                              key={leave.id}
                              type="button"
                              onClick={() => setSelectedLeave({ type: 'leave', data: leave })}
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${isSelected ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200'}`}
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-800">{leave.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{leave.code}</p>
                              </div>
                              {isSelected && <FaCheck size={12} className="text-violet-600" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'weekend', label: 'Weekend' }, { id: 'holiday', label: 'Holiday' }].map((opt) => {
                          const isSelected = selectedLeave?.type === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedLeave({ type: opt.id })}
                              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${isSelected ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Notes / Reason (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="One note for all selected employees..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── EMPLOYEE ATTENDANCE CARD ──────────────────────────────────────────────────
const EmployeeAttendanceCard = ({ emp, onAction, selected, onToggleSelect, isSelectionMode }) => {
  const statusCfg = STATUS_CONFIG[emp.day_status] || STATUS_CONFIG.unmarked;
  const cardActionsDisabled = isSelectionMode && selected;

  const canShowFlagActions = emp.day_status === 'present' || emp.day_status === 'half_day';

  // ✅ Only use the actual flags from API response — NOT derived from calculations
  const isDeductible = getDeductibleFlag(emp);
  const isOvertime = getOvertimeFlag(emp);

  const deductMins = (emp.calculations?.late_minutes || 0) +
    (emp.calculations?.early_leave_minutes || 0) +
    (emp.calculations?.extra_break_minutes || 0);
  const otMins = emp.calculations?.overtime_minutes || 0;

  const verificationCardClass = emp.is_verified
    ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-200 shadow-emerald-100/70'
    : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 shadow-amber-100/70';
  const verificationBadgeClass = emp.is_verified
    ? 'bg-emerald-600 text-white'
    : 'bg-amber-600 text-white';

  return (
    <div className="relative">
      {isSelectionMode && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleSelect?.(emp); }}
          className={`absolute top-3 left-3 z-10 h-4 w-4 rounded-md border-2 flex items-center justify-center transition-all shadow-sm ${selected ? 'bg-indigo-600 border-indigo-600 text-white scale-110' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
        >
          {selected && <FaCheck size={9} />}
        </button>
      )}
      <ManagementCard
        title={emp.name}
        subtitle={`[${emp.employee_code}]`}
        accent={statusCfg.dot.replace('bg-', '')}
        icon={<FaUser className="text-slate-500" />}
        className={verificationCardClass}
        badge={
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${verificationBadgeClass}`}>
              {emp.is_verified ? 'Verified' : 'Pending'}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onAction(emp, 'logs'); }}
              disabled={cardActionsDisabled}
              className="p-1.5 rounded-lg bg-white/80 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shadow-sm"
              title="View Logs"
            >
              <FaHistory size={11} />
            </button>
          </div>
        }
      >
        <div className={`flex flex-col md:flex-row gap-6 md:items-start ${isSelectionMode ? 'pl-5' : ''}`}>
          {/* Info */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1 text-xs text-indigo-500 font-semibold flex-wrap">
              <FaCalendarAlt size={9} />
              <span>{formatDate(emp.date)}</span>
              {emp.day_label && <><span className="text-gray-300 mx-0.5">·</span><span>{emp.day_label}</span></>}
              {emp.shift_label && emp.shift_label !== 'No Shift' && (
                <><span className="text-gray-300 mx-0.5">·</span><FaBuilding size={9} className="text-gray-400" /><span className="text-gray-500">{emp.shift_label}</span></>
              )}
            </div>
            <p className="text-xs text-gray-700 font-semibold">
              Expected: <span className="font-black">{formatMinutes(emp.expected_work_minutes)}</span>
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span>In: <span className={emp.punch_in ? 'text-emerald-600 font-bold' : 'text-slate-400 font-semibold'}>{emp.punch_in ? formatTime(emp.punch_in) : '—'}</span></span>
              <span className="text-gray-300">|</span>
              <span>Out: <span className={emp.punch_out ? 'text-emerald-600 font-bold' : 'text-slate-400 font-semibold'}>{emp.punch_out ? formatTime(emp.punch_out) : '—'}</span></span>
              {emp.calculations?.worked_minutes > 0 && (
                <><span className="text-gray-300">|</span><span className="text-gray-600 font-semibold">Worked: <strong>{formatMins(emp.calculations.worked_minutes)}</strong></span></>
              )}
            </div>

            {/* Status badges — only shown when truly active from API flags */}
            <div className="flex flex-wrap items-center gap-2">
              {canShowFlagActions && isDeductible && deductMins > 0 && (
                <span className="text-[10px] text-rose-500 font-bold">Late: {formatMins(deductMins)}</span>
              )}
              {canShowFlagActions && isOvertime && otMins > 0 && (
                <span className="text-[10px] text-orange-500 font-bold">OT: {formatMins(otMins)}</span>
              )}
              {(emp.attendances?.length || 0) > 1 && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {emp.attendances.length} entries
                </span>
              )}
            </div>
          </div>

          {/* Action buttons grid — all 6 using ManagementButton */}
          <div className="grid grid-cols-2 gap-2 shrink-0 md:w-48">
            {/* Row 1 */}
            <ManagementButton
              size="sm"
              tone="emerald"
              variant={emp.day_status === 'present' ? 'solid' : 'soft'}
              disabled={cardActionsDisabled}
              onClick={() => onAction(emp, 'present')}
            >
              Present
            </ManagementButton>

            <ManagementButton
              size="sm"
              tone="blue"
              variant={emp.day_status === 'half_day' ? 'solid' : 'soft'}
              disabled={cardActionsDisabled}
              onClick={() => onAction(emp, 'half_day')}
            >
              Half Day
            </ManagementButton>

            {/* Row 2 */}
            <ManagementButton
              size="sm"
              tone="rose"
              variant={emp.day_status === 'absent' ? 'solid' : 'soft'}
              disabled={cardActionsDisabled}
              onClick={() => onAction(emp, 'absent')}
            >
              Absent
            </ManagementButton>

            <ManagementButton
              size="sm"
              tone="violet"
              variant={emp.day_status === 'leave' || emp.day_status === 'paid_leave' ? 'solid' : 'outline'}
              disabled={cardActionsDisabled}
              onClick={() => onAction(emp, 'paid_leave')}
            >
              Leave
            </ManagementButton>

            {/* Row 3 — Deduct & OT: always rendered, disabled unless flag is true from API */}
            <ManagementButton
              size="sm"
              tone="rose"
              variant={canShowFlagActions && isDeductible ? 'solid' : 'soft'}
              disabled={cardActionsDisabled || !canShowFlagActions || !isDeductible}
              onClick={() => onAction(emp, 'flag_deductible')}
              title={
                !canShowFlagActions
                  ? 'Only available for Present or Half Day'
                  : !isDeductible
                    ? `No deduction flag set${deductMins > 0 ? ` (${formatMins(deductMins)} late — enable flag to apply)` : ''}`
                    : `Remove deduction (${formatMins(deductMins)})`
              }
            >
              <FaMoneyBillWave size={9} className="mr-1" />
              Deduct{deductMins > 0 ? ` ${formatMins(deductMins)}` : ''}
            </ManagementButton>

            <ManagementButton
              size="sm"
              tone="amber"
              variant={canShowFlagActions && isOvertime ? 'solid' : 'soft'}
              disabled={cardActionsDisabled || !canShowFlagActions || !isOvertime}
              onClick={() => onAction(emp, 'flag_overtime')}
              title={
                !canShowFlagActions
                  ? 'Only available for Present or Half Day'
                  : !isOvertime
                    ? `No overtime flag set${otMins > 0 ? ` (${formatMins(otMins)} calculated — enable flag to apply)` : ''}`
                    : `Remove overtime (${formatMins(otMins)})`
              }
            >
              <FaClock size={9} className="mr-1" />
              OT{otMins > 0 ? ` ${formatMins(otMins)}` : ''}
            </ManagementButton>
          </div>
        </div>
      </ManagementCard>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const UnmarkedAttendance = () => {
  const today = new Date().toISOString().slice(0, 10);

  const [dateFilter, setDateFilter] = useState({ date: today, month: '', year: '', from_date: '', to_date: '' });
  const [employees, setEmployees] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dayStatus, setDayStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

  const abortControllerRef = useRef(null);
  const lastFetchKeyRef = useRef('');

  const buildFetchKey = useCallback(() => {
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
    return `${fromDate}|${toDate}|${pagination.page}|${pagination.limit}|${search}|${dayStatus}|${selectedEmployee ?? ''}`;
  }, [dateFilter, pagination.page, pagination.limit, search, dayStatus, selectedEmployee]);

  const fetchAttendance = useCallback(async (force = false) => {
    const key = buildFetchKey();
    if (!force && key === lastFetchKeyRef.current) return;
    lastFetchKeyRef.current = key;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

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
      const statusParam = dayStatus ? `&day_status=${dayStatus}` : '';
      const empParam = selectedEmployee ? `&employee_id=${selectedEmployee}` : '';
      const url = `/attendance/list?from_date=${fromDate}&to_date=${toDate}&page=${pagination.page}&limit=${pagination.limit}&search=${encodeURIComponent(search)}${statusParam}${empParam}&type=attendance`;

      const response = await apiCall(url, 'GET', null, companyId);
      const result = await response.json();

      if (result.success) {
        const fallbackDate = fromDate || today;
        const mapped = (result.data || []).map(emp => mapApiEmployee(emp, fallbackDate));
        setEmployees(mapped);
        setCounts(result.meta?.counts || null);
        updatePagination({
          total: result.meta?.total || 0,
          total_pages: result.meta?.total_pages || 1,
          page: result.meta?.page || 1,
          limit: result.meta?.limit || 20,
        });
      } else {
        throw new Error(result.message || 'Failed to fetch attendance');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [buildFetchKey, dateFilter, pagination.page, pagination.limit, search, dayStatus, selectedEmployee, updatePagination, today]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAttendance(), 300);
    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  const handleDateChange = (val) => { setDateFilter(val); goToPage(1); };
  const handleSearch = (val) => { setSearch(val); goToPage(1); };
  const handleStatusChange = (val) => { setDayStatus(val); goToPage(1); };
  const handleEmployeeChange = (id) => { setSelectedEmployee(id); goToPage(1); };

  const handleAction = (emp, action) => {
    if (action === 'flag_deductible') {
      setModal({ type: 'flag_deductible', emp });
      return;
    }
    if (action === 'flag_overtime') {
      setModal({ type: 'flag_overtime', emp });
      return;
    }
    setModal({ type: action, emp });
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const response = await apiCall('/attendance/mark', 'POST', payload, companyId);
      const result = await response.json();
      if (result.success) {
        toast.success('Attendance updated successfully!');
        setModal(null);
        lastFetchKeyRef.current = '';
        fetchAttendance(true);
      } else {
        throw new Error(result.message || 'Failed to update attendance');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSubmit = async ({ action, employees: bulkEmps, notes, halfSession, leaveSubTab, selectedLeave }) => {
    if (!bulkEmps.length) return;
    try {
      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const payload = buildBulkApprovePayload(bulkEmps, action, notes, {
        halfDayType: halfSession === 'second' ? 'second_half' : 'first_half',
        leaveType: leaveSubTab,
        leaveTypeValue:
          selectedLeave?.type === 'leave'
            ? selectedLeave?.data?.code
            : selectedLeave?.type === 'weekend'
              ? 'weekend'
              : selectedLeave?.type === 'holiday'
                ? 'holiday'
                : null,
      });

      const response = await apiCall('/attendance/approve', 'PUT', payload, companyId);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to approve attendance');

      toast.success(`${bulkEmps.length} record${bulkEmps.length > 1 ? 's' : ''} updated successfully`);
      setBulkModalOpen(false);
      setBulkAction(null);
      setSelectedIds([]);
      lastFetchKeyRef.current = '';
      fetchAttendance(true);
    } catch (err) {
      toast.error(err.message || 'Bulk update failed');
    }
  };

  const toggleSelectEmployee = (emp) => {
    setSelectedIds(prev =>
      prev.includes(emp.employee_id)
        ? prev.filter(id => id !== emp.employee_id)
        : [...prev, emp.employee_id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = employees.map(e => e.employee_id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  };

  const selectedEmployees = useMemo(
    () => employees.filter(emp => selectedIds.includes(emp.employee_id)),
    [employees, selectedIds]
  );

  const isManageModal = modal && !['logs', 'flag_deductible', 'flag_overtime'].includes(modal.type);
  const isFlagDeductModal = modal?.type === 'flag_deductible';
  const isFlagOtModal = modal?.type === 'flag_overtime';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <FaUsers size={11} />
                Attendance management
              </div>
              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">Attendance Management</h1>
              <p className="mt-1 text-sm text-slate-500">Review attendance, breaks, and records from one workspace.</p>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <FaUserClock className="text-indigo-500" />
                <span className="font-medium text-slate-700">{pagination.total}</span>
                <span className="text-slate-500">records</span>
              </div>
              <RefreshButton loading={loading} onClick={() => { lastFetchKeyRef.current = ''; fetchAttendance(true); }}>
                Refresh
              </RefreshButton>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-4 shadow-sm">
          <div className="flex justify-between w-full flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name, code or email..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-9 text-sm font-medium text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                {search && (
                  <button type="button" onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-4 flex-col md:flex-row lg:flex-row">
              <div className="flex-1">
                <EmployeeSelect value={selectedEmployee} onChange={handleEmployeeChange} placeholder="Specific Employee..." />
              </div>
              <div className="flex flex-row gap-4">
                <div className="flex-1">
                  <StatusSelect value={dayStatus} onChange={handleStatusChange} options={STATUS_OPTIONS} />
                </div>
                <div className="flex-1">
                  <AdvancedDateFilter
                    value={dateFilter}
                    onChange={handleDateChange}
                    buttonClassName="w-full inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                    placeholder="Pick Date"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Counts */}
        <SummaryBar counts={counts} />

        {/* Bulk Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${isSelectionMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isSelectionMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-xs font-black uppercase tracking-widest ${isSelectionMode ? 'text-indigo-600' : 'text-slate-400'}`}>
              {isSelectionMode ? 'Bulk Mode ON' : 'Bulk Mode'}
            </span>
          </div>

          {isSelectionMode && employees.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2.5 select-none">
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all ${selectedIds.length === employees.length && employees.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : selectedIds.length > 0
                    ? 'bg-indigo-100 border-indigo-400'
                    : 'bg-white border-slate-300 hover:border-indigo-400'
                  }`}
              >
                {selectedIds.length === employees.length && employees.length > 0 && <FaCheck size={9} className="text-white" />}
                {selectedIds.length > 0 && selectedIds.length < employees.length && (
                  <span className="block w-2 h-0.5 bg-indigo-500 rounded" />
                )}
              </button>
              <span className="text-xs font-semibold text-slate-600">
                {selectedIds.length > 0 ? `${selectedIds.length} of ${employees.length} selected` : `Select all ${employees.length}`}
              </span>
              {selectedIds.length > 0 && (
                <button type="button" onClick={() => setSelectedIds([])} className="ml-1 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                  Clear
                </button>
              )}
            </label>
          )}
        </div>

        {/* Employee Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fetching attendance...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <FaUser size={28} />
              </div>
              <p className="text-slate-600 font-black">No employees found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting the date or filters</p>
            </div>
          ) : (
            <>
              {employees.map(emp => (
                <EmployeeAttendanceCard
                  key={emp.employee_id}
                  emp={emp}
                  onAction={handleAction}
                  selected={selectedIds.includes(emp.employee_id)}
                  onToggleSelect={toggleSelectEmployee}
                  isSelectionMode={isSelectionMode}
                />
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

        {/* Floating Bulk Action Bar */}
        <AnimatePresence>
          {isSelectionMode && selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-1.5 mr-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-black text-indigo-700">{selectedIds.length} selected</span>
              </div>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              {BULK_ATTENDANCE_ACTIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setBulkAction(item.id); setBulkModalOpen(true); }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm ${item.toneClass}`}
                >
                  {item.label}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button type="button" onClick={() => setSelectedIds([])} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <FaTimes size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isManageModal && (
          <ManageAttendanceModal
            key={`modal-${modal.emp.employee_id}`}
            employee={modal.emp}
            initialTab={modal.type}
            onClose={() => setModal(null)}
            onSubmit={handleSubmit}
          />
        )}

        {isFlagDeductModal && (
          <FlagActionModal
            key={`deduct-${modal.emp.employee_id}`}
            employee={modal.emp}
            flagType="deductible"
            onClose={() => setModal(null)}
            onSubmit={handleSubmit}
          />
        )}

        {isFlagOtModal && (
          <FlagActionModal
            key={`ot-${modal.emp.employee_id}`}
            employee={modal.emp}
            flagType="overtime"
            onClose={() => setModal(null)}
            onSubmit={handleSubmit}
          />
        )}

        {bulkModalOpen && bulkAction && (
          <BulkAttendanceModal
            employees={selectedEmployees}
            action={bulkAction}
            onClose={() => { setBulkModalOpen(false); setBulkAction(null); }}
            onSubmit={handleBulkSubmit}
          />
        )}

        {modal?.type === 'logs' && (
          <AttendanceLogsModal
            id={modal.emp.attendance_id || modal.emp.id}
            type="attendance"
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnmarkedAttendance;
