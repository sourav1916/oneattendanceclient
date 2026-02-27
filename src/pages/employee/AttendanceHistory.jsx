import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaCoffee,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUmbrellaBeach,
  FaSearch,
  FaFilter,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaRedoAlt
} from 'react-icons/fa';

const AttendanceHistory = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('monthly'); // 'daily', 'monthly', 'weekly'
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    totalWorkingHours: 0,
    totalBreakHours: 0
  });

  // Mock data generation
  useEffect(() => {
    generateMockData();
  }, [currentMonth]);

  useEffect(() => {
    applyFilters();
    calculateSummary();
  }, [attendanceData, searchTerm, statusFilter]);

  const generateMockData = () => {
    setLoading(true);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const mockData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const randomStatus = getRandomStatus(isWeekend);
      
      const record = generateAttendanceRecord(date, randomStatus);
      mockData.push(record);
    }
    
    setAttendanceData(mockData);
    setFilteredData(mockData);
    setLoading(false);
  };

  const getRandomStatus = (isWeekend) => {
    if (isWeekend) return 'absent';
    
    const rand = Math.random();
    if (rand < 0.7) return 'present';
    if (rand < 0.85) return 'late';
    if (rand < 0.95) return 'leave';
    return 'absent';
  };

  const generateAttendanceRecord = (date, status) => {
    const baseTime = new Date(date);
    baseTime.setHours(9, 0, 0);
    
    let inTime, outTime, breakStart, breakEnd, workingHours, breakHours;
    
    switch(status) {
      case 'present':
        inTime = new Date(baseTime);
        outTime = new Date(baseTime);
        outTime.setHours(18, 0, 0);
        breakStart = new Date(baseTime);
        breakStart.setHours(13, 0, 0);
        breakEnd = new Date(baseTime);
        breakEnd.setHours(14, 0, 0);
        workingHours = 8;
        breakHours = 1;
        break;
      
      case 'late':
        inTime = new Date(baseTime);
        inTime.setHours(9, 30 + Math.floor(Math.random() * 60), 0);
        outTime = new Date(baseTime);
        outTime.setHours(18, 30, 0);
        breakStart = new Date(baseTime);
        breakStart.setHours(13, 30, 0);
        breakEnd = new Date(baseTime);
        breakEnd.setHours(14, 30, 0);
        workingHours = 7.5;
        breakHours = 1;
        break;
      
      case 'leave':
        inTime = null;
        outTime = null;
        breakStart = null;
        breakEnd = null;
        workingHours = 0;
        breakHours = 0;
        break;
      
      case 'absent':
        inTime = null;
        outTime = null;
        breakStart = null;
        breakEnd = null;
        workingHours = 0;
        breakHours = 0;
        break;
      
      default:
        break;
    }
    
    return {
      id: date.toISOString(),
      date: date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      status: status,
      inTime: inTime,
      outTime: outTime,
      breakStart: breakStart,
      breakEnd: breakEnd,
      workingHours: workingHours,
      breakHours: breakHours,
      overtime: status === 'present' ? Math.random() > 0.8 ? 1.5 : 0 : 0,
      location: status !== 'absent' && status !== 'leave' ? 'Main Office' : '-',
      device: status !== 'absent' && status !== 'leave' ? 'Biometric' : '-'
    };
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.date.toLocaleDateString().includes(searchTerm) ||
        record.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    setFilteredData(filtered);
  };

  const calculateSummary = () => {
    const summary = {
      totalDays: attendanceData.length,
      presentDays: attendanceData.filter(d => d.status === 'present').length,
      absentDays: attendanceData.filter(d => d.status === 'absent').length,
      lateDays: attendanceData.filter(d => d.status === 'late').length,
      leaveDays: attendanceData.filter(d => d.status === 'leave').length,
      totalWorkingHours: attendanceData.reduce((acc, curr) => acc + curr.workingHours, 0),
      totalBreakHours: attendanceData.reduce((acc, curr) => acc + curr.breakHours, 0)
    };
    
    setSummary(summary);
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present':
        return <FaCheckCircle className="text-green-500" />;
      case 'late':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'absent':
        return <FaTimesCircle className="text-red-500" />;
      case 'leave':
        return <FaUmbrellaBeach className="text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800',
      leave: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + increment)));
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Day', 'Status', 'In Time', 'Out Time', 'Break Start', 'Break End', 'Working Hours', 'Break Hours', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        formatDate(record.date),
        record.dayName,
        record.status,
        formatTime(record.inTime),
        formatTime(record.outTime),
        formatTime(record.breakStart),
        formatTime(record.breakEnd),
        record.workingHours,
        record.breakHours,
        record.location
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${currentMonth.toLocaleDateString().replace(/\//g, '-')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaCalendarAlt className="mr-3 text-blue-600" />
            Attendance History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your attendance records
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Days</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.presentDays}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {((summary.presentDays / summary.totalDays) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late Days</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.lateDays}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {((summary.lateDays / summary.totalDays) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Working Hours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.totalWorkingHours.toFixed(1)}h
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaHourglassHalf className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Avg: {(summary.totalWorkingHours / (summary.presentDays + summary.lateDays) || 0).toFixed(1)}h/day
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Break Hours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.totalBreakHours.toFixed(1)}h
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FaCoffee className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Avg: {(summary.totalBreakHours / (summary.presentDays + summary.lateDays) || 0).toFixed(1)}h/day
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Today
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'weekly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by date or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={generateMockData}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <FaRedoAlt className="mr-2" />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaDownload className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Out Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Break
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Hrs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.dayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className="ml-2">{getStatusBadge(record.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaSignInAlt className="mr-1 text-green-500" />
                          {formatTime(record.inTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaSignOutAlt className="mr-1 text-red-500" />
                          {formatTime(record.outTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaCoffee className="mr-1 text-yellow-500" />
                          {record.breakHours > 0 ? (
                            <>
                              {formatTime(record.breakStart)} - {formatTime(record.breakEnd)}
                            </>
                          ) : (
                            '--:--'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaHourglassHalf className="mr-1 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {record.workingHours.toFixed(1)}h
                          </span>
                          {record.overtime > 0 && (
                            <span className="ml-1 text-xs text-green-600">
                              (+{record.overtime}h)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {filteredData.length} of {attendanceData.length} records
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Status Legend:</span>
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-1" />
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-1" />
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-1" />
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center">
              <FaUmbrellaBeach className="text-blue-500 mr-1" />
              <span className="text-sm text-gray-600">Leave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;