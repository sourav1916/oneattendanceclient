import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaCheck,
  FaExclamationCircle,
  FaSpinner
} from 'react-icons/fa';
import apiCall from '../utils/api';

// ==================== API SERVICE ====================
const holidayService = {
  // Fetch master holidays for a specific year and month
  getMasterHolidays: async (year, month) => {
    try {
      const response = await apiCall(`/holiday/master-holidays?year=${year}&month=${month}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch master holidays:', error);
      return [];
    }
  },

  // Create a new holiday
  createHoliday: async (holidayData) => {
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const response = await apiCall('/holiday/create', 'POST', holidayData, company?.id);
      const data = await response.json();
      return { success: !!data.success, data, error: data.message };
    } catch (error) {
      console.error('Failed to create holiday:', error);
      return { success: false, error: error.message };
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

const isSameDay = (left, right) => {
  const a = toCalendarDate(left);
  const b = toCalendarDate(right);
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
};

// ==================== CALENDAR CELL COMPONENT ====================
const CalendarCell = ({ 
  date, 
  dayNumber, 
  isCurrentMonth, 
  isSelected, 
  isToday,
  isHoliday, 
  holidayInfo,
  onTap,
  onPressHold,
  isSelecting
}) => {
  const getHolidayTypeClass = () => {
    if (!holidayInfo) return '';
    if (holidayInfo.type) return 'border-l-4 border-amber-500';
    if (holidayInfo.is_optional === 1) return 'border-l-4 border-emerald-500';
    return 'border-l-4 border-red-500';
  };

  const getHolidayBadge = () => {
    if (!holidayInfo) return null;
    const type = holidayInfo.type || (holidayInfo.is_optional ? 'Optional' : 'Holiday');
    const color = holidayInfo.type === 'Observance' ? 'bg-amber-100 text-amber-800' :
                  holidayInfo.is_optional ? 'bg-emerald-100 text-emerald-800' :
                  'bg-red-100 text-red-800';
    return (
      <span className={`text-[10px] px-1 rounded-full truncate max-w-[60px] ${color}`}>
        {type === 'Observance' ? 'Observance' : type}
      </span>
    );
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onMouseDown={() => onTap(date)}
      onMouseEnter={() => isSelecting && onTap(date)}
      onContextMenu={(e) => {
        e.preventDefault();
        onPressHold(date);
      }}
      className={`
        relative h-28 md:h-32 p-2 border border-gray-200 rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-md hover:border-indigo-300
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'border-sky-500 border-2 shadow-[0_0_0_1px_rgba(14,165,233,0.15)]' : ''}
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50' : ''}
        ${isHoliday ? getHolidayTypeClass() : ''}
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : isToday ? 'text-sky-700' : 'text-gray-700'}`}>
          {dayNumber}
        </span>
        <div className="flex flex-col items-end gap-1">
          {isToday && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
              Today
            </span>
          )}
          {getHolidayBadge()}
        </div>
      </div>
      
      {holidayInfo && (
        <p className="text-xs mt-1 font-medium text-gray-800 truncate">
          {holidayInfo.name}
        </p>
      )}
      
      {isSelected && !isHoliday && (
        <div className="absolute bottom-2 right-2">
          <FaCheck className="w-4 h-4 text-indigo-600" />
        </div>
      )}
    </motion.div>
  );
};

// ==================== CREATE HOLIDAY POPUP ====================
const CreateHolidayPopup = ({ selectedDates, onClose, onCreateSuccess }) => {
  const [holidayName, setHolidayName] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      setError('Please enter a holiday name');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const promises = selectedDates.map(date => 
      holidayService.createHoliday({
        name: holidayName.trim(),
        date: formatDate(date),
        ...(isOptional && { is_optional: 1 })
      })
    );

    const results = await Promise.all(promises);
    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      setSuccessMessage(`Created ${selectedDates.length} holiday(s) successfully!`);
      setTimeout(() => {
        onCreateSuccess();
        onClose();
      }, 1500);
    } else {
      setError('Some holidays failed to create. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Create Holiday</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <FaCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holiday Name *
            </label>
            <input
              type="text"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="e.g., Diwali, Republic Day"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Mark as Optional Holiday</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus className="w-5 h-5" />
                  Create {selectedDates.length > 1 ? `${selectedDates.length} Holidays` : 'Holiday'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ==================== MAIN CALENDAR COMPONENT ====================
const HolidayManagementCalendar = () => {
  const [currentDate, setCurrentDate] = useState(() => toCalendarDate(new Date()) || new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [masterHolidays, setMasterHolidays] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [yearMonth, setYearMonth] = useState({ year: null, month: null });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = useMemo(() => toCalendarDate(new Date()) || new Date(), []);

  // Fetch master holidays when month/year changes
  useEffect(() => {
    const fetchHolidays = async () => {
      if (yearMonth.year === currentYear && yearMonth.month === currentMonth) return;
      
      setIsLoading(true);
      const holidays = await holidayService.getMasterHolidays(currentYear, currentMonth + 1);
      
      const holidaysByDate = {};
      holidays.forEach(holiday => {
        holidaysByDate[holiday.date] = {
          name: holiday.name,
          type: holiday.type,
          day: holiday.day
        };
      });
      
      setMasterHolidays(prev => ({ ...prev, [`${currentYear}-${currentMonth}`]: holidaysByDate }));
      setYearMonth({ year: currentYear, month: currentMonth });
      setIsLoading(false);
    };

    fetchHolidays();
  }, [currentYear, currentMonth]);

  const getHolidayForDate = (date) => {
    const key = `${currentYear}-${currentMonth}`;
    const holidaysMap = masterHolidays[key] || {};
    return holidaysMap[formatDate(date)];
  };

  const handleDateTap = useCallback((date) => {
    const normalized = toCalendarDate(date);
    if (!normalized) return;
    
    if (isSelecting) {
      setSelectedDates(prev => {
        const exists = prev.some(d => formatDate(d) === formatDate(normalized));
        if (exists) {
          return prev.filter(d => formatDate(d) !== formatDate(normalized));
        }
        return [...prev, normalized];
      });
    } else {
      setSelectedDates([normalized]);
      setIsSelecting(false);
      setShowCreatePopup(true);
    }
  }, [isSelecting]);

  const handlePressHold = useCallback((date) => {
    const normalized = toCalendarDate(date);
    if (!normalized) return;
    setIsSelecting(true);
    setSelectedDates([normalized]);
  }, []);

  const resetSelection = () => {
    setSelectedDates([]);
    setIsSelecting(false);
  };

  const handleCreateSuccess = () => {
    resetSelection();
    // Refresh holidays for current month
    setYearMonth({ year: null, month: null });
  };

  const changeMonth = (delta) => {
    const target = toCalendarDate(new Date(currentYear, currentMonth + delta, 1));
    setCurrentDate(target || new Date(currentYear, currentMonth + delta, 1));
    resetSelection();
  };

  const goToToday = () => {
    setCurrentDate(toCalendarDate(new Date()) || new Date());
    resetSelection();
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
    
    const grid = [];
    const totalCells = 42; // 6 rows x 7 days
    
    for (let i = 0; i < totalCells; i++) {
      let date;
      let isCurrentMonth = true;
      let dayNumber;
      
      if (i < firstDay) {
        // Previous month days
        dayNumber = prevMonthDays - (firstDay - i - 1);
        date = new Date(currentYear, currentMonth - 1, dayNumber);
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        // Next month days
        dayNumber = i - (firstDay + daysInMonth) + 1;
        date = new Date(currentYear, currentMonth + 1, dayNumber);
        isCurrentMonth = false;
      } else {
        // Current month days
        dayNumber = i - firstDay + 1;
        date = new Date(currentYear, currentMonth, dayNumber);
        isCurrentMonth = true;
      }
      
      const isSelected = selectedDates.some(d => formatDate(d) === formatDate(date));
      const isToday = isSameDay(date, today);
      const holidayInfo = getHolidayForDate(date);
      const isHoliday = !!holidayInfo;
      
      grid.push({
        date,
        dayNumber,
        isCurrentMonth,
        isSelected,
        isToday,
        isHoliday,
        holidayInfo
      });
    }
    
    return grid;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Holiday Management
            </h1>
            <p className="text-gray-500 mt-1">Manage and track all system holidays</p>
          </div>
          
          {selectedDates.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreatePopup(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg"
              >
                <FaPlus className="w-5 h-5" />
                Create Holiday ({selectedDates.length})
              </button>
              <button
                onClick={resetSelection}
                className="p-2.5 hover:bg-gray-200 rounded-xl transition text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <FaChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <FaChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
            >
              Today
            </button>
          </div>
          
          {isSelecting && (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-2 rounded-lg">
              <FaExclamationCircle className="w-4 h-4" />
              Multi-select mode active. Tap dates to select/deselect.
              <button onClick={() => setIsSelecting(false)} className="ml-auto text-gray-500 hover:text-gray-700">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar cells */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <FaSpinner className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr">
              {generateCalendarGrid().map((cell, idx) => (
                <CalendarCell
                  key={idx}
                  {...cell}
                  onTap={handleDateTap}
                  onPressHold={handlePressHold}
                  isSelecting={isSelecting}
                />
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-l-4 border-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Mandatory Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-100 border-l-4 border-emerald-500 rounded"></div>
            <span className="text-sm text-gray-600">Optional Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border-l-4 border-amber-500 rounded"></div>
            <span className="text-sm text-gray-600">Observance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-50 ring-2 ring-indigo-500 rounded"></div>
            <span className="text-sm text-gray-600">Selected</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>💡 Tip: Press & hold to multi-select dates</span>
          </div>
        </div>
      </div>

      {/* Create Holiday Popup */}
      <AnimatePresence>
        {showCreatePopup && selectedDates.length > 0 && (
          <CreateHolidayPopup
            selectedDates={selectedDates}
            onClose={() => {
              setShowCreatePopup(false);
              resetSelection();
            }}
            onCreateSuccess={handleCreateSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HolidayManagementCalendar;
