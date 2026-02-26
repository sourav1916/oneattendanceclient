import React, { useState, useEffect } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';

const History = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    averageHours: 0
  });

  // Generate dummy attendance data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate last 90 days of attendance data
      const data = [];
      const today = new Date();
      
      for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends (Saturday and Sunday)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Random status with realistic distribution
        const rand = Math.random();
        let status, checkIn, checkOut, workingHours;
        
        if (rand < 0.7) { // 70% present
          status = 'present';
          checkIn = '09:00 AM';
          checkOut = '06:00 PM';
          workingHours = '9h 0m';
        } else if (rand < 0.85) { // 15% late
          status = 'late';
          checkIn = '09:30 AM';
          checkOut = '06:30 PM';
          workingHours = '9h 0m';
        } else { // 15% absent
          status = 'absent';
          checkIn = '--';
          checkOut = '--';
          workingHours = '0h 0m';
        }

        // Add some variety
        if (status !== 'absent') {
          const hourVariation = Math.floor(Math.random() * 60);
          const minuteVariation = Math.floor(Math.random() * 60);
          
          if (status === 'present') {
            checkIn = `${String(8 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`;
          } else {
            checkIn = `${String(9 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`;
          }
          
          checkOut = `${String(5 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} PM`;
          
          // Calculate working hours (simplified)
          workingHours = `${8 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`;
        }

        data.push({
          id: i,
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          checkIn,
          checkOut,
          workingHours,
          status,
          location: status !== 'absent' ? 'Office - Main Branch' : '-'
        });
      }

      setAttendanceData(data);
      setFilteredData(data);
      
      // Calculate summary
      calculateSummary(data);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate summary statistics
  const calculateSummary = (data) => {
    const present = data.filter(item => item.status === 'present').length;
    const late = data.filter(item => item.status === 'late').length;
    const absent = data.filter(item => item.status === 'absent').length;
    
    // Calculate total working hours
    const totalHours = data.reduce((acc, item) => {
      if (item.workingHours !== '0h 0m') {
        const [hours] = item.workingHours.split('h');
        return acc + parseInt(hours);
      }
      return acc;
    }, 0);

    setSummary({
      totalDays: data.length,
      presentDays: present,
      lateDays: late,
      absentDays: absent,
      totalHours: totalHours,
      averageHours: (totalHours / (present + late)).toFixed(1) || 0
    });
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...attendanceData];

    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === parseInt(year) && 
               itemDate.getMonth() === parseInt(month) - 1;
      });
    }

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by search (date)
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.date.includes(searchTerm) || 
        item.day.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
    calculateSummary(filtered);
  }, [selectedMonth, startDate, endDate, statusFilter, searchTerm, attendanceData]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Get unique months for filter
  const getUniqueMonths = () => {
    const months = new Set();
    attendanceData.forEach(item => {
      const [year, month] = item.date.split('-');
      months.add(`${year}-${month}`);
    });
    return Array.from(months).sort().reverse();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'present':
        return {
          icon: HiOutlineCheckCircle,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: 'Present'
        };
      case 'late':
        return {
          icon: HiOutlineExclamationCircle,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          label: 'Late'
        };
      default:
        return {
          icon: HiOutlineXCircle,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: 'Absent'
        };
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Day', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Location'];
    const csvData = filteredData.map(item => [
      item.date,
      item.day,
      item.checkIn,
      item.checkOut,
      item.workingHours,
      item.status,
      item.location
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-12 w-64 bg-slate-200 rounded-lg mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl"></div>
            ))}
          </div>
          
          <div className="h-16 bg-white rounded-2xl mb-6"></div>
          <div className="h-96 bg-white rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Attendance History
            </span>
          </h1>
          <p className="text-lg text-slate-600">View and filter your complete attendance records</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Total Days</p>
            <p className="text-2xl font-bold text-slate-800">{summary.totalDays}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Present</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.presentDays}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Late</p>
            <p className="text-2xl font-bold text-amber-600">{summary.lateDays}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Absent</p>
            <p className="text-2xl font-bold text-rose-600">{summary.absentDays}</p>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HiOutlineFilter className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-700">Filters</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Month filter */}
            <div>
              <label className="block text-sm text-slate-500 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Months</option>
                {getUniqueMonths().map(month => {
                  const [year, m] = month.split('-');
                  const date = new Date(year, m - 1);
                  return (
                    <option key={month} value={month}>
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm text-slate-500 mb-1">Search</label>
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Export button */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
              >
                <HiOutlineDownload className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Advanced filters - Date range */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate ? startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate ? endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
          </p>
          <p className="text-sm text-slate-500">
            Total Hours: <span className="font-semibold text-indigo-600">{summary.totalHours}h</span> | 
            Avg: <span className="font-semibold text-indigo-600">{summary.averageHours}h</span>
          </p>
        </div>

        {/* Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Day</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Check In</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Check Out</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Working Hours</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Location</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => {
                  const status = getStatusBadge(item.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-700">{item.date}</td>
                      <td className="px-6 py-4 text-slate-600">{item.day}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{item.checkIn}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{item.checkOut}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{item.workingHours}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${status.bg} rounded-full text-xs font-medium ${status.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.location}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <HiOutlineCalendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No attendance records found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Next
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Summary footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-end gap-4 text-sm text-slate-500"
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            <span>Present: {summary.presentDays}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            <span>Late: {summary.lateDays}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
            <span>Absent: {summary.absentDays}</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default History;