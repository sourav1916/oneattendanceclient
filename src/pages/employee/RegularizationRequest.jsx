import React, { useState, useEffect } from 'react';
import {
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaSignInAlt,
  FaPaperPlane,
  FaTimes,
  FaCheckCircle,
  FaInfoCircle,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaUpload,
  FaCommentDots,
  FaHistory,
  FaChevronRight,
  FaChevronLeft,
  FaTimesCircle
} from 'react-icons/fa';

const RegularizationRequest = () => {
  const [requestType, setRequestType] = useState('missed_punch');
  const [formData, setFormData] = useState({
    date: '',
    punchTime: '',
    expectedTime: '',
    actualTime: '',
    reason: '',
    comments: '',
    supportingDoc: null,
    location: '',
    witness: '',
    shift: 'morning'
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableDates, setAvailableDates] = useState([]);

  // Load recent requests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('regularizationRequests');
    if (saved) {
      setRecentRequests(JSON.parse(saved).slice(0, 3));
    }
    
    // Generate available dates (last 7 days)
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  }, []);

  const requestTypes = [
    {
      id: 'missed_punch',
      label: 'Missed Punch',
      icon: FaClock,
      description: 'Forgot to punch in or out',
      color: 'yellow'
    },
    {
      id: 'wrong_punch',
      label: 'Wrong Punch',
      icon: FaEdit,
      description: 'Incorrect punch time recorded',
      color: 'blue'
    },
    {
      id: 'late_justification',
      label: 'Late Justification',
      icon: FaExclamationTriangle,
      description: 'Explain reason for coming late',
      color: 'orange'
    },
    {
      id: 'early_checkout',
      label: 'Early Checkout',
      icon: FaSignOutAlt,
      description: 'Request for early departure',
      color: 'purple'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    if (formData.reason && formData.reason.length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }
    
    if (requestType === 'missed_punch' && !formData.punchTime) {
      newErrors.punchTime = 'Please specify which punch was missed';
    }
    
    if (requestType === 'wrong_punch') {
      if (!formData.actualTime) newErrors.actualTime = 'Actual time is required';
      if (!formData.expectedTime) newErrors.expectedTime = 'Expected time is required';
    }
    
    if (requestType === 'late_justification' && !formData.actualTime) {
      newErrors.actualTime = 'Please enter your actual arrival time';
    }
    
    if (requestType === 'early_checkout' && !formData.expectedTime) {
      newErrors.expectedTime = 'Please enter expected checkout time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const request = {
      id: Date.now(),
      type: requestType,
      ...formData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      requestId: `REQ${Math.floor(Math.random() * 10000)}`.padStart(7, '0')
    };
    
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('regularizationRequests') || '[]');
    localStorage.setItem('regularizationRequests', JSON.stringify([request, ...existing]));
    
    setSuccess(true);
    setSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSuccess(false);
      setFormData({
        date: '',
        punchTime: '',
        expectedTime: '',
        actualTime: '',
        reason: '',
        comments: '',
        supportingDoc: null,
        location: '',
        witness: '',
        shift: 'morning'
      });
      setCurrentStep(1);
    }, 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, supportingDoc: file.name });
    }
  };

  const getTypeIcon = (type) => {
    const found = requestTypes.find(t => t.id === type);
    return found ? found.icon : FaClock;
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex items-center">
            <FaEdit className="text-xl sm:text-2xl md:text-3xl text-blue-600 mr-2 sm:mr-3" />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Regularization Request</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                Submit requests for attendance corrections and justifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 md:py-8">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaCheckCircle className="text-2xl sm:text-3xl md:text-4xl text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-green-800 mb-2">Request Submitted Successfully!</h2>
            <p className="text-sm sm:text-base text-green-600 mb-3 sm:mb-4">Your regularization request has been sent for approval.</p>
            <p className="text-xs sm:text-sm text-gray-500">Request ID: {Date.now().toString().slice(-8)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Request Form - Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Progress Steps - Mobile Optimized */}
                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                        currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        1
                      </div>
                      <span className="hidden sm:block ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Select Type</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 md:mx-4 ${
                      currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                    <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                        currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        2
                      </div>
                      <span className="hidden sm:block ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Details</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 md:mx-4 ${
                      currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                    <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                        currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        3
                      </div>
                      <span className="hidden sm:block ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Submit</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6">
                  {/* Step 1: Request Type Selection */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Select Request Type</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {requestTypes.map((type) => {
                          const Icon = type.icon;
                          const isSelected = requestType === type.id;
                          return (
                            <div
                              key={type.id}
                              onClick={() => setRequestType(type.id)}
                              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? `border-${type.color}-500 bg-${type.color}-50`
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className={`p-1.5 sm:p-2 rounded-lg bg-${type.color}-100 text-${type.color}-600 mr-2 sm:mr-3`}>
                                  <Icon className="text-base sm:text-lg md:text-xl" />
                                </div>
                                <div>
                                  <h4 className="text-sm sm:text-base font-medium text-gray-800">{type.label}</h4>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{type.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-6 sm:mt-8 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Request Details */}
                  {currentStep === 2 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Request Details</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Date Selection */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Date <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              errors.date ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select date</option>
                            {availableDates.map(date => (
                              <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </option>
                            ))}
                          </select>
                          {errors.date && (
                            <p className="mt-1 text-xs text-red-500">{errors.date}</p>
                          )}
                        </div>

                        {/* Shift Selection */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Shift
                          </label>
                          <div className="flex flex-wrap gap-3 sm:gap-4">
                            {['morning', 'afternoon', 'night'].map(shift => (
                              <label key={shift} className="flex items-center">
                                <input
                                  type="radio"
                                  name="shift"
                                  value={shift}
                                  checked={formData.shift === shift}
                                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                  className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4"
                                />
                                <span className="text-xs sm:text-sm text-gray-700 capitalize">{shift}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Dynamic Fields based on request type */}
                        {requestType === 'missed_punch' && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Missed Punch Type
                            </label>
                            <select
                              value={formData.punchTime}
                              onChange={(e) => setFormData({ ...formData, punchTime: e.target.value })}
                              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                                errors.punchTime ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select type</option>
                              <option value="in">Punch In</option>
                              <option value="out">Punch Out</option>
                              <option value="both">Both In & Out</option>
                            </select>
                            {errors.punchTime && (
                              <p className="mt-1 text-xs text-red-500">{errors.punchTime}</p>
                            )}
                          </div>
                        )}

                        {requestType === 'wrong_punch' && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                  Recorded Time
                                </label>
                                <input
                                  type="time"
                                  value={formData.expectedTime}
                                  onChange={(e) => setFormData({ ...formData, expectedTime: e.target.value })}
                                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                                    errors.expectedTime ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors.expectedTime && (
                                  <p className="mt-1 text-xs text-red-500">{errors.expectedTime}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                  Correct Time
                                </label>
                                <input
                                  type="time"
                                  value={formData.actualTime}
                                  onChange={(e) => setFormData({ ...formData, actualTime: e.target.value })}
                                  className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                                    errors.actualTime ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors.actualTime && (
                                  <p className="mt-1 text-xs text-red-500">{errors.actualTime}</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {requestType === 'late_justification' && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Actual Arrival Time
                            </label>
                            <input
                              type="time"
                              value={formData.actualTime}
                              onChange={(e) => setFormData({ ...formData, actualTime: e.target.value })}
                              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                                errors.actualTime ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.actualTime && (
                              <p className="mt-1 text-xs text-red-500">{errors.actualTime}</p>
                            )}
                          </div>
                        )}

                        {requestType === 'early_checkout' && (
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Expected Checkout Time
                            </label>
                            <input
                              type="time"
                              value={formData.expectedTime}
                              onChange={(e) => setFormData({ ...formData, expectedTime: e.target.value })}
                              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
                                errors.expectedTime ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.expectedTime && (
                              <p className="mt-1 text-xs text-red-500">{errors.expectedTime}</p>
                            )}
                          </div>
                        )}

                        {/* Reason */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows="3"
                            placeholder="Please provide detailed reason..."
                            className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg ${
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

                        {/* Location (Optional) */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Location (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Where were you?"
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg"
                          />
                        </div>

                        {/* Witness (Optional) */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Witness (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.witness}
                            onChange={(e) => setFormData({ ...formData, witness: e.target.value })}
                            placeholder="Name of person who can verify"
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg"
                          />
                        </div>

                        {/* Supporting Document */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Supporting Document (Optional)
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            <label
                              htmlFor="file-upload"
                              className="flex flex-col items-center justify-center cursor-pointer"
                            >
                              <FaUpload className="text-gray-400 text-base sm:text-xl mb-1 sm:mb-2" />
                              <span className="text-xs sm:text-sm text-gray-600 text-center">
                                {formData.supportingDoc || 'Click to upload'}
                              </span>
                              <span className="text-xs text-gray-400 mt-1 text-center">
                                PDF, JPG, PNG (Max 5MB)
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Additional Comments */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Additional Comments
                          </label>
                          <textarea
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                            rows="2"
                            placeholder="Any additional information..."
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-8 flex flex-col xs:flex-row gap-2 xs:gap-3 justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="w-full xs:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="w-full xs:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Review Request
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review and Submit */}
                  {currentStep === 3 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Review Your Request</h3>
                      
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className={`p-1.5 sm:p-2 rounded-lg bg-${getTypeColor(requestType)}-100 text-${getTypeColor(requestType)}-600 mr-2 sm:mr-3`}>
                            {React.createElement(getTypeIcon(requestType), { className: "text-base sm:text-lg md:text-xl" })}
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-medium text-gray-800">
                              {requestTypes.find(t => t.id === requestType)?.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500">Request Type</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">
                              {formData.date ? formatDate(formData.date) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Shift</p>
                            <p className="font-medium capitalize">{formData.shift}</p>
                          </div>
                          
                          {formData.punchTime && (
                            <div>
                              <p className="text-gray-500">Missed Punch</p>
                              <p className="font-medium capitalize">{formData.punchTime}</p>
                            </div>
                          )}
                          
                          {formData.expectedTime && (
                            <div>
                              <p className="text-gray-500">Recorded Time</p>
                              <p className="font-medium">{formData.expectedTime}</p>
                            </div>
                          )}
                          
                          {formData.actualTime && (
                            <div>
                              <p className="text-gray-500">
                                {requestType === 'wrong_punch' ? 'Correct Time' : 'Actual Time'}
                              </p>
                              <p className="font-medium">{formData.actualTime}</p>
                            </div>
                          )}
                          
                          {formData.location && (
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium">{formData.location}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 sm:mt-4">
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="text-xs sm:text-sm mt-1">{formData.reason}</p>
                        </div>

                        {formData.comments && (
                          <div className="mt-3 sm:mt-4">
                            <p className="text-xs text-gray-500">Additional Comments</p>
                            <p className="text-xs sm:text-sm mt-1">{formData.comments}</p>
                          </div>
                        )}

                        {formData.supportingDoc && (
                          <div className="mt-3 flex items-center">
                            <FaFileAlt className="text-gray-400 mr-2 text-xs sm:text-sm" />
                            <span className="text-xs sm:text-sm text-gray-600 truncate">{formData.supportingDoc}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex">
                          <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                          <div>
                            <p className="text-xs sm:text-sm text-blue-800">
                              By submitting this request, you confirm that the information provided is accurate. 
                              False information may lead to disciplinary action.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="w-full xs:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full xs:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                              <span className="text-xs sm:text-sm">Submitting...</span>
                            </>
                          ) : (
                            <>
                              <FaPaperPlane className="mr-1 sm:mr-2 text-xs sm:text-sm" />
                              <span className="text-xs sm:text-sm">Submit Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column - Info & Recent Requests */}
            <div className="lg:col-span-1">
              {/* Guidelines */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Guidelines</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start">
                    <FaClock className="text-blue-500 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Submit within 7 days of incident
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Provide detailed reason
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaUpload className="text-purple-500 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Attach supporting documents
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaHistory className="text-orange-500 mt-0.5 mr-2 flex-shrink-0 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      Max 3 pending requests
                    </span>
                  </li>
                </ul>
              </div>

              {/* Recent Requests */}
              {recentRequests.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Recent Requests</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {recentRequests.map((request) => {
                      const Icon = getTypeIcon(request.type);
                      return (
                        <div key={request.id} className="border rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center">
                              <Icon className="text-gray-500 mr-1 sm:mr-2 text-xs sm:text-sm" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                {requestTypes.find(t => t.id === request.type)?.label}
                              </span>
                            </div>
                            <span className="text-[8px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                              Pending
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {formatDate(request.date)}
                          </p>
                          <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                            ID: {request.requestId}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularizationRequest;