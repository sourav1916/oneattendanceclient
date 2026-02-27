import React, { useState, useEffect } from 'react';
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMoneyBillWave,
  FaFingerprint,
  FaUserCheck,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTrash,
  FaCheck,
  FaEye,
  FaFilter,
  FaSearch,
  FaDownload,
  FaArchive,
  FaStar,
  FaRegStar,
  FaRegBell,
  FaUserClock,
  FaUserTag,
  FaCreditCard,
  FaWallet,
  FaUmbrellaBeach,
  FaBriefcaseMedical,
  FaHome,
  FaChartLine,
  FaRegCalendarCheck,
  FaRegClock,
  FaRegMoneyBillAlt,
  FaRegPaperPlane,
  FaRegEdit,
  FaRegFileAlt
} from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    readStatus: 'all',
    dateRange: 'all',
    search: ''
  });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    punchAlerts: 0,
    approvalRequests: 0,
    salaryAlerts: 0,
    leaveAlerts: 0
  });

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [notifications, filters]);

  const loadNotifications = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
      setFilteredNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  };

  const generateMockNotifications = () => {
    const types = ['punch', 'approval', 'salary', 'leave', 'system', 'reminder'];
    const statuses = ['unread', 'read'];
    const priorities = ['high', 'medium', 'low'];
    
    const notifications = [];
    
    // Punch alerts
    notifications.push(
      {
        id: 1,
        type: 'punch',
        category: 'Punch Alert',
        title: 'Missed Punch In',
        message: 'You missed your punch in today. Please regularize immediately.',
        time: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
        status: 'unread',
        priority: 'high',
        actionable: true,
        actionUrl: '/regularization',
        actionLabel: 'Regularize Now',
        icon: FaFingerprint,
        color: 'red',
        metadata: {
          date: new Date().toISOString().split('T')[0],
          expectedTime: '09:00 AM',
          currentStatus: 'Not Punched'
        }
      },
      {
        id: 2,
        type: 'punch',
        category: 'Punch Alert',
        title: 'Punch Out Reminder',
        message: 'Don\'t forget to punch out before leaving today.',
        time: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
        status: 'read',
        priority: 'medium',
        actionable: false,
        icon: FaUserClock,
        color: 'orange',
        metadata: {
          shiftEnd: '06:00 PM',
          currentTime: '05:30 PM'
        }
      }
    );

    // Approval requests
    notifications.push(
      {
        id: 3,
        type: 'approval',
        category: 'Approval Status',
        title: 'Leave Request Approved',
        message: 'Your leave request for March 25-27 has been approved.',
        time: new Date(Date.now() - 1 * 60 * 60000).toISOString(), // 1 hour ago
        status: 'unread',
        priority: 'high',
        actionable: true,
        actionUrl: '/leave-history',
        actionLabel: 'View Details',
        icon: FaCheckCircle,
        color: 'green',
        metadata: {
          leaveType: 'Annual Leave',
          startDate: '2024-03-25',
          endDate: '2024-03-27',
          days: 3,
          approvedBy: 'Sarah Manager'
        }
      },
      {
        id: 4,
        type: 'approval',
        category: 'Approval Status',
        title: 'Regularization Request Pending',
        message: 'Your punch regularization request is awaiting approval.',
        time: new Date(Date.now() - 3 * 60 * 60000).toISOString(), // 3 hours ago
        status: 'unread',
        priority: 'medium',
        actionable: false,
        icon: FaClock,
        color: 'yellow',
        metadata: {
          requestId: 'REQ12345',
          date: '2024-03-20',
          type: 'Missed Punch'
        }
      }
    );

    // Salary alerts
    notifications.push(
      {
        id: 5,
        type: 'salary',
        category: 'Salary Alert',
        title: 'Salary Credited',
        message: 'Your March 2024 salary of ₹75,000 has been credited to your account.',
        time: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
        status: 'read',
        priority: 'high',
        actionable: true,
        actionUrl: '/salary-preview',
        actionLabel: 'View Salary',
        icon: FaMoneyBillWave,
        color: 'green',
        metadata: {
          amount: 75000,
          month: 'March 2024',
          creditedOn: new Date().toISOString().split('T')[0],
          transactionId: 'TXN123456789'
        }
      },
      {
        id: 6,
        type: 'salary',
        category: 'Salary Alert',
        title: 'Salary Advance Approved',
        message: 'Your advance request for ₹10,000 has been approved.',
        time: new Date(Date.now() - 1 * 60 * 60000).toISOString(), // 1 hour ago
        status: 'unread',
        priority: 'high',
        actionable: true,
        actionUrl: '/salary-advance',
        actionLabel: 'View Advance',
        icon: FaCreditCard,
        color: 'blue',
        metadata: {
          amount: 10000,
          approvedOn: new Date().toISOString().split('T')[0],
          repaymentPeriod: '3 months'
        }
      },
      {
        id: 7,
        type: 'salary',
        category: 'Salary Alert',
        title: 'Payslip Available',
        message: 'Your March 2024 payslip is now available for download.',
        time: new Date(Date.now() - 1 * 60 * 60000).toISOString(), // 1 hour ago
        status: 'unread',
        priority: 'medium',
        actionable: true,
        actionUrl: '/salary-history',
        actionLabel: 'Download',
        icon: FaWallet,
        color: 'purple',
        metadata: {
          month: 'March 2024',
          downloadUrl: '/payslips/march-2024.pdf'
        }
      }
    );

    // Leave alerts
    notifications.push(
      {
        id: 8,
        type: 'leave',
        category: 'Leave Alert',
        title: 'Leave Balance Low',
        message: 'Your annual leave balance is running low (2 days remaining).',
        time: new Date(Date.now() - 5 * 60 * 60000).toISOString(), // 5 hours ago
        status: 'unread',
        priority: 'medium',
        actionable: false,
        icon: FaUmbrellaBeach,
        color: 'orange',
        metadata: {
          leaveType: 'Annual Leave',
          remaining: 2,
          total: 20
        }
      },
      {
        id: 9,
        type: 'leave',
        category: 'Leave Alert',
        title: 'Leave Request Submitted',
        message: 'Your leave request for April 10-12 has been submitted for approval.',
        time: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(), // 1 day ago
        status: 'read',
        priority: 'medium',
        actionable: false,
        icon: FaRegPaperPlane,
        color: 'blue',
        metadata: {
          leaveType: 'Casual Leave',
          startDate: '2024-04-10',
          endDate: '2024-04-12',
          days: 3
        }
      }
    );

    // System notifications
    notifications.push(
      {
        id: 10,
        type: 'system',
        category: 'System Update',
        title: 'Profile Update Required',
        message: 'Please update your emergency contact information by end of month.',
        time: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), // 2 days ago
        status: 'unread',
        priority: 'low',
        actionable: true,
        actionUrl: '/edit-profile',
        actionLabel: 'Update Now',
        icon: FaInfoCircle,
        color: 'gray',
        metadata: {
          deadline: '2024-03-31',
          department: 'HR'
        }
      },
      {
        id: 11,
        type: 'reminder',
        category: 'Reminder',
        title: 'Document Expiry Reminder',
        message: 'Your passport will expire in 30 days. Please upload renewed copy.',
        time: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(), // 1 day ago
        status: 'unread',
        priority: 'high',
        actionable: true,
        actionUrl: '/documents',
        actionLabel: 'Upload Now',
        icon: FaExclamationTriangle,
        color: 'red',
        metadata: {
          document: 'Passport',
          expiryDate: '2024-04-27',
          daysLeft: 30
        }
      }
    );

    return notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Read status filter
    if (filters.readStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filters.readStatus);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: 1,
        week: 7,
        month: 30
      };
      const days = ranges[filters.dateRange];
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.time);
        const diffDays = Math.floor((now - notifDate) / (1000 * 60 * 60 * 24));
        return diffDays <= days;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower) ||
        n.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNotifications(filtered);
  };

  const calculateStats = () => {
    setStats({
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      punchAlerts: notifications.filter(n => n.type === 'punch').length,
      approvalRequests: notifications.filter(n => n.type === 'approval').length,
      salaryAlerts: notifications.filter(n => n.type === 'salary').length,
      leaveAlerts: notifications.filter(n => n.type === 'leave').length
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: 'read' }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const archiveNotification = (id) => {
    // Archive logic
    deleteNotification(id);
  };

  const toggleStar = (id) => {
    // Star logic
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffSeconds = Math.floor((now - notifTime) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBg = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'punch': return FaFingerprint;
      case 'approval': return FaUserCheck;
      case 'salary': return FaMoneyBillWave;
      case 'leave': return FaUmbrellaBeach;
      case 'system': return FaInfoCircle;
      case 'reminder': return FaClock;
      default: return FaBell;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'punch': return 'bg-orange-500';
      case 'approval': return 'bg-green-500';
      case 'salary': return 'bg-blue-500';
      case 'leave': return 'bg-purple-500';
      case 'system': return 'bg-gray-500';
      case 'reminder': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const notifDate = new Date(notification.time).toDateString();
    
    let group;
    if (notifDate === today) group = 'Today';
    else if (notifDate === yesterday) group = 'Yesterday';
    else group = 'Earlier';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBell className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Stay updated with your alerts and approvals
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <FaFilter className="mr-2" />
                Filter
              </button>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaCheck className="mr-2" />
                Mark All Read
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaBell className="text-gray-400 text-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
              </div>
              <FaRegBell className="text-yellow-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Punch Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.punchAlerts}</p>
              </div>
              <FaFingerprint className="text-orange-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approvals</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvalRequests}</p>
              </div>
              <FaUserCheck className="text-green-500 text-xl" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Salary Alerts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.salaryAlerts}</p>
              </div>
              <FaMoneyBillWave className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-lg shadow mb-6 p-4 animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Filter Notifications</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="punch">Punch Alerts</option>
                  <option value="approval">Approval Status</option>
                  <option value="salary">Salary Alerts</option>
                  <option value="leave">Leave Alerts</option>
                  <option value="system">System Updates</option>
                  <option value="reminder">Reminders</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={filters.readStatus}
                  onChange={(e) => setFilters({ ...filters, readStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {(filters.type !== 'all' || filters.readStatus !== 'all' || filters.dateRange !== 'all' || filters.search) && (
              <div className="mt-3 flex items-center">
                <span className="text-xs text-gray-500 mr-2">Active Filters:</span>
                <button
                  onClick={() => setFilters({ type: 'all', readStatus: 'all', dateRange: 'all', search: '' })}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group}>
                  <div className="bg-gray-50 px-6 py-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {group}
                    </h3>
                  </div>
                  {items.map((notification) => {
                    const Icon = notification.icon || getTypeIcon(notification.type);
                    const typeColor = getTypeColor(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                          notification.status === 'unread' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-10 h-10 ${typeColor} bg-opacity-10 rounded-lg flex items-center justify-center mr-3`}>
                            <Icon className={`text-${typeColor.replace('bg-', '')} text-lg`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                {notification.priority && (
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getPriorityBg(notification.priority)} ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </span>
                                )}
                                {notification.status === 'unread' && (
                                  <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {getTimeAgo(notification.time)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>

                            {/* Metadata */}
                            {notification.metadata && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {Object.entries(notification.metadata).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                              {notification.actionable && (
                                <button
                                  onClick={() => window.location.href = notification.actionUrl}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {notification.actionLabel || 'View Details'}
                                </button>
                              )}
                              
                              {notification.status === 'unread' && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Mark as read
                                </button>
                              )}

                              <button
                                onClick={() => archiveNotification(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Archive
                              </button>

                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="ml-4 flex items-start space-x-1">
                            <button
                              onClick={() => toggleStar(notification.id)}
                              className="p-1 text-gray-400 hover:text-yellow-500"
                            >
                              <FaRegStar />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedNotification(notification);
                                setShowDetails(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaRegBell className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  <FaDownload className="inline mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${getTypeColor(selectedNotification.type)} bg-opacity-10 rounded-lg flex items-center justify-center mr-3`}>
                    {React.createElement(selectedNotification.icon || getTypeIcon(selectedNotification.type), { 
                      className: `text-${getTypeColor(selectedNotification.type).replace('bg-', '')} text-xl` 
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h3>
                    <p className="text-sm text-gray-500">{selectedNotification.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Received</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedNotification.time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className={`text-sm font-medium capitalize ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </p>
                  </div>
                </div>

                {selectedNotification.metadata && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Details</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  {selectedNotification.actionable && (
                    <button
                      onClick={() => window.location.href = selectedNotification.actionUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {selectedNotification.actionLabel || 'Take Action'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;