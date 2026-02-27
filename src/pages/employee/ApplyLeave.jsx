import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaUmbrellaBeach,
  FaBriefcaseMedical,
  FaHeart,
  FaBaby,
  FaGraduationCap,
  FaPlane,
  FaHome,
  FaFileAlt,
  FaUpload,
  FaPaperPlane,
  FaTimesCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaClock,
  FaUserTie,
  FaCommentDots,
  FaExclamationTriangle,
  FaPlusCircle,
  FaMinusCircle
} from 'react-icons/fa';

const ApplyLeave = () => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    halfDay: false,
    halfDayType: 'first', // first, second
    reason: '',
    contactNumber: '',
    alternateContact: '',
    emergencyContact: '',
    addressDuringLeave: '',
    handoverNotes: '',
    documents: [],
    notifyTo: []
  });

  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [availableLeaves, setAvailableLeaves] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [overlapWarning, setOverlapWarning] = useState(false);

  // Mock leave types with balances
  const leaveTypes = [
    {
      id: 'annual',
      label: 'Annual Leave',
      icon: FaUmbrellaBeach,
      color: 'blue',
      description: 'Planned time off for vacation or personal time',
      balance: 15,
      total: 20,
      minDays: 1,
      maxDays: 20,
      requiresApproval: true,
      allowHalfDay: true
    },
    {
      id: 'sick',
      label: 'Sick Leave',
      icon: FaBriefcaseMedical,
      color: 'red',
      description: 'Medical leave for illness or health concerns',
      balance: 8,
      total: 12,
      minDays: 0.5,
      maxDays: 5,
      requiresApproval: true,
      allowHalfDay: true,
      requireDocument: true
    },
    {
      id: 'casual',
      label: 'Casual Leave',
      icon: FaHome,
      color: 'green',
      description: 'Short leave for personal reasons',
      balance: 5,
      total: 8,
      minDays: 0.5,
      maxDays: 3,
      requiresApproval: true,
      allowHalfDay: true
    },
    {
      id: 'bereavement',
      label: 'Bereavement Leave',
      icon: FaHeart,
      color: 'purple',
      description: 'Leave due to demise of family member',
      balance: 3,
      total: 3,
      minDays: 1,
      maxDays: 3,
      requiresApproval: true,
      allowHalfDay: false
    },
    {
      id: 'maternity',
      label: 'Maternity Leave',
      icon: FaBaby,
      color: 'pink',
      description: 'Leave for childbirth and childcare',
      balance: 180,
      total: 180,
      minDays: 60,
      maxDays: 180,
      requiresApproval: true,
      allowHalfDay: false,
      requireDocument: true
    },
    {
      id: 'paternity',
      label: 'Paternity Leave',
      icon: FaBaby,
      color: 'blue',
      description: 'Leave for fathers after childbirth',
      balance: 15,
      total: 15,
      minDays: 5,
      maxDays: 15,
      requiresApproval: true,
      allowHalfDay: false
    },
    {
      id: 'study',
      label: 'Study Leave',
      icon: FaGraduationCap,
      color: 'indigo',
      description: 'Leave for educational purposes',
      balance: 10,
      total: 10,
      minDays: 1,
      maxDays: 10,
      requiresApproval: true,
      allowHalfDay: true,
      requireDocument: true
    },
    {
      id: 'unpaid',
      label: 'Unpaid Leave',
      icon: FaMinusCircle,
      color: 'gray',
      description: 'Leave without pay when no balance available',
      balance: 'N/A',
      total: 'Unlimited',
      minDays: 1,
      maxDays: 30,
      requiresApproval: true,
      allowHalfDay: true
    }
  ];

  // Mock team members for notification
  useEffect(() => {
    setTeamMembers([
      { id: 1, name: 'John Manager', role: 'Manager', email: 'john@company.com' },
      { id: 2, name: 'Sarah Team Lead', role: 'Team Lead', email: 'sarah@company.com' },
      { id: 3, name: 'Mike HR', role: 'HR', email: 'mike@company.com' },
      { id: 4, name: 'Lisa Colleague', role: 'Team Member', email: 'lisa@company.com' }
    ]);
  }, []);

  // Load leave balance
  useEffect(() => {
    setLeaveBalance({
      annual: { taken: 5, remaining: 15, total: 20 },
      sick: { taken: 4, remaining: 8, total: 12 },
      casual: { taken: 3, remaining: 5, total: 8 }
    });
  }, []);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      let days = diffDays;
      if (formData.halfDay) {
        days = days - 0.5;
      }
      
      setCalculatedDays(days);
      
      // Check for weekend overlap warning
      let weekendCount = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0 || d.getDay() === 6) {
          weekendCount++;
        }
      }
      setOverlapWarning(weekendCount > 0);
    } else {
      setCalculatedDays(0);
    }
  }, [formData.startDate, formData.endDate, formData.halfDay]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select leave type';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.length < 20) {
      newErrors.reason = 'Please provide a detailed reason (minimum 20 characters)';
    }

    if (formData.contactNumber && !/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid 10-digit mobile number';
    }

    // Check leave balance
    if (formData.leaveType && leaveBalance && formData.leaveType !== 'unpaid') {
      const selectedLeave = leaveTypes.find(l => l.id === formData.leaveType);
      if (selectedLeave && calculatedDays > selectedLeave.balance) {
        newErrors.balance = `Insufficient balance. Available: ${selectedLeave.balance} days`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create leave request object
    const leaveRequest = {
      id: Date.now(),
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      ...formData,
      days: calculatedDays,
      status: 'pending',
      appliedOn: new Date().toISOString(),
      documents: selectedFiles,
      history: [
        {
          date: new Date().toISOString(),
          action: 'Applied',
          by: 'John Doe',
          comments: 'Leave application submitted'
        }
      ]
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
    localStorage.setItem('leaveRequests', JSON.stringify([leaveRequest, ...existing]));

    setSuccess(true);
    setLoading(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSuccess(false);
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        halfDay: false,
        halfDayType: 'first',
        reason: '',
        contactNumber: '',
        alternateContact: '',
        emergencyContact: '',
        addressDuringLeave: '',
        handoverNotes: '',
        documents: [],
        notifyTo: []
      });
      setStep(1);
      setSelectedFiles([]);
    }, 3000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files.map(f => f.name)]);
  };

  const removeFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileName));
  };

  const handleNotifyToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      notifyTo: prev.notifyTo.includes(memberId)
        ? prev.notifyTo.filter(id => id !== memberId)
        : [...prev.notifyTo, memberId]
    }));
  };

  const getLeaveTypeIcon = (typeId) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type ? type.icon : FaUmbrellaBeach;
  };

  const getLeaveTypeColor = (typeId) => {
    const type = leaveTypes.find(t => t.id === typeId);
    return type ? type.color : 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center">
              <FaUmbrellaBeach className="text-xl sm:text-2xl md:text-3xl text-blue-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Apply for Leave</h1>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500">
                  Submit your leave request for approval
                </p>
              </div>
            </div>

            {/* Leave Balance Summary - Mobile Optimized */}
            {leaveBalance && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Annual</p>
                  <p className="text-sm sm:text-base font-bold text-blue-600">{leaveBalance.annual.remaining}d</p>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Sick</p>
                  <p className="text-sm sm:text-base font-bold text-red-600">{leaveBalance.sick.remaining}d</p>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Casual</p>
                  <p className="text-sm sm:text-base font-bold text-green-600">{leaveBalance.casual.remaining}d</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="mx-auto px-2 py-4 sm:py-6 md:py-8">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaCheckCircle className="text-2xl sm:text-3xl md:text-4xl text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 mb-2">Leave Request Submitted!</h2>
            <p className="text-sm sm:text-base text-green-600 mb-3 sm:mb-4">Your leave request has been sent for approval.</p>
            <p className="text-xs sm:text-sm text-gray-500">You will be notified once it's reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Progress Steps - Mobile Optimized */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <span className="text-xs sm:text-sm">{s}</span>
                    </div>
                    <span className={`hidden sm:block ml-1 sm:ml-2 text-xs sm:text-sm font-medium ${
                      step >= s ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {s === 1 && 'Details'}
                      {s === 2 && 'Additional'}
                      {s === 3 && 'Review'}
                    </span>
                    {s < 3 && (
                      <div className={`flex-1 h-0.5 mx-1 sm:mx-2 md:mx-4 ${
                        step > s ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Leave Details - Mobile Optimized */}
            {step === 1 && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Leave Details</h3>

                {/* Leave Type Selection - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {leaveTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.leaveType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setFormData({ ...formData, leaveType: type.id })}
                          className={`p-2 sm:p-3 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? `border-${type.color}-500 bg-${type.color}-50`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`p-1.5 sm:p-2 rounded-lg bg-${type.color}-100 text-${type.color}-600 inline-block mb-1 sm:mb-2`}>
                            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.balance}d left</p>
                        </div>
                      );
                    })}
                  </div>
                  {errors.leaveType && (
                    <p className="mt-1 text-xs text-red-500">{errors.leaveType}</p>
                  )}
                </div>

                {/* Date Selection - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Half Day Option - Mobile Optimized */}
                {formData.leaveType && leaveTypes.find(t => t.id === formData.leaveType)?.allowHalfDay && (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-2 sm:mb-3">
                      <input
                        type="checkbox"
                        id="halfDay"
                        checked={formData.halfDay}
                        onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                        className="mr-2 w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <label htmlFor="halfDay" className="text-xs sm:text-sm font-medium text-gray-700">
                        Apply for Half Day
                      </label>
                    </div>
                    
                    {formData.halfDay && (
                      <div className="flex flex-col xs:flex-row gap-2 xs:gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="halfDayType"
                            value="first"
                            checked={formData.halfDayType === 'first'}
                            onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                            className="mr-2 w-3 h-3 sm:w-4 sm:h-4"
                          />
                          <span className="text-xs sm:text-sm text-gray-600">First Half</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="halfDayType"
                            value="second"
                            checked={formData.halfDayType === 'second'}
                            onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                            className="mr-2 w-3 h-3 sm:w-4 sm:h-4"
                          />
                          <span className="text-xs sm:text-sm text-gray-600">Second Half</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Days Calculation - Mobile Optimized */}
                {calculatedDays > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-blue-600 mr-2 text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm text-blue-800">Total Leave Days</span>
                      </div>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800">{calculatedDays}</span>
                    </div>
                    {overlapWarning && (
                      <p className="text-xs text-orange-600 mt-1 sm:mt-2 flex items-center">
                        <FaExclamationTriangle className="mr-1 text-xs" />
                        Includes weekends
                      </p>
                    )}
                    {errors.balance && (
                      <p className="text-xs text-red-600 mt-1 sm:mt-2">{errors.balance}</p>
                    )}
                  </div>
                )}

                {/* Reason - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows="3"
                    placeholder="Detailed reason..."
                    className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reason && (
                    <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.reason.length}/500
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Additional Info
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Additional Information - Mobile Optimized */}
            {step === 2 && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Additional Information</h3>

                {/* Contact Information - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="10-digit mobile"
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Alternate Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.alternateContact}
                      onChange={(e) => setFormData({ ...formData, alternateContact: e.target.value })}
                      placeholder="Alternate"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Emergency Contact - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency number"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address During Leave - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Address During Leave
                  </label>
                  <textarea
                    value={formData.addressDuringLeave}
                    onChange={(e) => setFormData({ ...formData, addressDuringLeave: e.target.value })}
                    rows="2"
                    placeholder="Where will you be?"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Handover Notes - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Work Handover Notes
                  </label>
                  <textarea
                    value={formData.handoverNotes}
                    onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                    rows="2"
                    placeholder="Work handover details..."
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Document Upload - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Supporting Documents
                    {leaveTypes.find(t => t.id === formData.leaveType)?.requireDocument && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <FaUpload className="text-gray-400 text-base sm:text-xl mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm text-gray-600 text-center">
                        Click to upload
                      </span>
                      <span className="text-xs text-gray-400 mt-0.5 sm:mt-1 text-center">
                        PDF, JPG, PNG (Max 5MB)
                      </span>
                    </label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1 sm:space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-1.5 sm:p-2 rounded">
                          <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[150px] sm:max-w-none">{file}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimesCircle className="text-xs sm:text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notify Team Members - Mobile Optimized */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Notify Team Members
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.notifyTo.includes(member.id)}
                          onChange={() => handleNotifyToggle(member.id)}
                          className="mr-2 w-3 h-3 sm:w-4 sm:h-4"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit - Mobile Optimized */}
            {step === 3 && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Review Your Application</h3>

                {/* Leave Summary Card - Mobile Optimized */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 sm:p-5 md:p-6 text-white">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center min-w-0">
                      {formData.leaveType && (
                        <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                          {React.createElement(getLeaveTypeIcon(formData.leaveType), { className: "text-sm sm:text-base md:text-xl" })}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs opacity-80">Leave Type</p>
                        <p className="text-sm sm:text-base md:text-xl font-bold truncate">
                          {leaveTypes.find(t => t.id === formData.leaveType)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs opacity-80">Days</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold">{calculatedDays}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <p className="text-xs opacity-80">From</p>
                      <p className="text-xs sm:text-sm font-medium">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">To</p>
                      <p className="text-xs sm:text-sm font-medium">{new Date(formData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {formData.halfDay && (
                    <div className="mt-2">
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 sm:px-3 sm:py-1 rounded">
                        Half Day ({formData.halfDayType === 'first' ? 'First' : 'Second'})
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Summary - Mobile Optimized */}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-xs sm:text-sm text-gray-800 mt-1 break-words">{formData.reason}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="text-xs sm:text-sm text-gray-800">{formData.contactNumber || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Alternate</p>
                      <p className="text-xs sm:text-sm text-gray-800">{formData.alternateContact || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Address During Leave</p>
                    <p className="text-xs sm:text-sm text-gray-800 break-words">{formData.addressDuringLeave || 'Not provided'}</p>
                  </div>
                </div>

                {/* Documents Summary - Mobile Optimized */}
                {selectedFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Attached Documents</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedFiles.map((file, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded max-w-full truncate">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification Summary - Mobile Optimized */}
                {formData.notifyTo.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Will Notify</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {formData.notifyTo.map(id => {
                        const member = teamMembers.find(m => m.id === id);
                        return member && (
                          <span key={id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {member.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Terms and Conditions - Mobile Optimized */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                    <div>
                      <p className="text-xs sm:text-sm text-yellow-800 mb-1 sm:mb-2">
                        Please confirm:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-0.5 sm:space-y-1">
                        <li>• Information is accurate</li>
                        <li>• Work handover completed</li>
                        <li>• Will be available on contact</li>
                        <li>• Subject to approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                        <span className="text-xs sm:text-sm">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2 text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm">Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ApplyLeave;