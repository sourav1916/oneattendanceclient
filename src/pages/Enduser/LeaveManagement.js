import React, { useState, useEffect } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineOfficeBuilding,
  HiOutlineHeart,
  HiOutlineBriefcase,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineEmojiHappy,
  HiOutlineBan,
  HiOutlineFlag
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveManagement = () => {
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [summary, setSummary] = useState({
    totalLeaves: 20,
    usedLeaves: 8,
    pendingLeaves: 2,
    approvedLeaves: 6,
    rejectedLeaves: 1,
    remainingLeaves: 12
  });

  // Form state
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Leave types with icons (using available icons)
  const leaveTypes = [
    { id: 'annual', label: 'Annual Leave', icon: HiOutlineFlag, color: 'blue', days: 20 },
    { id: 'sick', label: 'Sick Leave', icon: HiOutlineHeart, color: 'rose', days: 10 },
    { id: 'personal', label: 'Personal Leave', icon: HiOutlineUserGroup, color: 'purple', days: 5 },
    { id: 'workFromHome', label: 'Work From Home', icon: HiOutlineHome, color: 'amber', days: 10 },
    { id: 'unpaid', label: 'Unpaid Leave', icon: HiOutlineBriefcase, color: 'slate', days: 30 },
    { id: 'bereavement', label: 'Bereavement Leave', icon: HiOutlineEmojiHappy, color: 'indigo', days: 5 },
    { id: 'maternity', label: 'Maternity/Paternity', icon: HiOutlineOfficeBuilding, color: 'pink', days: 90 },
    { id: 'other', label: 'Other Leave', icon: HiOutlineDocumentText, color: 'cyan', days: 10 }
  ];

  // Generate dummy leave data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const dummyRequests = [
        {
          id: 1,
          type: 'annual',
          startDate: '2024-02-15',
          endDate: '2024-02-20',
          days: 5,
          reason: 'Family vacation to Hawaii',
          status: 'approved',
          appliedOn: '2024-01-10',
          approvedBy: 'Sarah Johnson',
          comments: 'Enjoy your vacation!'
        },
        {
          id: 2,
          type: 'sick',
          startDate: '2024-02-05',
          endDate: '2024-02-06',
          days: 2,
          reason: 'Flu and fever',
          status: 'approved',
          appliedOn: '2024-02-04',
          approvedBy: 'Michael Chen'
        },
        {
          id: 3,
          type: 'personal',
          startDate: '2024-02-25',
          endDate: '2024-02-25',
          days: 1,
          reason: 'Doctor appointment',
          status: 'pending',
          appliedOn: '2024-02-20'
        },
        {
          id: 4,
          type: 'annual',
          startDate: '2024-03-10',
          endDate: '2024-03-20',
          days: 10,
          reason: 'Europe trip',
          status: 'pending',
          appliedOn: '2024-02-15'
        },
        {
          id: 5,
          type: 'workFromHome',
          startDate: '2024-02-08',
          endDate: '2024-02-09',
          days: 2,
          reason: 'Home appliance repair',
          status: 'rejected',
          appliedOn: '2024-02-01',
          comments: 'Please coordinate with team for WFH'
        },
        {
          id: 6,
          type: 'sick',
          startDate: '2024-01-20',
          endDate: '2024-01-22',
          days: 3,
          reason: 'COVID recovery',
          status: 'approved',
          appliedOn: '2024-01-19',
          approvedBy: 'Emily Rodriguez'
        },
        {
          id: 7,
          type: 'annual',
          startDate: '2024-02-28',
          endDate: '2024-03-01',
          days: 2,
          reason: 'Long weekend getaway',
          status: 'pending',
          appliedOn: '2024-02-18'
        },
        {
          id: 8,
          type: 'bereavement',
          startDate: '2024-01-05',
          endDate: '2024-01-09',
          days: 5,
          reason: 'Family bereavement',
          status: 'approved',
          appliedOn: '2024-01-02',
          approvedBy: 'Sarah Johnson'
        },
        {
          id: 9,
          type: 'maternity',
          startDate: '2024-03-01',
          endDate: '2024-05-30',
          days: 90,
          reason: 'Maternity leave',
          status: 'approved',
          appliedOn: '2024-02-01',
          approvedBy: 'HR Department'
        }
      ];

      setLeaveRequests(dummyRequests);
      setFilteredRequests(dummyRequests);
      
      // Calculate summary based on actual data
      const used = dummyRequests
        .filter(r => r.status === 'approved')
        .reduce((acc, r) => acc + r.days, 0);
      
      setSummary(prev => ({
        ...prev,
        usedLeaves: used,
        pendingLeaves: dummyRequests.filter(r => r.status === 'pending').length,
        approvedLeaves: dummyRequests.filter(r => r.status === 'approved').length,
        rejectedLeaves: dummyRequests.filter(r => r.status === 'rejected').length,
        remainingLeaves: prev.totalLeaves - used
      }));
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...leaveRequests];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [statusFilter, leaveRequests]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Calculate number of days between dates
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.leaveType) {
      errors.leaveType = 'Please select a leave type';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        errors.endDate = 'End date cannot be before start date';
      }
      
      const days = calculateDays(formData.startDate, formData.endDate);
      const selectedType = leaveTypes.find(t => t.id === formData.leaveType);
      
      if (selectedType && days > selectedType.days) {
        errors.days = `Maximum ${selectedType.days} days allowed for ${selectedType.label}`;
      }
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason';
    } else if (formData.reason.length < 10) {
      errors.reason = 'Reason must be at least 10 characters';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const days = calculateDays(formData.startDate, formData.endDate);
    
    const newRequest = {
      id: leaveRequests.length + 1,
      ...formData,
      days,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };
    
    setLeaveRequests(prev => [newRequest, ...prev]);
    setShowApplyForm(false);
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      halfDay: false
    });
    setFormErrors({});
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return {
          icon: HiOutlineCheckCircle,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          label: 'Approved'
        };
      case 'rejected':
        return {
          icon: HiOutlineXCircle,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          label: 'Rejected'
        };
      default:
        return {
          icon: HiOutlineClock,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          label: 'Pending'
        };
    }
  };

  // Get leave type details
  const getLeaveTypeDetails = (typeId) => {
    return leaveTypes.find(t => t.id === typeId) || leaveTypes[0];
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-12 w-64 bg-slate-200 rounded-lg mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/40 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                Leave Management
              </span>
            </h1>
            <p className="text-lg text-slate-600">Apply for leave and track your requests</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowApplyForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Apply for Leave
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Total Leaves</p>
            <p className="text-2xl font-bold text-slate-800">{summary.totalLeaves}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Used</p>
            <p className="text-2xl font-bold text-blue-600">{summary.usedLeaves}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.remainingLeaves}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{summary.pendingLeaves}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white/60 shadow-lg">
            <p className="text-sm text-slate-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.approvedLeaves}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-xl mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineFilter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-700">Filter Requests</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Leave Requests Table */}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Leave Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Days</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Applied On</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((request, index) => {
                  const status = getStatusBadge(request.status);
                  const StatusIcon = status.icon;
                  const type = getLeaveTypeDetails(request.type);
                  const TypeIcon = type.icon;
                  
                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-${type.color}-100 rounded-lg flex items-center justify-center`}>
                            <TypeIcon className={`w-4 h-4 text-${type.color}-600`} />
                          </div>
                          <span className="font-medium text-slate-700">{type.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-700">{request.startDate}</p>
                          <p className="text-slate-400 text-xs">to {request.endDate}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-slate-700">{request.days} day{request.days > 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">{request.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request.appliedOn}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${status.bg} ${status.text} rounded-full text-xs font-medium border ${status.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <HiOutlineCalendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No leave requests found</p>
            </div>
          )}

          {/* Pagination */}
          {filteredRequests.length > 0 && (
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
                        ? 'bg-blue-600 text-white'
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

        {/* Apply Leave Modal */}
        <AnimatePresence>
          {showApplyForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowApplyForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800">Apply for Leave</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Leave Type *
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.leaveType ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select leave type</option>
                      {leaveTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label} ({type.days} days/year)
                        </option>
                      ))}
                    </select>
                    {formErrors.leaveType && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.leaveType}</p>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.startDate ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      />
                      {formErrors.startDate && (
                        <p className="mt-1 text-xs text-rose-600">{formErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.endDate ? 'border-rose-500' : 'border-slate-200'
                        }`}
                      />
                      {formErrors.endDate && (
                        <p className="mt-1 text-xs text-rose-600">{formErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Days count and validation */}
                  {formData.startDate && formData.endDate && !formErrors.endDate && (
                    <div className={`rounded-xl p-4 ${
                      formErrors.days ? 'bg-rose-50' : 'bg-blue-50'
                    }`}>
                      <p className={`text-sm ${
                        formErrors.days ? 'text-rose-700' : 'text-blue-700'
                      }`}>
                        Total days: <span className="font-bold">
                          {calculateDays(formData.startDate, formData.endDate)} day(s)
                        </span>
                      </p>
                      {formErrors.days && (
                        <p className="mt-1 text-xs text-rose-600">{formErrors.days}</p>
                      )}
                    </div>
                  )}

                  {/* Half day option */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="halfDay"
                      id="halfDay"
                      checked={formData.halfDay}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="halfDay" className="text-sm text-slate-700">
                      Half day leave
                    </label>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reason for Leave *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Please provide a reason for your leave request..."
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                        formErrors.reason ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    />
                    {formErrors.reason && (
                      <p className="mt-1 text-xs text-rose-600">{formErrors.reason}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leave Balance Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {leaveTypes.slice(0, 4).map(type => {
            const TypeIcon = type.icon;
            return (
              <div key={type.id} className="bg-white/60 backdrop-blur rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 bg-${type.color}-100 rounded-lg flex items-center justify-center`}>
                    <TypeIcon className={`w-4 h-4 text-${type.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{type.label}</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{type.days} days</p>
                <p className="text-xs text-slate-500">Annual quota</p>
              </div>
            );
          })}
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

export default LeaveManagement;