import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaHistory,
  FaCreditCard,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaEye,
  FaPlusCircle,
  FaMinusCircle,
  FaFileInvoice,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPercent,
  FaChartLine,
  FaRupeeSign,
  FaWallet,
  FaBan,
  FaReceipt,
  FaArrowRight,
  FaArrowLeft,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const SalaryAdvance = () => {
  const [advanceData, setAdvanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: '',
    reason: '',
    repaymentMonths: '3',
    urgent: false,
    comments: ''
  });
  const [repayAmount, setRepayAmount] = useState('');
  const [errors, setErrors] = useState({});

  // Handle resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileFilter(false);
        setShowMobileMenu(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load advance data
  useEffect(() => {
    fetchAdvanceData();
  }, []);

  const fetchAdvanceData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockAdvanceData();
      setAdvanceData(mockData);
      setLoading(false);
    }, 1000);
  };

  const generateMockAdvanceData = () => {
    return {
      // Current advance summary
      summary: {
        totalAdvanceTaken: 25000,
        totalRepaid: 8000,
        outstandingBalance: 17000,
        availableLimit: 50000,
        pendingRequests: 1,
        activeAdvances: 2,
        completedAdvances: 3,
        nextDueDate: '2024-04-15',
        nextDueAmount: 2000,
        interestRate: 0,
        maxAdvancePercentage: 50
      },

      // Advance history
      advances: [
        {
          id: 1,
          requestDate: '2024-01-10',
          approvedDate: '2024-01-12',
          amount: 15000,
          repaidAmount: 6000,
          outstandingAmount: 9000,
          status: 'active',
          reason: 'Medical emergency',
          repaymentPeriod: 6,
          monthlyInstallment: 2500,
          nextDueDate: '2024-04-15',
          lastPaymentDate: '2024-03-15',
          lastPaymentAmount: 2500,
          approvedBy: 'HR Manager',
          comments: 'Approved for medical expenses',
          transactions: [
            { date: '2024-02-15', amount: 2500, type: 'repayment', status: 'completed' },
            { date: '2024-03-15', amount: 2500, type: 'repayment', status: 'completed' },
            { date: '2024-01-12', amount: 15000, type: 'disbursement', status: 'completed' }
          ]
        },
        {
          id: 2,
          requestDate: '2024-02-20',
          approvedDate: '2024-02-22',
          amount: 10000,
          repaidAmount: 2000,
          outstandingAmount: 8000,
          status: 'active',
          reason: 'Home renovation',
          repaymentPeriod: 4,
          monthlyInstallment: 2500,
          nextDueDate: '2024-04-10',
          lastPaymentDate: '2024-03-10',
          lastPaymentAmount: 2000,
          approvedBy: 'Finance Team',
          comments: 'Partial payment received',
          transactions: [
            { date: '2024-03-10', amount: 2000, type: 'repayment', status: 'completed' },
            { date: '2024-02-22', amount: 10000, type: 'disbursement', status: 'completed' }
          ]
        },
        {
          id: 3,
          requestDate: '2023-11-05',
          approvedDate: '2023-11-07',
          amount: 20000,
          repaidAmount: 20000,
          outstandingAmount: 0,
          status: 'completed',
          reason: 'Emergency travel',
          repaymentPeriod: 4,
          monthlyInstallment: 5000,
          completedDate: '2024-03-05',
          approvedBy: 'Department Head',
          comments: 'Fully repaid',
          transactions: [
            { date: '2023-12-05', amount: 5000, type: 'repayment', status: 'completed' },
            { date: '2024-01-05', amount: 5000, type: 'repayment', status: 'completed' },
            { date: '2024-02-05', amount: 5000, type: 'repayment', status: 'completed' },
            { date: '2024-03-05', amount: 5000, type: 'repayment', status: 'completed' },
            { date: '2023-11-07', amount: 20000, type: 'disbursement', status: 'completed' }
          ]
        }
      ],

      // Pending requests
      pendingRequests: [
        {
          id: 4,
          requestDate: '2024-03-25',
          amount: 5000,
          reason: 'Car repair',
          status: 'pending',
          expectedApproval: '2024-03-28',
          priority: 'medium'
        }
      ],

      // Upcoming dues
      upcomingDues: [
        {
          id: 1,
          dueDate: '2024-04-15',
          amount: 2500,
          advanceId: 1,
          status: 'pending'
        },
        {
          id: 2,
          dueDate: '2024-04-10',
          amount: 2500,
          advanceId: 2,
          status: 'pending'
        }
      ],

      // Monthly salary info
      salary: {
        monthlySalary: 75000,
        lastSalaryDate: '2024-03-28',
        nextSalaryDate: '2024-04-28'
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getStatusBadge = (status) => {
    const classes = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      overdue: 'bg-orange-100 text-orange-800'
    };
    
    const icons = {
      active: <FaClock className="mr-1" />,
      completed: <FaCheckCircle className="mr-1" />,
      pending: <FaClock className="mr-1" />,
      rejected: <FaTimesCircle className="mr-1" />,
      overdue: <FaExclamationTriangle className="mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${classes[status]}`}>
        {icons[status]}
        <span className="hidden xs:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const getFilteredAdvances = () => {
    if (!advanceData) return [];
    
    switch(filter) {
      case 'active':
        return advanceData.advances.filter(a => a.status === 'active');
      case 'completed':
        return advanceData.advances.filter(a => a.status === 'completed');
      case 'pending':
        return advanceData.pendingRequests;
      default:
        return advanceData.advances;
    }
  };

  const validateRequestForm = () => {
    const newErrors = {};
    
    if (!requestForm.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseInt(requestForm.amount) < 1000) {
      newErrors.amount = 'Minimum advance amount is ₹1,000';
    } else if (parseInt(requestForm.amount) > advanceData?.summary?.availableLimit) {
      newErrors.amount = 'Amount exceeds available limit';
    }
    
    if (!requestForm.reason) {
      newErrors.reason = 'Reason is required';
    } else if (requestForm.reason.length < 10) {
      newErrors.reason = 'Please provide a detailed reason';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = () => {
    if (!validateRequestForm()) return;
    
    // Simulate API call
    alert('Advance request submitted successfully!');
    setShowRequestModal(false);
    setRequestForm({
      amount: '',
      reason: '',
      repaymentMonths: '3',
      urgent: false,
      comments: ''
    });
  };

  const handleRepaySubmit = () => {
    if (!repayAmount || parseInt(repayAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    // Simulate API call
    alert(`Repayment of ${formatCurrency(parseInt(repayAmount))} processed successfully!`);
    setShowRepayModal(false);
    setRepayAmount('');
  };

  const calculateProgress = (repaid, total) => {
    return (repaid / total) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!advanceData) return null;

  const filteredAdvances = getFilteredAdvances();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <FaMoneyBillWave className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 truncate">
                  Salary Advance
                </h1>
                <p className="hidden sm:block mt-1 text-sm text-gray-500 truncate">
                  Manage your advance requests and track repayments
                </p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center whitespace-nowrap text-sm sm:text-base"
              >
                <FaPlusCircle className="mr-2 text-sm sm:text-base" />
                <span className="hidden xs:inline">Request Advance</span>
                <span className="xs:hidden">Request</span>
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
        <div className="md:hidden bg-white border-b shadow-lg fixed top-[73px] left-0 right-0 z-30 animate-slideDown">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setShowRequestModal(true);
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FaPlusCircle className="mr-2" />
              Request Advance
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 lg:py-8">
        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FaWallet className="text-xl sm:text-2xl opacity-80" />
              <span className="text-xs opacity-80">Outstanding</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate">
              {formatCurrency(advanceData.summary.outstandingBalance)}
            </p>
            <p className="text-xs opacity-80 hidden xs:block">Total amount to repay</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FaCheckCircle className="text-xl sm:text-2xl opacity-80" />
              <span className="text-xs opacity-80">Repaid</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate">
              {formatCurrency(advanceData.summary.totalRepaid)}
            </p>
            <p className="text-xs opacity-80 hidden xs:block">Total amount repaid</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FaCreditCard className="text-xl sm:text-2xl opacity-80" />
              <span className="text-xs opacity-80">Available</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate">
              {formatCurrency(advanceData.summary.availableLimit)}
            </p>
            <p className="text-xs opacity-80 hidden xs:block">Max {advanceData.summary.maxAdvancePercentage}% of salary</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 sm:p-6 text-white col-span-1 xs:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <FaCalendarAlt className="text-xl sm:text-2xl opacity-80" />
              <span className="text-xs opacity-80">Next Due</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 truncate">
              {formatCurrency(advanceData.summary.nextDueAmount)}
            </p>
            <p className="text-xs opacity-80">Due {formatShortDate(advanceData.summary.nextDueDate)}</p>
          </div>
        </div>

        {/* Quick Stats - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Active</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{advanceData.summary.activeAdvances}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <FaClock className="text-blue-600 text-sm sm:text-base" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Completed</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{advanceData.summary.completedAdvances}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <FaCheckCircle className="text-green-600 text-sm sm:text-base" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{advanceData.summary.pendingRequests}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <FaClock className="text-yellow-600 text-sm sm:text-base" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Dues Alert - Responsive */}
        {advanceData.upcomingDues.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col xs:flex-row xs:items-start gap-2">
              <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-0 xs:mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800 mb-2">Upcoming Repayments</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  {advanceData.upcomingDues.map((due, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2">
                      <div>
                        <p className="text-xs text-gray-500">Due {formatShortDate(due.dueDate)}</p>
                        <p className="font-medium text-gray-900">{formatCurrency(due.amount)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAdvance(advanceData.advances.find(a => a.id === due.advanceId));
                          setShowRepayModal(true);
                        }}
                        className="px-2 sm:px-3 py-1 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
                      >
                        Pay
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section - Responsive */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          {/* Mobile Filter Button */}
          <div className="md:hidden p-3 border-b border-gray-200">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="w-full flex items-center justify-between text-gray-700"
            >
              <span className="font-medium">Filter: {filter === 'all' ? 'All' : filter}</span>
              <svg className={`w-5 h-5 transform transition-transform ${showMobileFilter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Tabs - Desktop */}
          <div className="hidden md:block border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                  filter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Advances
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                  filter === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                  filter === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`py-4 px-4 sm:px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
                  filter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Requests
              </button>
            </nav>
          </div>

          {/* Mobile Filter Dropdown */}
          {showMobileFilter && (
            <div className="md:hidden p-3 space-y-2 animate-slideDown">
              <button
                onClick={() => {
                  setFilter('all');
                  setShowMobileFilter(false);
                }}
                className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Advances
              </button>
              <button
                onClick={() => {
                  setFilter('active');
                  setShowMobileFilter(false);
                }}
                className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                  filter === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setFilter('completed');
                  setShowMobileFilter(false);
                }}
                className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                  filter === 'completed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => {
                  setFilter('pending');
                  setShowMobileFilter(false);
                }}
                className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                  filter === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Pending Requests
              </button>
            </div>
          )}
        </div>

        {/* Advances List - Responsive */}
        <div className="space-y-4 sm:space-y-6">
          {filteredAdvances.map((item) => {
            if (filter === 'pending') {
              // Pending request card - Responsive
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 gap-2">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                          <FaClock className="text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {formatCurrency(item.amount)}
                          </h3>
                          <p className="text-xs text-gray-500">Requested {formatShortDate(item.requestDate)}</p>
                        </div>
                      </div>
                      {getStatusBadge('pending')}
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Reason</p>
                        <p className="text-xs sm:text-sm text-gray-900 truncate">{item.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expected Approval</p>
                        <p className="text-xs sm:text-sm text-gray-900">{formatShortDate(item.expectedApproval)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Advance card - Responsive
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        item.status === 'active' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {item.status === 'active' ? (
                          <FaClock className="text-blue-600" />
                        ) : (
                          <FaCheckCircle className="text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {formatCurrency(item.amount)}
                        </h3>
                        <p className="text-xs text-gray-500">Approved {formatShortDate(item.approvedDate)}</p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-600">Repayment Progress</span>
                      <span className="font-medium">
                        {formatCurrency(item.repaidAmount)} of {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${calculateProgress(item.repaidAmount, item.amount)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid - Responsive */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className="text-sm sm:text-lg font-bold text-red-600 truncate">
                        {formatCurrency(item.outstandingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly</p>
                      <p className="text-sm sm:text-base font-medium truncate">
                        {formatCurrency(item.monthlyInstallment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Next Due</p>
                      <p className="text-sm sm:text-base font-medium truncate">
                        {formatShortDate(item.nextDueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last</p>
                      <p className="text-sm sm:text-base font-medium truncate">
                        {formatCurrency(item.lastPaymentAmount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Transaction History - Responsive */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Recent Transactions</h4>
                    <div className="space-y-2">
                      {item.transactions.slice(0, 3).map((transaction, index) => (
                        <div key={index} className="flex flex-col xs:flex-row xs:items-center justify-between text-xs sm:text-sm gap-1">
                          <div className="flex items-center">
                            {transaction.type === 'disbursement' ? (
                              <FaArrowRight className="text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <FaArrowLeft className="text-blue-500 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-gray-600 truncate">
                              {transaction.type === 'disbursement' ? 'Disbursed' : 'Repayment'} {formatShortDate(transaction.date)}
                            </span>
                          </div>
                          <span className={`font-medium ml-6 xs:ml-0 ${
                            transaction.type === 'disbursement' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {transaction.type === 'disbursement' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.status === 'active' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedAdvance(item);
                          setShowRepayModal(true);
                        }}
                        className="w-full xs:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <FaCreditCard className="mr-2" />
                        Repay Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Salary Info Banner - Responsive */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col xs:flex-row xs:items-center gap-4 xs:gap-6">
            <div className="flex items-center">
              <FaChartLine className="text-xl sm:text-2xl mr-3 opacity-80 flex-shrink-0" />
              <div>
                <p className="text-xs opacity-80">Monthly Salary</p>
                <p className="text-base sm:text-xl lg:text-2xl font-bold">{formatCurrency(advanceData.salary.monthlySalary)}</p>
              </div>
            </div>
            <div className="hidden xs:block h-8 w-px bg-gray-600"></div>
            <div>
              <p className="text-xs opacity-80">Last Salary</p>
              <p className="text-sm sm:text-base font-medium">{formatShortDate(advanceData.salary.lastSalaryDate)}</p>
            </div>
            <div className="hidden xs:block h-8 w-px bg-gray-600"></div>
            <div>
              <p className="text-xs opacity-80">Next Salary</p>
              <p className="text-sm sm:text-base font-medium">{formatShortDate(advanceData.salary.nextSalaryDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Advance Modal - Responsive */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Request Salary Advance</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Available Limit Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-blue-800">Available Limit</span>
                    <span className="text-base sm:text-lg font-bold text-blue-800">
                      {formatCurrency(advanceData.summary.availableLimit)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Repayment Period
                  </label>
                  <select
                    value={requestForm.repaymentMonths}
                    onChange={(e) => setRequestForm({ ...requestForm, repaymentMonths: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                    <option value="4">4 Months</option>
                    <option value="5">5 Months</option>
                    <option value="6">6 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                    placeholder="Please provide reason"
                    rows="3"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.reason ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reason && (
                    <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Additional Comments
                  </label>
                  <textarea
                    value={requestForm.comments}
                    onChange={(e) => setRequestForm({ ...requestForm, comments: e.target.value })}
                    placeholder="Any additional information"
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={requestForm.urgent}
                    onChange={(e) => setRequestForm({ ...requestForm, urgent: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="urgent" className="text-xs sm:text-sm text-gray-700">
                    Mark as urgent (priority processing)
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0 text-sm" />
                    <p className="text-xs text-yellow-700">
                      Advances are interest-free and deducted from future salaries. Maximum amount is 50% of monthly salary.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestSubmit}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Modal - Responsive */}
      {showRepayModal && selectedAdvance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Make Repayment</h3>
                <button
                  onClick={() => {
                    setShowRepayModal(false);
                    setSelectedAdvance(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-600">Outstanding Amount</span>
                  <span className="font-bold text-red-600 text-sm sm:text-base">
                    {formatCurrency(selectedAdvance.outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Monthly Installment</span>
                  <span className="font-medium text-sm sm:text-base">{formatCurrency(selectedAdvance.monthlyInstallment)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Repayment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col xs:flex-row gap-2">
                  <button
                    onClick={() => setRepayAmount(selectedAdvance.monthlyInstallment)}
                    className="flex-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs sm:text-sm hover:bg-gray-200"
                  >
                    Min: {formatCurrency(selectedAdvance.monthlyInstallment)}
                  </button>
                  <button
                    onClick={() => setRepayAmount(selectedAdvance.outstandingAmount)}
                    className="flex-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs sm:text-sm hover:bg-gray-200"
                  >
                    Full: {formatCurrency(selectedAdvance.outstandingAmount)}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    Amount will be deducted from your next salary.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowRepayModal(false);
                      setSelectedAdvance(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRepaySubmit}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirm Repayment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for additional responsive utilities and animations */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:block {
            display: block;
          }
          .xs\\:inline {
            display: inline;
          }
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:items-center {
            align-items: center;
          }
          .xs\\:ml-0 {
            margin-left: 0;
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

export default SalaryAdvance;