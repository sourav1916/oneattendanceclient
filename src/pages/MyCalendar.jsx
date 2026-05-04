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
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { ManagementHub } from '../components/common';
import ModalScrollLock from '../components/ModalScrollLock';

const MyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const lastFetchedKeyRef = useRef(null);

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
    const attendance_percentage = totalWorkingDays > 0 ? ((present / totalWorkingDays) * 100).toFixed(1) : 0;
    
    return {
      total_present: present,
      total_absent: absent,
      total_holidays: holidays,
      total_leave: leaves,
      total_weekends: weekends,
      attendance_percentage
    };
  }, [calendarData]);

  useEffect(() => {
    const fetchKey = `${month}-${year}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;

    const fetchCalendar = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const companyId = JSON.parse(localStorage.getItem('company'))?.id;
        const response = await apiCall(`/shifts/my-calendar?month=${month}&year=${year}`, 'GET', null, companyId);
        const json = await response.json();
        if (json.success) {
          setCalendarData(json.data);
        } else {
          setError(json.message || 'Failed to fetch calendar');
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

  const changeMonth = (delta) => {
    setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1));
  };

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    
    const grid = [];
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      let dateObj;
      let isCurrentMonth = true;
      if (i < firstDay) {
        const day = prevMonthDays - (firstDay - i - 1);
        dateObj = new Date(year, month - 2, day);
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        const day = i - (firstDay + daysInMonth) + 1;
        dateObj = new Date(year, month, day);
        isCurrentMonth = false;
      } else {
        const day = i - firstDay + 1;
        dateObj = new Date(year, month - 1, day);
        isCurrentMonth = true;
      }
      
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      const dayData = calendarData?.[dateStr] || null;
      
      grid.push({
        date: dateObj,
        dayNumber: dateObj.getDate(),
        isCurrentMonth,
        data: dayData,
        isToday: new Date().toDateString() === dateObj.toDateString()
      });
    }
    return grid;
  }, [calendarData, month, year]);

  const [selectedCell, setSelectedCell] = useState(null);

  const getStatusStyles = (status, isCurrentMonth) => {
    if (!isCurrentMonth) return 'bg-gray-50/50 text-gray-300';
    switch (status) {
      case 'present': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'absent': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'holiday': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'weekend': return 'bg-slate-50 border-slate-100 text-slate-600';
      case 'leave': return 'bg-violet-50 border-violet-100 text-violet-700';
      default: return 'bg-white border-gray-100 text-gray-700';
    }
  };

  return (
    <ManagementHub
      eyebrow={<><FaCalendarAlt size={11} /> Dashboard</>}
      title="My Calendar"
      description="View your attendance, holidays, and leave schedules in one place."
      accent="indigo"
    >
      <div className="max-w-screen-2xl mx-auto px-4 pb-8">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <SummaryCard label="Present" value={calendarSummary?.total_present || 0} icon={FaCheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryCard label="Absent" value={calendarSummary?.total_absent || 0} icon={FaTimesCircle} color="text-rose-600" bg="bg-rose-50" />
          <SummaryCard label="Holidays" value={calendarSummary?.total_holidays || 0} icon={FaUmbrellaBeach} color="text-amber-600" bg="bg-amber-50" />
          <SummaryCard label="Leaves" value={calendarSummary?.total_leave || 0} icon={FaInfoCircle} color="text-violet-600" bg="bg-violet-50" />
          <SummaryCard label="Weekends" value={calendarSummary?.total_weekends || 0} icon={FaCalendarAlt} color="text-slate-600" bg="bg-slate-50" />
          <SummaryCard label="Attendance %" value={`${calendarSummary?.attendance_percentage || 0}%`} icon={FaSpinner} color="text-indigo-600" bg="bg-indigo-50" />
        </div>

        {/* Calendar Main Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-gray-900">
                {currentDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><FaChevronLeft className="w-3 h-3" /></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Today</button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><FaChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
            
            {user?.name && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <FaUser className="text-indigo-600" />
                <div className="text-left">
                  <p className="text-xs font-black text-indigo-900 leading-none">{user.name}</p>
                  {user.employee?.employee_code && (
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{user.employee.employee_code}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <FaSpinner className="w-10 h-10 animate-spin text-indigo-600" />
              </div>
            )}
            {calendarGrid.map((cell, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCell(cell)}
                className={`min-h-[120px] p-2 transition-all cursor-pointer hover:opacity-90 ${getStatusStyles(cell.data?.status, cell.isCurrentMonth)} ${cell.isToday ? 'ring-2 ring-indigo-500 ring-inset z-[1]' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-black ${cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                    {cell.dayNumber}
                  </span>
                  {cell.isToday && (
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Today</span>
                  )}
                </div>
                
                {cell.data && cell.isCurrentMonth && (
                  <div className="space-y-1 mt-1">
                    <StatusBadge 
                      status={cell.data.status} 
                      type={cell.data.is_leave?.type || cell.data.is_weekend?.type} 
                    />
                    {cell.data.status === 'holiday' && cell.data.is_holiday?.name && (
                      <p className="text-[10px] font-bold leading-tight break-words text-amber-700/80">{cell.data.is_holiday.name}</p>
                    )}
                    {cell.data.status === 'leave' && cell.data.is_leave?.name && (
                      <p className="text-[10px] font-bold leading-tight break-words text-violet-700/80">{cell.data.is_leave.name}</p>
                    )}
                    {cell.data.status === 'present' && cell.data.worked?.work_hour && (
                      <div className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded uppercase tracking-tighter mt-1">
                        {cell.data.worked.work_hour}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <LegendItem color="bg-emerald-500" label="Present" />
          <LegendItem color="bg-rose-500" label="Absent" />
          <LegendItem color="bg-amber-500" label="Holiday" />
          <LegendItem color="bg-violet-500" label="Leave" />
          <LegendItem color="bg-slate-400" label="Weekend" />
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

const SummaryCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className={`${bg} p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4`}>
    <div className={`p-3 rounded-xl bg-white/80 ${color}`}><Icon size={20} /></div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-black ${color.replace('text-', 'text-gray-900')}`}>{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status, type }) => {
  const labels = {
    present: 'Present',
    absent: 'Absent',
    holiday: 'Holiday',
    weekend: 'Weekend',
    leave: 'Leave'
  };
  
  const colors = {
    present: 'bg-emerald-600',
    absent: 'bg-rose-600',
    holiday: 'bg-amber-600',
    weekend: 'bg-slate-500',
    leave: 'bg-violet-600'
  };

  return (
    <div className="flex flex-wrap gap-1">
      <span className={`${colors[status] || 'bg-gray-400'} text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter`}>
        {labels[status] || status}
      </span>
      {type && (
        <span className="bg-white/50 text-gray-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-black/5">
          {type}
        </span>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`}></div>
    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
  </div>
);

const DayDetailsModal = ({ cell, onClose }) => {
  if (!cell) return null;
  const { date, data } = cell;
  
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-black text-gray-900">{formattedDate}</h3>
            {data?.status && (
              <div className="mt-1">
                <StatusBadge status={data.status} type={data.is_leave?.type || data.is_weekend?.type} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-xl transition-colors">
            <FaTimesCircle size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Holiday Section */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Holiday Info</h4>
            {data?.is_holiday && Object.keys(data.is_holiday).length > 0 ? (
              <p className="font-bold text-amber-900">{data.is_holiday.name}</p>
            ) : (
              <p className="text-xs italic text-amber-600/50">No record found</p>
            )}
          </div>
          
          {/* Leave Section */}
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
            <h4 className="text-xs font-black text-violet-500 uppercase tracking-widest mb-1">Leave Info</h4>
            {data?.is_leave && Object.keys(data.is_leave).length > 0 ? (
              <>
                <p className="font-bold text-violet-900">{data.is_leave.name}</p>
                {data.is_leave.type && <p className="text-sm text-violet-700 mt-1">Type: {data.is_leave.type}</p>}
              </>
            ) : (
              <p className="text-xs italic text-violet-600/50">No record found</p>
            )}
          </div>

          {/* Weekend Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Weekend Info</h4>
            {data?.is_weekend && Object.keys(data.is_weekend).length > 0 ? (
              <p className="font-bold text-slate-900">{data.is_weekend.name || 'Weekend'}</p>
            ) : (
              <p className="text-xs italic text-slate-400/60">No record found</p>
            )}
          </div>
          
          {/* Work Section */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-3">Work Info</h4>
            {data?.worked && Object.keys(data.worked).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {data.worked.punch_in && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Punch In</p>
                    <p className="font-black text-emerald-900">{data.worked.punch_in}</p>
                  </div>
                )}
                {data.worked.punch_out && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Punch Out</p>
                    <p className="font-black text-emerald-900">{data.worked.punch_out}</p>
                  </div>
                )}
                {data.worked.work_hour && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Total Hours</p>
                    <p className="font-black text-emerald-900">{data.worked.work_hour}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs italic text-emerald-600/50">No record found</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MyCalendar;
