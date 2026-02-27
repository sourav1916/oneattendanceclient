import React, { useState } from 'react';
import { 
  FaBuilding, FaCheckCircle, FaClock, FaUserClock, 
  FaCheck, FaTimes, FaHourglassHalf, FaShieldAlt, 
  FaExclamationTriangle, FaExclamationCircle, FaFingerprint,
  FaArrowRight, FaChartLine, FaMobile, FaLaptop, FaIdCard
} from 'react-icons/fa';

const AttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('main');

  // Sample data
  const liveAttendanceData = [
    { id: 1, name: 'John Smith', department: 'Sales', employeeId: 'EMP001', time: '08:45 AM', status: 'on-time', avatar: 'https://via.placeholder.com/32' },
    { id: 2, name: 'Sarah Johnson', department: 'Marketing', employeeId: 'EMP045', time: '08:52 AM', status: 'on-time', avatar: 'https://via.placeholder.com/32' },
    { id: 3, name: 'Mike Wilson', department: 'IT', employeeId: 'EMP089', time: '09:15 AM', status: 'late', avatar: 'https://via.placeholder.com/32' },
    { id: 4, name: 'Emily Brown', department: 'HR', employeeId: 'EMP023', time: '08:30 AM', status: 'on-time', avatar: 'https://via.placeholder.com/32' },
    { id: 5, name: 'David Lee', department: 'Sales', employeeId: 'EMP056', time: '09:30 AM', status: 'late', avatar: 'https://via.placeholder.com/32' },
  ];

  const pendingApprovalsData = [
    { id: 1, title: 'Leave Request - John Smith', subtitle: '2 days ago', type: 'leave' },
    { id: 2, title: 'Overtime - Sarah Johnson', subtitle: '5 hours overtime', type: 'overtime' },
    { id: 3, title: 'Travel Reimbursement', subtitle: '$245.50 - Mike Wilson', type: 'reimbursement' },
    { id: 4, title: 'Leave Request - Emily Brown', subtitle: '3 days ago', type: 'leave' },
  ];

  const branchData = [
    { name: 'Head Office', employees: 245, present: 215, late: 15, absent: 15 },
    { name: 'Downtown Branch', employees: 189, present: 170, late: 8, absent: 11 },
    { name: 'Westside Branch', employees: 156, present: 142, late: 6, absent: 8 },
    { name: 'North Campus', employees: 98, present: 89, late: 4, absent: 5 },
  ];

  const exceptionsData = [
    { id: 1, message: 'Multiple late check-ins', detail: 'John Smith - 3 days this week', type: 'error' },
    { id: 2, message: 'Early departure', detail: 'Sarah Johnson - Left 2 hours early', type: 'warning' },
    { id: 3, message: 'Missing punch out', detail: 'Mike Wilson - Yesterday', type: 'warning' },
    { id: 4, message: 'Unauthorized overtime', detail: 'David Lee - 4 hours', type: 'error' },
  ];

  const punchMethodData = [
    { method: 'Biometric', percentage: 45, color: 'bg-blue-600' },
    { method: 'Mobile App', percentage: 30, color: 'bg-green-600' },
    { method: 'Web Check-in', percentage: 15, color: 'bg-purple-600' },
    { method: 'RFID Card', percentage: 10, color: 'bg-yellow-600' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'on-time': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getExceptionIcon = (type) => {
    switch(type) {
      case 'error': return <FaExclamationCircle className="text-red-500 mr-3" />;
      case 'warning': return <FaClock className="text-yellow-500 mr-3" />;
      default: return <FaExclamationTriangle className="text-orange-500 mr-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Live
              </span>
              <span className="text-sm text-gray-500">Last updated: 2 minutes ago</span>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('main')}
                className={`${
                  activeTab === 'main'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Main Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                Analytics Dashboard
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      {activeTab === 'main' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Company Overview Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 hover:shadow-md transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                    <FaBuilding className="text-blue-600 text-xl" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Active Today</p>
                    <p className="text-2xl font-bold text-gray-900">1,089</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <FaClock className="text-yellow-600 text-xl" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">On Leave</p>
                    <p className="text-2xl font-bold text-gray-900">89</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                    <FaUserClock className="text-purple-600 text-xl" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Late Today</p>
                    <p className="text-2xl font-bold text-gray-900">56</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Attendance Monitor & Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Live Attendance Monitor */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Attendance Monitor</h3>
                <span className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                  Live
                </span>
              </div>
              <div className="space-y-3">
                {liveAttendanceData.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <div className="flex items-center flex-1">
                      <img 
                        src={employee.avatar} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                        alt={employee.name}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.department} • {employee.employeeId}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(employee.status)}`}>
                      {employee.status === 'on-time' ? `Checked in ${employee.time}` : `Late - ${employee.time}`}
                    </span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center">
                View all live updates
                <FaArrowRight className="ml-2 text-xs" />
              </button>
            </div>

            {/* Right Column - Summary Widgets */}
            <div className="space-y-6">
              {/* Present/Absent/Late Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Present</span>
                      <span className="font-medium">1,089 (88%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Absent</span>
                      <span className="font-medium">89 (7%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-red-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Late</span>
                      <span className="font-medium">56 (5%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Payable vs Paid vs Due */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Payable</span>
                    <span className="font-bold text-gray-900">$845,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="font-bold text-green-600">$623,000</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Due</span>
                    <span className="font-bold text-yellow-600">$222,000</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Processing Progress</span>
                      <span className="font-medium">74%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '74%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals Widget */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {pendingApprovalsData.length} pending
                </span>
              </div>
              <div className="space-y-3">
                {pendingApprovalsData.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{approval.title}</p>
                      <p className="text-xs text-gray-500">{approval.subtitle}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200">
                        <FaCheck />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200">
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                View all approvals
                <FaArrowRight className="ml-2 text-xs" />
              </button>
            </div>

            {/* Branch/Site Attendance Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Attendance Summary</h3>
              <div className="space-y-4">
                {branchData.map((branch, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                        <p className="text-xs text-gray-500">{branch.employees} employees</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {branch.present} present
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <span className="text-green-600">● {branch.present}</span>
                      <span className="text-yellow-600">● {branch.late} late</span>
                      <span className="text-red-600">● {branch.absent} absent</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Check-in Time</p>
                  <p className="text-2xl font-bold text-gray-900">08:47 AM</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaClock className="text-2xl text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">▼ 5 min earlier than last week</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overtime Hours</p>
                  <p className="text-2xl font-bold text-gray-900">247.5</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaHourglassHalf className="text-2xl text-green-600" />
                </div>
              </div>
              <p className="text-xs text-yellow-600 mt-2">▲ 12% vs last month</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">95.3%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaShieldAlt className="text-2xl text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">▲ 2.3% vs last month</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exceptions</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="text-2xl text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-red-600 mt-2">▲ 5 new alerts</p>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Analytics</h3>
                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg">
                <div className="text-center">
                  <FaChartLine className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Attendance trend chart will be displayed here</p>
                  <p className="text-xs text-gray-400 mt-2">Powered by your preferred chart library</p>
                </div>
              </div>
            </div>

            {/* Punch Method Usage */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Punch Method Usage</h3>
              <div className="space-y-4">
                {punchMethodData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        {index === 0 && <FaFingerprint className="text-blue-600 mr-2" />}
                        {index === 1 && <FaMobile className="text-green-600 mr-2" />}
                        {index === 2 && <FaLaptop className="text-purple-600 mr-2" />}
                        {index === 3 && <FaIdCard className="text-yellow-600 mr-2" />}
                        <span className="text-sm text-gray-700">{item.method}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${item.color} h-2.5 rounded-full transition-all duration-500`} 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overtime Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-xl font-bold text-gray-900">127.5</p>
                  <p className="text-xs text-gray-500">hours</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xl font-bold text-gray-900">523</p>
                  <p className="text-xs text-gray-500">hours</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Avg/Employee</p>
                  <p className="text-xl font-bold text-gray-900">4.2</p>
                  <p className="text-xs text-gray-500">hours/week</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Overtime Departments</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Engineering</span>
                    <span className="text-sm font-medium">156 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Operations</span>
                    <span className="text-sm font-medium">134 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Support</span>
                    <span className="text-sm font-medium">98 hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exceptions / Violations Alerts */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Exceptions & Violations</h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full animate-pulse">
                  {exceptionsData.length} active
                </span>
              </div>
              <div className="space-y-3">
                {exceptionsData.map((exception) => (
                  <div 
                    key={exception.id} 
                    className={`flex items-start p-3 rounded-lg ${
                      exception.type === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                    } hover:shadow-md transition-shadow duration-200`}
                  >
                    {getExceptionIcon(exception.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{exception.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{exception.detail}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all exceptions
              </button>
            </div>
          </div>

          {/* Additional Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Peak Attendance Hours</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">8:00 - 9:00 AM</span>
                  <span className="text-xs font-medium">45% of workforce</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">9:00 - 10:00 AM</span>
                  <span className="text-xs font-medium">35% of workforce</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">After 10:00 AM</span>
                  <span className="text-xs font-medium">20% of workforce</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Most Common Late Days</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Monday</span>
                  <span className="text-xs font-medium">34 late entries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Friday</span>
                  <span className="text-xs font-medium">28 late entries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Wednesday</span>
                  <span className="text-xs font-medium">15 late entries</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Compliance by Department</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-600 w-24">HR</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-600 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <span className="text-xs font-medium ml-2">98%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-600 w-24">Engineering</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-600 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-xs font-medium ml-2">95%</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-600 w-24">Sales</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-yellow-600 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <span className="text-xs font-medium ml-2">87%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;