import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaMinusCircle,
  FaPlusCircle,
  FaTimesCircle,
  FaDownload,
  FaCalendarAlt,
  FaPercent,
  FaCreditCard,
  FaHistory,
  FaChartLine,
  FaFileInvoice,
  FaInfoCircle,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { AnimatePresence } from "framer-motion";

const SalaryPreview = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  // Handle resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileMenu(false);
        setShowMobileActions(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Employee data (mock)
  const employeeInfo = {
    name: 'John Doe',
    employeeId: 'EMP001',
    department: 'Engineering',
    designation: 'Senior Developer',
    joinDate: '2020-01-15',
    bankAccount: 'XXXX XXXX XXXX 1234',
    panNumber: 'ABCDE1234F',
    uanNumber: '101234567890'
  };

  // Load salary data when month changes
  useEffect(() => {
    fetchSalaryData();
  }, [selectedMonth]);

  const fetchSalaryData = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockSalaryData();
      setSalaryData(mockData);
      setLoading(false);
    }, 1000);
  };

  const generateMockSalaryData = () => {
    const baseSalary = 75000;
    const overtimeHours = Math.floor(Math.random() * 20);
    const overtimeRate = 500;
    const overtimeAmount = overtimeHours * overtimeRate;

    const pfDeduction = baseSalary * 0.12;
    const taxDeduction = baseSalary * 0.1;
    const insuranceDeduction = 1500;
    const otherDeductions = Math.random() * 2000;

    const advanceTaken = Math.random() > 0.7 ? 5000 : 0;
    const advanceInstallment = advanceTaken ? 1000 : 0;

    const bonus = Math.random() > 0.5 ? 5000 : 0;
    const incentives = Math.random() * 3000;

    const totalEarnings = baseSalary + overtimeAmount + bonus + incentives;
    const totalDeductions = pfDeduction + taxDeduction + insuranceDeduction + otherDeductions + advanceInstallment;
    const netSalary = totalEarnings - totalDeductions;

    return {
      month: selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),

      earnings: {
        basic: baseSalary,
        hra: baseSalary * 0.4,
        conveyance: 1600,
        medical: 1250,
        special: 5000,
        overtime: {
          hours: overtimeHours,
          rate: overtimeRate,
          amount: overtimeAmount
        },
        bonus: bonus,
        incentives: incentives,
        otherAllowances: 2000,
        total: totalEarnings
      },

      deductions: {
        pf: pfDeduction,
        professionalTax: 200,
        incomeTax: taxDeduction,
        insurance: insuranceDeduction,
        loan: advanceInstallment > 0 ? 3000 : 0,
        advance: advanceInstallment,
        other: otherDeductions,
        total: totalDeductions
      },

      advances: {
        taken: advanceTaken,
        installment: advanceInstallment,
        remaining: advanceTaken ? advanceTaken - advanceInstallment : 0,
        history: advanceTaken ? [
          { date: '2024-01-15', amount: 2000, reason: 'Medical emergency' },
          { date: '2024-02-15', amount: 1000, reason: 'Advance repayment' },
          { date: '2024-03-15', amount: 1000, reason: 'Advance repayment' }
        ] : []
      },

      summary: {
        grossEarnings: totalEarnings,
        grossDeductions: totalDeductions,
        netSalary: netSalary,
        payable: netSalary - (advanceTaken ? advanceInstallment : 0),
        takeHome: netSalary
      },

      ytd: {
        earnings: baseSalary * 6 + 15000,
        deductions: (pfDeduction + taxDeduction) * 6 + 5000,
        net: baseSalary * 6 + 10000
      },

      status: 'calculated',
      paymentDate: '2024-04-01',
      paymentMode: 'Bank Transfer'
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

  const formatShortCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  };

  const handleAdvanceRequest = () => {
    if (!advanceAmount || !advanceReason) return;

    alert(`Advance request for ${formatCurrency(parseInt(advanceAmount))} submitted successfully!`);
    setShowAdvanceModal(false);
    setAdvanceAmount('');
    setAdvanceReason('');
  };

  const handleDownloadPayslip = () => {
    alert('Downloading payslip...');
  };

  const SalaryCard = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-2 sm:py-3">
        <h3 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h3>
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );

  const SummaryCard = ({ label, value, icon: Icon, color = 'blue', subtext }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{label}</p>
          <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1 hidden xs:block truncate">{subtext}</p>}
        </div>
        <div className={`p-2 sm:p-3 bg-${color}-100 rounded-lg flex-shrink-0 ml-2`}>
          <Icon className={`text-${color}-600 text-sm sm:text-base lg:text-xl`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color = 'blue' }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between text-xs sm:text-sm mb-1">
          <span className="text-gray-600 truncate">{label}</span>
          <span className="font-medium ml-2">{formatShortCurrency(value)}</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-600 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading || !salaryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-2 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <FaMoneyBillWave className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Salary Preview
                </h1>
                <p className="hidden sm:block mt-1 text-sm text-gray-500 truncate">
                  View your expected salary and detailed breakdown
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
              >
                <FaHistory className="mr-2" />
                History
              </button>
              <button
                onClick={handleDownloadPayslip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <FaDownload className="mr-2" />
                Download
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
                setShowHistory(true);
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <FaHistory className="mr-2" />
              View History
            </button>
            <button
              onClick={() => {
                handleDownloadPayslip();
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FaDownload className="mr-2" />
              Download Payslip
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto px-2 py-4 sm:py-6 lg:py-8">
        {/* Month Selection - Responsive */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <FaCalendarAlt className="text-gray-400 text-sm sm:text-base flex-shrink-0" />
                <select
                  value={selectedMonth.toISOString()}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(6)].map((_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    return (
                      <option key={i} value={date.toISOString()}>
                        {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-between xs:justify-end space-x-2">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap ${salaryData.status === 'paid' ? 'bg-green-100 text-green-800' :
                    salaryData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                  }`}>
                  {salaryData.status}
                </span>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  {showBreakdown ? 'Simple' : 'Detailed'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Info Banner - Responsive */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Name</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{employeeInfo.name}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">ID</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{employeeInfo.employeeId}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Dept</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{employeeInfo.department}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Role</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{employeeInfo.designation}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <SummaryCard
            label="Gross"
            value={formatShortCurrency(salaryData.summary.grossEarnings)}
            icon={FaPlusCircle}
            color="green"
            subtext="Before deductions"
          />
          <SummaryCard
            label="Deductions"
            value={formatShortCurrency(salaryData.summary.grossDeductions)}
            icon={FaMinusCircle}
            color="red"
            subtext="All deductions"
          />
          <SummaryCard
            label="Net Salary"
            value={formatShortCurrency(salaryData.summary.netSalary)}
            icon={FaMoneyBillWave}
            color="blue"
            subtext="Take home"
          />
          <SummaryCard
            label="YTD"
            value={formatShortCurrency(salaryData.ytd.earnings)}
            icon={FaChartLine}
            color="purple"
            subtext="Year to date"
          />
        </div>

        {!showBreakdown ? (
          /* Simple View - Responsive */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Earnings Summary */}
            <SalaryCard title="Earnings">
              <div className="space-y-2 sm:space-y-4">
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Basic Salary</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.earnings.basic)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">HRA</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.earnings.hra)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Special Allowance</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.earnings.special)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Overtime</span>
                  <span className="font-medium text-green-600 ml-2">
                    {formatShortCurrency(salaryData.earnings.overtime.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 text-sm sm:text-base">
                  <span className="font-semibold text-gray-800 truncate">Total Earnings</span>
                  <span className="font-bold text-base sm:text-lg text-green-600 ml-2">
                    {formatShortCurrency(salaryData.earnings.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Deductions Summary */}
            <SalaryCard title="Deductions">
              <div className="space-y-2 sm:space-y-4">
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Provident Fund</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.deductions.pf)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Professional Tax</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.deductions.professionalTax)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Income Tax</span>
                  <span className="font-medium ml-2">{formatShortCurrency(salaryData.deductions.incomeTax)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b text-sm sm:text-base">
                  <span className="text-gray-600 truncate">Advance</span>
                  <span className="font-medium text-red-600 ml-2">
                    {formatShortCurrency(salaryData.deductions.advance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 text-sm sm:text-base">
                  <span className="font-semibold text-gray-800 truncate">Total Deductions</span>
                  <span className="font-bold text-base sm:text-lg text-red-600 ml-2">
                    {formatShortCurrency(salaryData.deductions.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>
          </div>
        ) : (
          /* Detailed View - Responsive */
          <div className="space-y-4 sm:space-y-6">
            {/* Detailed Earnings */}
            <SalaryCard title="Detailed Earnings Breakdown">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">Fixed Components</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {[
                      { label: 'Basic Salary', value: salaryData.earnings.basic },
                      { label: 'HRA', value: salaryData.earnings.hra },
                      { label: 'Conveyance', value: salaryData.earnings.conveyance },
                      { label: 'Medical', value: salaryData.earnings.medical },
                      { label: 'Special', value: salaryData.earnings.special },
                      { label: 'Other Allowances', value: salaryData.earnings.otherAllowances }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 truncate">{item.label}</span>
                        <span className="font-medium ml-2">{formatShortCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">Variable Components</h4>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 truncate">Overtime ({salaryData.earnings.overtime.hours} hrs)</span>
                      <span className="font-medium text-green-600 ml-2">
                        {formatShortCurrency(salaryData.earnings.overtime.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 truncate">Performance Bonus</span>
                      <span className="font-medium ml-2">{formatShortCurrency(salaryData.earnings.bonus)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 truncate">Incentives</span>
                      <span className="font-medium ml-2">{formatShortCurrency(salaryData.earnings.incentives)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm sm:text-base text-gray-800">Total Earnings</span>
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                    {formatShortCurrency(salaryData.earnings.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Detailed Deductions */}
            <SalaryCard title="Detailed Deductions Breakdown">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">Statutory Deductions</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {[
                      { label: 'Provident Fund', value: salaryData.deductions.pf },
                      { label: 'Professional Tax', value: salaryData.deductions.professionalTax },
                      { label: 'Income Tax', value: salaryData.deductions.incomeTax },
                      { label: 'Insurance', value: salaryData.deductions.insurance }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 truncate">{item.label}</span>
                        <span className="font-medium ml-2">{formatShortCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">Other Deductions</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {[
                      { label: 'Loan Repayment', value: salaryData.deductions.loan },
                      { label: 'Advance', value: salaryData.deductions.advance },
                      { label: 'Other', value: salaryData.deductions.other }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 truncate">{item.label}</span>
                        <span className={`font-medium ml-2 ${item.label === 'Advance' ? 'text-red-600' : ''}`}>
                          {formatShortCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm sm:text-base text-gray-800">Total Deductions</span>
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-red-600">
                    {formatShortCurrency(salaryData.deductions.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Advance Details */}
            {salaryData.advances.taken > 0 && (
              <SalaryCard title="Advance Details">
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs text-orange-600 truncate">Total Taken</p>
                    <p className="text-sm sm:text-base font-bold text-orange-700">
                      {formatShortCurrency(salaryData.advances.taken)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs text-blue-600 truncate">This Month</p>
                    <p className="text-sm sm:text-base font-bold text-blue-700">
                      {formatShortCurrency(salaryData.advances.installment)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs text-green-600 truncate">Remaining</p>
                    <p className="text-sm sm:text-base font-bold text-green-700">
                      {formatShortCurrency(salaryData.advances.remaining)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 sm:mt-4">
                  <h4 className="font-medium text-xs sm:text-sm text-gray-700 mb-2">Repayment History</h4>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    {salaryData.advances.history.map((item, index) => (
                      <div key={index} className="flex flex-col xs:flex-row xs:justify-between text-xs py-1 gap-1">
                        <span className="text-gray-600">{formatDate(item.date)}</span>
                        <span className="truncate">{item.reason}</span>
                        <span className="font-medium">{formatShortCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SalaryCard>
            )}
          </div>
        )}

        {/* Net Salary Card - Responsive */}
        <div className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Net Take Home Salary</p>
              <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-white">
                {formatShortCurrency(salaryData.summary.netSalary)}
              </p>
              <p className="text-blue-200 text-xs mt-1 hidden xs:block">
                After all deductions
              </p>
            </div>
            <div className="text-left xs:text-right">
              <p className="text-blue-100 text-xs sm:text-sm">Payment Mode</p>
              <p className="text-white font-medium text-sm sm:text-base">{salaryData.paymentMode}</p>
              <p className="text-blue-200 text-xs mt-1">
                By: {formatDate(salaryData.paymentDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Tax Information - Responsive */}
        <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center mb-2 sm:mb-3">
            <FaPercent className="text-blue-600 mr-2 text-sm sm:text-base" />
            <h3 className="font-medium text-sm sm:text-base text-gray-800">Tax Information</h3>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">PAN</p>
              <p className="text-xs sm:text-sm font-medium truncate">{employeeInfo.panNumber}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">UAN</p>
              <p className="text-xs sm:text-sm font-medium truncate">{employeeInfo.uanNumber}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">YTD Tax</p>
              <p className="text-xs sm:text-sm font-medium">{formatShortCurrency(salaryData.ytd.deductions * 0.3)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Responsive */}
        <div className="mt-4 sm:mt-6 flex flex-col xs:flex-row xs:justify-end gap-2 sm:gap-3">
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <FaCreditCard className="mr-2 text-sm sm:text-base" />
            Request Advance
          </button>
          <button
            onClick={handleDownloadPayslip}
            className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            <FaFileInvoice className="mr-2 text-sm sm:text-base" />
            Download Payslip
          </button>
        </div>
      </div>

      {/* Advance Request Modal - Responsive */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Request Salary Advance</h3>
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                    placeholder="Please provide reason"
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0 text-sm" />
                    <p className="text-xs text-yellow-700">
                      Advances are subject to approval and deducted from future salaries.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowAdvanceModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdvanceRequest}
                    disabled={!advanceAmount || !advanceReason}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal - Responsive */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp sm:animate-fadeIn">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Salary History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {[...Array(6)].map((_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const amount = 75000 + Math.random() * 5000;
                    return (
                      <div key={i} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm sm:text-base text-gray-900">
                              {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">Paid: {formatDate(date)}</p>
                          </div>
                          <div className="text-left xs:text-right">
                            <p className="text-base sm:text-lg font-bold text-green-600">
                              {formatShortCurrency(amount)}
                            </p>
                            <p className="text-xs text-gray-400">Net Salary</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom CSS for additional responsive utilities and animations */}
      <style jsx>{`
        @media (min-width: 480px) {
          .xs\\:block {
            display: block;
          }
          .xs\\:inline {
            display: inline;
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .xs\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
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

export default SalaryPreview;