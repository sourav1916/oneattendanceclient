import React, { useState, useEffect } from 'react';
import {
  FaHistory,
  FaMoneyBillWave,
  FaDownload,
  FaEye,
  FaChartLine,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFileInvoice,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPercent,
  FaPlusCircle,
  FaMinusCircle,
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaEnvelope,
  FaChartBar
} from 'react-icons/fa';

const SalaryHistory = () => {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'month',
    direction: 'desc'
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list, grid, chart
  const [expandedRows, setExpandedRows] = useState([]);

  // Generate mock salary history data
  useEffect(() => {
    generateSalaryHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [salaryHistory, selectedYear, selectedMonth, searchTerm, sortConfig]);

  const generateSalaryHistory = () => {
    setLoading(true);
    
    const history = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Generate last 12 months of data
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Skip future months
      if (date > currentDate) continue;

      const baseSalary = 75000 + (Math.random() * 5000 - 2500);
      const overtimeHours = Math.floor(Math.random() * 25);
      const overtimeRate = 500;
      const overtimeAmount = overtimeHours * overtimeRate;
      
      const bonus = Math.random() > 0.6 ? 5000 + Math.random() * 3000 : 0;
      const incentives = Math.random() * 4000;
      
      const pfDeduction = baseSalary * 0.12;
      const taxDeduction = baseSalary * 0.1;
      const insuranceDeduction = 1500;
      const advanceDeduction = Math.random() > 0.7 ? 2000 : 0;
      
      const totalEarnings = baseSalary + overtimeAmount + bonus + incentives;
      const totalDeductions = pfDeduction + taxDeduction + insuranceDeduction + advanceDeduction;
      const netSalary = totalEarnings - totalDeductions;

      // Determine status based on date
      let status;
      if (date > currentDate) {
        status = 'upcoming';
      } else if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        status = 'processing';
      } else if (Math.random() > 0.1) {
        status = 'paid';
      } else {
        status = 'pending';
      }

      history.push({
        id: i + 1,
        year,
        month: month,
        monthName: date.toLocaleDateString('en-US', { month: 'long' }),
        shortMonth: date.toLocaleDateString('en-US', { month: 'short' }),
        date: date.toISOString(),
        status,
        
        // Earnings
        earnings: {
          basic: baseSalary,
          hra: baseSalary * 0.4,
          conveyance: 1600,
          medical: 1250,
          special: 5000,
          overtime: {
            hours: overtimeHours,
            rate: overtimeRate,
            amount: overtimeAmount
          },
          bonus: bonus,
          incentives: incentives,
          total: totalEarnings
        },

        // Deductions
        deductions: {
          pf: pfDeduction,
          professionalTax: 200,
          incomeTax: taxDeduction,
          insurance: insuranceDeduction,
          advance: advanceDeduction,
          loan: advanceDeduction > 0 ? 3000 : 0,
          total: totalDeductions
        },

        // Summary
        summary: {
          grossEarnings: totalEarnings,
          grossDeductions: totalDeductions,
          netSalary: netSalary
        },

        // Payment details
        paymentDate: status === 'paid' ? new Date(year, month, 28).toISOString() : null,
        paymentMode: status === 'paid' ? (Math.random() > 0.5 ? 'Bank Transfer' : 'Cheque') : null,
        transactionId: status === 'paid' ? `TXN${Math.floor(Math.random() * 1000000)}` : null,

        // Additional
        payslipUrl: status === 'paid' ? `/payslips/${year}_${month}.pdf` : null,
        remarks: status === 'pending' ? 'Awaiting approval' : 
                status === 'processing' ? 'Salary processing' : null
      });
    }

    setSalaryHistory(history);
    setFilteredHistory(history);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...salaryHistory];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(record => record.year === parseInt(selectedYear));
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(record => record.month === parseInt(selectedMonth));
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.monthName.toLowerCase().includes(term) ||
        record.status.toLowerCase().includes(term) ||
        record.year.toString().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortConfig.field) {
        case 'month':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'netSalary':
          aVal = a.summary.netSalary;
          bVal = b.summary.netSalary;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a[sortConfig.field];
          bVal = b[sortConfig.field];
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredHistory(filtered);
  };

  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(1) + 'L';
    }
    if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(1) + 'K';
    }
    return formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status, size = 'text-sm') => {
    switch(status) {
      case 'paid':
        return <FaCheckCircle className={`${size} text-green-500`} />;
      case 'pending':
        return <FaClock className={`${size} text-yellow-500`} />;
      case 'processing':
        return <FaClock className={`${size} text-blue-500`} />;
      case 'upcoming':
        return <FaCalendarAlt className={`${size} text-gray-500`} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      upcoming: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${classes[status]}`}>
        {status === 'paid' ? 'PD' : 
         status === 'pending' ? 'PN' : 
         status === 'processing' ? 'PR' : 'UP'}
      </span>
    );
  };

  const getFullStatusBadge = (status) => {
    const classes = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      upcoming: 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      paid: <FaCheckCircle className="mr-1" />,
      pending: <FaClock className="mr-1" />,
      processing: <FaClock className="mr-1" />,
      upcoming: <FaCalendarAlt className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAvailableYears = () => {
    const years = [...new Set(salaryHistory.map(record => record.year))];
    return years.sort((a, b) => b - a);
  };

  const calculateTotals = () => {
    return filteredHistory.reduce((acc, record) => ({
      totalEarnings: acc.totalEarnings + record.earnings.total,
      totalDeductions: acc.totalDeductions + record.deductions.total,
      totalNet: acc.totalNet + record.summary.netSalary,
      count: acc.count + 1
    }), { totalEarnings: 0, totalDeductions: 0, totalNet: 0, count: 0 });
  };

  const handleDownloadPayslip = (record) => {
    alert(`Downloading payslip for ${record.monthName} ${record.year}`);
  };

  const handlePrintPayslip = (record) => {
    alert(`Printing payslip for ${record.monthName} ${record.year}`);
  };

  const handleEmailPayslip = (record) => {
    alert(`Emailing payslip for ${record.monthName} ${record.year}`);
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <FaHistory className="text-xl sm:text-2xl md:text-3xl text-blue-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Salary History</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  View your complete salary history and download payslips
                </p>
              </div>
            </div>
            
            {/* Summary Stats - Compact on mobile */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 bg-gray-50 p-2 sm:p-0 sm:bg-transparent rounded-lg">
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-green-600">
                  {formatCompactCurrency(totals.totalNet)}
                </p>
              </div>
              <div className="h-4 sm:h-8 w-px bg-gray-300"></div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-gray-500">Avg</p>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-blue-600">
                  {formatCompactCurrency(totals.totalNet / (totals.count || 1))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 md:py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <FaSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Year Filter */}
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Years</option>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle - Compact on mobile */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-colors ${
                    viewMode === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Chart
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedYear !== 'all' || selectedMonth !== 'all' || searchTerm) && (
              <div className="mt-2 sm:mt-3 flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">Active:</span>
                {selectedYear !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Year: {selectedYear}
                  </span>
                )}
                {selectedMonth !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Month: {new Date(2000, parseInt(selectedMonth), 1).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedYear('all');
                    setSelectedMonth('all');
                    setSearchTerm('');
                  }}
                  className="text-[8px] sm:text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Mobile View - Cards (320px - 767px) - List and Grid both become cards */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Card Header */}
                    <div className={`px-4 py-3 ${
                      record.status === 'paid' ? 'bg-green-50 border-l-4 border-green-500' :
                      record.status === 'pending' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                      record.status === 'processing' ? 'bg-blue-50 border-l-4 border-blue-500' :
                      'bg-gray-50 border-l-4 border-gray-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(record.status, 'text-base mr-2')}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {record.monthName} {record.year}
                            </h3>
                            <p className="text-xs text-gray-600">{record.shortMonth} {record.year}</p>
                          </div>
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      {/* Amount Summary */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500">Net Salary</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(record.summary.netSalary)}
                        </span>
                      </div>

                      {/* Earnings & Deductions */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-[10px] text-gray-500">Earnings</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCompactCurrency(record.earnings.total)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-[10px] text-gray-500">Deductions</p>
                          <p className="text-sm font-medium text-red-600">
                            {formatCompactCurrency(record.deductions.total)}
                          </p>
                        </div>
                      </div>

                      {/* Quick Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Basic</span>
                          <span className="font-medium">{formatCompactCurrency(record.earnings.basic)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">PF</span>
                          <span className="font-medium">{formatCompactCurrency(record.deductions.pf)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Overtime</span>
                          <span className="font-medium text-green-600">
                            {formatCompactCurrency(record.earnings.overtime.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tax</span>
                          <span className="font-medium">{formatCompactCurrency(record.deductions.incomeTax)}</span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      {record.paymentDate && (
                        <div className="text-xs text-gray-400 mb-3">
                          Paid: {formatDate(record.paymentDate)}
                        </div>
                      )}

                      {/* Actions */}
                      {record.status === 'paid' && (
                        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleDownloadPayslip(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <FaDownload className="text-sm" />
                          </button>
                          <button
                            onClick={() => handlePrintPayslip(record)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Print"
                          >
                            <FaPrint className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEmailPayslip(record)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Email"
                          >
                            <FaEnvelope className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop View - Table (768px and above) */}
            <div className="hidden md:block">
              {viewMode === 'list' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('month')}
                              className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                            >
                              Month
                              {sortConfig.field === 'month' && (
                                sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('netSalary')}
                              className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                            >
                              Gross Earnings
                              {sortConfig.field === 'netSalary' && (
                                sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deductions
                          </th>
                          <th className="px-6 py-3 text-left">
                            <button
                              onClick={() => handleSort('netSalary')}
                              className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                            >
                              Net Salary
                              {sortConfig.field === 'netSalary' && (
                                sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistory.map((record) => (
                          <React.Fragment key={record.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => toggleRowExpand(record.id)}
                                  className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
                                >
                                  {expandedRows.includes(record.id) ? (
                                    <FaChevronUp className="mr-2 text-gray-400" />
                                  ) : (
                                    <FaChevronDown className="mr-2 text-gray-400" />
                                  )}
                                  {record.monthName} {record.year}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getFullStatusBadge(record.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">
                                  {formatCurrency(record.earnings.total)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-red-600">
                                  {formatCurrency(record.deductions.total)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-green-600">
                                  {formatCurrency(record.summary.netSalary)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-500">
                                  {formatDate(record.paymentDate)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {record.status === 'paid' && (
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleDownloadPayslip(record)}
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Download Payslip"
                                    >
                                      <FaDownload />
                                    </button>
                                    <button
                                      onClick={() => handlePrintPayslip(record)}
                                      className="text-gray-600 hover:text-gray-800 transition-colors"
                                      title="Print Payslip"
                                    >
                                      <FaPrint />
                                    </button>
                                    <button
                                      onClick={() => handleEmailPayslip(record)}
                                      className="text-green-600 hover:text-green-800 transition-colors"
                                      title="Email Payslip"
                                    >
                                      <FaEnvelope />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            
                            {/* Expanded Row Details */}
                            {expandedRows.includes(record.id) && (
                              <tr className="bg-gray-50">
                                <td colSpan="7" className="px-6 py-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <h4 className="text-xs font-medium text-gray-500 mb-2">Earnings Breakdown</h4>
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Basic</span>
                                          <span className="font-medium">{formatCurrency(record.earnings.basic)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">HRA</span>
                                          <span className="font-medium">{formatCurrency(record.earnings.hra)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Overtime</span>
                                          <span className="font-medium text-green-600">
                                            {formatCurrency(record.earnings.overtime.amount)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Bonus</span>
                                          <span className="font-medium">{formatCurrency(record.earnings.bonus)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-xs font-medium text-gray-500 mb-2">Deductions Breakdown</h4>
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">PF</span>
                                          <span className="font-medium">{formatCurrency(record.deductions.pf)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Tax</span>
                                          <span className="font-medium">{formatCurrency(record.deductions.incomeTax)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Insurance</span>
                                          <span className="font-medium">{formatCurrency(record.deductions.insurance)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Advance</span>
                                          <span className="font-medium text-red-600">
                                            {formatCurrency(record.deductions.advance)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="text-xs font-medium text-gray-500 mb-2">Payment Info</h4>
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Mode</span>
                                          <span className="font-medium">{record.paymentMode || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Transaction ID</span>
                                          <span className="font-medium">{record.transactionId || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600">Remarks</span>
                                          <span className="font-medium">{record.remarks || '-'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Showing {filteredHistory.length} of {salaryHistory.length} records
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHistory.map((record) => (
                    <div key={record.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">
                            {record.monthName} {record.year}
                          </h3>
                          {getFullStatusBadge(record.status)}
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Gross Earnings</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(record.earnings.total)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Deductions</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(record.deductions.total)}
                            </span>
                          </div>
                          
                          <div className="border-t border-dashed pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-800">Net Salary</span>
                              <span className="text-xl font-bold text-green-600">
                                {formatCurrency(record.summary.netSalary)}
                              </span>
                            </div>
                          </div>
                          
                          {record.paymentDate && (
                            <div className="text-xs text-gray-400">
                              Paid on: {formatDate(record.paymentDate)}
                            </div>
                          )}
                          
                          {record.status === 'paid' && (
                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                onClick={() => handleDownloadPayslip(record)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={() => handlePrintPayslip(record)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Print"
                              >
                                <FaPrint />
                              </button>
                              <button
                                onClick={() => handleEmailPayslip(record)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Email"
                              >
                                <FaEnvelope />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart View */}
              {viewMode === 'chart' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Trend</h3>
                  <div className="h-80 flex items-end space-x-2">
                    {filteredHistory.slice(0, 12).reverse().map((record, index) => {
                      const maxSalary = Math.max(...filteredHistory.map(r => r.summary.netSalary));
                      const height = (record.summary.netSalary / maxSalary) * 100;
                      
                      return (
                        <div key={record.id} className="flex-1 flex flex-col items-center group">
                          <div className="relative w-full">
                            <div 
                              className="bg-blue-600 rounded-t hover:bg-blue-700 transition-all cursor-pointer"
                              style={{ height: `${height}%`, minHeight: '20px' }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {formatCurrency(record.summary.netSalary)}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                            {record.monthName.slice(0, 3)} {record.year.toString().slice(-2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Highest</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCompactCurrency(Math.max(...filteredHistory.map(r => r.summary.netSalary)))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Lowest</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCompactCurrency(Math.min(...filteredHistory.map(r => r.summary.netSalary)))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Average</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCompactCurrency(totals.totalNet / (totals.count || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* No Results */}
            {filteredHistory.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
                <FaMoneyBillWave className="text-3xl sm:text-4xl md:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No salary records found</h3>
                <p className="text-xs sm:text-sm text-gray-500">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryHistory;