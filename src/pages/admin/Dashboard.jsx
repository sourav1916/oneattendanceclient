// pages/admin/Dashboard.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUsers, FaUserCheck, FaUserClock, FaCalendarCheck,
  FaMoneyBillWave, FaPlaneDeparture, FaClock, FaExclamationTriangle,
  FaArrowUp, FaArrowDown, FaEllipsisV, FaEye, FaDownload,
  FaChartLine, FaUserTie, FaBuilding, FaBriefcase
} from "react-icons/fa";

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [showStats, setShowStats] = useState(true);

  // Stats data
  const stats = [
    {
      title: "Total Employees",
      value: "156",
      change: "+12",
      trend: "up",
      icon: FaUsers,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Present Today",
      value: "142",
      change: "91%",
      trend: "up",
      icon: FaUserCheck,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "On Leave",
      value: "8",
      change: "+2",
      trend: "up",
      icon: FaPlaneDeparture,
      color: "orange",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Late Arrivals",
      value: "6",
      change: "-3",
      trend: "down",
      icon: FaClock,
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-600"
    }
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, user: "John Smith", action: "Checked in", time: "2 min ago", type: "attendance" },
    { id: 2, user: "Sarah Johnson", action: "Applied for leave", time: "15 min ago", type: "leave" },
    { id: 3, user: "Mike Wilson", action: "Regularization request", time: "1 hour ago", type: "regularization" },
    { id: 4, user: "Emily Brown", action: "Salary advance request", time: "2 hours ago", type: "salary" },
    { id: 5, user: "David Lee", action: "Checked out", time: "3 hours ago", type: "attendance" },
  ];

  // Department attendance
  const departments = [
    { name: "Engineering", total: 45, present: 42, percentage: 93 },
    { name: "Sales", total: 32, present: 28, percentage: 87 },
    { name: "Marketing", total: 28, present: 26, percentage: 92 },
    { name: "HR", total: 15, present: 14, percentage: 93 },
    { name: "Finance", total: 20, present: 18, percentage: 90 },
    { name: "Operations", total: 16, present: 14, percentage: 87 },
  ];

  // Pending requests
  const pendingRequests = [
    { id: 1, type: "Leave", user: "Alice Cooper", days: 3, status: "pending" },
    { id: 2, type: "Regularization", user: "Bob Martin", date: "2024-02-28", status: "pending" },
    { id: 3, type: "Salary Advance", user: "Carol White", amount: "$500", status: "pending" },
    { id: 4, type: "Leave", user: "Dan Brown", days: 2, status: "pending" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <motion.h1 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-xl sm:text-2xl font-bold text-slate-800"
        >
          Admin Dashboard
        </motion.h1>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            <FaDownload className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <AnimatePresence mode="wait">
        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.textColor}`} />
                    </div>
                    <span className={`text-xs font-medium flex items-center ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                      {stat.trend === 'up' ? 
                        <FaArrowUp className="w-3 h-3 ml-1" /> : 
                        <FaArrowDown className="w-3 h-3 ml-1" />
                      }
                    </span>
                  </div>
                  
                  <div className="mt-2 sm:mt-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                      {stat.value}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {stat.title}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Department Attendance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Department-wise Attendance
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
              >
                <FaEye className="w-4 h-4 mr-1" />
                View All
              </motion.button>
            </div>

            <div className="space-y-3">
              {departments.map((dept, index) => (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-24 sm:w-32">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {dept.name}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.percentage}%` }}
                          transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                          className="h-full bg-purple-500 rounded-full"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-600 min-w-[40px]">
                        {dept.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {dept.present}/{dept.total} present
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
              Recent Activities
            </h2>
            
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-medium text-sm">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {activity.user}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 width on large screens */}
        <div className="space-y-4 sm:space-y-6">
          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Pending Requests
              </h2>
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                {pendingRequests.length} new
              </span>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    request.type === 'Leave' ? 'bg-orange-100' :
                    request.type === 'Regularization' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {request.type === 'Leave' && <FaPlaneDeparture className="w-4 h-4 text-orange-600" />}
                    {request.type === 'Regularization' && <FaClock className="w-4 h-4 text-blue-600" />}
                    {request.type === 'Salary Advance' && <FaMoneyBillWave className="w-4 h-4 text-green-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {request.user}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {request.type} • {request.days || request.date || request.amount}
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                  >
                    <FaEllipsisV className="w-3 h-3 text-slate-400" />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ x: 5 }}
              className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              View All Requests
              <FaArrowUp className="w-3 h-3 ml-1 rotate-45" />
            </motion.button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm p-4 sm:p-6"
          >
            <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Add Employee", icon: FaUserTie },
                { label: "Mark Attendance", icon: FaUserCheck },
                { label: "Process Payroll", icon: FaMoneyBillWave },
                { label: "Generate Report", icon: FaChartLine },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center p-2 rounded-lg text-white/90 hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs text-center">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}