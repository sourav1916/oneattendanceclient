import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaBuilding,
  FaUsers,
  FaTimes,
  FaPlus,
  FaSpinner,
  FaTrash,
  FaCheck,
  FaExclamationCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';

// ==================== API SERVICE ====================
const holidayService = {
  // Fetch master holidays list
  getMasterHolidays: async (year, month) => {
    try {
      const response = await apiCall(`/holiday/master-holidays?year=${year}&month=${month}`, 'GET');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch master holidays:', error);
      return [];
    }
  },

  // Fetch company holidays list
  getCompanyHolidays: async (companyId) => {
    if (!companyId) return [];
    try {
      const response = await apiCall('/holiday/company/list', 'GET', null, companyId);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch company holidays:', error);
      return [];
    }
  },

  // Create holiday API
  createHoliday: async (payload) => {
    try {
      const response = await apiCall('/holiday/create', 'POST', payload);
      return await response.json();
    } catch (error) {
      console.error('Failed to create holiday:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },

  // Update holiday API
  updateHoliday: async (payload) => {
    try {
      const response = await apiCall('/holiday/update', 'PUT', payload);
      return await response.json();
    } catch (error) {
      console.error('Failed to update holiday:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  },

  // Delete holiday API
  deleteHoliday: async (id) => {
    try {
      const response = await apiCall('/holiday/delete', 'POST', { id });
      return await response.json();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      return { success: false, error: 'Internal Server Error' };
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
  isSelected, 
  isToday, 
  holidayInfo,
  onTap,
  onPressHold,
  isSelecting,
  onAction
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getCellStyles = () => {
    if (isSelected) return { backgroundColor: '#e0e7ff', borderColor: '#4f46e5', zIndex: 10 };
    if (!holidayInfo) return {};

    const isOptional = holidayInfo.is_optional === 1;
    const isObservance = holidayInfo.type === 'Observance';
    const isCorporate = holidayInfo.source === 'company';

    if (isObservance) return { backgroundColor: '#fef3c7', color: '#92400e' }; // light-amber
    if (isOptional) return { backgroundColor: '#d1fae5', color: '#065f46' }; // light-emerald
    if (isCorporate) return { backgroundColor: '#e0e7ff', color: '#3730a3' }; // light-indigo
    return { backgroundColor: '#fee2e2', color: '#991b1b' }; // light-red
  };

  const handleAction = (action) => {
    setShowMenu(false);
    onAction(date, holidayInfo, action);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onContextMenu={(e) => {
        e.preventDefault();
        onPressHold(date);
      }}
      onClick={() => isSelecting ? onTap(date) : null}
      className={`
        relative h-20 xsm:h-16 sm:h-24 md:h-28 lg:h-32 p-1 xsm:p-0.5 sm:p-1.5 md:p-2 border border-gray-100 rounded-lg
        transition-all duration-200
        ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-white text-gray-700'}
        ${isToday ? 'border-sky-500 border-2 shadow-[0_0_0_1px_rgba(14,165,233,0.15)] z-10' : ''}
        ${isSelecting ? 'cursor-pointer hover:border-indigo-400' : ''}
      `}
      style={getCellStyles()}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs xsm:text-[10px] sm:text-sm font-bold ${!isCurrentMonth ? 'text-gray-300' : isToday ? 'text-sky-800' : 'text-gray-700'}`}>
          {dayNumber}
        </span>
        <div className="flex items-center gap-1">
          {isToday && (
            <span className="text-[8px] xsm:text-[7px] sm:text-[10px] px-1 xsm:px-0.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold uppercase tracking-tighter">
              TDY
            </span>
          )}
          {holidayInfo && (
            <span className="text-[8px] xsm:text-[7px] sm:text-[10px] px-1 rounded-full bg-white/50 font-bold shadow-sm">
              {holidayInfo.source === 'master' ? 'M' : 'C'}
            </span>
          )}
          
          {/* Action Menu Trigger (ONLY if not selecting) */}
          {!isSelecting && (
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`p-1 rounded-lg transition-all active:scale-95 ${showMenu ? 'bg-black/10' : 'hover:bg-black/5'}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                </div>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-30 bg-black/5" 
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-5 right-2 w-40 xsm:w-36 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_10px_40px_-10px_rgba(79,70,229,0.3)] border border-indigo-100 py-1.5 z-40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!holidayInfo ? (
                        <button
                          onClick={() => handleAction('create')}
                          className="w-full flex items-center gap-3 px-4 xsm:px-3 py-2.5 xsm:py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                        >
                          <FaPlus className="w-3 h-3" /> Add Corporate
                        </button>
                      ) : (
                        <>
                          {holidayInfo.source === 'company' && (
                            <>
                              <button
                                onClick={() => handleAction('update')}
                                className="w-full flex items-center gap-3 px-4 xsm:px-3 py-2.5 xsm:py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                              >
                                <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                                  <FaCalendarAlt className="w-3 h-3" />
                                </div>
                                Update
                              </button>
                              <button
                                onClick={() => handleAction('delete')}
                                className="w-full flex items-center gap-3 px-4 xsm:px-3 py-2.5 xsm:py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all active:scale-95"
                              >
                                <div className="p-1 rounded-lg bg-red-50 text-red-600">
                                  <FaTrash className="w-3 h-3" />
                                </div>
                                Delete
                              </button>
                              <div className="h-px bg-gray-100 mx-3 my-1"></div>
                            </>
                          )}
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {holidayInfo && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[10px] xsm:text-[8px] sm:text-xs font-bold truncate leading-tight opacity-95 tracking-tight">
            {holidayInfo.name}
          </p>
          <p className="text-[8px] xsm:text-[7px] font-bold opacity-60 uppercase tracking-widest leading-none">
            {holidayInfo.source === 'master' ? 'Master' : 'Company'}
          </p>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      toast.error('Please enter a holiday name');
      return;
    }

    setIsSubmitting(true);
    
    const company = JSON.parse(localStorage.getItem('company'));
    const results = await Promise.all(selectedDates.map(date => 
      holidayService.createHoliday({
        name: holidayName.trim(),
        date: formatDate(date),
        is_optional: isOptional ? 1 : 0,
        company_id: company?.id
      })
    ));

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} holiday(s)!`);
      onCreateSuccess();
      onClose();
    } else {
      toast.error('Failed to create holidays');
    }
    
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 xsm:p-2"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl xsm:rounded-2xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 xsm:p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl xsm:text-lg font-bold">Create New Holiday</h3>
              <p className="text-white/80 text-xs xsm:text-[10px] mt-1 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3" />
                {selectedDates.length === 1 
                  ? formatDate(selectedDates[0]) 
                  : `${selectedDates.length} dates selected`}
              </p>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }} 
              className="relative z-[70] p-2 xsm:p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <FaTimes className="w-4 h-4 xsm:w-3.5 xsm:h-3.5" />
            </button>
          </div>
          
          {/* Abstract decoration */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 xsm:p-4 space-y-5 xsm:space-y-4">
          <div>
            <label className="block text-sm xsm:text-xs font-medium text-gray-700 mb-1.5 xsm:mb-1">
              Holiday Name *
            </label>
            <input
              type="text"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full px-3 xsm:px-2 py-2 xsm:py-1.5 text-sm xsm:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="e.g., Diwali, Republic Day"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="w-4 h-4 xsm:w-3.5 xsm:h-3.5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm xsm:text-xs text-gray-700">Mark as Optional Holiday</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 xsm:py-2.5 text-sm rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="w-4 h-4 xsm:w-3.5 xsm:h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaPlus className="w-4 h-4 xsm:w-3.5 xsm:h-3.5" />
                  Create Holiday{selectedDates.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ==================== UPDATE HOLIDAY POPUP ====================
const UpdateHolidayModal = ({ holiday, onClose, onUpdateSuccess }) => {
  const [holidayName, setHolidayName] = useState(holiday.name || '');
  const [isOptional, setIsOptional] = useState(holiday.is_optional === 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!holidayName.trim()) {
      toast.error('Please enter a holiday name');
      return;
    }

    setIsSubmitting(true);
    
    const result = await holidayService.updateHoliday({
      id: holiday.id,
      name: holidayName.trim(),
      date: holiday.date,
      is_optional: isOptional ? 1 : 0
    });

    if (result.success) {
      toast.success('Holiday updated successfully!');
      onUpdateSuccess();
      onClose();
    } else {
      toast.error(result.error || 'Failed to update holiday');
    }
    
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 xsm:p-2"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl xsm:rounded-2xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 xsm:p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl xsm:text-lg font-bold">Update Holiday</h3>
              <p className="text-white/80 text-xs xsm:text-[10px] mt-1 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3" />
                {holiday.date}
              </p>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }} 
              className="relative z-[70] p-2 xsm:p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <FaTimes className="w-4 h-4 xsm:w-3.5 xsm:h-3.5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 xsm:p-4 space-y-5 xsm:space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Holiday Name
            </label>
            <input
              type="text"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
              placeholder="e.g., Diwali, Republic Day"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <label className="flex items-center gap-3 cursor-pointer w-full">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">Optional Holiday</span>
                <span className="text-[10px] text-gray-500 italic">Allow employees to choose to observe this day</span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 xsm:py-2.5 text-sm rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="w-4 h-4 xsm:w-3.5 xsm:h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4 xsm:w-3.5 xsm:h-3.5" />
                  Update Holiday
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ==================== DELETE CONFIRMATION POPUP ====================
const DeleteConfirmationModal = ({ holiday, onClose, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await holidayService.deleteHoliday(holiday.id);
    if (result.success) {
      toast.success('Holiday deleted successfully!');
      onDeleteSuccess();
      onClose();
    } else {
      toast.error(result.error || 'Failed to delete holiday');
    }
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 xsm:p-2"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl xsm:rounded-2xl shadow-[0_20px_70px_-15px_rgba(239,68,68,0.3)] max-w-sm w-full p-8 xsm:p-4 text-center border border-red-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 xsm:w-16 xsm:h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-red-50/50">
          <FaTrash className="w-8 h-8 xsm:w-6 xsm:h-6" />
        </div>
        <h3 className="text-2xl xsm:text-xl font-black text-gray-900 mb-2 font-outfit uppercase tracking-tight">Wait!</h3>
        <p className="text-gray-500 text-sm xsm:text-xs mb-8 xsm:mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-gray-900 block mt-1 text-lg">"{holiday.name}"</span>?
          <span className="text-red-500 block mt-2 text-[10px] font-bold uppercase tracking-widest">This action is irreversible</span>
        </p>
        <div className="grid grid-cols-2 gap-4 xsm:gap-2">
          <button
            onClick={onClose}
            className="px-4 py-3 xsm:py-2.5 text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl transition-all active:scale-95 border border-gray-100"
          >
            Go Back
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-3 xsm:py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-lg shadow-red-200 active:scale-95 flex items-center justify-center gap-2"
          >
            {isDeleting ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Yes, Delete'}
          </button>
        </div>
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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [allHolidays, setAllHolidays] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Shared fetch lock to prevent double loading while ensuring UI updates
  const fetchLock = useRef(null); 

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = useMemo(() => toCalendarDate(new Date()) || new Date(), []);

  useEffect(() => {
    let isActive = true;
    const key = `${currentYear}-${currentMonth}`;

    const fetchHolidays = async () => {
      // 1. If we already have the data for this month/year in state, don't fetch
      if (allHolidays[key]) {
        setIsLoading(false);
        return;
      }

      // 2. If another instance (like from StrictMode) is already fetching this same month/year
      if (fetchLock.current?.key === key) {
        try {
          const data = await fetchLock.current.promise;
          if (isActive) {
            setAllHolidays(prev => ({ ...prev, [key]: data }));
          }
        } catch (err) {
          console.error("Lock sync failed:", err);
        } finally {
          if (isActive) setIsLoading(false);
        }
        return;
      }
      
      setIsLoading(true);
      
      // 3. Create a shared promise for this specific month/year
      const company = JSON.parse(localStorage.getItem('company'));
      const activePromise = (async () => {
        const [masterData, companyData] = await Promise.all([
          holidayService.getMasterHolidays(currentYear, currentMonth + 1),
          holidayService.getCompanyHolidays(company?.id)
        ]);

        const holidaysByDate = {};
        masterData.forEach(holiday => {
          holidaysByDate[holiday.date] = { ...holiday, source: 'master' };
        });
        companyData.forEach(holiday => {
          const hDate = new Date(holiday.date);
          if (hDate.getFullYear() === currentYear && hDate.getMonth() === currentMonth) {
            holidaysByDate[holiday.date] = { ...holiday, source: 'company' };
          }
        });
        return holidaysByDate;
      })();

      fetchLock.current = { key, promise: activePromise };

      try {
        const data = await activePromise;
        if (isActive) {
          setAllHolidays(prev => ({ ...prev, [key]: data }));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
        fetchLock.current = null; // Clear lock on error to allow retry
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchHolidays();

    return () => {
      isActive = false;
    };
  }, [currentYear, currentMonth]);

  const getHolidayForDate = (date) => {
    const key = `${currentYear}-${currentMonth}`;
    const holidaysMap = allHolidays[key] || {};
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
    }
  }, [isSelecting]);

  const handleActionClick = useCallback((date, holiday, action) => {
    switch (action) {
      case 'create':
        setSelectedDates([date]);
        setShowCreatePopup(true);
        break;
      case 'update':
        setSelectedHoliday(holiday);
        setShowUpdateModal(true);
        break;
      case 'delete':
        setSelectedHoliday(holiday);
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  }, []);

  const handlePressHold = useCallback((date) => {
    const normalized = toCalendarDate(date);
    if (!normalized) return;
    setIsSelecting(true);
    setSelectedDates([normalized]);
  }, []);

  const resetSelection = () => {
    setSelectedDates([]);
    setIsSelecting(false);
    setSelectedHoliday(null);
  };

  const handleRefresh = () => {
    resetSelection();
    // Force a re-fetch by clearing the ref cache
    lastFetched.current = { year: null, month: null };
    setCurrentDate(new Date(currentDate)); // Trigger effect
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
  const weekDaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 xsm:p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 xsm:mb-3 sm:mb-6 md:mb-8 flex flex-col gap-3 xsm:gap-2">
          <div>
            <h1 className="text-xl xsm:text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Holiday Management
            </h1>
            <p className="text-xs xsm:text-[10px] sm:text-sm text-gray-500 mt-1">Manage and track all system holidays</p>
          </div>
          
          {selectedDates.length > 0 && (
            <div className="flex items-center gap-2 xsm:gap-1.5">
              <button
                onClick={() => setShowCreatePopup(true)}
                className="flex items-center gap-1.5 xsm:gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 xsm:px-2 py-2 xsm:py-1.5 text-xs xsm:text-[10px] rounded-xl transition shadow-md hover:shadow-lg"
              >
                <FaPlus className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" />
                Create ({selectedDates.length})
              </button>
              <button
                onClick={resetSelection}
                className="p-2 xsm:p-1.5 hover:bg-gray-200 rounded-xl transition text-gray-600"
              >
                <FaTimes className="w-4 h-4 xsm:w-3.5 xsm:h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl xsm:rounded-xl shadow-sm border border-gray-200 p-3 xsm:p-2 mb-4 xsm:mb-3">
          <div className="flex flex-wrap items-center justify-between gap-3 xsm:gap-2">
            <div className="flex items-center gap-2 xsm:gap-1.5">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 xsm:p-1 hover:bg-gray-100 rounded-xl transition"
              >
                <FaChevronLeft className="w-4 h-4 xsm:w-3 xsm:h-3 text-gray-600" />
              </button>
              <div className="flex items-center gap-1.5 xsm:gap-1">
                <FaCalendarAlt className="w-4 h-4 xsm:w-3 xsm:h-3 text-indigo-500" />
                <h2 className="text-base xsm:text-sm sm:text-lg md:text-xl font-semibold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 xsm:p-1 hover:bg-gray-100 rounded-xl transition"
              >
                <FaChevronRight className="w-4 h-4 xsm:w-3 xsm:h-3 text-gray-600" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 xsm:px-2 py-1.5 xsm:py-1 text-xs xsm:text-[10px] bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
            >
              Today
            </button>
          </div>
          
          {isSelecting && (
            <div className="mt-3 xsm:mt-2 flex items-center gap-1.5 xsm:gap-1 text-xs xsm:text-[10px] text-indigo-600 bg-indigo-50 p-2 xsm:p-1.5 rounded-lg">
              <FaExclamationCircle className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" />
              Multi-select mode active. Tap dates to select/deselect.
              <button onClick={() => setIsSelecting(false)} className="ml-auto text-gray-500 hover:text-gray-700">
                <FaTimes className="w-3.5 h-3.5 xsm:w-3 xsm:h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl xsm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {weekDays.map((day, idx) => (
              <div key={day} className="p-2 xsm:p-1 text-center text-xs xsm:text-[10px] font-semibold text-gray-500">
                <span className="xsm:hidden">{day}</span>
                <span className="hidden xsm:inline">{weekDaysShort[idx]}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar cells */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64 xsm:h-48 text-indigo-500 font-bold uppercase tracking-widest gap-2">
              <FaSpinner className="animate-spin text-xl" />
              Syncing...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {generateCalendarGrid().map((cell, idx) => (
                <CalendarCell
                  key={idx}
                  {...cell}
                  onTap={handleDateTap}
                  onPressHold={handlePressHold}
                  isSelecting={isSelecting}
                  onAction={handleActionClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 xsm:mt-3 flex flex-wrap gap-4 xsm:gap-2 justify-center text-xs xsm:text-[10px]">
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded border border-red-200" style={{ backgroundColor: '#fee2e2' }}></div>
            <span className="text-gray-600 font-medium">Mandatory</span>
          </div>
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded border border-emerald-200" style={{ backgroundColor: '#d1fae5' }}></div>
            <span className="text-gray-600 font-medium">Optional</span>
          </div>
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded border border-amber-200" style={{ backgroundColor: '#fef3c7' }}></div>
            <span className="text-gray-600 font-medium">Observance</span>
          </div>
          <div className="flex items-center gap-1.5 xsm:gap-1">
            <div className="w-4 h-4 rounded border border-indigo-200" style={{ backgroundColor: '#e0e7ff' }}></div>
            <span className="text-gray-600 font-medium">Corporate</span>
          </div>
        </div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {showCreatePopup && selectedDates.length > 0 && (
          <CreateHolidayPopup
            selectedDates={selectedDates}
            onClose={() => {
              setShowCreatePopup(false);
              resetSelection();
            }}
            onCreateSuccess={handleRefresh}
          />
        )}

        {showUpdateModal && selectedHoliday && (
          <UpdateHolidayModal
            holiday={selectedHoliday}
            onClose={() => {
              setShowUpdateModal(false);
              resetSelection();
            }}
            onUpdateSuccess={handleRefresh}
          />
        )}

        {showDeleteModal && selectedHoliday && (
          <DeleteConfirmationModal
            holiday={selectedHoliday}
            onClose={() => {
              setShowDeleteModal(false);
              resetSelection();
            }}
            onDeleteSuccess={handleRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HolidayManagementCalendar;
