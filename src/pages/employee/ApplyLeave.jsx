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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUmbrellaBeach className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Submit your leave request for approval
                </p>
              </div>
            </div>

            {/* Leave Balance Summary */}
            {leaveBalance && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Annual Leave</p>
                  <p className="text-lg font-bold text-blue-600">{leaveBalance.annual.remaining} days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Sick Leave</p>
                  <p className="text-lg font-bold text-red-600">{leaveBalance.sick.remaining} days</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Casual Leave</p>
                  <p className="text-lg font-bold text-green-600">{leaveBalance.casual.remaining} days</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Leave Request Submitted!</h2>
            <p className="text-green-600 mb-4">Your leave request has been sent for approval.</p>
            <p className="text-sm text-gray-500">You will be notified once it's reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {s}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      step >= s ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {s === 1 && 'Leave Details'}
                      {s === 2 && 'Additional Info'}
                      {s === 3 && 'Review & Submit'}
                    </span>
                    {s < 3 && <div className={`w-16 h-0.5 mx-4 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Leave Details */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Leave Details</h3>

                {/* Leave Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {leaveTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.leaveType === type.id;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setFormData({ ...formData, leaveType: type.id })}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? `border-${type.color}-500 bg-${type.color}-50`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-${type.color}-100 text-${type.color}-600 inline-block mb-2`}>
                            <Icon />
                          </div>
                          <p className="text-sm font-medium text-gray-800">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.balance} days left</p>
                        </div>
                      );
                    })}
                  </div>
                  {errors.leaveType && (
                    <p className="mt-1 text-xs text-red-500">{errors.leaveType}</p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Half Day Option */}
                {formData.leaveType && leaveTypes.find(t => t.id === formData.leaveType)?.allowHalfDay && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="halfDay"
                        checked={formData.halfDay}
                        onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="halfDay" className="text-sm font-medium text-gray-700">
                        Apply for Half Day
                      </label>
                    </div>
                    
                    {formData.halfDay && (
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="halfDayType"
                            value="first"
                            checked={formData.halfDayType === 'first'}
                            onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">First Half</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="halfDayType"
                            value="second"
                            checked={formData.halfDayType === 'second'}
                            onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Second Half</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Days Calculation */}
                {calculatedDays > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-blue-600 mr-2" />
                        <span className="text-sm text-blue-800">Total Leave Days</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-800">{calculatedDays}</span>
                    </div>
                    {overlapWarning && (
                      <p className="text-xs text-orange-600 mt-2 flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        Includes {overlapWarning ? 'weekends' : ''}. Weekends may not count as leave days.
                      </p>
                    )}
                    {errors.balance && (
                      <p className="text-xs text-red-600 mt-2">{errors.balance}</p>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Leave <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows="4"
                    placeholder="Please provide detailed reason for your leave request..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reason && (
                    <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.reason.length}/500 characters
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Additional Info
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Additional Information */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Additional Information</h3>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="10-digit mobile number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternate Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.alternateContact}
                      onChange={(e) => setFormData({ ...formData, alternateContact: e.target.value })}
                      placeholder="Alternate number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address During Leave */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address During Leave
                  </label>
                  <textarea
                    value={formData.addressDuringLeave}
                    onChange={(e) => setFormData({ ...formData, addressDuringLeave: e.target.value })}
                    rows="2"
                    placeholder="Where will you be during this leave?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Handover Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Handover Notes
                  </label>
                  <textarea
                    value={formData.handoverNotes}
                    onChange={(e) => setFormData({ ...formData, handoverNotes: e.target.value })}
                    rows="3"
                    placeholder="Provide details about work handover, pending tasks, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supporting Documents
                    {leaveTypes.find(t => t.id === formData.leaveType)?.requireDocument && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                      <FaUpload className="text-gray-400 text-xl mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PDF, JPG, PNG, DOC (Max 5MB each)
                      </span>
                    </label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-600">{file}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notify Team Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notify Team Members
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers.map(member => (
                      <label key={member.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.notifyTo.includes(member.id)}
                          onChange={() => handleNotifyToggle(member.id)}
                          className="mr-2"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Review & Submit
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Review Your Application</h3>

                {/* Leave Summary Card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {formData.leaveType && (
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                          {React.createElement(getLeaveTypeIcon(formData.leaveType), { className: "text-xl" })}
                        </div>
                      )}
                      <div>
                        <p className="text-sm opacity-80">Leave Type</p>
                        <p className="text-xl font-bold">
                          {leaveTypes.find(t => t.id === formData.leaveType)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-80">Total Days</p>
                      <p className="text-3xl font-bold">{calculatedDays}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs opacity-80">From</p>
                      <p className="font-medium">{new Date(formData.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-80">To</p>
                      <p className="font-medium">{new Date(formData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {formData.halfDay && (
                    <div className="mt-2">
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                        Half Day ({formData.halfDayType === 'first' ? 'First Half' : 'Second Half'})
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-sm text-gray-800 mt-1">{formData.reason}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Contact Number</p>
                    <p className="text-sm text-gray-800">{formData.contactNumber || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Address During Leave</p>
                    <p className="text-sm text-gray-800">{formData.addressDuringLeave || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Work Handover</p>
                    <p className="text-sm text-gray-800">{formData.handoverNotes || 'Not provided'}</p>
                  </div>
                </div>

                {/* Documents Summary */}
                {selectedFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Attached Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notification Summary */}
                {formData.notifyTo.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Will Notify</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.notifyTo.map(id => {
                        const member = teamMembers.find(m => m.id === id);
                        return member && (
                          <span key={id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {member.name} ({member.role})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-800 mb-2">
                        Please confirm the following:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• I have provided accurate information in this application</li>
                        <li>• I have completed necessary work handover</li>
                        <li>• I will be available on provided contact numbers</li>
                        <li>• I understand that leave is subject to approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Submit Application
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