import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaBuilding,
  FaUsers,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaFilter,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import apiCall from '../utils/api';

// ==================== API SERVICE ====================
const holidayService = {
  // Fetch company holidays list
  getCompanyHolidays: async (companyId) => {
    try {
      const response = await apiCall('/holiday/company/list', 'GET', null, companyId);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch company holidays:', error);
      return [];
    }
  }
};

// ==================== HELPER FUNCTIONS ====================
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const toCalendarDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if ([year, month, day].every(num => Number.isFinite(num))) {
        return new Date(year, month - 1, day);
      }
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
};

const formatDate = (date) => {
  const normalized = toCalendarDate(date);
  if (!normalized) return '';
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameDay = (date1, date2) => {
  const left = toCalendarDate(date1);
  const right = toCalendarDate(date2);
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
};


// ==================== CALENDAR CELL COMPONENT ====================
const CalendarCell = ({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  holidays,
  showHolidayDetails,
  onMonthNavigate,
  onTap,
  isHighlighted
}) => {
  const hasHolidays = holidays && holidays.length > 0;

  const getHolidayStyles = () => {
    if (!hasHolidays) return {};
    const holiday = holidays[0];
    const isOptional = holiday.is_optional === 1;
    const isObservance = holiday.type === 'Observance';

    if (isObservance) return { backgroundColor: '#fef3c7', color: '#92400e' }; // light-amber
    if (isOptional) return { backgroundColor: '#d1fae5', color: '#065f46' }; // light-emerald
    return { backgroundColor: '#fee2e2', color: '#991b1b' }; // light-red
  };

  const getHolidayBadge = (holiday) => {
    const type = holiday.type || (holiday.is_optional === 1 ? 'Optional' : 'Holiday');

    return (
      <span className="text-[9px] xsm:text-[8px] px-1 py-0.5 rounded-full truncate font-bold opacity-80 bg-white/50">
        {type === 'Observance' ? 'Obs' : type.slice(0, 3)}
      </span>
    );
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (!isCurrentMonth) {
          onMonthNavigate(date);
        } else {
          onTap(date);
        }
      }}
      className={`
        relative h-20 xsm:h-16 sm:h-24 md:h-28 lg:h-32 p-1 xsm:p-0.5 sm:p-1.5 md:p-2 border border-gray-100 rounded-lg
        transition-all duration-200 hover:shadow-md
        ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300 cursor-pointer hover:bg-gray-100/80 active:scale-[0.98]' : 'bg-white text-gray-700'}
        ${isToday ? 'border-sky-600 border-2 shadow-[0_0_12px_rgba(79,70,229,0.3)] z-20 scale-[1.02]' : ''}
        ${isHighlighted ? 'border-indigo-400 border-2 shadow-[0_0_12px_rgba(79,70,229,0.3)] z-20 scale-[1.02]' : ''}
      `}
      style={hasHolidays && showHolidayDetails ? getHolidayStyles() : {}}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs xsm:text-[10px] sm:text-sm font-bold ${!isCurrentMonth ? 'text-gray-300' : isToday ? 'text-sky-800' : 'text-gray-700'}`}>
          {dayNumber}
        </span>
        <div className="flex flex-col items-end gap-0.5 xsm:gap-0">
          {isToday && (
            <span className="text-[8px] xsm:text-[7px] sm:text-[10px] px-1 xsm:px-0.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold uppercase tracking-tighter">
              Today
            </span>
          )}
          {hasHolidays && showHolidayDetails && getHolidayBadge(holidays[0])}
          {hasHolidays && !showHolidayDetails && (
            <span className="text-[8px] xsm:text-[7px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black">
              {holidays.length}
            </span>
          )}
        </div>
      </div>

      {hasHolidays && showHolidayDetails && (
        <div className="mt-1 space-y-0.5">
          {holidays.slice(0, 1).map((holiday, idx) => (
            <p key={idx} className="text-[10px] xsm:text-[8px] sm:text-xs font-bold truncate leading-tight opacity-95 tracking-tight">
              {holiday.name}
            </p>
          ))}
          {holidays.length > 1 && (
            <p className="text-[8px] xsm:text-[7px] opacity-70 font-bold uppercase tracking-widest text-right">+{holidays.length - 1} more</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ==================== HOLIDAY DETAILS SIDEBAR ====================
const HolidayDetailsSidebar = ({ holidays, onClose, onMonthNavigate }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const date = formatDate(holiday.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(holiday);
    return acc;
  }, {});

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        className="fixed right-0 top-0 h-full w-[400px] xsm:w-full bg-white shadow-2xl z-[100] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 p-6 xsm:p-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-xl xsm:text-lg font-black text-gray-900 uppercase tracking-tight">Corporate Calendar</h3>
            <p className="text-xs xsm:text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{holidays.length} holidays configured</p>
          </div>
          <button onClick={onClose} className="p-3 xsm:p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 bg-gray-50">
            <FaTimes className="w-5 h-5 xsm:w-4 xsm:h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 xsm:p-4 space-y-6">
          {Object.entries(groupedHolidays).map(([date, dateHolidays]) => (
            <div key={date} className="group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <FaCalendarAlt className="w-5 h-5" />
                </div>
                <span className="font-black text-gray-900 text-sm tracking-tight">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="space-y-3 pl-10 xsm:pl-0">
                {dateHolidays.map((holiday, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onMonthNavigate(holiday.date);
                      onClose();
                    }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all hover:bg-white hover:shadow-sm cursor-pointer active:scale-[0.98] group/item"
                  >
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 group-hover/item:scale-125 transition-transform ${holiday.type === 'Observance' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                        holiday.is_optional === 1 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                          'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black text-gray-900 leading-tight truncate group-hover/item:text-indigo-600 transition-colors">{holiday.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {holiday.type || (holiday.is_optional === 1 ? 'Optional Holiday' : 'Mandatory Holiday')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

// ==================== MAIN COMPONENT ====================
const CompanyHolidayCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHolidaySidebar, setShowHolidaySidebar] = useState(false);
  const [showHolidayDetails, setShowHolidayDetails] = useState(true);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCompany] = useState(() => JSON.parse(localStorage.getItem('company')));
  const [isLoading, setIsLoading] = useState(false);

  // Shared fetch lock to prevent double loading while ensuring UI updates
  const fetchLock = useRef(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = useMemo(() => toCalendarDate(new Date()), []);


  useEffect(() => {
    const fetchCompanyHolidays = async () => {
      if (!selectedCompany) return;

      // 1. If another instance is already fetching, wait for its promise
      if (fetchLock.current) {
        try {
          const data = await fetchLock.current;
          setCompanyHolidays(data);
        } catch (err) {
          console.error("Lock sync failed:", err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      // 2. Start the fetch and store the promise in the ref
      const activePromise = holidayService.getCompanyHolidays(selectedCompany.id);
      fetchLock.current = activePromise;

      try {
        const holidays = await activePromise;
        setCompanyHolidays(holidays);
      } catch (err) {
        console.error("Failed to fetch holidays:", err);
        fetchLock.current = null; // Clear lock on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyHolidays();
  }, [selectedCompany]);

  const getHolidaysForDate = useCallback((date) => {
    const dateStr = formatDate(date);
    return companyHolidays.filter(holiday => formatDate(holiday.date) === dateStr);
  }, [companyHolidays]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
  };

  const goToToday = () => {
    const todayDate = new Date();
    setSelectedDate(toCalendarDate(todayDate));
    setCurrentDate(todayDate);
  };

  const handleMonthNavigate = useCallback((date) => {
    const normalized = toCalendarDate(date);
    if (!normalized) return;
    
    // Select the day and show that month
    setSelectedDate(normalized);
    const targetMonth = new Date(normalized.getFullYear(), normalized.getMonth(), 1);
    setCurrentDate(targetMonth);
  }, []);
  
  const handleDateClick = useCallback((date) => {
    const normalized = toCalendarDate(date);
    if (!normalized) return;
    setSelectedDate(normalized);
  }, []);

  const generateCalendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

    const grid = [];
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      let date;
      let isCurrentMonth = true;
      let dayNumber;

      if (i < firstDay) {
        dayNumber = prevMonthDays - (firstDay - i - 1);
        date = new Date(currentYear, currentMonth - 1, dayNumber);
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        dayNumber = i - (firstDay + daysInMonth) + 1;
        date = new Date(currentYear, currentMonth + 1, dayNumber);
        isCurrentMonth = false;
      } else {
        dayNumber = i - firstDay + 1;
        date = new Date(currentYear, currentMonth, dayNumber);
        isCurrentMonth = true;
      }

      const isToday = isSameDay(date, today);
      const holidays = getHolidaysForDate(date);
      const isHighlighted = selectedDate && isSameDay(date, selectedDate);
      
      grid.push({
        date,
        dayNumber,
        isCurrentMonth,
        isToday,
        holidays,
        isHighlighted
      });
    }

    return grid;
  }, [currentYear, currentMonth, today, getHolidaysForDate, selectedDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 xsm:p-2 sm:p-4 md:p-6 lg:p-8 font-outfit">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 xsm:mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl xsm:text-lg sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">
              {selectedCompany ? `${selectedCompany.name} Holidays` : 'Company Holiday Hub'}
            </h1>
            <p className="text-xs xsm:text-[10px] sm:text-sm text-gray-500 mt-1 font-medium italic">
              {selectedCompany ? `Syncing from Directory #${selectedCompany.id}` : 'Stay updated with your corporate schedule'}
            </p>
          </div>

          <div className="flex items-center gap-2 xsm:gap-1.5 flex-wrap">
            <button
              onClick={() => setShowHolidayDetails(!showHolidayDetails)}
              className="flex items-center gap-1.5 xsm:gap-1 px-3 xsm:px-2 py-2 xsm:py-1.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition text-xs xsm:text-[10px] text-gray-700 shadow-sm font-bold uppercase tracking-wider active:scale-95"
            >
              {showHolidayDetails ? <FaEyeSlash className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" /> : <FaEye className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" />}
              {showHolidayDetails ? 'Hide Names' : 'Show Names'}
            </button>

            <button
              onClick={() => setShowHolidaySidebar(true)}
              className="flex items-center gap-1.5 xsm:gap-1 px-4 xsm:px-3 py-2 xsm:py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-xs xsm:text-[10px] shadow-lg shadow-indigo-100 font-bold uppercase tracking-wider active:scale-95"
            >
              <FaFilter className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" />
              All Holidays
            </button>
          </div>
        </div>

        {/* Spacing correction */}
        <div className="h-4 xsm:h-2"></div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl xsm:rounded-xl shadow-sm border border-gray-200 p-3 xsm:p-2 mb-4 xsm:mb-3">
          <div className="flex items-center justify-between gap-3 xsm:gap-2">
            <div className="flex items-center gap-2 xsm:gap-1.5">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 xsm:p-1 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
              >
                <FaChevronLeft className="w-4 h-4 xsm:w-3 xsm:h-3 text-gray-600" />
              </button>
              <div className="flex items-center gap-1.5 xsm:gap-1">
                <FaCalendarAlt className="w-4 h-4 xsm:w-3 xsm:h-3 text-indigo-500" />
                <h2 className="text-base xsm:text-sm sm:text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 xsm:p-1 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
              >
                <FaChevronRight className="w-4 h-4 xsm:w-3 xsm:h-3 text-gray-600" />
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-4 xsm:px-3 py-2 xsm:py-1.5 text-xs xsm:text-[10px] bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-indigo-600 font-black uppercase tracking-widest border border-indigo-50"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-3xl xsm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {weekDays.map((day, idx) => (
              <div key={day} className="p-3 xsm:p-2 text-center text-xs xsm:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span className="xsm:hidden">{day}</span>
                <span className="hidden xsm:inline">{weekDaysShort[idx]}</span>
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 xsm:h-64 gap-3">
              <FaSpinner className="w-8 h-8 xsm:w-6 xsm:h-6 animate-spin text-indigo-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Calendar...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {generateCalendarGrid.map((cell, idx) => (
                <CalendarCell
                  key={idx}
                  {...cell}
                  showHolidayDetails={showHolidayDetails}
                  onMonthNavigate={handleMonthNavigate}
                  onTap={handleDateClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 xsm:mt-3 flex flex-wrap gap-4 xsm:gap-2 justify-center text-[10px] xsm:text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded-lg border border-red-200 shadow-sm" style={{ backgroundColor: '#fee2e2' }}></div>
            <span className="text-gray-500">Mandatory</span>
          </div>
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded-lg border border-emerald-200 shadow-sm" style={{ backgroundColor: '#d1fae5' }}></div>
            <span className="text-gray-500">Optional</span>
          </div>
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded-lg border border-amber-200 shadow-sm" style={{ backgroundColor: '#fef3c7' }}></div>
            <span className="text-gray-500">Observance</span>
          </div>
        </div>

      </div>

      {/* Holiday Details Sidebar */}
      <AnimatePresence>
        {showHolidaySidebar && (
          <HolidayDetailsSidebar
            holidays={companyHolidays}
            onClose={() => setShowHolidaySidebar(false)}
            onMonthNavigate={handleMonthNavigate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyHolidayCalendar;
