import React, { useState, useEffect } from 'react';
import {
  FaHistory,
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
  FaCommentDots,
  FaUserCheck,
  FaCalendarAlt,
  FaFileAlt,
  FaBan
} from 'react-icons/fa';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'submittedAt',
    direction: 'desc'
  });
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters, sortConfig]);

  const loadRequests = () => {
    setLoading(true);
    
    // Load from localStorage or generate mock data
    const saved = localStorage.getItem('regularizationRequests');
    if (saved) {
      setRequests(JSON.parse(saved));
    } else {
      // Generate mock data
      const mockRequests = generateMockRequests();
      setRequests(mockRequests);
      localStorage.setItem('regularizationRequests', JSON.stringify(mockRequests));
    }
    
    setLoading(false);
  };

  const generateMockRequests = () => {
    const types = ['missed_punch', 'wrong_punch', 'late_justification', 'early_checkout'];
    const statuses = ['pending', 'approved', 'rejected', 'processing'];
    const requests = [];

    for (let i = 1; i <= 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      requests.push({
        id: i,
        requestId: `REQ${String(i).padStart(5, '0')}`,
        type: type,
        status: status,
        date: date.toISOString().split('T')[0],
        submittedAt: date.toISOString(),
        reason: getRandomReason(type),
        comments: Math.random() > 0.7 ? 'Additional comments here...' : null,
        location: Math.random() > 0.5 ? 'Main Office' : 'Remote',
        reviewedBy: status !== 'pending' ? 'John Manager' : null,
        reviewedAt: status !== 'pending' ? new Date().toISOString() : null,
        reviewerComments: status === 'rejected' ? 'Please provide more details' : null
      });
    }
    
    return requests;
  };

  const getRandomReason = (type) => {
    const reasons = {
      missed_punch: [
        'Forgot to punch in while rushing to meeting',
        'System was down during punch time',
        'Emergency phone call distracted me'
      ],
      wrong_punch: [
        'Accidentally punched out instead of in',
        'Wrong time recorded due to system error',
        'Punched for wrong shift'
      ],
      late_justification: [
        'Traffic jam on highway',
        'Train delayed by 30 minutes',
        'Medical appointment in the morning'
      ],
      early_checkout: [
        'Doctor appointment scheduled',
        'Family emergency required early departure',
        'Client meeting ended early'
      ]
    };
    return reasons[type][Math.floor(Math.random() * reasons[type].length)];
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: 1,
        week: 7,
        month: 30,
        quarter: 90
      };
      const days = ranges[filters.dateRange];
      filtered = filtered.filter(r => {
        const requestDate = new Date(r.date);
        const diffDays = Math.floor((now - requestDate) / (1000 * 60 * 60 * 24));
        return diffDays <= days;
      });
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.requestId.toLowerCase().includes(searchLower) ||
        r.reason.toLowerCase().includes(searchLower) ||
        r.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      
      if (sortConfig.field === 'date' || sortConfig.field === 'submittedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRequests(filtered);
  };

  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getStatusIcon = (status, size = 'text-sm') => {
    switch(status) {
      case 'approved': return <FaCheckCircle className={`${size} text-green-500`} />;
      case 'rejected': return <FaTimesCircle className={`${size} text-red-500`} />;
      case 'pending': return <FaClock className={`${size} text-yellow-500`} />;
      case 'processing': return <FaUserCheck className={`${size} text-blue-500`} />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${classes[status]}`}>
        {status === 'approved' ? 'A' : 
         status === 'rejected' ? 'R' : 
         status === 'pending' ? 'P' : 'PR'}
      </span>
    );
  };

  const getFullStatusBadge = (status) => {
    const classes = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800'
    };
    
    const icons = {
      approved: <FaCheckCircle className="mr-1" />,
      rejected: <FaTimesCircle className="mr-1" />,
      pending: <FaClock className="mr-1" />,
      processing: <FaUserCheck className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      missed_punch: 'Missed Punch',
      wrong_punch: 'Wrong Punch',
      late_justification: 'Late Justification',
      early_checkout: 'Early Checkout'
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type) => {
    const colors = {
      missed_punch: 'yellow',
      wrong_punch: 'blue',
      late_justification: 'orange',
      early_checkout: 'purple'
    };
    const color = colors[type] || 'gray';
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {type === 'missed_punch' ? 'MP' :
         type === 'wrong_punch' ? 'WP' :
         type === 'late_justification' ? 'LJ' : 'EC'}
      </span>
    );
  };

  const getFullTypeBadge = (type) => {
    const colors = {
      missed_punch: 'yellow',
      wrong_punch: 'blue',
      late_justification: 'orange',
      early_checkout: 'purple'
    };
    const color = colors[type] || 'gray';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
        {getTypeLabel(type)}
      </span>
    );
  };

  const getStatusSummary = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      processing: requests.filter(r => r.status === 'processing').length
    };
  };

  const handleExport = () => {
    const summary = getStatusSummary();
    const csvContent = [
      ['Request ID', 'Type', 'Status', 'Date', 'Reason', 'Comments', 'Reviewed By', 'Review Date'].join(','),
      ...filteredRequests.map(r => [
        r.requestId,
        getTypeLabel(r.type),
        r.status,
        new Date(r.date).toLocaleDateString(),
        `"${r.reason}"`,
        r.comments ? `"${r.comments}"` : '',
        r.reviewedBy || '',
        r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

  const summary = getStatusSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <FaHistory className="text-xl sm:text-2xl md:text-3xl text-blue-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Requests</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Track and manage your regularization requests
                </p>
              </div>
            </div>
            <button
              onClick={loadRequests}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <FaRedoAlt className="mr-1 sm:mr-2 text-sm" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto sm:px-2 py-4 sm:py-6 md:py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Pending</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-yellow-600">{summary.pending}</p>
              </div>
              <FaClock className="text-yellow-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Approved</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-green-600">{summary.approved}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Rejected</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600">{summary.rejected}</p>
              </div>
              <FaTimesCircle className="text-red-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-2 sm:p-3 md:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Processing</p>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-blue-600">{summary.processing}</p>
              </div>
              <FaUserCheck className="text-blue-500 text-sm sm:text-base md:text-xl hidden sm:block" />
            </div>
          </div>
        </div>

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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processing">Processing</option>
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
                  <option value="missed_punch">Missed Punch</option>
                  <option value="wrong_punch">Wrong Punch</option>
                  <option value="late_justification">Late Justification</option>
                  <option value="early_checkout">Early Checkout</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">7 Days</option>
                  <option value="month">30 Days</option>
                  <option value="quarter">90 Days</option>
                </select>
              </div>

              {/* View Mode Toggle - Hidden on mobile since we use cards */}
              <div className="hidden lg:block">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="list">List View</option>
                  <option value="grid">Grid View</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all' || filters.search) && (
              <div className="mt-2 sm:mt-3 flex items-center flex-wrap gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">Active:</span>
                {filters.status !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Status: {filters.status}
                  </span>
                )}
                {filters.type !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    Type: {getTypeLabel(filters.type)}
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="text-[8px] sm:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {filters.dateRange === 'today' ? 'Today' :
                     filters.dateRange === 'week' ? '7d' :
                     filters.dateRange === 'month' ? '30d' : '90d'}
                  </span>
                )}
                <button
                  onClick={() => setFilters({ status: 'all', type: 'all', dateRange: 'all', search: '' })}
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
                {filteredRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Card Header with Status */}
                    <div className={`px-4 py-3 border-l-4 ${
                      request.status === 'approved' ? 'border-green-500 bg-green-50' :
                      request.status === 'rejected' ? 'border-red-500 bg-red-50' :
                      request.status === 'pending' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(request.status, 'text-base mr-2')}
                          <span className="text-xs font-medium">
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-600">{request.requestId}</span>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                          {getTypeLabel(request.type)}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <FaCalendarAlt className="mr-1 text-xs" />
                          {formatDate(request.date)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-xs text-gray-700 line-clamp-2">{request.reason}</p>
                      </div>
                      
                      {request.comments && (
                        <div className="flex items-center text-[10px] text-gray-500 mb-3">
                          <FaCommentDots className="mr-1 text-xs" />
                          <span>Has additional comments</span>
                        </div>
                      )}
                      
                      {request.reviewedBy && (
                        <div className="flex items-center text-[10px] text-gray-500 mb-3">
                          <span>Reviewed by {request.reviewedBy}</span>
                        </div>
                      )}
                      
                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <FaEye className="mr-1 text-xs" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('type')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Type
                            {sortConfig.field === 'type' && (
                              sortConfig.direction === 'asc' ? <FaSortAmountUp className="ml-1" /> : <FaSortAmountDown className="ml-1" />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('date')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Date
                            {sortConfig.field === 'date' && (
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('submittedAt')}
                            className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                          >
                            Submitted
                            {sortConfig.field === 'submittedAt' && (
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
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {request.requestId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getFullTypeBadge(request.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <FaCalendarAlt className="mr-1 text-gray-400 text-xs" />
                              {formatDate(request.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getFullStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {request.reason}
                            </div>
                            {request.comments && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <FaCommentDots className="mr-1 text-xs" />
                                Has comments
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.submittedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing {filteredRequests.length} of {requests.length} requests
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
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No requests found</h3>
                <p className="text-xs sm:text-sm text-gray-500">Try adjusting your filters or create a new request</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className={`p-3 sm:p-4 rounded-lg mb-4 ${
                selectedRequest.status === 'approved' ? 'bg-green-50' :
                selectedRequest.status === 'rejected' ? 'bg-red-50' :
                selectedRequest.status === 'pending' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center">
                    {getStatusIcon(selectedRequest.status, 'text-lg sm:text-xl mr-2')}
                    <div>
                      <p className="text-sm sm:text-base font-medium">
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">{selectedRequest.requestId}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium">{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedRequest.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted On</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedRequest.submittedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">{selectedRequest.location || '-'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.comments && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Additional Comments</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-800">{selectedRequest.comments}</p>
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Review Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Reviewed By</p>
                      <p className="text-sm font-medium">{selectedRequest.reviewedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reviewed On</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedRequest.reviewedAt)}</p>
                    </div>
                  </div>
                  {selectedRequest.reviewerComments && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">Reviewer Comments</p>
                      <div className="bg-gray-50 rounded-lg p-3 mt-1">
                        <p className="text-sm text-gray-800">{selectedRequest.reviewerComments}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg order-2 xs:order-1"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center order-1 xs:order-2">
                    <FaBan className="mr-1 sm:mr-2 text-xs" />
                    Cancel Request
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

export default MyRequests;