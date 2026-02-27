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
  FaFileAlt
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'processing': return <FaUserCheck className="text-blue-500" />;
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
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

  const getTypeColor = (type) => {
    const colors = {
      missed_punch: 'yellow',
      wrong_punch: 'blue',
      late_justification: 'orange',
      early_checkout: 'purple'
    };
    return colors[type] || 'gray';
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

  const summary = getStatusSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaHistory className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage your regularization requests
                </p>
              </div>
            </div>
            <button
              onClick={loadRequests}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <FaRedoAlt className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
              </div>
              <FaClock className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
              </div>
              <FaTimesCircle className="text-red-500 text-xl" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{summary.processing}</p>
              </div>
              <FaUserCheck className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, reason, type..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all' || filters.search) && (
              <div className="mt-3 flex items-center">
                <span className="text-sm text-gray-500 mr-2">Active Filters:</span>
                {filters.status !== 'all' && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                    Status: {filters.status}
                  </span>
                )}
                {filters.type !== 'all' && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full mr-2">
                    Type: {getTypeLabel(filters.type)}
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                    Range: {filters.dateRange}
                  </span>
                )}
                <button
                  onClick={() => setFilters({ status: 'all', type: 'all', dateRange: 'all', search: '' })}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Requests Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {request.requestId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm px-2 py-1 rounded-full bg-${getTypeColor(request.type)}-100 text-${getTypeColor(request.type)}-800`}>
                          {getTypeLabel(request.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="mr-1 text-gray-400" />
                          {new Date(request.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <span className="ml-2">{getStatusBadge(request.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.reason}
                        </div>
                        {request.comments && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <FaCommentDots className="mr-1" />
                            Has comments
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.submittedAt).toLocaleDateString()}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No requests found
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
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
              <div className="flex items-center space-x-2">
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
      </div>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">Request ID</span>
                  <span className="text-lg font-bold text-gray-900">{selectedRequest.requestId}</span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(selectedRequest.status)}
                  <span className="ml-2">{getStatusBadge(selectedRequest.status)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedRequest.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-medium">
                    {new Date(selectedRequest.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedRequest.location || '-'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-800">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.comments && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Additional Comments</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-800">{selectedRequest.comments}</p>
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Reviewed By</p>
                      <p className="font-medium">{selectedRequest.reviewedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reviewed On</p>
                      <p className="font-medium">
                        {new Date(selectedRequest.reviewedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.reviewerComments && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Reviewer Comments</p>
                      <div className="bg-gray-50 rounded-lg p-3 mt-1">
                        <p className="text-gray-800">{selectedRequest.reviewerComments}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
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