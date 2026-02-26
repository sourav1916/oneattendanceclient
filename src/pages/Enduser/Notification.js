import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'leave', 'warning', 'info'

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dummy notifications data
      const dummyNotifications = [
        {
          id: 1,
          type: 'leave_approved',
          category: 'leave',
          title: 'Leave Request Approved',
          message: 'Your annual leave request for Feb 15-20 has been approved by Sarah Johnson.',
          time: '2 hours ago',
          timestamp: '2024-02-26T10:30:00',
          read: false,
          priority: 'high',
          actionRequired: false,
          details: {
            leaveType: 'Annual Leave',
            duration: '5 days',
            dates: 'Feb 15 - Feb 20, 2024'
          }
        },
        {
          id: 2,
          type: 'leave_rejected',
          category: 'leave',
          title: 'Leave Request Rejected',
          message: 'Your work from home request for Feb 8-9 has been rejected. Please coordinate with your team.',
          time: '1 day ago',
          timestamp: '2024-02-25T14:20:00',
          read: false,
          priority: 'high',
          actionRequired: true,
          details: {
            leaveType: 'Work From Home',
            duration: '2 days',
            dates: 'Feb 8 - Feb 9, 2024',
            reason: 'Team coordination needed'
          }
        },
        {
          id: 3,
          type: 'late_warning',
          category: 'warning',
          title: 'Late Check-in Warning',
          message: 'You checked in late today at 9:30 AM. Regular start time is 9:00 AM.',
          time: '3 hours ago',
          timestamp: '2024-02-26T09:30:00',
          read: true,
          priority: 'medium',
          actionRequired: false,
          details: {
            checkInTime: '9:30 AM',
            expectedTime: '9:00 AM',
            lateBy: '30 minutes'
          }
        },
        {
          id: 4,
          type: 'leave_approved',
          category: 'leave',
          title: 'Sick Leave Approved',
          message: 'Your sick leave request for Feb 5-6 has been approved. Take care!',
          time: '3 days ago',
          timestamp: '2024-02-23T11:15:00',
          read: true,
          priority: 'medium',
          actionRequired: false,
          details: {
            leaveType: 'Sick Leave',
            duration: '2 days',
            dates: 'Feb 5 - Feb 6, 2024'
          }
        },
        {
          id: 5,
          type: 'leave_rejected',
          category: 'leave',
          title: 'Leave Request Rejected',
          message: 'Your personal leave request for Feb 25 has been rejected due to team capacity.',
          time: '4 days ago',
          timestamp: '2024-02-22T16:45:00',
          read: true,
          priority: 'medium',
          actionRequired: false,
          details: {
            leaveType: 'Personal Leave',
            duration: '1 day',
            dates: 'Feb 25, 2024',
            reason: 'Team capacity'
          }
        },
        {
          id: 6,
          type: 'late_warning',
          category: 'warning',
          title: 'Second Late Warning',
          message: 'This is your second late check-in this month. Please maintain regular attendance.',
          time: '1 week ago',
          timestamp: '2024-02-19T09:45:00',
          read: true,
          priority: 'high',
          actionRequired: true,
          details: {
            checkInTime: '9:45 AM',
            expectedTime: '9:00 AM',
            lateBy: '45 minutes',
            warningsCount: 2
          }
        },
        {
          id: 7,
          type: 'leave_approved',
          category: 'leave',
          title: 'Annual Leave Approved',
          message: 'Your annual leave request for March 10-20 has been approved. Enjoy your trip!',
          time: '1 week ago',
          timestamp: '2024-02-18T09:00:00',
          read: false,
          priority: 'low',
          actionRequired: false,
          details: {
            leaveType: 'Annual Leave',
            duration: '10 days',
            dates: 'Mar 10 - Mar 20, 2024'
          }
        },
        {
          id: 8,
          type: 'leave_approved',
          category: 'leave',
          title: 'Maternity Leave Approved',
          message: 'Your maternity leave request has been approved by HR department.',
          time: '2 weeks ago',
          timestamp: '2024-02-12T13:20:00',
          read: true,
          priority: 'high',
          actionRequired: false,
          details: {
            leaveType: 'Maternity Leave',
            duration: '90 days',
            dates: 'Mar 1 - May 30, 2024'
          }
        },
        {
          id: 9,
          type: 'info',
          category: 'info',
          title: 'Profile Update Reminder',
          message: 'Please update your emergency contact information in your profile.',
          time: '2 days ago',
          timestamp: '2024-02-24T10:00:00',
          read: false,
          priority: 'low',
          actionRequired: true,
          details: {
            task: 'Update emergency contact',
            deadline: 'Mar 1, 2024'
          }
        },
        {
          id: 10,
          type: 'info',
          category: 'info',
          title: 'Timesheet Reminder',
          message: 'Please submit your timesheet for the current week by Friday.',
          time: '1 day ago',
          timestamp: '2024-02-25T08:00:00',
          read: true,
          priority: 'medium',
          actionRequired: true,
          details: {
            task: 'Submit timesheet',
            deadline: 'Feb 28, 2024'
          }
        }
      ];

      setNotifications(dummyNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  // Filter notifications
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Filter by read/unread
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.category === selectedType);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Get notification styles based on type and priority
  const getNotificationStyles = (notification) => {
    const baseStyles = {
      container: 'relative overflow-hidden',
      indicator: '',
      badge: ''
    };

    // Type-based styling
    if (notification.type.includes('approved')) {
      baseStyles.indicator = 'bg-green-500';
      baseStyles.badge = 'bg-green-100 text-green-700 border-green-200';
    } else if (notification.type.includes('rejected')) {
      baseStyles.indicator = 'bg-rose-500';
      baseStyles.badge = 'bg-rose-100 text-rose-700 border-rose-200';
    } else if (notification.type.includes('warning')) {
      baseStyles.indicator = 'bg-amber-500';
      baseStyles.badge = 'bg-amber-100 text-amber-700 border-amber-200';
    } else {
      baseStyles.indicator = 'bg-blue-500';
      baseStyles.badge = 'bg-blue-100 text-blue-700 border-blue-200';
    }

    // Priority-based border
    if (notification.priority === 'high') {
      baseStyles.container += ' border-l-4 border-l-rose-500';
    } else if (notification.priority === 'medium') {
      baseStyles.container += ' border-l-4 border-l-amber-500';
    }

    return baseStyles;
  };

  // Get category label
  const getCategoryLabel = (category) => {
    switch(category) {
      case 'leave': return 'Leave';
      case 'warning': return 'Warning';
      case 'info': return 'Information';
      default: return category;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-slate-200 rounded-lg mb-8 animate-pulse"></div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse"></div>
            ))}
          </div>
          
          {/* Filters skeleton */}
          <div className="h-16 bg-white rounded-2xl mb-6 animate-pulse"></div>
          
          {/* Notifications list skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                Notifications
              </span>
            </h1>
            <p className="text-slate-600">Stay updated with your latest alerts</p>
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Mark all as read
            </motion.button>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Total Notifications</p>
            <p className="text-3xl font-bold text-slate-800">{notifications.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Unread</p>
            <p className="text-3xl font-bold text-amber-600">{unreadCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Require Action</p>
            <p className="text-3xl font-bold text-rose-600">
              {notifications.filter(n => n.actionRequired && !n.read).length}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Read/Unread filter */}
            <div className="flex-1">
              <label className="block text-sm text-slate-500 mb-2">Filter by status</label>
              <div className="flex gap-2">
                {['all', 'unread', 'read'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                      filter === option
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex-1">
              <label className="block text-sm text-slate-500 mb-2">Filter by type</label>
              <div className="flex gap-2">
                {['all', 'leave', 'warning', 'info'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedType(option)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                      selectedType === option
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option === 'all' ? 'All' : getCategoryLabel(option)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => {
              const styles = getNotificationStyles(notification);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${styles.container}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-3 h-3 rounded-full ${styles.indicator} ${
                        !notification.read ? 'animate-pulse' : ''
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {notification.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${styles.badge}`}>
                            {getCategoryLabel(notification.category)}
                          </span>
                          {notification.priority === 'high' && (
                            <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                              High Priority
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-400">{notification.time}</span>
                      </div>

                      <p className="text-slate-600 mb-3">{notification.message}</p>

                      {/* Details section */}
                      {notification.details && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(notification.details).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-xs text-slate-400 capitalize mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-sm font-medium text-slate-700">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-3">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        {notification.actionRequired && (
                          <button className="text-sm bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors">
                            Take Action
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-sm text-slate-400 hover:text-slate-600"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {filteredNotifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-2xl border border-slate-100"
            >
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No notifications</h3>
              <p className="text-slate-500">You're all caught up!</p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-slate-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Notifications;