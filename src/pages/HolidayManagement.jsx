// ============================================
// Reusable Calendar Component
// ============================================
import React, { useState, useEffect, useMemo,useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaRegCalendarCheck,
  FaInfoCircle,
  FaBuilding,
  FaPlus,
  FaCheckCircle,
  FaTimes,
  FaSearch,
  FaCheckDouble,
  FaToggleOn,
  FaToggleOff,
  FaListUl,
  FaUserPlus,
  FaExclamationTriangle,
  
} from "react-icons/fa";

const CalendarHolidayComponent = ({ holidays = [], onAddHoliday, onDateClick, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [viewMode, setViewMode] = useState("month"); // month, week

  // Get current year and month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get holidays for a specific date
  const getHolidaysForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter(h => h.date === dateStr);
  };

  // Generate calendar days for month view
  useEffect(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    
    // Add previous month days
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        day,
        month: currentMonth - 1,
        year: currentYear,
        isCurrentMonth: false,
        isToday: false,
        holidays: getHolidaysForDate(currentYear, currentMonth - 1, day),
        date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      });
    }

    // Add current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && 
                     today.getMonth() === currentMonth && 
                     today.getFullYear() === currentYear;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday,
        holidays: getHolidaysForDate(currentYear, currentMonth, i),
        date: dateStr
      });
    }

    // Add next month days to complete 6 rows
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({
        day: i,
        month: currentMonth + 1,
        year: currentYear,
        isCurrentMonth: false,
        isToday: false,
        holidays: getHolidaysForDate(currentYear, currentMonth + 1, i),
        date: `${currentYear}-${String(currentMonth + 2).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      });
    }

    setCalendarDays(days);
  }, [currentYear, currentMonth, holidays]);

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FaRegCalendarCheck className="text-2xl" />
            <div>
              <h2 className="text-xl font-bold">{monthNames[currentMonth]} {currentYear}</h2>
              <p className="text-sm opacity-90">
                {holidays.length} Holiday{holidays.length !== 1 ? "s" : ""} this month
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => {
          const hasHoliday = day.holidays.length > 0;
          const isSelected = selectedDate === day.date;
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => onDateClick?.(day.date, day.holidays)}
              className={`
                min-h-[100px] p-2 border-b border-r cursor-pointer transition-all
                ${!day.isCurrentMonth ? "bg-gray-50/50" : "bg-white"}
                ${hasHoliday ? "hover:bg-emerald-50" : "hover:bg-gray-50"}
                ${isSelected ? "ring-2 ring-emerald-500 ring-inset" : ""}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${day.isToday ? "bg-emerald-600 text-white" : ""}
                  ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-700"}
                `}>
                  {day.day}
                </span>
                {hasHoliday && (
                  <div className="flex gap-0.5">
                    {day.holidays.slice(0, 2).map((h, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        title={h.name}
                      />
                    ))}
                    {day.holidays.length > 2 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Holiday Names */}
              {hasHoliday && (
                <div className="mt-1 space-y-0.5">
                  {day.holidays.slice(0, 2).map((holiday, idx) => (
                    <div
                      key={idx}
                      className="text-xs truncate text-emerald-700 font-medium"
                      title={holiday.name}
                    >
                      {holiday.name.length > 15 ? holiday.name.slice(0, 12) + "..." : holiday.name}
                    </div>
                  ))}
                  {day.holidays.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{day.holidays.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-gray-600">Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
          <span className="text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 ring-2 ring-emerald-500 ring-inset"></div>
          <span className="text-gray-600">Selected Date</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Enhanced Create Holiday Modal with Tabs
// ============================================
const CreateHolidayModal = ({ isOpen, onClose, onSuccess, companyId, currentYear, currentMonth }) => {
  const [activeTab, setActiveTab] = useState("mandatory");
  const [mandatoryHolidays, setMandatoryHolidays] = useState([]);
  const [selectedMandatoryIds, setSelectedMandatoryIds] = useState(new Set());
  const [customHolidays, setCustomHolidays] = useState([
    { id: Date.now(), name: "", start_date: "", end_date: "", is_optional: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [fetchingMandatory, setFetchingMandatory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch mandatory holidays
  const fetchMandatoryHolidays = useCallback(async () => {
    if (!companyId) return;
    
    setFetchingMandatory(true);
    try {
      // Mock API call - replace with actual
      const mockResponse = {
        success: true,
        count: 5,
        data: [
          { id: 1, name: "Guru Ravidas Jayanti", date: "2026-02-01", day: "Sunday", type: "Observance" },
          { id: 2, name: "Maharishi Dayanand Saraswati Jayanti", date: "2026-02-12", day: "Thursday", type: "Observance" },
          { id: 3, name: "Maha Shivaratri", date: "2026-02-15", day: "Sunday", type: "Observance" },
          { id: 4, name: "Shivaji Jayanti", date: "2026-02-19", day: "Thursday", type: "Observance" },
          { id: 5, name: "Ramadan Start", date: "2026-02-19", day: "Thursday", type: "Observance" }
        ]
      };
      
      setMandatoryHolidays(mockResponse.data);
    } catch (error) {
      console.error("Error fetching mandatory holidays:", error);
      toast.error("Failed to load mandatory holidays");
    } finally {
      setFetchingMandatory(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("mandatory");
      setSelectedMandatoryIds(new Set());
      setCustomHolidays([{ id: Date.now(), name: "", start_date: "", end_date: "", is_optional: false }]);
      setSearchTerm("");
      fetchMandatoryHolidays();
    }
  }, [isOpen, fetchMandatoryHolidays]);

  const toggleMandatoryHoliday = (holidayId) => {
    const newSelected = new Set(selectedMandatoryIds);
    if (newSelected.has(holidayId)) {
      newSelected.delete(holidayId);
    } else {
      newSelected.add(holidayId);
    }
    setSelectedMandatoryIds(newSelected);
  };

  const toggleSelectAllMandatory = () => {
    if (selectedMandatoryIds.size === filteredMandatoryHolidays.length) {
      setSelectedMandatoryIds(new Set());
    } else {
      const newSelected = new Set();
      filteredMandatoryHolidays.forEach(holiday => {
        newSelected.add(holiday.id);
      });
      setSelectedMandatoryIds(newSelected);
    }
  };

  const addCustomHoliday = () => {
    setCustomHolidays([...customHolidays, { id: Date.now(), name: "", start_date: "", end_date: "", is_optional: false }]);
  };

  const removeCustomHoliday = (id) => {
    if (customHolidays.length === 1) {
      toast.warning("At least one custom holiday field is required");
      return;
    }
    setCustomHolidays(customHolidays.filter(h => h.id !== id));
  };

  const updateCustomHoliday = (id, field, value) => {
    setCustomHolidays(customHolidays.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const validateCustomHolidays = () => {
    const invalidHolidays = customHolidays.filter(
      h => !h.name.trim() || !h.start_date
    );
    if (invalidHolidays.length > 0) {
      toast.error("Please fill in all custom holiday names and start dates");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (selectedMandatoryIds.size === 0 && customHolidays.filter(h => h.name.trim()).length === 0) {
      toast.warning("Please select at least one holiday to add");
      return;
    }

    if (activeTab === "custom" && !validateCustomHolidays()) {
      return;
    }

    setLoading(true);
    
    const holidaysToAdd = [];
    
    // Add selected mandatory holidays
    mandatoryHolidays.forEach(holiday => {
      if (selectedMandatoryIds.has(holiday.id)) {
        holidaysToAdd.push({
          name: holiday.name,
          date: holiday.date,
          is_optional: holiday.type === "optional" ? 1 : 0
        });
      }
    });
    
    // Add custom holidays
    customHolidays.forEach(holiday => {
      if (holiday.name.trim() && holiday.start_date) {
        holidaysToAdd.push({
          name: holiday.name.trim(),
          start_date: holiday.start_date,
          end_date: holiday.end_date || holiday.start_date,
          is_optional: holiday.is_optional ? 1 : 0
        });
      }
    });

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success(`Successfully added ${holidaysToAdd.length} holiday${holidaysToAdd.length !== 1 ? "s" : ""}!`);
      onSuccess();
      onClose();
    }, 1000);
  };

  const filteredMandatoryHolidays = mandatoryHolidays.filter(holiday =>
    holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holiday.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <FaPlus className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Add Company Holidays</h2>
                  <p className="text-sm text-white/80">Select from mandatory holidays or create custom ones</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-gray-50 px-5">
              <button
                onClick={() => setActiveTab("mandatory")}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all relative ${
                  activeTab === "mandatory" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaListUl size={16} />
                <span>Mandatory Holidays</span>
                {activeTab === "mandatory" && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-2 px-5 py-3 font-medium transition-all relative ${
                  activeTab === "custom" ? "text-emerald-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaUserPlus size={16} />
                <span>Custom Holidays</span>
                {activeTab === "custom" && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "mandatory" && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                    {filteredMandatoryHolidays.length > 0 && (
                      <button
                        onClick={toggleSelectAllMandatory}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                      >
                        <FaCheckDouble size={14} />
                        {selectedMandatoryIds.size === filteredMandatoryHolidays.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  {fetchingMandatory && (
                    <div className="flex justify-center items-center py-12">
                      <FaSpinner className="animate-spin text-emerald-500 text-3xl" />
                    </div>
                  )}

                  {!fetchingMandatory && filteredMandatoryHolidays.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <FaExclamationTriangle className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No mandatory holidays found for this month</p>
                    </div>
                  )}

                  {!fetchingMandatory && filteredMandatoryHolidays.length > 0 && (
                    <div className="space-y-2">
                      {filteredMandatoryHolidays.map((holiday, idx) => {
                        const isSelected = selectedMandatoryIds.has(holiday.id);
                        return (
                          <motion.div
                            key={holiday.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => toggleMandatoryHoliday(holiday.id)}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                              isSelected ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-gray-200 hover:border-emerald-300"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-800">{holiday.name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getHolidayTypeColor(holiday.type)}`}>
                                  {holiday.type || "Observance"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <FaCalendarAlt size={12} />
                                  {formatDate(holiday.date)}
                                </span>
                                <span>{getDayName(holiday.date)}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {isSelected ? (
                                <FaToggleOn className="text-emerald-500 text-2xl" />
                              ) : (
                                <FaToggleOff className="text-gray-300 text-2xl" />
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {selectedMandatoryIds.size > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm text-emerald-700">
                        <strong>{selectedMandatoryIds.size}</strong> holiday{selectedMandatoryIds.size !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "custom" && (
                <div>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <FaInfoCircle />
                    Create custom holidays with date ranges
                  </p>

                  <div className="space-y-3">
                    {customHolidays.map((holiday) => (
                      <motion.div
                        key={holiday.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Holiday Name *</label>
                            <input
                              type="text"
                              value={holiday.name}
                              onChange={(e) => updateCustomHoliday(holiday.id, "name", e.target.value)}
                              placeholder="e.g., Company Foundation Day"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date *</label>
                            <input
                              type="date"
                              value={holiday.start_date}
                              onChange={(e) => updateCustomHoliday(holiday.id, "start_date", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                            <input
                              type="date"
                              value={holiday.end_date}
                              onChange={(e) => updateCustomHoliday(holiday.id, "end_date", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Optional"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="flex items-center gap-2 cursor-pointer mt-6">
                              <input
                                type="checkbox"
                                checked={holiday.is_optional}
                                onChange={(e) => updateCustomHoliday(holiday.id, "is_optional", e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Optional</span>
                            </label>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeCustomHoliday(holiday.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all mt-6"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addCustomHoliday}
                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FaPlus size={14} />
                    Add Another Custom Holiday
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? "Adding..." : "Add Selected Holidays"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// Main Company Holidays Page
// ============================================
export default function CompanyHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  const companyId = JSON.parse(localStorage.getItem("company"))?.id;

  // Fetch company holidays
  const fetchCompanyHolidays = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual
      const mockHolidays = [
        { id: 1, name: "Republic Day", date: "2026-01-26", type: "Public", is_optional: 0 },
        { id: 2, name: "Maha Shivaratri", date: "2026-02-15", type: "Observance", is_optional: 0 },
        { id: 3, name: "Holi", date: "2026-03-06", type: "Public", is_optional: 0 },
        { id: 4, name: "Good Friday", date: "2026-04-03", type: "Observance", is_optional: 0 },
        { id: 5, name: "Company Foundation Day", date: "2026-05-15", type: "Custom", is_optional: 1 }
      ];
      
      setTimeout(() => {
        setHolidays(mockHolidays);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays");
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyHolidays();
  }, [fetchCompanyHolidays]);

  const handleDateClick = (date, holidaysOnDate) => {
    setSelectedDate(date);
    setSelectedHolidays(holidaysOnDate);
    setShowDetailsPanel(true);
  };

  const handleAddHolidaySuccess = () => {
    fetchCompanyHolidays();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-xl h-[600px]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg">
              <FaRegCalendarCheck className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Company Holidays</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage all company holidays</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <FaPlus size={14} />
            Add Holidays
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Holidays</p>
                <p className="text-2xl font-bold text-gray-800">{holidays.length}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-xl">
                <FaCalendarAlt className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Public Holidays</p>
                <p className="text-2xl font-bold text-gray-800">
                  {holidays.filter(h => h.type === "Public").length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <FaBuilding className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Observance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {holidays.filter(h => h.type === "Observance").length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FaInfoCircle className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Optional Holidays</p>
                <p className="text-2xl font-bold text-gray-800">
                  {holidays.filter(h => h.is_optional === 1).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FaCheckCircle className="text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar and Details Panel */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarHolidayComponent
              holidays={holidays}
              onAddHoliday={() => setIsModalOpen(true)}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </div>
          
          {/* Details Panel */}
          <AnimatePresence>
            {showDetailsPanel && selectedDate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-xl p-5 h-fit"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FaCalendarAlt className="text-emerald-500" />
                    {formatDate(selectedDate)}
                  </h3>
                  <button
                    onClick={() => setShowDetailsPanel(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
                
                {selectedHolidays.length === 0 ? (
                  <div className="text-center py-8">
                    <FaInfoCircle className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No holidays on this date</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    >
                      Add Holiday
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 mb-2">
                      {selectedHolidays.length} Holiday{selectedHolidays.length !== 1 ? "s" : ""} on this day
                    </p>
                    {selectedHolidays.map((holiday, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-800">{holiday.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getHolidayTypeColor(holiday.type)}`}>
                            {holiday.type || (holiday.is_optional ? "Optional" : "Public")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {getDayName(holiday.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Empty State for No Holidays */}
        {holidays.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 text-center py-16 bg-white rounded-2xl shadow-lg"
          >
            <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No holidays added yet</p>
            <p className="text-gray-400 mt-2">Start by adding holidays for your company</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all inline-flex items-center gap-2"
            >
              <FaPlus size={14} />
              Add Your First Holiday
            </button>
          </motion.div>
        )}

        {/* Create Holiday Modal */}
        <CreateHolidayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddHolidaySuccess}
          companyId={companyId}
        />
      </div>
    </div>
  );
}

// Helper functions (same as before)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const getDayName = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const getHolidayTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case "public":
      return "bg-red-100 text-red-700 border-red-200";
    case "observance":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "optional":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};