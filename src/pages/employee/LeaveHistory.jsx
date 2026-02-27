import React, { useState, useEffect } from 'react';
import {
  FaHistory,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaDownload,
  FaRedoAlt,
  FaFileAlt,
  FaUserTie,
  FaCommentDots,
  FaUmbrellaBeach,
  FaBriefcaseMedical,
  FaHeart,
  FaBaby,
  FaGraduationCap,
  FaPlane,
  FaHome,
  FaChartBar,
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaEnvelope,
  FaBan
} from 'react-icons/fa';

const LeaveHistory = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    year: 'all',
    month: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'appliedOn',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    cancelled: 0,
    totalDays: 0
  });

  // Leave type mapping
  const leaveTypes = {
    annual: { label: 'Annual Leave', icon: FaUmbrellaBeach, color: 'blue' },
    sick: { label: 'Sick Leave', icon: FaBriefcaseMedical, color: 'red' },
    casual: { label: 'Casual Leave', icon: FaHome, color: 'green' },
    bereavement: { label: 'Bereavement Leave', icon: FaHeart, color: 'purple' },
    maternity: { label: 'Maternity Leave', icon: FaBaby, color: 'pink' },
    paternity: { label: 'Paternity Leave', icon: FaBaby, color: 'blue' },
    study: { label: 'Study Leave', icon: FaGraduationCap, color: 'indigo' },
    unpaid: { label: 'Unpaid Leave', icon: FaBan, color: 'gray' }
  };

  // Load leave history
  useEffect(() => {
    loadLeaveHistory();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [leaveRequests, filters, sortConfig]);

  const loadLeaveHistory = () => {
    setLoading(true);
    
    // Try to load from localStorage first
    const saved = localStorage.getItem('leaveRequests');
    if (saved) {
      const requests = JSON.parse(saved);
      setLeaveRequests(requests);
      setFilteredRequests(requests);
    } else {
      // Generate mock data
      const mockRequests = generateMockRequests();
      setLeaveRequests(mockRequests);
      localStorage.setItem('leaveRequests', JSON.stringify(mockRequests));
    }
    
    setLoading(false);
  };

  const generateMockRequests = () => {
    const statuses = ['approved', 'rejected', 'pending', 'cancelled'];
    const types = Object.keys(leaveTypes);
    const requests = [];

    for (let i = 1; i <= 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const appliedDate = new Date();
      appliedDate.setDate(appliedDate.getDate() - Math.floor(Math.random() * 90));
      
      const startDate = new Date(appliedDate);
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10) + 1);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
      
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      const reviewers = ['John Manager', 'Sarah HR', 'Mike Team Lead', 'Lisa Director'];
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      
      const reviewDate = status !== 'pending' ? new Date(appliedDate) : null;
      if (reviewDate) {
        reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 3) + 1);
      }

      requests.push({
        id: i,
        requestId: `LEAVE${String(i).padStart(5, '0')}`,
        type: type,
        status: status,
        appliedOn: appliedDate.toISOString(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: days,
        reason: getRandomReason(type),
        contactNumber: '9876543210',
        addressDuringLeave: '123 Main St, City',
        handoverNotes: 'All tasks handed over to team member',
        documents: Math.random() > 0.7 ? ['document.pdf', 'receipt.jpg'] : [],
        reviewer: status !== 'pending' ? reviewer : null,
        reviewedOn: reviewDate ? reviewDate.toISOString() : null,
        reviewerComments: status === 'rejected' ? 'Insufficient leave balance' : 
                         status === 'approved' ? 'Approved' : null,
        cancellationReason: status === 'cancelled' ? 'Changed plans' : null,
        history: generateHistory(status, appliedDate, reviewDate)
      });
    }
    
    return requests;
  };

  const getRandomReason = (type) => {
    const reasons = {
      annual: ['Family vacation', 'Travel plans', 'Personal time off'],
      sick: ['Fever and cold', 'Medical checkup', 'Not feeling well'],
      casual: ['Personal work', 'Family function', 'Home maintenance'],
      bereavement: ['Family demise', 'Relative passed away'],
      maternity: ['Maternity leave', 'Childbirth'],
      paternity: ['Paternity leave', 'Childcare'],
      study: ['Exam preparation', 'Course attendance'],
      unpaid: ['Extended leave', 'Personal reasons']
    };
    return reasons[type]?.[Math.floor(Math.random() * reasons[type].length)] || 'Leave requested';
  };

  const generateHistory = (status, appliedDate, reviewDate) => {
    const history = [
      {
        date: appliedDate.toISOString(),
        action: 'Applied',
        by: 'Self',
        comments: 'Leave application submitted'
      }
    ];
    
    if (status !== 'pending' && reviewDate) {
      history.push({
        date: reviewDate.toISOString(),
        action: status === 'approved' ? 'Approved' : 'Rejected',
        by: 'Reviewer',
        comments: status === 'approved' ? 'Leave approved' : 'Request rejected'
      });
    }
    
    if (status === 'cancelled') {
      const cancelDate = new Date(appliedDate);
      cancelDate.setDate(cancelDate.getDate() + 1);
      history.push({
        date: cancelDate.toISOString(),
        action: 'Cancelled',
        by: 'Self',
        comments: 'Request cancelled by employee'
      });
    }
    
    return history;
  };

  const applyFilters = () => {
    let filtered = [...leaveRequests];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    // Year filter
    if (filters.year !== 'all') {
      filtered = filtered.filter(r => {
        const year = new Date(r.appliedOn).getFullYear();
        return year.toString() === filters.year;
      });
    }

    // Month filter
    if (filters.month !== 'all') {
      filtered = filtered.filter(r => {
        const month = new Date(r.appliedOn).getMonth();
        return month.toString() === filters.month;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.requestId.toLowerCase().includes(searchLower) ||
        r.reason.toLowerCase().includes(searchLower) ||
        leaveTypes[r.type]?.label.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      
      if (sortConfig.field === 'appliedOn' || sortConfig.field === 'startDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRequests(filtered);
  };

  const calculateStats = () => {
    const total = leaveRequests.length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const cancelled = leaveRequests.filter(r => r.status === 'cancelled').length;
    const totalDays = leaveRequests
      .filter(r => r.status === 'approved')
      .reduce((acc, curr) => acc + curr.days, 0);

    setStats({ total, approved, rejected, pending, cancelled, totalDays });
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status, size = 'text-sm') => {
    switch(status) {
      case 'approved':
        return <FaCheckCircle className={`${size} text-green-500`} />;
      case 'rejected':
        return <FaTimesCircle className={`${size} text-red-500`} />;
      case 'pending':
        return <FaClock className={`${size} text-yellow-500`} />;
      case 'cancelled':
        return <FaBan className={`${size} text-gray-500`} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${classes[status]}`}>
        {status === 'approved' ? 'A' : 
         status === 'rejected' ? 'R' : 
         status === 'pending' ? 'P' : 'C'}
      </span>
    );
  };

  const getFullStatusBadge = (status) => {
    const classes = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      approved: <FaCheckCircle className="mr-1" />,
      rejected: <FaTimesCircle className="mr-1" />,
      pending: <FaClock className="mr-1" />,
      cancelled: <FaBan className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type, size = 'text-sm') => {
    const leaveType = leaveTypes[type];
    if (!leaveType) return null;
    const Icon = leaveType.icon;
    return <Icon className={`${size} text-${leaveType.color}-600`} />;
  };

  const getTypeBadge = (type) => {
    const leaveType = leaveTypes[type];
    if (!leaveType) return null;
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-${leaveType.color}-100 text-${leaveType.color}-800`}>
        {type === 'annual' ? 'AL' :
         type === 'sick' ? 'SL' :
         type === 'casual' ? 'CL' :
         type === 'bereavement' ? 'BL' :
         type === 'maternity' ? 'ML' :
         type === 'paternity' ? 'PL' :
         type === 'study' ? 'ST' : 'UL'}
      </span>
    );
  };

  const getFullTypeBadge = (type) => {
    const leaveType = leaveTypes[type];
    if (!leaveType) return null;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${leaveType.color}-100 text-${leaveType.color}-800`}>
        {leaveType.label}
      </span>
    );
  };

  const getAvailableYears = () => {
    const years = [...new Set(leaveRequests.map(r => new Date(r.appliedOn).getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  const handleExport = () => {
    const csvContent = [
      ['Request ID', 'Type', 'Status', 'Applied On', 'Start Date', 'End Date', 'Days', 'Reason', 'Reviewer', 'Reviewed On'].join(','),
      ...filteredRequests.map(r => [
        r.requestId,
        leaveTypes[r.type]?.label || r.type,
        r.status,
        formatDate(r.appliedOn),
        formatDate(r.startDate),
        formatDate(r.endDate),
        r.days,
        `"${r.reason}"`,
        r.reviewer || '',
        r.reviewedOn ? formatDate(r.reviewedOn) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = (request) => {
    alert(`Printing leave request ${request.requestId}`);
  };

  const handleEmail = (request) => {
    alert(`Emailing leave request ${request.requestId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <FaHistory className="text-xl sm:text-2xl md:text-3xl text-blue-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Leave History</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Track and manage all your leave requests
                </p>
              </div>
            </div>
            
            <button
              onClick={loadLeaveHistory}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <FaRedoAlt className="mr-1 sm:mr-2 text-sm" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Approved</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Rejected</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <FaTimesCircle className="text-red-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Pending</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FaClock className="text-yellow-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Days</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-blue-600">{stats.totalDays}</p>
              </div>
              <FaCalendarAlt className="text-blue-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <FaSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-7 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {Object.entries(leaveTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Years</option>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="list">List</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.status !== 'all' || filters.type !== 'all' || filters.year !== 'all' || filters.search) && (
              <div className="mt-2 sm:mt-3 flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">Active:</span>
                {filters.status !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Status: {filters.status}
                  </span>
                )}
                {filters.type !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Type: {leaveTypes[filters.type]?.label}
                  </span>
                )}
                {filters.year !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Year: {filters.year}
                  </span>
                )}
                <button
                  onClick={() => setFilters({ status: 'all', type: 'all', year: 'all', month: 'all', search: '' })}
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
            {/* Mobile View - Cards (320px - 767px) */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {filteredRequests.map((request) => {
                  const leaveType = leaveTypes[request.type];
                  
                  return (
                    <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      {/* Card Header with Type and Status */}
                      <div className={`bg-gradient-to-r from-${leaveType?.color}-500 to-${leaveType?.color}-600 px-4 py-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getTypeIcon(request.type, 'text-base text-white mr-2')}
                            <h3 className="text-sm font-semibold text-white">
                              {leaveType?.label}
                            </h3>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(request.status, 'text-base text-white mr-1')}
                            <span className="text-xs text-white opacity-90">
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">Request ID</span>
                          <span className="text-xs font-mono font-medium text-gray-900">{request.requestId}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">Applied On</span>
                          <span className="text-xs text-gray-900">{formatDate(request.appliedOn)}</span>
                        </div>
                        
                        <div className="border-t border-dashed border-gray-200 my-3 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Leave Period</span>
                            <span className="text-xs font-medium text-gray-900">
                              {request.days} {request.days === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">From</span>
                            <span className="font-medium">{formatDate(request.startDate)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-600">To</span>
                            <span className="font-medium">{formatDate(request.endDate)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <p className="text-xs text-gray-700 line-clamp-2">{request.reason}</p>
                        </div>
                        
                        {request.reviewer && (
                          <div className="flex items-center text-[10px] text-gray-500 mb-3">
                            <FaUserTie className="mr-1 text-xs" />
                            <span>Reviewed by {request.reviewer}</span>
                          </div>
                        )}
                        
                        {/* Card Footer Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => handlePrint(request)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Print"
                          >
                            <FaPrint className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleEmail(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Email"
                          >
                            <FaEnvelope className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop View - Table (768px and above) */}
            <div className="hidden md:block">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('requestId')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Request ID
                            {sortConfig.field === 'requestId' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('appliedOn')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Applied On
                            {sortConfig.field === 'appliedOn' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('startDate')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Leave Dates
                            {sortConfig.field === 'startDate' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('days')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Days
                            {sortConfig.field === 'days' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Status
                            {sortConfig.field === 'status' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request) => (
                        <React.Fragment key={request.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleRowExpand(request.id)}
                                className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {expandedRows.includes(request.id) ? (
                                  <FaChevronUp className="mr-2 text-gray-400" />
                                ) : (
                                  <FaChevronDown className="mr-2 text-gray-400" />
                                )}
                                {request.requestId}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getFullTypeBadge(request.type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(request.appliedOn)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(request.startDate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                to {formatDate(request.endDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                {request.days}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getFullStatusBadge(request.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowDetails(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handlePrint(request)}
                                  className="text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Print"
                                >
                                  <FaPrint />
                                </button>
                                <button
                                  onClick={() => handleEmail(request)}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  title="Email"
                                >
                                  <FaEnvelope />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row Details */}
                          {expandedRows.includes(request.id) && (
                            <tr className="bg-gray-50">
                              <td colSpan="7" className="px-6 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 mb-2">Reason</h4>
                                    <p className="text-sm text-gray-800">{request.reason}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 mb-2">Contact</h4>
                                    <p className="text-sm text-gray-800">{request.contactNumber}</p>
                                    <p className="text-xs text-gray-500 mt-1">{request.addressDuringLeave}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-500 mb-2">Review Info</h4>
                                    {request.reviewer ? (
                                      <>
                                        <p className="text-sm text-gray-800">By: {request.reviewer}</p>
                                        <p className="text-xs text-gray-500">On: {formatDate(request.reviewedOn)}</p>
                                        {request.reviewerComments && (
                                          <p className="text-xs text-gray-600 mt-1">{request.reviewerComments}</p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-sm text-gray-500">Pending review</p>
                                    )}
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
                      Showing {filteredRequests.length} of {leaveRequests.length} requests
                    </p>
                    <button
                      onClick={handleExport}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FaDownload className="mr-1" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* No Results */}
            {filteredRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
                <FaHistory className="text-3xl sm:text-4xl md:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No leave requests found</h3>
                <p className="text-xs sm:text-sm text-gray-500">Try adjusting your filters or apply for a new leave</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getTypeIcon(selectedRequest.type, 'text-lg sm:text-xl')}
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 ml-2">
                    Leave Request Details
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-3 sm:p-4 rounded-lg mb-4 ${
                selectedRequest.status === 'approved' ? 'bg-green-50 border border-green-200' :
                selectedRequest.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                selectedRequest.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center">
                    {getStatusIcon(selectedRequest.status, 'text-lg sm:text-xl mr-2')}
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        Request {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {selectedRequest.status === 'approved' && `Approved by ${selectedRequest.reviewer} on ${formatDate(selectedRequest.reviewedOn)}`}
                        {selectedRequest.status === 'rejected' && `Rejected by ${selectedRequest.reviewer} on ${formatDate(selectedRequest.reviewedOn)}`}
                        {selectedRequest.status === 'pending' && 'Awaiting approval'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">{selectedRequest.requestId}</span>
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Leave Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Leave Type</span>
                      <span className="text-xs sm:text-sm font-medium">{leaveTypes[selectedRequest.type]?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Start Date</span>
                      <span className="text-xs sm:text-sm font-medium">{formatDate(selectedRequest.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">End Date</span>
                      <span className="text-xs sm:text-sm font-medium">{formatDate(selectedRequest.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Total Days</span>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">{selectedRequest.days} days</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Application Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Applied On</span>
                      <span className="text-xs sm:text-sm font-medium">{formatDateTime(selectedRequest.appliedOn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Contact</span>
                      <span className="text-xs sm:text-sm font-medium">{selectedRequest.contactNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Address</span>
                      <span className="text-xs sm:text-sm font-medium text-right">{selectedRequest.addressDuringLeave}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Reason for Leave</h4>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-gray-800">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Documents */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Attached Documents</h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {selectedRequest.documents.map((doc, index) => (
                      <span key={index} className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs">
                        <FaFileAlt className="mr-1 text-gray-500 text-[8px] sm:text-xs" />
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Comments */}
              {selectedRequest.reviewerComments && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Reviewer Comments</h4>
                  <div className={`p-2 sm:p-3 rounded-lg ${
                    selectedRequest.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-xs sm:text-sm ${
                      selectedRequest.status === 'approved' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {selectedRequest.reviewerComments}
                    </p>
                  </div>
                </div>
              )}

              {/* History Timeline */}
              <div className="border-t pt-4 sm:pt-6">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-4">Request Timeline</h4>
                <div className="space-y-2 sm:space-y-3">
                  {selectedRequest.history?.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {event.action === 'Applied' && <FaFileAlt className="text-blue-500 text-xs sm:text-sm" />}
                        {event.action === 'Approved' && <FaCheckCircle className="text-green-500 text-xs sm:text-sm" />}
                        {event.action === 'Rejected' && <FaTimesCircle className="text-red-500 text-xs sm:text-sm" />}
                        {event.action === 'Cancelled' && <FaBan className="text-gray-500 text-xs sm:text-sm" />}
                      </div>
                      <div className="ml-2 sm:ml-3 flex-1">
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{event.action}</p>
                          <p className="text-[8px] sm:text-xs text-gray-500">{formatDateTime(event.date)}</p>
                        </div>
                        <p className="text-[8px] sm:text-xs text-gray-500">By: {event.by}</p>
                        {event.comments && (
                          <p className="text-[8px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">{event.comments}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg order-2 xs:order-1"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrint(selectedRequest)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center order-1 xs:order-2"
                >
                  <FaPrint className="mr-1 sm:mr-2 text-xs" />
                  Print
                </button>
                {selectedRequest.status === 'pending' && (
                  <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center order-3">
                    <FaBan className="mr-1 sm:mr-2 text-xs" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;