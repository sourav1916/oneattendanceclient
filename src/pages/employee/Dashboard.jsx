import React, { useState, useEffect } from 'react';
import { 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineExclamationCircle,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineArrowRight,
  HiOutlineTrendingUp
} from 'react-icons/hi';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [workingHours, setWorkingHours] = useState('0h 0m');
  const [currentStatus, setCurrentStatus] = useState('absent');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  // Animation variants
  const fadeInUp = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring", stiffness: 100, damping: 20 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const floatingAnimation = {
    initial: { y: 0 },
    animate: {
      y: [-8, 8, -8],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Simulate API call
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dummy data from API
      const dummyData = {
        today: {
          status: 'present',
          checkIn: '09:15 AM',
          checkOut: '06:30 PM',
          workingHours: '8h 15m',
        },
        summary: {
          presentDays: 18,
          absentDays: 3,
          leaveDays: 2,
          totalDays: 23,
          monthlyTrend: [4, 6, 8, 12, 15, 18],
        },
        user: {
          name: 'Alex Morgan',
          role: 'Software Engineer',
          employeeId: 'EMP-2024-089',
          department: 'Engineering',
        },
        recentActivity: [
          { date: '2024-01-15', status: 'present', checkIn: '09:00', checkOut: '18:00' },
          { date: '2024-01-14', status: 'present', checkIn: '08:55', checkOut: '17:45' },
          { date: '2024-01-13', status: 'late', checkIn: '09:30', checkOut: '18:15' },
        ]
      };
      
      setAttendanceData(dummyData);
      setCurrentStatus(dummyData.today.status);
      setCheckInTime(dummyData.today.checkIn);
      setCheckOutTime(dummyData.today.checkOut);
      setWorkingHours(dummyData.today.workingHours);
      
      if (dummyData.today.status !== 'absent') {
        setIsCheckedIn(true);
        if (dummyData.today.checkOut !== '--:-- --') {
          setIsCheckedOut(true);
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Handle check-in
  const handleCheckIn = () => {
    if (isCheckedIn) return;
    
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    setCheckInTime(formattedTime);
    setIsCheckedIn(true);
    setCurrentStatus('present');
  };

  // Handle check-out
  const handleCheckOut = () => {
    if (!isCheckedIn || isCheckedOut) return;
    
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    setCheckOutTime(formattedTime);
    setIsCheckedOut(true);
  };

  // Get status color
  const getStatusColor = () => {
    switch(currentStatus) {
      case 'present': return 'emerald';
      case 'late': return 'amber';
      default: return 'rose';
    }
  };

  const statusColor = getStatusColor();

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-7xl animate-pulse">
          {/* Top bar skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
            <div>
              <div className="h-8 sm:h-10 w-48 sm:w-64 bg-slate-200 rounded-lg mb-2 sm:mb-3"></div>
              <div className="h-4 sm:h-5 w-36 sm:w-48 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-slate-200 rounded-2xl"></div>
          </div>
          
          {/* Main content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 sm:h-96 bg-white/50 rounded-2xl sm:rounded-3xl"></div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="h-40 sm:h-48 bg-white/50 rounded-2xl sm:rounded-3xl"></div>
              <div className="h-40 sm:h-48 bg-white/50 rounded-2xl sm:rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-x-hidden">
      {/* Light theme background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none"></div>
      
      {/* Soft gradient orbs */}
      <motion.div 
        variants={floatingAnimation}
        initial="initial"
        animate="animate"
        className="absolute top-20 left-20 w-48 h-48 sm:w-96 sm:h-96 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        variants={floatingAnimation}
        initial="initial"
        animate="animate"
        className="absolute bottom-20 right-20 w-48 h-48 sm:w-96 sm:h-96 bg-purple-100/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        variants={floatingAnimation}
        initial="initial"
        animate="animate"
        className="absolute top-1/2 left-1/3 w-48 h-48 sm:w-96 sm:h-96 bg-amber-100/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        {/* Header Section - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 md:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 sm:gap-3 text-indigo-600 mb-2 sm:mb-3"
              >
                <div className="h-1 w-6 sm:w-10 bg-indigo-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium tracking-wider uppercase">Attendance Overview</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4"
              >
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                  {attendanceData?.user.name}
                </span>
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500"
              >
                <span className="flex items-center gap-1 sm:gap-2">
                  <HiOutlineUser className="w-3 h-3 sm:w-4 sm:h-4" />
                  {attendanceData?.user.role}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>{attendanceData?.user.department}</span>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 sm:gap-4 self-start sm:self-auto"
            >
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Employee ID</p>
                <p className="text-sm sm:text-base lg:text-lg font-mono text-indigo-600">{attendanceData?.user.employeeId}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl rotate-45 transform hover:rotate-90 transition-transform duration-300 shadow-lg"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Main Stats */}
          <motion.div 
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8"
          >
            {/* Status Bar - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-${statusColor}-100 to-transparent rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl`}></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-500 mb-1 sm:mb-2">Current Status</p>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut"
                        }}
                        className={`w-3 h-3 sm:w-4 sm:h-4 bg-${statusColor}-500 rounded-full shadow-lg shadow-${statusColor}-500/30`}
                      />
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-bold text-${statusColor}-600`}>
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Check In</p>
                      <p className="text-sm sm:text-base md:text-2xl font-mono text-indigo-600">{checkInTime || '--:--'}</p>
                    </div>
                    <div className="hidden sm:block w-px h-8 sm:h-10 bg-slate-200"></div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Check Out</p>
                      <p className="text-sm sm:text-base md:text-2xl font-mono text-indigo-600">{checkOutTime || '--:--'}</p>
                    </div>
                    <div className="hidden md:block w-px h-10 bg-slate-200"></div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Working Hours</p>
                      <p className="text-sm sm:text-base md:text-2xl font-mono text-emerald-600">{workingHours}</p>
                    </div>
                  </div>
                </div>

                {/* Progress line */}
                <div className="mt-4 sm:mt-6 h-1 sm:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isCheckedOut ? '100%' : isCheckedIn ? '60%' : '0%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-400 rounded-full`}
                  />
                </div>
              </div>
            </motion.div>

            {/* Stats Grid - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            >
              {/* Present Days */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <HiOutlineCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-emerald-600" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600">{attendanceData?.summary.presentDays}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">Present Days</p>
                  <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                    <HiOutlineTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full">+12%</span>
                  </div>
                </div>
              </div>

              {/* Absent Days */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-rose-400 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <HiOutlineXCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-rose-600" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-rose-600">{attendanceData?.summary.absentDays}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">Absent Days</p>
                  <div className="mt-1 sm:mt-2">
                    <span className="text-xs text-rose-600 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-full">Last: 3d ago</span>
                  </div>
                </div>
              </div>

              {/* Leave Days */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <HiOutlineExclamationCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-amber-600" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600">{attendanceData?.summary.leaveDays}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">Leave Days</p>
                  <div className="mt-1 sm:mt-2">
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full">2 left</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 text-slate-700">
                <span className="w-1 h-4 sm:h-5 bg-indigo-500 rounded-full"></span>
                Recent Activity
              </h3>
              
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {attendanceData?.recentActivity.map((activity, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-wrap items-center gap-2 py-2 sm:py-3 border-b border-slate-100 last:border-0"
                  >
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      activity.status === 'present' ? 'bg-emerald-500' : 
                      activity.status === 'late' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-xs sm:text-sm text-slate-600 w-16 sm:w-20 md:w-24">{activity.date}</span>
                    <span className="text-xs sm:text-sm text-indigo-600 font-mono">{activity.checkIn}</span>
                    <HiOutlineArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                    <span className="text-xs sm:text-sm text-indigo-600 font-mono">{activity.checkOut}</span>
                    <span className={`ml-auto text-xs font-medium px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full ${
                      activity.status === 'present' ? 'text-emerald-700 bg-emerald-50' : 
                      activity.status === 'late' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                      {activity.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Quick Actions & Stats */}
          <motion.div 
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="space-y-4 sm:space-y-6 md:space-y-8"
          >
            {/* Quick Actions - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-200/30 to-purple-200/30 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl"></div>
              <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 md:mb-6 text-slate-700">Quick Actions</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckIn}
                    disabled={isCheckedIn}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-5 md:px-6 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all duration-300 ${
                      isCheckedIn 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-600/25'
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-3">
                      <HiOutlineLogin className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">Check In</span>
                    </span>
                    {isCheckedIn ? (
                      <span className="text-xs sm:text-sm text-emerald-600 bg-white px-2 sm:px-3 py-1 rounded-full">Done</span>
                    ) : (
                      <HiOutlineArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckOut}
                    disabled={!isCheckedIn || isCheckedOut}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-5 md:px-6 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all duration-300 ${
                      !isCheckedIn || isCheckedOut
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-3">
                      <HiOutlineLogout className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">Check Out</span>
                    </span>
                    {isCheckedOut ? (
                      <span className="text-xs sm:text-sm text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full">Done</span>
                    ) : (
                      <HiOutlineArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </motion.button>
                </div>

                {/* Live indicator */}
                <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-500">
                    <div className="relative">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
                      <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span>Live sync • Updated now</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Weekly Stats - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-8 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-6 text-slate-700">Weekly Progress</h3>
              
              <div className="space-y-3 sm:space-y-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                  <div key={day} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm text-slate-500 w-6 sm:w-8">{day}</span>
                    <div className="flex-1 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${[85, 90, 70, 95, 80][index]}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-indigo-600">{['8h', '9h', '7h', '9.5h', '8h'][index]}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 md:pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-500">Weekly avg</span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600">8.3h</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">↑ 0.5h from last week</p>
              </div>
            </motion.div>

            {/* Quick Tip - Mobile Optimized */}
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-indigo-100"
            >
              <p className="text-xs sm:text-sm text-indigo-700 mb-1 sm:mb-2">✨ Quick tip</p>
              <p className="text-xs sm:text-sm text-slate-600">You're doing great! Only 2 more days until your next milestone.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;