import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaUser, FaSearch, FaPlus, FaEye, FaSpinner,
  FaTrash, FaEdit, FaFileAlt, FaCalendarCheck,
  FaEllipsisV, FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Dummy Data
const DUMMY_LEAVES = [
  {
    id: 1,
    leave_type: 'Sick Leave',
    start_date: '2024-04-05',
    end_date: '2024-04-07',
    duration: 3,
    reason: 'Flu and fever, need rest to recover',
    status: 'approved',
    applied_on: '2024-04-01T10:30:00Z',
    approved_by: 'Sarah Johnson',
    approved_on: '2024-04-01T14:20:00Z',
    remarks: 'Get well soon!',
    attachment: null
  },
  {
    id: 2,
    leave_type: 'Casual Leave',
    start_date: '2024-04-15',
    end_date: '2024-04-16',
    duration: 2,
    reason: 'Family function to attend',
    status: 'pending',
    applied_on: '2024-04-01T09:15:00Z',
    approved_by: null,
    approved_on: null,
    remarks: null,
    attachment: null
  },
  {
    id: 3,
    leave_type: 'Annual Leave',
    start_date: '2024-05-20',
    end_date: '2024-05-24',
    duration: 5,
    reason: 'Vacation trip to Goa',
    status: 'pending',
    applied_on: '2024-03-28T16:45:00Z',
    approved_by: null,
    approved_on: null,
    remarks: null,
    attachment: 'vacation-booking.pdf'
  },
  {
    id: 4,
    leave_type: 'Sick Leave',
    start_date: '2024-03-15',
    end_date: '2024-03-15',
    duration: 1,
    reason: 'Doctor appointment',
    status: 'rejected',
    applied_on: '2024-03-14T11:20:00Z',
    approved_by: 'Sarah Johnson',
    approved_on: '2024-03-14T15:30:00Z',
    remarks: 'Please use half-day leave instead',
    attachment: null
  },
  {
    id: 5,
    leave_type: 'Maternity Leave',
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    duration: 90,
    reason: 'Maternity leave',
    status: 'approved',
    applied_on: '2024-03-20T10:00:00Z',
    approved_by: 'HR Department',
    approved_on: '2024-03-21T09:00:00Z',
    remarks: 'Congratulations! All documents verified.',
    attachment: 'medical-certificate.pdf'
  },
  {
    id: 6,
    leave_type: 'Casual Leave',
    start_date: '2024-04-10',
    end_date: '2024-04-10',
    duration: 1,
    reason: 'Personal work',
    status: 'approved',
    applied_on: '2024-04-08T14:30:00Z',
    approved_by: 'Sarah Johnson',
    approved_on: '2024-04-08T16:00:00Z',
    remarks: null,
    attachment: null
  },
  {
    id: 7,
    leave_type: 'Work From Home',
    start_date: '2024-04-12',
    end_date: '2024-04-12',
    duration: 1,
    reason: 'Internet installation at home',
    status: 'pending',
    applied_on: '2024-04-01T08:00:00Z',
    approved_by: null,
    approved_on: null,
    remarks: null,
    attachment: null
  },
  {
    id: 8,
    leave_type: 'Compensatory Off',
    start_date: '2024-04-18',
    end_date: '2024-04-18',
    duration: 1,
    reason: 'Worked on weekend (March 30)',
    status: 'approved',
    applied_on: '2024-03-31T17:00:00Z',
    approved_by: 'Sarah Johnson',
    approved_on: '2024-04-01T09:30:00Z',
    remarks: 'Thanks for the weekend effort!',
    attachment: null
  }
];

const LEAVE_BALANCE = {
  sick_leave: { total: 12, used: 4, remaining: 8 },
  casual_leave: { total: 10, used: 3, remaining: 7 },
  annual_leave: { total: 20, used: 5, remaining: 15 },
  maternity_leave: { total: 180, used: 90, remaining: 90 },
  work_from_home: { total: 24, used: 0, remaining: 24 },
  compensatory_off: { total: 6, used: 1, remaining: 5 }
};

// Helper Components
const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { icon: FaCheckCircle, text: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' };
      case 'rejected':
        return { icon: FaTimesCircle, text: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' };
      case 'pending':
        return { icon: FaClock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'cancelled':
        return { icon: FaTimesCircle, text: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' };
      default:
        return { icon: FaInfoCircle, text: status || 'Unknown', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon size={12} /> {config.text}
    </span>
  );
};

const LeaveTypeBadge = ({ type }) => {
  const getTypeConfig = () => {
    const typeMap = {
      'sick leave': { className: 'bg-red-100 text-red-800', icon: '🤒' },
      'casual leave': { className: 'bg-blue-100 text-blue-800', icon: '🏖️' },
      'annual leave': { className: 'bg-purple-100 text-purple-800', icon: '✈️' },
      'maternity leave': { className: 'bg-pink-100 text-pink-800', icon: '👶' },
      'work from home': { className: 'bg-indigo-100 text-indigo-800', icon: '🏠' },
      'compensatory off': { className: 'bg-green-100 text-green-800', icon: '⚖️' }
    };

    const config = typeMap[type?.toLowerCase()] || { className: 'bg-gray-100 text-gray-700', icon: '📋' };
    return config;
  };

  const config = getTypeConfig();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      <span>{config.icon}</span> {type}
    </span>
  );
};

// Leave Details Modal
const LeaveDetailsModal = ({ leave, onClose }) => {
  if (!leave) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <FaInfoCircle /> Leave Details
            </h2>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition">
              <FaTimesCircle size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Leave Information */}
          <div className="border-b pb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaCalendarAlt className="text-purple-500" /> Leave Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Leave Type</label>
                <div className="mt-1">
                  <LeaveTypeBadge type={leave.leave_type} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <div className="mt-1">
                  <StatusBadge status={leave.status} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Start Date</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDate(leave.start_date)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">End Date</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDate(leave.end_date)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Duration</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">
                  {leave.duration} {leave.duration === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Applied On</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDateTime(leave.applied_on)}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="border-b pb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaFileAlt className="text-purple-500" /> Reason
            </h3>
            <p className="text-gray-700 text-sm sm:text-base bg-gray-50 p-3 rounded-lg">{leave.reason}</p>
          </div>

          {/* Approval Details */}
          {(leave.approved_by || leave.remarks) && (
            <div className="border-b pb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaUser className="text-purple-500" /> Approval Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {leave.approved_by && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Approved/Rejected By</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{leave.approved_by}</p>
                  </div>
                )}
                {leave.approved_on && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">On</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{formatDateTime(leave.approved_on)}</p>
                  </div>
                )}
                {leave.remarks && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 uppercase">Remarks</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {leave.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachment */}
          {leave.attachment && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaFileAlt className="text-purple-500" /> Attachment
              </h3>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <FaFileAlt className="text-purple-500" />
                <span className="text-sm text-gray-700 flex-1 truncate">{leave.attachment}</span>
                <button className="text-purple-600 hover:text-purple-700 text-xs font-medium">
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Leave Card Component for Mobile
const LeaveCard = ({ leave, onViewDetails, onEdit, onDelete, activeMenuId, onToggleMenu, processingId }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <LeaveTypeBadge type={leave.leave_type} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Applied: {formatDate(leave.applied_on)}</p>
        </div>
        <div className="relative flex-shrink-0 ml-2">
          <button
            onClick={() => onToggleMenu(leave.id)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FaEllipsisV size={16} className="text-gray-500" />
          </button>

          {activeMenuId === leave.id && (
            <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => onViewDetails(leave)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-t-xl transition"
              >
                <FaEye size={12} />
                View Details
              </button>
              {leave.status === 'pending' && (
                <>
                  <button
                    onClick={() => onEdit(leave)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition"
                  >
                    <FaEdit size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(leave.id)}
                    disabled={processingId === leave.id}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition"
                  >
                    {processingId === leave.id ? <FaSpinner className="animate-spin" size={12} /> : <FaTrash size={12} />}
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Duration:</span>
          <span className="font-medium text-xs">{leave.duration} {leave.duration === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">From:</span>
          <span className="text-gray-700 text-xs">{formatDate(leave.start_date)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">To:</span>
          <span className="text-gray-700 text-xs">{formatDate(leave.end_date)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Status:</span>
          <StatusBadge status={leave.status} />
        </div>
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600 line-clamp-2">{leave.reason}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Leave Balance Card
const LeaveBalanceCard = ({ type, balance }) => {
  const percentage = (balance.used / balance.total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 capitalize">{type.replace(/_/g, ' ')}</h3>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600">{balance.remaining}</p>
          <p className="text-xs text-gray-500">remaining</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Used: {balance.used}</span>
          <span>Total: {balance.total}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Apply Leave Modal
const ApplyLeaveModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    attachment: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: '',
      attachment: null
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <FaPlus /> Apply for Leave
            </h2>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition">
              <FaTimesCircle size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
              required
            >
              <option value="">Select Leave Type</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Compensatory Off">Compensatory Off</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
              placeholder="Please provide a reason for your leave..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2.5 rounded-lg font-medium transition text-sm"
            >
              Submit Application
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium transition text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main Component
const MyLeaves = () => {
  const [leaves, setLeaves] = useState(DUMMY_LEAVES);
  const [filteredLeaves, setFilteredLeaves] = useState(DUMMY_LEAVES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle window resize
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const showDuration = !isMobile;
  const showAppliedOn = isDesktop;

  // Filter leaves
  useEffect(() => {
    let filtered = leaves;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(leave =>
        leave.leave_type.toLowerCase().includes(search) ||
        leave.reason.toLowerCase().includes(search) ||
        leave.status.toLowerCase().includes(search)
      );
    }

    setFilteredLeaves(filtered);
  }, [leaves, searchTerm, statusFilter]);

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
    setActiveMenuId(null);
  };

  const handleApplyLeave = (formData) => {
    const newLeave = {
      id: leaves.length + 1,
      ...formData,
      duration: Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24)) + 1,
      status: 'pending',
      applied_on: new Date().toISOString(),
      approved_by: null,
      approved_on: null,
      remarks: null,
      attachment: formData.attachment?.name || null
    };

    setLeaves([newLeave, ...leaves]);
    setShowApplyModal(false);
    toast.success('Leave application submitted successfully!');
  };

  const handleDeleteLeave = async (leaveId) => {
    setProcessingId(leaveId);
    
    // Simulate API call
    setTimeout(() => {
      setLeaves(leaves.filter(leave => leave.id !== leaveId));
      setProcessingId(null);
      setActiveMenuId(null);
      toast.success('Leave application deleted successfully');
    }, 1000);
  };

  const handleEditLeave = (leave) => {
    toast.info('Edit functionality coming soon!');
    setActiveMenuId(null);
  };

  const toggleActionMenu = (leaveId) => {
    setActiveMenuId((current) => (current === leaveId ? null : leaveId));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-500 text-base sm:text-xl md:text-2xl" />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    My Leaves
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your leave applications</p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm shadow-lg"
              >
                <FaPlus /> Apply Leave
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarCheck className="text-purple-500 text-sm sm:text-base" />
                  <p className="text-xs text-gray-500 uppercase">Total</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaClock className="text-yellow-500 text-sm sm:text-base" />
                  <p className="text-xs text-gray-500 uppercase">Pending</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaCheckCircle className="text-green-500 text-sm sm:text-base" />
                  <p className="text-xs text-gray-500 uppercase">Approved</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.approved}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FaTimesCircle className="text-red-500 text-sm sm:text-base" />
                  <p className="text-xs text-gray-500 uppercase">Rejected</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Leave Balance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaCalendarCheck className="text-purple-500" /> Leave Balance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(LEAVE_BALANCE).map(([type, balance]) => (
                <LeaveBalanceCard key={type} type={type} balance={balance} />
              ))}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search leaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:w-48"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </motion.div>

          {/* Leaves List */}
          {filteredLeaves.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-10 md:p-12 text-center">
              <FaExclamationTriangle className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base md:text-lg">No leaves found</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop/Tablet Table View */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Leave Type
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Start Date
                          </th>
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            End Date
                          </th>
                          {showDuration && (
                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Duration
                            </th>
                          )}
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          {showAppliedOn && (
                            <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Applied On
                            </th>
                          )}
                          <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLeaves.map((leave) => (
                          <motion.tr
                            key={leave.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <LeaveTypeBadge type={leave.leave_type} />
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {formatDate(leave.start_date)}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {formatDate(leave.end_date)}
                              </div>
                            </td>
                            {showDuration && (
                              <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900">
                                  {leave.duration} {leave.duration === 1 ? 'day' : 'days'}
                                </div>
                              </td>
                            )}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <StatusBadge status={leave.status} />
                            </td>
                            {showAppliedOn && (
                              <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-900">
                                  {formatDateTime(leave.applied_on)}
                                </div>
                              </td>
                            )}
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                              <div className="relative flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => toggleActionMenu(leave.id)}
                                  className="rounded-lg bg-gray-50 p-1.5 sm:p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <FaEllipsisV size={14} />
                                </button>

                                {activeMenuId === leave.id && (
                                  <div className="absolute right-0 top-8 sm:top-10 z-10 w-40 rounded-xl border border-gray-200 bg-white p-1.5 sm:p-2 shadow-xl">
                                    <button
                                      type="button"
                                      onClick={() => handleViewDetails(leave)}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-700 transition hover:bg-blue-50"
                                    >
                                      <FaEye size={12} />
                                      View Details
                                    </button>
                                    {leave.status === 'pending' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleEditLeave(leave)}
                                          className="flex w-full items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-700 transition hover:bg-purple-50"
                                        >
                                          <FaEdit size={12} />
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLeave(leave.id)}
                                          disabled={processingId === leave.id}
                                          className="flex w-full items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                          {processingId === leave.id ? (
                                            <FaSpinner className="animate-spin" size={12} />
                                          ) : (
                                            <FaTrash size={12} />
                                          )}
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Mobile Card View */}
              {isMobile && (
                <div className="space-y-3 sm:space-y-4">
                  {filteredLeaves.map((leave) => (
                    <LeaveCard
                      key={leave.id}
                      leave={leave}
                      onViewDetails={handleViewDetails}
                      onEdit={handleEditLeave}
                      onDelete={handleDeleteLeave}
                      activeMenuId={activeMenuId}
                      onToggleMenu={toggleActionMenu}
                      processingId={processingId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailsModal && selectedLeave && (
          <LeaveDetailsModal
            leave={selectedLeave}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showApplyModal && (
          <ApplyLeaveModal
            isOpen={showApplyModal}
            onClose={() => setShowApplyModal(false)}
            onSubmit={handleApplyLeave}
          />
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" />
    </>
  );
};

export default MyLeaves;