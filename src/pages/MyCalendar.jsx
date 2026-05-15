import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaUmbrellaBeach,
  FaInfoCircle,
  FaUser,
  FaClock,
  FaIdCard,
  FaBriefcase,
  FaSignOutAlt,
  FaSignInAlt,
  FaHourglassHalf,
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { ManagementHub } from '../components/common';
import ModalScrollLock from '../components/ModalScrollLock';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import AdvancedDateFilter from '../components/AdvancedDateFilter';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  present:  { 
    cell: 'bg-emerald-50/50 border-emerald-100/50',  
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',  
    label: 'Present',
    icon: FaCheckCircle,
    color: 'text-emerald-600'
  },
  absent:   { 
    cell: 'bg-rose-50/50 border-rose-100/50',        
    pill: 'bg-rose-100 text-rose-700 border-rose-200',        
    label: 'Absent',
    icon: FaTimesCircle,
    color: 'text-rose-600'
  },
  holiday:  { 
    cell: 'bg-amber-50/50 border-amber-100/50',      
    pill: 'bg-amber-100 text-amber-700 border-amber-200',      
    label: 'Holiday',
    icon: FaUmbrellaBeach,
    color: 'text-amber-600'
  },
  weekend:  { 
    cell: 'bg-slate-50/50 border-slate-100/50',      
    pill: 'bg-slate-100 text-slate-700 border-slate-200',      
    label: 'Weekend',
    icon: FaCalendarAlt,
    color: 'text-slate-600'
  },
  leave:    { 
    cell: 'bg-violet-50/50 border-violet-100/50',    
    pill: 'bg-violet-100 text-violet-700 border-violet-200',    
    label: 'Leave',
    icon: FaInfoCircle,
    color: 'text-violet-600'
  },
  upcoming: { 
    cell: 'bg-white border-gray-100',          
    pill: 'bg-gray-100 text-gray-500 border-gray-200',       
    label: 'Upcoming',
    icon: FaClock,
    color: 'text-gray-400'
  },
  half_day: {
    cell: 'bg-orange-50/50 border-orange-100/50',
    pill: 'bg-orange-100 text-orange-700 border-orange-200',
    label: 'Half Day',
    icon: FaHourglassHalf,
    color: 'text-orange-600'
  }
};

// ─── Components ───────────────────────────────────────────────────────────────

const CalendarCell = ({ cell, onClick }) => {
  const { dayNumber, isCurrentMonth, data, isToday } = cell;
  const status = data?.status || (isCurrentMonth ? 'upcoming' : null);
  const styles = STATUS_STYLES[status] || STATUS_STYLES.upcoming;
  
  if (!isCurrentMonth) {
    return (
      <div className="min-h-[120px] bg-gray-50/30 p-2 border-r border-b border-gray-100">
        <span className="text-xs text-gray-300 font-medium">{dayNumber}</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, zIndex: 1 }}
      onClick={() => onClick(cell)}
      className={`
        min-h-[120px] p-3 cursor-pointer transition-all border-r border-b 
        ${styles.cell}
        ${isToday ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200 ring-inset' : 'border-gray-100'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`
          flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
          ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-700'}
        `}>
          {dayNumber}
        </span>
        
        {data?.is_holiday && (
          <div className="text-amber-500" title={data.is_holiday.name}>
            <FaUmbrellaBeach size={12} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {status && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${styles.pill}`}>
            <span className={`w-1 h-1 rounded-full ${styles.color.replace('text-', 'bg-')}`} />
            {styles.label}
          </span>
        )}

        {/* Present / Worked details */}
        {data?.worked && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-gray-800 flex items-center gap-1">
              <FaClock size={8} className="text-gray-400" />
              {data.worked.total_work}
            </p>
            {data.worked.overtime !== '0h 0m' && (
              <p className="text-[9px] font-bold text-indigo-600">
                OT: {data.worked.overtime}
              </p>
            )}
          </div>
        )}

        {/* Leave details */}
        {data?.is_leave && (
          <div className="mt-1">
            <p className="text-[10px] font-bold text-violet-700 leading-tight truncate" title={data.is_leave.name}>
              {data.is_leave.code} - {data.is_leave.name}
            </p>
          </div>
        )}

        {/* Holiday details */}
        {data?.is_holiday && (
          <p className="text-[9px] font-medium text-amber-700 leading-tight line-clamp-2" title={data.is_holiday.name}>
            {data.is_holiday.name}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, type }) => {
  const styles = STATUS_STYLES[type] || STATUS_STYLES.upcoming;
  return (
    <div className={`p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${styles.pill}`}>
        <Icon />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const EmployeeInfo = ({ employee }) => {
  if (!employee) return null;
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden group">
      {/* Decorative shapes */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-110" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl transition-transform group-hover:scale-110" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30 shadow-inner">
            {employee.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase() || <FaUser size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{employee.employee_name || 'My Calendar'}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 opacity-90">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                <FaIdCard size={12} /> {employee.employee_code}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                <FaBriefcase size={12} /> {employee.designation?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 flex items-center gap-1.5">
              <FaSignInAlt size={10} /> Shift Start
            </p>
            <p className="text-lg font-black">{employee.shift_start?.slice(0, 5) || '--:--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 flex items-center gap-1.5">
              <FaSignOutAlt size={10} /> Shift End
            </p>
            <p className="text-lg font-black">{employee.shift_end?.slice(0, 5) || '--:--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 flex items-center gap-1.5">
              <FaClock size={10} /> Expected
            </p>
            <p className="text-lg font-black">{employee.expected_work || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayDetailsModal = ({ cell, onClose }) => {
  if (!cell) return null;
  const { date, data } = cell;
  const w = data?.worked || {};
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const InfoRow = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-800">{value || '—'}</span>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{formattedDate}</h3>
            {data?.status && (
              <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[data.status]?.pill}`}>
                {STATUS_STYLES[data.status]?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-2xl transition-all">
            <FaTimesCircle size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {data?.worked ? (
            <div className="grid gap-3">
              <InfoRow label="Work Hours" value={w.total_work} icon={FaClock} color="bg-emerald-100 text-emerald-600" />
              <InfoRow label="Break Time" value={w.break} icon={FaHourglassHalf} color="bg-amber-100 text-amber-600" />
              <InfoRow label="Overtime" value={w.overtime} icon={FaSignInAlt} color="bg-indigo-100 text-indigo-600" />
              <InfoRow label="Target" value={w.expected_work} icon={FaSignOutAlt} color="bg-slate-100 text-slate-600" />
            </div>
          ) : data?.is_leave ? (
            <div className="p-6 bg-violet-50 rounded-3xl border border-violet-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                <FaInfoCircle />
              </div>
              <h4 className="text-lg font-black text-violet-900 leading-tight mb-1">{data.is_leave.name}</h4>
              <p className="text-sm font-bold text-violet-500 uppercase tracking-widest">{data.is_leave.code} • {data.is_leave.type?.replace('_', ' ')}</p>
            </div>
          ) : data?.is_holiday ? (
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                <FaUmbrellaBeach />
              </div>
              <h4 className="text-lg font-black text-amber-900 leading-tight mb-1">{data.is_holiday.name}</h4>
              <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">
                {data.is_holiday.is_optional ? 'Optional Holiday' : 'Public Holiday'}
              </p>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center text-gray-400">
              <FaCalendarAlt size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">No activity recorded for this day</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MyCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const lastFetchedKeyRef = useRef(null);

  const fetchCalendar = useCallback(async (m, y) => {
    setLoading(true);
    setError(null);
    try {
      const companyId = JSON.parse(localStorage.getItem('company'))?.id;
      const response = await apiCall(`/shifts/my-calendar?month=${m}&year=${y}`, 'GET', null, companyId);
      const json = await response.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to fetch calendar');
        toast.error(json.message || 'Failed to fetch calendar');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      toast.error('Could not connect to the server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchKey = `${month}-${year}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;
    fetchCalendar(month, year);
  }, [month, year, fetchCalendar]);

  const handleFilterChange = (filter) => {
    if (filter.month && filter.year) {
      setCurrentDate(new Date(filter.year, filter.month - 1, 1));
    }
  };

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const grid = [];
    
    // 42 cells (6 rows of 7 days)
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
        data: data?.days?.[dateStr] || null,
        isToday: new Date().toDateString() === dateObj.toDateString(),
      });
    }
    return grid;
  }, [data, month, year]);

  const summary = data?.summary || {};

  return (
    <ManagementHub
      eyebrow={<><FaCalendarAlt size={11} /> Dashboard</>}
      title="Attendance Calendar"
      description="Track your attendance, leave history, and upcoming holidays."
      accent="indigo"
      onRefresh={() => fetchCalendar(month, year)}
    >
      <div className="max-w-screen-2xl mx-auto px-4 pb-12">
        
        {/* Header & Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long' })} {year}
            </h2>
            
            <AdvancedDateFilter
              value={{ month, year }}
              onChange={handleFilterChange}
              tabOptions={['month']}
              placeholder="Select Month"
              buttonClassName="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl shadow-sm hover:bg-gray-50 transition-all font-bold text-gray-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {['present', 'absent', 'holiday', 'leave', 'weekend'].map(s => (
              <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
                <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].color.replace('text-', 'bg-')}`} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{STATUS_STYLES[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Profile Section */}
        <EmployeeInfo employee={{ ...data?.employee, employee_name: user?.name }} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <SummaryCard label="Total Days" value={summary.total_days || 0} icon={FaCalendarAlt} type="upcoming" />
          <SummaryCard label="Present"    value={summary.present || 0}    icon={FaCheckCircle}  type="present"  />
          <SummaryCard label="Absent"     value={summary.absent || 0}     icon={FaTimesCircle}  type="absent"   />
          <SummaryCard label="Leaves"     value={summary.leave || 0}      icon={FaInfoCircle}   type="leave"    />
          <SummaryCard label="Holidays"   value={summary.holiday || 0}    icon={FaUmbrellaBeach} type="holiday"  />
          <SummaryCard label="Weekends"   value={summary.weekend || 0}    icon={FaCalendarAlt}  type="weekend"  />
          <SummaryCard label="Half Days"  value={summary.half_day || 0}   icon={FaHourglassHalf} type="half_day" />
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <FaSpinner className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-xs font-black text-indigo-900 uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
              </div>
            </div>
          )}

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="py-4 text-center">
                <span className="hidden md:block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{day}</span>
                <span className="md:hidden text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {error ? (
              <div className="col-span-7 py-32 flex flex-col items-center gap-4 text-rose-500">
                <FaTimesCircle size={48} className="opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm">{error}</p>
                <button 
                  onClick={() => fetchCalendar(month, year)}
                  className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  Retry Request
                </button>
              </div>
            ) : (
              calendarGrid.map((cell, idx) => (
                <CalendarCell 
                  key={idx} 
                  cell={cell} 
                  onClick={setSelectedCell} 
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCell && (
          <DayDetailsModal 
            cell={selectedCell} 
            onClose={() => setSelectedCell(null)} 
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
};

export default MyCalendar;