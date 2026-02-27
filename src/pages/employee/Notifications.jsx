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
  FaRegFileAlt,
  FaBars,
  FaTimes
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Handle resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileMenu(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <FaBell className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Notifications
                </h1>
                <p className="hidden sm:block mt-1 text-sm text-gray-500 truncate">
                  Stay updated with your alerts and approvals
                </p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center whitespace-nowrap"
              >
                <FaFilter className="mr-2" />
                Filter
              </button>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap"
              >
                <FaCheck className="mr-2" />
                Mark All Read
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b shadow-lg fixed top-[72px] left-0 right-0 z-30 animate-slideDown">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setShowFilterPanel(!showFilterPanel);
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <FaFilter className="mr-2" />
              Filter
            </button>
            <button
              onClick={() => {
                markAllAsRead();
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FaCheck className="mr-2" />
              Mark All Read
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaBell className="text-gray-400 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Unread</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.unread}</p>
              </div>
              <FaRegBell className="text-yellow-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Punch</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{stats.punchAlerts}</p>
              </div>
              <FaFingerprint className="text-orange-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Approvals</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.approvalRequests}</p>
              </div>
              <FaUserCheck className="text-green-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
          
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Salary</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.salaryAlerts}</p>
              </div>
              <FaMoneyBillWave className="text-blue-500 text-lg sm:text-xl flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Filter Panel - Responsive */}
        {showFilterPanel && (
          <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-4 sm:p-6 animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700">Filter Notifications</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Search - Always visible on mobile */}
              <div className="w-full">
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

              {/* Filter Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group}>
                  <div className="bg-gray-50 px-4 sm:px-6 py-2">
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
                        className={`px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors ${
                          notification.status === 'unread' ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start">
                          {/* Icon - Hidden on very small screens? No, keep it but adjust size */}
                          <div className={`hidden xs:flex flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 ${typeColor} bg-opacity-10 rounded-lg items-center justify-center mr-3 mb-2 sm:mb-0`}>
                            <Icon className={`text-${typeColor.replace('bg-', '')} text-sm sm:text-lg`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 break-words">
                                  {notification.title}
                                </p>
                                {notification.priority && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getPriorityBg(notification.priority)} ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority}
                                  </span>
                                )}
                                {notification.status === 'unread' && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 mt-1 sm:mt-0">
                                {getTimeAgo(notification.time)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-2 break-words">
                              {notification.message}
                            </p>

                            {/* Metadata - Responsive */}
                            {notification.metadata && (
                              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                                {Object.entries(notification.metadata).slice(0, 3).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">
                                    {key}: {value}
                                  </span>
                                ))}
                                {Object.keys(notification.metadata).length > 3 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    +{Object.keys(notification.metadata).length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions - Responsive */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              {notification.actionable && (
                                <button
                                  onClick={() => window.location.href = notification.actionUrl}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                                >
                                  {notification.actionLabel || 'View Details'}
                                </button>
                              )}
                              
                              {notification.status === 'unread' && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                                >
                                  Mark read
                                </button>
                              )}

                              <button
                                onClick={() => archiveNotification(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap"
                              >
                                Archive
                              </button>

                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Quick Actions - Hidden on mobile, shown on hover on desktop */}
                          <div className="hidden sm:flex ml-4 items-start space-x-1">
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
            <div className="text-center py-8 sm:py-12 px-4">
              <FaRegBell className="text-4xl sm:text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm sm:text-base text-gray-500">You're all caught up!</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                Showing {filteredNotifications.length} of {notifications.length}
              </p>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <button className="px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FaDownload className="inline mr-1 text-xs" />
                  <span className="hidden xs:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal - Responsive */}
      {showDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center min-w-0">
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 ${getTypeColor(selectedNotification.type)} bg-opacity-10 rounded-lg flex items-center justify-center mr-3`}>
                    {React.createElement(selectedNotification.icon || getTypeIcon(selectedNotification.type), { 
                      className: `text-${getTypeColor(selectedNotification.type).replace('bg-', '')} text-lg sm:text-xl` 
                    })}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedNotification.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedNotification.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm sm:text-base text-gray-800 break-words">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Received</p>
                    <p className="text-xs sm:text-sm font-medium break-words">
                      {new Date(selectedNotification.time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className={`text-xs sm:text-sm font-medium capitalize ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </p>
                  </div>
                </div>

                {selectedNotification.metadata && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Details</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex flex-col xs:flex-row xs:justify-between text-xs sm:text-sm py-1">
                          <span className="text-gray-600 capitalize break-words">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-gray-900 break-words xs:text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse xs:flex-row xs:justify-end gap-2 xs:gap-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg text-sm sm:text-base"
                  >
                    Close
                  </button>
                  {selectedNotification.actionable && (
                    <button
                      onClick={() => window.location.href = selectedNotification.actionUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
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

      {/* Custom CSS for additional responsive utilities */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:flex {
            display: flex;
          }
          .xs\\:inline {
            display: inline;
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:justify-end {
            justify-content: flex-end;
          }
          .xs\\:text-right {
            text-align: right;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Notifications;