import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaUmbrellaBeach,
  FaGlassCheers,
  FaBriefcaseMedical,
  FaPlane,
  FaMoon,
  FaSun,
  FaInfoCircle,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaCoffee,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaLaptop,
  FaUserTie,
  FaChartBar
} from 'react-icons/fa';

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    holiday: 0,
    workingDays: 0
  });
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Mock holidays data
  const mockHolidays = [
    { date: '2024-01-26', name: 'Republic Day', type: 'national' },
    { date: '2024-03-08', name: 'Holi', type: 'festival' },
    { date: '2024-08-15', name: 'Independence Day', type: 'national' },
    { date: '2024-10-02', name: 'Gandhi Jayanti', type: 'national' },
    { date: '2024-10-12', name: 'Dussehra', type: 'festival' },
    { date: '2024-11-01', name: 'Diwali', type: 'festival' },
    { date: '2024-12-25', name: 'Christmas', type: 'festival' }
  ];

  // Generate mock attendance data
  useEffect(() => {
    generateAttendanceData();
    generateCalendarDays();
  }, [currentDate]);

  const generateAttendanceData = () => {
    const data = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Set holidays for the month
    const monthHolidays = mockHolidays.filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate.getMonth() === month && holidayDate.getFullYear() === year;
    });
    setHolidays(monthHolidays);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isHoliday = monthHolidays.some(h => h.date === dateStr);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let status;
      if (isHoliday) {
        status = 'holiday';
      } else if (isWeekend) {
        status = 'weekend';
      } else {
        // Random attendance for demonstration
        const rand = Math.random();
        if (rand < 0.7) status = 'present';
        else if (rand < 0.85) status = 'absent';
        else status = 'leave';
      }

      data[dateStr] = {
        status,
        holidayName: isHoliday ? monthHolidays.find(h => h.date === dateStr)?.name : null,
        checkIn: status === 'present' ? '09:00 AM' : null,
        checkOut: status === 'present' ? '06:00 PM' : null,
        breakStart: status === 'present' ? '01:00 PM' : null,
        breakEnd: status === 'present' ? '02:00 PM' : null,
        workingHours: status === 'present' ? 8 : 0,
        overtime: status === 'present' && Math.random() > 0.8 ? 1.5 : 0,
        location: status === 'present' ? 'Main Office' : null,
        device: status === 'present' ? 'Biometric' : null,
        notes: status === 'absent' ? 'Sick leave' : status === 'leave' ? 'Planned leave' : null
      };
    }

    setAttendanceData(data);
    calculateSummary(data, daysInMonth, monthHolidays);
  };

  const calculateSummary = (data, daysInMonth, monthHolidays) => {
    let present = 0, absent = 0, leave = 0, holiday = 0, weekend = 0;
    
    Object.values(data).forEach(record => {
      switch(record.status) {
        case 'present': present++; break;
        case 'absent': absent++; break;
        case 'leave': leave++; break;
        case 'holiday': holiday++; break;
        case 'weekend': weekend++; break;
      }
    });

    setSummary({
      present,
      absent,
      leave,
      holiday,
      weekend,
      total: daysInMonth,
      workingDays: daysInMonth - holiday - weekend
    });
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push({
        day,
        date: dateStr,
        isCurrentMonth: true,
        isToday,
        ...attendanceData[dateStr]
      });
    }

    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day) => {
    if (day && day.date) {
      setSelectedDate(day);
      setShowDetails(true);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'leave': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'holiday': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'weekend': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-200';
    }
  };

  const getStatusIcon = (status, size = 'text-sm') => {
    switch(status) {
      case 'present': return <FaCheckCircle className={`${size} text-green-500`} />;
      case 'absent': return <FaTimesCircle className={`${size} text-red-500`} />;
      case 'leave': return <FaUmbrellaBeach className={`${size} text-yellow-500`} />;
      case 'holiday': return <FaGlassCheers className={`${size} text-purple-500`} />;
      case 'weekend': return <FaMoon className={`${size} text-gray-500`} />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      present: 'Present',
      absent: 'Absent',
      leave: 'Leave',
      holiday: 'Holiday',
      weekend: 'Weekend'
    };
    return labels[status] || status;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaCalendarAlt className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Calendar</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View attendance status by day, week, or month
                </p>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{summary.present}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <FaCheckCircle className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <FaTimesCircle className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.leave}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <FaUmbrellaBeach className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Holidays</p>
                <p className="text-2xl font-bold text-purple-600">{summary.holiday}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <FaGlassCheers className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Working Days</p>
                <p className="text-2xl font-bold text-blue-600">{summary.workingDays}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FaBriefcaseMedical className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Status:</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-1 text-xs" />
                  <span className="text-xs text-gray-600">Present</span>
                </div>
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-500 mr-1 text-xs" />
                  <span className="text-xs text-gray-600">Absent</span>
                </div>
                <div className="flex items-center">
                  <FaUmbrellaBeach className="text-yellow-500 mr-1 text-xs" />
                  <span className="text-xs text-gray-600">Leave</span>
                </div>
                <div className="flex items-center">
                  <FaGlassCheers className="text-purple-500 mr-1 text-xs" />
                  <span className="text-xs text-gray-600">Holiday</span>
                </div>
                <div className="flex items-center">
                  <FaMoon className="text-gray-500 mr-1 text-xs" />
                  <span className="text-xs text-gray-600">Weekend</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                    ${day.status ? getStatusColor(day.status) : 'hover:border-gray-300'}
                    hover:shadow-md
                  `}
                >
                  {day.day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${!day.isCurrentMonth && 'text-gray-400'}`}>
                          {day.day}
                        </span>
                        {day.status && (
                          <span className="text-xs">
                            {getStatusIcon(day.status)}
                          </span>
                        )}
                      </div>
                      
                      {day.status === 'present' && (
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-green-600">
                            <FaClock className="mr-1" /> 9:00 - 18:00
                          </div>
                          {day.overtime > 0 && (
                            <div className="text-xs text-blue-600">
                              +{day.overtime}h OT
                            </div>
                          )}
                        </div>
                      )}
                      
                      {day.holidayName && (
                        <div className="text-xs text-purple-600 font-medium mt-1">
                          {day.holidayName}
                        </div>
                      )}
                      
                      {day.status === 'leave' && day.notes && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {day.notes}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Holidays List */}
        {holidays.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Holidays</h3>
            <div className="flex flex-wrap gap-2">
              {holidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full"
                >
                  <FaGlassCheers className="mr-1 text-xs" />
                  <span className="text-sm">{holiday.name}</span>
                  <span className="mx-1 text-purple-300">•</span>
                  <span className="text-xs">
                    {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Attendance Rate</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {((summary.present / summary.workingDays) * 100 || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${(summary.present / summary.workingDays) * 100 || 0}, 100`}
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Leave Balance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500 mt-1">Remaining days</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaUmbrellaBeach className="text-yellow-600 text-xl" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Overtime</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">8.5</p>
                <p className="text-xs text-gray-500 mt-1">Hours this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaClock className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {showDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getStatusIcon(selectedDate.status, 'text-2xl')}
                  <h3 className="text-xl font-bold text-gray-900 ml-2">
                    {new Date(selectedDate.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${getStatusColor(selectedDate.status)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="font-semibold">{getStatusLabel(selectedDate.status)}</span>
                </div>
                {selectedDate.holidayName && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-medium">Holiday:</span>
                    <span>{selectedDate.holidayName}</span>
                  </div>
                )}
              </div>

              {selectedDate.status === 'present' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Attendance Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-green-600 mb-1">
                        <FaSignInAlt className="mr-1" />
                        <span className="text-xs text-gray-500">Check In</span>
                      </div>
                      <p className="font-medium">{selectedDate.checkIn}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-red-600 mb-1">
                        <FaSignOutAlt className="mr-1" />
                        <span className="text-xs text-gray-500">Check Out</span>
                      </div>
                      <p className="font-medium">{selectedDate.checkOut}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-yellow-600 mb-1">
                        <FaCoffee className="mr-1" />
                        <span className="text-xs text-gray-500">Break</span>
                      </div>
                      <p className="font-medium">
                        {selectedDate.breakStart} - {selectedDate.breakEnd}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center text-blue-600 mb-1">
                        <FaHourglassHalf className="mr-1" />
                        <span className="text-xs text-gray-500">Working Hours</span>
                      </div>
                      <p className="font-medium">
                        {selectedDate.workingHours}h
                        {selectedDate.overtime > 0 && (
                          <span className="text-xs text-green-600 ml-1">
                            (+{selectedDate.overtime}h OT)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaMapMarkerAlt className="text-gray-500 mr-1" />
                      <span className="text-xs text-gray-500">Location</span>
                    </div>
                    <p className="text-sm">{selectedDate.location}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FaLaptop className="text-gray-500 mr-1" />
                      <span className="text-xs text-gray-500">Device</span>
                    </div>
                    <p className="text-sm">{selectedDate.device}</p>
                  </div>
                </div>
              )}

              {selectedDate.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">{selectedDate.notes}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaChartBar className="mr-2" />
                  View Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;