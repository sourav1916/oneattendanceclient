import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaUmbrellaBeach,
  FaInfoCircle,
  FaUser,
  FaClock,
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { ManagementHub } from '../components/common';
import ModalScrollLock from '../components/ModalScrollLock';
import { useAuth } from '../context/AuthContext';

// ─── DUMMY DATA (remove when API is ready) ────────────────────────────────────
const DUMMY_DATA = {
  "2026-05-01": { is_weekend:{}, is_holiday:{ name:"Buddha Purnima", is_optional:true }, is_leave:{}, worked:{}, status:"holiday" },
  "2026-05-02": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"absent" },
  "2026-05-03": { is_weekend:{ type:"Weekly Off" }, is_holiday:{}, is_leave:{}, worked:{}, status:"weekend" },
  "2026-05-04": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{ punch_in:"09:05", punch_out:"18:30", work_hour:"9h 25m", early_late:"+0:05", is_dt:false, is_ot:true, half_day:null }, status:"present" },
  "2026-05-05": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{ punch_in:"08:40", punch_out:"17:50", work_hour:"9h 10m", early_late:"-0:20", is_dt:false, is_ot:false, half_day:null }, status:"present" },
  "2026-05-06": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{ punch_in:"09:30", punch_out:"20:00", work_hour:"10h 30m", early_late:"+0:30", is_dt:true, is_ot:true, half_day:null }, status:"present" },
  "2026-05-07": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{ punch_in:"09:00", punch_out:"13:00", work_hour:"4h 00m", early_late:null, is_dt:false, is_ot:false, half_day:"1st half" }, status:"present" },
  "2026-05-08": { is_weekend:{}, is_holiday:{}, is_leave:{ name:"Casual Leave", type:"CL" }, worked:{}, status:"leave" },
  "2026-05-09": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{ punch_in:"09:10", punch_out:"18:20", work_hour:"9h 10m", early_late:"+0:10", is_dt:false, is_ot:false, half_day:null }, status:"present" },
  "2026-05-10": { is_weekend:{ type:"Weekly Off" }, is_holiday:{}, is_leave:{}, worked:{}, status:"weekend" },
  "2026-05-11": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-12": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-13": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-14": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-15": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-16": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-17": { is_weekend:{ type:"Weekly Off" }, is_holiday:{}, is_leave:{}, worked:{}, status:"weekend" },
  "2026-05-18": { is_weekend:{}, is_holiday:{}, is_leave:{ name:"Medical Leave", type:"ML" }, worked:{}, status:"leave" },
  "2026-05-19": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-20": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-21": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-22": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-23": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-24": { is_weekend:{ type:"Weekly Off" }, is_holiday:{}, is_leave:{}, worked:{}, status:"weekend" },
  "2026-05-25": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-26": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-27": { is_weekend:{}, is_holiday:{ name:"Bakrid (tentative)", is_optional:false }, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-28": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-29": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-30": { is_weekend:{}, is_holiday:{}, is_leave:{}, worked:{}, status:"upcoming" },
  "2026-05-31": { is_weekend:{ type:"Weekly Off" }, is_holiday:{}, is_leave:{}, worked:{}, status:"weekend" },
};
// ─────────────────────────────────────────────────────────────────────────────

const USE_DUMMY = true; // ← set to false when your API is ready

const STATUS_STYLES = {
  present:  { cell: 'bg-emerald-50 border-emerald-100',  pill: 'bg-emerald-700 text-emerald-50',  label: 'Present'  },
  absent:   { cell: 'bg-rose-50 border-rose-100',        pill: 'bg-rose-700 text-rose-50',        label: 'Absent'   },
  holiday:  { cell: 'bg-amber-50 border-amber-100',      pill: 'bg-amber-700 text-amber-50',      label: 'Holiday'  },
  weekend:  { cell: 'bg-slate-50 border-slate-100',      pill: 'bg-slate-500 text-slate-50',      label: 'Weekend'  },
  leave:    { cell: 'bg-violet-50 border-violet-100',    pill: 'bg-violet-700 text-violet-50',    label: 'Leave'    },
  upcoming: { cell: 'bg-white border-gray-100',          pill: 'bg-gray-200 text-gray-500',       label: 'Upcoming' },
};

// ─── Calendar Cell ────────────────────────────────────────────────────────────
const CalendarCell = ({ cell, onClick }) => {
  const { dayNumber, isCurrentMonth, data, isToday } = cell;
  const status = data?.status || (isCurrentMonth ? 'upcoming' : null);
  const styles = STATUS_STYLES[status] || STATUS_STYLES.upcoming;
  const w = data?.worked || {};

  if (!isCurrentMonth) {
    return (
      <div className="min-h-[110px] bg-gray-50/40 p-2">
        <span className="text-xs text-gray-300 font-medium">{dayNumber}</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(cell)}
      className={`
        min-h-[110px] p-2 cursor-pointer transition-all hover:brightness-95 border
        ${styles.cell}
        ${isToday ? 'ring-2 ring-indigo-500 ring-inset z-[1]' : ''}
      `}
    >
      {/* Day number + today badge */}
      <div className="flex items-center justify-between mb-1.5">
        {isToday ? (
          <span className="w-[22px] h-[22px] rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
            {dayNumber}
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-800">{dayNumber}</span>
        )}
      </div>

      {/* Status pill */}
      {status && (
        <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${styles.pill}`}>
          {styles.label}
        </span>
      )}

      {/* ── PRESENT: timing chips + work hours ── */}
      {status === 'present' && (
        <div className="mt-1.5 space-y-1">
          {w.half_day ? (
            // Type 2: Half day
            <div className="flex flex-wrap gap-1">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase tracking-wide">
                Half day
              </span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wide">
                {w.half_day}
              </span>
            </div>
          ) : (
            // Type 1: Early/Late + DT/OT
            <div className="flex flex-wrap gap-1">
              {w.early_late && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide
                  ${w.early_late.startsWith('-')
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-rose-200 text-rose-900'
                  }`}>
                  {w.early_late}
                </span>
              )}
              {w.is_dt && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 uppercase tracking-wide">
                  DT
                </span>
              )}
              {w.is_ot && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-200 text-pink-900 uppercase tracking-wide">
                  OT
                </span>
              )}
            </div>
          )}
          {w.work_hour && (
            <p className="text-[9px] font-semibold text-emerald-700">{w.work_hour}</p>
          )}
        </div>
      )}

      {/* ── Type 3: LEAVE ── */}
      {status === 'leave' && data?.is_leave?.name && (
        <div className="mt-1.5 space-y-1">
          <p className="text-[9px] font-semibold text-violet-800 leading-tight">{data.is_leave.name}</p>
          {data.is_leave.type && (
            <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded bg-violet-200 text-violet-900 uppercase tracking-wide">
              {data.is_leave.type}
            </span>
          )}
        </div>
      )}

      {/* ── HOLIDAY name ── */}
      {(status === 'holiday' || (status === 'upcoming' && data?.is_holiday?.name)) && (
        <p className="text-[9px] font-semibold text-amber-800 leading-tight mt-1.5">
          {data?.is_holiday?.name}
          {data?.is_holiday?.is_optional && <span className="ml-1 text-amber-500">★</span>}
        </p>
      )}

      {/* ── WEEKEND type ── */}
      {status === 'weekend' && data?.is_weekend?.type && (
        <p className="text-[9px] font-semibold text-slate-500 mt-1.5">{data.is_weekend.type}</p>
      )}

      {/* Info icon bottom-right */}
      {data && (
        <div className="flex justify-end mt-1">
          <FaInfoCircle className="text-gray-300 w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
};

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className={`${bg} p-3 rounded-2xl border border-white shadow-sm flex items-center gap-3`}>
    <div className={`p-2.5 rounded-xl bg-white/80 ${color}`}><Icon size={18} /></div>
    <div>
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-black text-gray-900`}>{value}</p>
    </div>
  </div>
);

// ─── Legend Item ──────────────────────────────────────────────────────────────
const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = STATUS_STYLES[status];
  if (!styles) return null;
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${styles.pill}`}>
      {styles.label}
    </span>
  );
};

// ─── Day Details Modal ────────────────────────────────────────────────────────
const DayDetailsModal = ({ cell, onClose }) => {
  if (!cell) return null;
  const { date, data } = cell;
  const w = data?.worked || {};

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const InfoSection = ({ title, color, children, hasData }) => (
    <div className={`${color} p-4 rounded-xl border border-black/5`}>
      <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-gray-500">{title}</h4>
      {hasData ? children : <p className="text-xs italic text-gray-400">No record found</p>}
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-base font-black text-gray-900">{formattedDate}</h3>
            {data?.status && <div className="mt-1.5"><StatusBadge status={data.status} /></div>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-xl transition-colors">
            <FaTimesCircle size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {/* Work Info */}
          <InfoSection title="Work Info" color="bg-emerald-50" hasData={Object.keys(w).length > 0}>
            <div className="grid grid-cols-2 gap-3">
              {w.punch_in && (
                <div>
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest">Punch In</p>
                  <p className="font-black text-emerald-900">{w.punch_in}</p>
                </div>
              )}
              {w.punch_out && (
                <div>
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest">Punch Out</p>
                  <p className="font-black text-emerald-900">{w.punch_out}</p>
                </div>
              )}
              {w.work_hour && (
                <div>
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest">Total Hours</p>
                  <p className="font-black text-emerald-900">{w.work_hour}</p>
                </div>
              )}
              {w.half_day && (
                <div>
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest">Half Day</p>
                  <p className="font-black text-emerald-900">{w.half_day}</p>
                </div>
              )}
            </div>
            {/* Timing + DT/OT badges */}
            {(w.early_late || w.is_dt || w.is_ot) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-100">
                {w.early_late && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase
                    ${w.early_late.startsWith('-') ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}`}>
                    {w.early_late.startsWith('-') ? 'Early' : 'Late'} {w.early_late}
                  </span>
                )}
                {w.is_dt && <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-200 text-blue-900 uppercase">Double Time</span>}
                {w.is_ot && <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-200 text-pink-900 uppercase">Overtime</span>}
              </div>
            )}
          </InfoSection>

          {/* Leave Info */}
          <InfoSection title="Leave Info" color="bg-violet-50" hasData={data?.is_leave && Object.keys(data.is_leave).length > 0}>
            {data?.is_leave?.name && (
              <>
                <p className="font-bold text-violet-900">{data.is_leave.name}</p>
                {data.is_leave.type && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-violet-200 text-violet-900 uppercase">
                    {data.is_leave.type}
                  </span>
                )}
              </>
            )}
          </InfoSection>

          {/* Holiday Info */}
          <InfoSection title="Holiday Info" color="bg-amber-50" hasData={data?.is_holiday && Object.keys(data.is_holiday).length > 0}>
            {data?.is_holiday?.name && (
              <div className="flex items-center gap-2">
                <p className="font-bold text-amber-900">{data.is_holiday.name}</p>
                {data.is_holiday.is_optional && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 uppercase">Optional</span>
                )}
              </div>
            )}
          </InfoSection>

          {/* Weekend Info */}
          <InfoSection title="Weekend Info" color="bg-slate-50" hasData={data?.is_weekend && Object.keys(data.is_weekend).length > 0}>
            {data?.is_weekend?.type && <p className="font-bold text-slate-900">{data.is_weekend.type}</p>}
          </InfoSection>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const lastFetchedKeyRef = useRef(null);

  useEffect(() => {
    const fetchKey = `${month}-${year}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;

    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      try {
        if (USE_DUMMY) {
          // ── DUMMY: simulate network delay ──
          await new Promise(r => setTimeout(r, 400));
          setCalendarData(DUMMY_DATA);
        } else {
          // ── REAL API ──
          const companyId = JSON.parse(localStorage.getItem('company'))?.id;
          const response = await apiCall(`/shifts/my-calendar?month=${month}&year=${year}`, 'GET', null, companyId);
          const json = await response.json();
          if (json.success) setCalendarData(json.data);
          else setError(json.message || 'Failed to fetch calendar');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [month, year]);

  const changeMonth = delta => setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));

  const calendarSummary = useMemo(() => {
    if (!calendarData) return null;
    let present = 0, absent = 0, holidays = 0, leaves = 0, weekends = 0;
    Object.values(calendarData).forEach(day => {
      if (day.status === 'present') present++;
      else if (day.status === 'absent') absent++;
      else if (day.status === 'holiday') holidays++;
      else if (day.status === 'leave') leaves++;
      else if (day.status === 'weekend') weekends++;
    });
    const totalWorkingDays = present + absent + leaves;
    const attendance_percentage = totalWorkingDays > 0
      ? ((present / totalWorkingDays) * 100).toFixed(1)
      : 0;
    return { present, absent, holidays, leaves, weekends, attendance_percentage };
  }, [calendarData]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < 42; i++) {
      let dateObj, isCurrentMonth = true;
      if (i < firstDay) {
        dateObj = new Date(year, month - 2, prevMonthDays - (firstDay - i - 1));
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        dateObj = new Date(year, month, i - (firstDay + daysInMonth) + 1);
        isCurrentMonth = false;
      } else {
        dateObj = new Date(year, month - 1, i - firstDay + 1);
      }
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      grid.push({
        date: dateObj,
        dayNumber: dateObj.getDate(),
        isCurrentMonth,
        data: calendarData?.[dateStr] || null,
        isToday: new Date().toDateString() === dateObj.toDateString(),
      });
    }
    return grid;
  }, [calendarData, month, year]);

  return (
    <ManagementHub
      eyebrow={<><FaCalendarAlt size={11} /> Dashboard</>}
      title="My Calendar"
      description="View your attendance, holidays, and leave schedules in one place."
      accent="indigo"
    >
      <div className="max-w-screen-2xl mx-auto px-4 pb-8">

        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SummaryCard label="Present"     value={calendarSummary?.present || 0}               icon={FaCheckCircle}  color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryCard label="Absent"      value={calendarSummary?.absent || 0}                icon={FaTimesCircle}  color="text-rose-600"    bg="bg-rose-50"    />
          <SummaryCard label="Holidays"    value={calendarSummary?.holidays || 0}              icon={FaUmbrellaBeach} color="text-amber-600"   bg="bg-amber-50"   />
          <SummaryCard label="Leaves"      value={calendarSummary?.leaves || 0}               icon={FaInfoCircle}   color="text-violet-600"  bg="bg-violet-50"  />
          <SummaryCard label="Weekends"    value={calendarSummary?.weekends || 0}              icon={FaCalendarAlt}  color="text-slate-600"   bg="bg-slate-50"   />
          <SummaryCard label="Attendance"  value={`${calendarSummary?.attendance_percentage || 0}%`} icon={FaClock} color="text-indigo-600"  bg="bg-indigo-50"  />
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-gray-900">
                {currentDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                  Today
                </button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {user?.name && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <FaUser className="text-indigo-600" />
                <div>
                  <p className="text-xs font-black text-indigo-900 leading-none">{user.name}</p>
                  {user.employee?.employee_code && (
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                      {user.employee.employee_code}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}
            {error && (
              <div className="col-span-7 py-16 flex flex-col items-center gap-2 text-rose-500">
                <FaTimesCircle size={28} />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}
            {!error && calendarGrid.map((cell, idx) => (
              <CalendarCell key={idx} cell={cell} onClick={setSelectedCell} />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap justify-center gap-5">
          <LegendItem color="bg-emerald-500" label="Present" />
          <LegendItem color="bg-rose-500"    label="Absent"  />
          <LegendItem color="bg-amber-500"   label="Holiday" />
          <LegendItem color="bg-violet-500"  label="Leave"   />
          <LegendItem color="bg-slate-400"   label="Weekend" />
          <LegendItem color="bg-gray-200"    label="Upcoming"/>
        </div>
      </div>

      <AnimatePresence>
        {selectedCell && (
          <DayDetailsModal cell={selectedCell} onClose={() => setSelectedCell(null)} />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
};

export default MyCalendar;