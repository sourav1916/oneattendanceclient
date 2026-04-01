import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';

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

// ==================== COMPANY SELECTOR COMPONENT ====================
const CompanySelector = ({ companies, selectedCompany, onSelectCompany }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FaBuilding className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-700">Select Company</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {companies.map(company => (
          <motion.button
            key={company.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCompany(company)}
            className={`
              flex items-center gap-3 p-3 rounded-xl border-2 transition-all
              ${selectedCompany?.id === company.id 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCompany?.id === company.id ? 'bg-indigo-500' : 'bg-gray-200'}`}>
              <FaBuilding className={`w-5 h-5 ${selectedCompany?.id === company.id ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">{company.name}</p>
              <p className="text-xs text-gray-500">ID: {company.id}</p>
            </div>
            {selectedCompany?.id === company.id && (
              <FaCheck className="w-5 h-5 text-indigo-500" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ==================== CALENDAR CELL COMPONENT ====================
const CalendarCell = ({ 
  dayNumber, 
  isCurrentMonth, 
  isToday,
  holidays,
  showHolidayDetails
}) => {
  const hasHolidays = holidays && holidays.length > 0;
  
  const getHolidayTypeClass = (holiday) => {
    if (holiday.type) return 'border-l-4 border-amber-500';
    if (holiday.is_optional === 1) return 'border-l-4 border-emerald-500';
    return 'border-l-4 border-red-500';
  };

  const getHolidayBadge = (holiday) => {
    const type = holiday.type || (holiday.is_optional === 1 ? 'Optional' : 'Holiday');
    const color = holiday.type === 'Observance' ? 'bg-amber-100 text-amber-800' :
                  holiday.is_optional === 1 ? 'bg-emerald-100 text-emerald-800' :
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
      className={`
        relative h-28 md:h-32 p-2 border border-gray-200 rounded-lg
        transition-all duration-200 hover:shadow-md hover:border-indigo-300
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'border-sky-500 border-2 shadow-[0_0_0_1px_rgba(14,165,233,0.15)]' : ''}
        ${hasHolidays && showHolidayDetails ? getHolidayTypeClass(holidays[0]) : ''}
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
          {hasHolidays && showHolidayDetails && getHolidayBadge(holidays[0])}
          {hasHolidays && !showHolidayDetails && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {holidays.length} holiday{holidays.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      {hasHolidays && showHolidayDetails && (
        <div className="mt-1 space-y-0.5">
          {holidays.slice(0, 2).map((holiday, idx) => (
            <p key={idx} className="text-xs font-medium text-gray-800 truncate">
              {holiday.name}
            </p>
          ))}
          {holidays.length > 2 && (
            <p className="text-[10px] text-gray-500">+{holidays.length - 2} more</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ==================== HOLIDAY DETAILS SIDEBAR ====================
const HolidayDetailsSidebar = ({ holidays, onClose }) => {
  const groupedHolidays = holidays.reduce((acc, holiday) => {
    // Format the date properly from the API response
    const date = formatDate(holiday.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(holiday);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Company Holidays</h3>
          <p className="text-sm text-gray-500">{holidays.length} holidays found</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
          <FaTimes className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {Object.entries(groupedHolidays).map(([date, dateHolidays]) => (
          <div key={date} className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <FaCalendarAlt className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-gray-700">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="space-y-2">
              {dateHolidays.map((holiday, idx) => (
                <div key={idx} className="flex items-start gap-2 pl-6">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    holiday.type === 'Observance' ? 'bg-amber-500' :
                    holiday.is_optional === 1 ? 'bg-emerald-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{holiday.name}</p>
                    <p className="text-xs text-gray-500">
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
  );
};

// ==================== MAIN COMPONENT ====================
const CompanyHolidayCalendar = () => {
  const { companies: authCompanies, company: activeCompany } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHolidaySidebar, setShowHolidaySidebar] = useState(false);
  const [showHolidayDetails, setShowHolidayDetails] = useState(true);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = useMemo(() => toCalendarDate(new Date()), []);

  useEffect(() => {
    setCompanies(authCompanies || []);

    if (!authCompanies?.length) {
      setSelectedCompany(null);
      return;
    }

    setSelectedCompany((prev) => {
      if (prev) {
        const matchedPrevious = authCompanies.find((company) => company.id === prev.id);
        if (matchedPrevious) return matchedPrevious;
      }

      if (activeCompany) {
        const matchedActive = authCompanies.find((company) => company.id === activeCompany.id);
        if (matchedActive) return matchedActive;
      }

      return authCompanies[0];
    });
  }, [authCompanies, activeCompany]);

  // Fetch company holidays when selected company changes
  useEffect(() => {
    const fetchCompanyHolidays = async () => {
      if (!selectedCompany) return;
      
      setIsLoading(true);
      const holidays = await holidayService.getCompanyHolidays(selectedCompany.id);
      setCompanyHolidays(holidays);
      setIsLoading(false);
    };

    fetchCompanyHolidays();
  }, [selectedCompany]);

  const getHolidaysForDate = useCallback((date) => {
    const dateStr = formatDate(date);
    const holidays = companyHolidays.filter((holiday) => {
      const holidayDateStr = formatDate(holiday.date);
      return holidayDateStr === dateStr;
    });
    
    return holidays;
  }, [companyHolidays]);

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid
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
      
      grid.push({
        date,
        dayNumber,
        isCurrentMonth,
        isToday,
        holidays
      });
    }
    
    return grid;
  }, [currentYear, currentMonth, today, getHolidaysForDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Company Holiday Management
            </h1>
            <p className="text-gray-500 mt-1">View and manage holidays for your companies</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHolidayDetails(!showHolidayDetails)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700"
            >
              {showHolidayDetails ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              {showHolidayDetails ? 'Hide Details' : 'Show Details'}
            </button>
            
            <button
              onClick={() => setShowHolidaySidebar(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700"
            >
              <FaFilter className="w-4 h-4" />
              View All Holidays
            </button>
          </div>
        </div>

        {/* Company Selector */}
        <CompanySelector
          companies={companies}
          selectedCompany={selectedCompany}
          onSelectCompany={setSelectedCompany}
        />

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
              {generateCalendarGrid.map((cell, idx) => (
                <CalendarCell
                  key={idx}
                  {...cell}
                  showHolidayDetails={showHolidayDetails}
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
        </div>

        {/* Company Info Card */}
        {selectedCompany && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaBuilding className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{selectedCompany.name}</h3>
                <p className="text-sm text-gray-600">
                  Company ID: {selectedCompany.id} | Total Holidays: {companyHolidays.length}
                </p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaUsers className="w-4 h-4" />
                  <span>Company Specific Holidays</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Holiday Details Sidebar */}
      <AnimatePresence>
        {showHolidaySidebar && (
          <HolidayDetailsSidebar
            holidays={companyHolidays}
            onClose={() => setShowHolidaySidebar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyHolidayCalendar;
