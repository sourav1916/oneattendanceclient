import React, { useState, useEffect } from 'react';
import { 
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const MyAttendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState({ loading: true, enabled: false, address: '', error: null });
  const [attendance, setAttendance] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    checkInTime: null,
    checkOutTime: null,
    status: 'absent',
    workingHours: '0h 0m'
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: true }));
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocation({
            loading: false,
            enabled: true,
            address: 'San Francisco, CA (simulated)',
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            error: null
          });
        },
        (error) => {
          setLocation({
            loading: false,
            enabled: false,
            address: '',
            error: 'Location access denied. Please enable GPS.'
          });
        }
      );
    } else {
      setLocation({
        loading: false,
        enabled: false,
        address: '',
        error: 'Geolocation not supported'
      });
    }
  }, []);

  // Handle check-in
  const handleCheckIn = () => {
    if (attendance.isCheckedIn) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 15);

    setAttendance({
      ...attendance,
      isCheckedIn: true,
      checkInTime: formattedTime,
      status: isLate ? 'late' : 'present'
    });

    setSuccessMessage(`Check-in successful at ${formattedTime}`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Handle check-out
  const handleCheckOut = () => {
    if (!attendance.isCheckedIn || attendance.isCheckedOut) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const workingHours = calculateWorkingHours(attendance.checkInTime, formattedTime);

    setAttendance({
      ...attendance,
      isCheckedOut: true,
      checkOutTime: formattedTime,
      workingHours: workingHours
    });

    setSuccessMessage(`Check-out successful at ${formattedTime}`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Calculate working hours
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '0h 0m';

    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes, seconds] = time.split(':');
      hours = parseInt(hours);
      minutes = parseInt(minutes);
      
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      return { hours, minutes };
    };

    const inTime = parseTime(checkIn);
    const outTime = parseTime(checkOut);

    let hoursDiff = outTime.hours - inTime.hours;
    let minutesDiff = outTime.minutes - inTime.minutes;

    if (minutesDiff < 0) {
      hoursDiff -= 1;
      minutesDiff += 60;
    }

    return `${hoursDiff}h ${minutesDiff}m`;
  };

  // Get status info
  const getStatusInfo = () => {
    if (attendance.isCheckedOut) {
      return {
        icon: HiOutlineCheckCircle,
        color: 'emerald',
        text: 'Completed',
        bg: 'bg-emerald-50',
        textColor: 'text-emerald-700'
      };
    } else if (attendance.isCheckedIn) {
      if (attendance.status === 'late') {
        return {
          icon: HiOutlineExclamationCircle,
          color: 'amber',
          text: 'Working (Late)',
          bg: 'bg-amber-50',
          textColor: 'text-amber-700'
        };
      } else {
        return {
          icon: HiOutlineCheckCircle,
          color: 'blue',
          text: 'Working',
          bg: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      }
    } else {
      return {
        icon: HiOutlineXCircle,
        color: 'slate',
        text: 'Not Started',
        bg: 'bg-slate-50',
        textColor: 'text-slate-600'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background - With pointer-events-none */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-emerald-50 text-emerald-800 px-6 py-3 rounded-2xl shadow-lg border border-emerald-200 flex items-center gap-3">
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mark Attendance
            </span>
          </h1>
          <p className="text-lg text-slate-600">Check in or out to record your attendance</p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Time & Location */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current time card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-xl"
            >
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <HiOutlineClock className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Current Time</h2>
              </div>
              
              <div className="text-center">
                <motion.div
                  key={formattedTime}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-mono font-bold text-slate-800 mb-2"
                >
                  {formattedTime}
                </motion.div>
                <p className="text-slate-500">{formattedDate}</p>
              </div>
            </motion.div>

            {/* Location card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-xl"
            >
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <HiOutlineLocationMarker className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Your Location</h2>
              </div>
              
              {location.loading ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Detecting location...</span>
                </div>
              ) : location.enabled ? (
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Location detected</span>
                  </div>
                  <p className="text-slate-700 font-medium">{location.address}</p>
                  {location.coordinates && (
                    <p className="text-xs text-slate-500 mt-1">
                      Lat: {location.coordinates.lat.toFixed(4)}, Lng: {location.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-600">
                  <HiOutlineInformationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{location.error}</p>
                </div>
              )}
            </motion.div>

            {/* Quick tips */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100"
            >
              <h3 className="text-sm font-semibold text-indigo-700 mb-2">📍 Quick Tips</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  Check in before 9:15 AM to avoid late mark
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  Location is recorded with each attendance
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  You can't check out without checking in first
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Right column - Attendance actions */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl"
            >
              {/* Status indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-700">Current Status</h2>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`flex items-center gap-2 px-4 py-2 ${statusInfo.bg} rounded-full`}
                  >
                    <StatusIcon className={`w-4 h-4 ${statusInfo.textColor}`} />
                    <span className={`text-sm font-medium ${statusInfo.textColor}`}>{statusInfo.text}</span>
                  </motion.div>
                </div>

                {/* Status progress bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: attendance.isCheckedOut ? '100%' : 
                             attendance.isCheckedIn ? '50%' : '0%' 
                    }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      attendance.isCheckedOut ? 'bg-emerald-500' :
                      attendance.isCheckedIn ? 'bg-blue-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Time records */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Check In Time</p>
                  <p className="text-xl font-mono font-semibold text-indigo-600">
                    {attendance.checkInTime || '--:--:-- --'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Check Out Time</p>
                  <p className="text-xl font-mono font-semibold text-indigo-600">
                    {attendance.checkOutTime || '--:--:-- --'}
                  </p>
                </div>
              </div>

              {/* Working hours display */}
              {attendance.isCheckedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100"
                >
                  <p className="text-sm text-indigo-600 mb-1">Total Working Hours</p>
                  <p className="text-3xl font-bold text-indigo-700">{attendance.workingHours}</p>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckIn}
                  disabled={attendance.isCheckedIn}
                  className={`
                    relative py-6 px-6 rounded-2xl font-semibold text-lg
                    flex items-center justify-center gap-3 transition-all duration-300
                    ${attendance.isCheckedIn 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-indigo-600/25'
                    }
                  `}
                >
                  <HiOutlineLogin className="w-6 h-6" />
                  <span>Check In</span>
                  {attendance.isCheckedIn && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></span>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckOut}
                  disabled={!attendance.isCheckedIn || attendance.isCheckedOut}
                  className={`
                    relative py-6 px-6 rounded-2xl font-semibold text-lg
                    flex items-center justify-center gap-3 transition-all duration-300
                    ${!attendance.isCheckedIn || attendance.isCheckedOut
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-indigo-600 border-2 border-indigo-600 shadow-lg hover:bg-indigo-50'
                    }
                  `}
                >
                  <HiOutlineLogout className="w-6 h-6" />
                  <span>Check Out</span>
                  {attendance.isCheckedOut && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></span>
                  )}
                </motion.button>
              </div>

              {/* Recent activity note */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                  <span>Last synced: Just now</span>
                </div>
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 grid grid-cols-3 gap-4"
            >
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">This Week</p>
                <p className="text-xl font-bold text-indigo-600">4 days</p>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">On Time</p>
                <p className="text-xl font-bold text-emerald-600">85%</p>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Hours</p>
                <p className="text-xl font-bold text-purple-600">32h</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default MyAttendance;