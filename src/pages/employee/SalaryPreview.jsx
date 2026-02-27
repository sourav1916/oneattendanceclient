import React, { useState, useEffect } from 'react';
import {
  FaMoneyBillWave,
  FaClock,
  FaMinusCircle,
  FaPlusCircle,
  FaCalculator,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaPercent,
  FaRubleSign,
  FaCreditCard,
  FaHistory,
  FaChartLine,
  FaFileInvoice,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

const SalaryPreview = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

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
    const overtimeRate = 500; // per hour
    const overtimeAmount = overtimeHours * overtimeRate;
    
    // Deductions
    const pfDeduction = baseSalary * 0.12;
    const taxDeduction = baseSalary * 0.1;
    const insuranceDeduction = 1500;
    const otherDeductions = Math.random() * 2000;
    
    // Advances
    const advanceTaken = Math.random() > 0.7 ? 5000 : 0;
    const advanceInstallment = advanceTaken ? 1000 : 0;
    
    // Earnings
    const bonus = Math.random() > 0.5 ? 5000 : 0;
    const incentives = Math.random() * 3000;
    
    const totalEarnings = baseSalary + overtimeAmount + bonus + incentives;
    const totalDeductions = pfDeduction + taxDeduction + insuranceDeduction + otherDeductions + advanceInstallment;
    const netSalary = totalEarnings - totalDeductions;

    return {
      month: selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      
      // Earnings
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

      // Deductions
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

      // Advance details
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

      // Summary
      summary: {
        grossEarnings: totalEarnings,
        grossDeductions: totalDeductions,
        netSalary: netSalary,
        payable: netSalary - (advanceTaken ? advanceInstallment : 0),
        takeHome: netSalary
      },

      // YTD totals
      ytd: {
        earnings: baseSalary * 6 + 15000,
        deductions: (pfDeduction + taxDeduction) * 6 + 5000,
        net: baseSalary * 6 + 10000
      },

      // Status
      status: 'calculated', // calculated, approved, paid
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

  const formatNumber = (num) => {
    return num.toLocaleString('en-IN');
  };

  const handleAdvanceRequest = () => {
    if (!advanceAmount || !advanceReason) return;
    
    // Simulate API call
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const SummaryCard = ({ label, value, icon: Icon, color = 'blue', subtext }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`text-${color}-600 text-xl`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color = 'blue' }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{formatCurrency(value)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color}-600 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (!salaryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Salary Preview</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View your expected salary and detailed breakdown
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(true)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <FaHistory className="mr-2" />
                History
              </button>
              <button
                onClick={handleDownloadPayslip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaDownload className="mr-2" />
                Download Payslip
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Selection */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FaCalendarAlt className="text-gray-400" />
              <select
                value={selectedMonth.toISOString()}
                onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(6)].map((_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  return (
                    <option key={i} value={date.toISOString()}>
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                salaryData.status === 'paid' ? 'bg-green-100 text-green-800' :
                salaryData.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {salaryData.status.charAt(0).toUpperCase() + salaryData.status.slice(1)}
              </span>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {showBreakdown ? 'Simple View' : 'Detailed View'}
              </button>
            </div>
          </div>
        </div>

        {/* Employee Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Employee Name</p>
              <p className="font-medium text-gray-900">{employeeInfo.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Employee ID</p>
              <p className="font-medium text-gray-900">{employeeInfo.employeeId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-medium text-gray-900">{employeeInfo.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Designation</p>
              <p className="font-medium text-gray-900">{employeeInfo.designation}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Gross Earnings"
            value={formatCurrency(salaryData.summary.grossEarnings)}
            icon={FaPlusCircle}
            color="green"
            subtext="Before deductions"
          />
          <SummaryCard
            label="Total Deductions"
            value={formatCurrency(salaryData.summary.grossDeductions)}
            icon={FaMinusCircle}
            color="red"
            subtext="All deductions included"
          />
          <SummaryCard
            label="Net Salary"
            value={formatCurrency(salaryData.summary.netSalary)}
            icon={FaMoneyBillWave}
            color="blue"
            subtext="Take home amount"
          />
          <SummaryCard
            label="YTD Earnings"
            value={formatCurrency(salaryData.ytd.earnings)}
            icon={FaChartLine}
            color="purple"
            subtext="Financial year total"
          />
        </div>

        {!showBreakdown ? (
          /* Simple View - Main components only */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Summary */}
            <SalaryCard title="Earnings">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-medium">{formatCurrency(salaryData.earnings.basic)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">HRA</span>
                  <span className="font-medium">{formatCurrency(salaryData.earnings.hra)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Special Allowance</span>
                  <span className="font-medium">{formatCurrency(salaryData.earnings.special)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Overtime</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(salaryData.earnings.overtime.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-800">Total Earnings</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatCurrency(salaryData.earnings.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Deductions Summary */}
            <SalaryCard title="Deductions">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Provident Fund</span>
                  <span className="font-medium">{formatCurrency(salaryData.deductions.pf)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Professional Tax</span>
                  <span className="font-medium">{formatCurrency(salaryData.deductions.professionalTax)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Income Tax</span>
                  <span className="font-medium">{formatCurrency(salaryData.deductions.incomeTax)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Advance Deduction</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(salaryData.deductions.advance)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-800">Total Deductions</span>
                  <span className="font-bold text-lg text-red-600">
                    {formatCurrency(salaryData.deductions.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>
          </div>
        ) : (
          /* Detailed View - Complete breakdown */
          <div className="space-y-6">
            {/* Detailed Earnings */}
            <SalaryCard title="Detailed Earnings Breakdown">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Fixed Components</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.basic)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">House Rent Allowance (HRA)</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.hra)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conveyance Allowance</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.conveyance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medical Allowance</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.medical)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.special)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Other Allowances</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.otherAllowances)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Variable Components</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overtime ({salaryData.earnings.overtime.hours} hrs @ {formatCurrency(salaryData.earnings.overtime.rate)}/hr)</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(salaryData.earnings.overtime.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance Bonus</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.bonus)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Incentives</span>
                      <span className="font-medium">{formatCurrency(salaryData.earnings.incentives)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Earnings</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(salaryData.earnings.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Detailed Deductions */}
            <SalaryCard title="Detailed Deductions Breakdown">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Statutory Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Provident Fund (12%)</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.pf)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.professionalTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Income Tax (TDS)</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.incomeTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Insurance Premium</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.insurance)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Other Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Loan Repayment</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.loan)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advance Deduction</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(salaryData.deductions.advance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Other Deductions</span>
                      <span className="font-medium">{formatCurrency(salaryData.deductions.other)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total Deductions</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(salaryData.deductions.total)}
                  </span>
                </div>
              </div>
            </SalaryCard>

            {/* Advance Details */}
            {salaryData.advances.taken > 0 && (
              <SalaryCard title="Advance Details">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-orange-600">Total Advance Taken</p>
                    <p className="text-lg font-bold text-orange-700">
                      {formatCurrency(salaryData.advances.taken)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600">This Month's Installment</p>
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(salaryData.advances.installment)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Remaining Amount</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(salaryData.advances.remaining)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Repayment History</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {salaryData.advances.history.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">{item.date}</span>
                        <span>{item.reason}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SalaryCard>
            )}
          </div>
        )}

        {/* Net Salary Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Net Take Home Salary</p>
              <p className="text-4xl font-bold text-white">
                {formatCurrency(salaryData.summary.netSalary)}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                After all deductions and adjustments
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Payment Mode</p>
              <p className="text-white font-medium">{salaryData.paymentMode}</p>
              <p className="text-blue-200 text-xs mt-1">
                Expected by: {new Date(salaryData.paymentDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <FaPercent className="text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800">Tax Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">PAN Number</p>
              <p className="font-medium">{employeeInfo.panNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">UAN Number</p>
              <p className="font-medium">{employeeInfo.uanNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">YTD Tax Deducted</p>
              <p className="font-medium">{formatCurrency(salaryData.ytd.deductions * 0.3)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
          >
            <FaCreditCard className="mr-2" />
            Request Advance
          </button>
          <button
            onClick={handleDownloadPayslip}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FaFileInvoice className="mr-2" />
            Download Payslip
          </button>
        </div>
      </div>

      {/* Advance Request Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Request Salary Advance</h3>
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                    placeholder="Please provide reason for advance request"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      Advances are subject to approval and will be deducted from future salaries in installments.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAdvanceModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdvanceRequest}
                    disabled={!advanceAmount || !advanceReason}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Salary History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {[...Array(6)].map((_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const amount = 75000 + Math.random() * 5000;
                  return (
                    <div key={i} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-500">Paid on: 01/{date.getMonth() + 1}/{date.getFullYear()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(amount)}
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
    </div>
  );
};

export default SalaryPreview;