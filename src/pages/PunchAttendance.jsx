import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

const PunchAttendance = () => {
  const { user, employee, permissions: userPermissions, isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState('punched_out');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [punchHistory, setPunchHistory] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Permission helpers based on the permissions array from AuthContext
  const hasPermission = (permissionName) => {
    return userPermissions?.some(p => p.action === permissionName ) || false;
  };

  // Check if user has any of the required permissions
  const hasAnyPermission = (permissionNames) => {
    return permissionNames.some(permName => hasPermission(permName));
  };

  // Check if user has all required permissions
  const hasAllPermissions = (permissionNames) => {
    return permissionNames.every(permName => hasPermission(permName));
  };

  // Permission flags
  const canViewAllEmployees = hasAnyPermission(['manage_all', 'manage_all_employees']);
  const canManageAllEmployees = hasPermission('manage_all_employees');
  const canEditAttendance = hasAnyPermission(['edit_attendance', 'manage_all_employees']);
  const canExportData = hasPermission('export_attendance');
  const canViewReports = hasPermission('view_reports');
  const canManageCompany = hasPermission('manage_company');

  // Dummy employee data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      position: 'Senior Developer',
      avatar: 'JD',
      status: 'punched_in',
      todayAttendance: {
        punchIn: '09:00 AM',
        punchOut: null,
        breakStart: '01:00 PM',
        breakEnd: '02:00 PM',
        totalHours: '5h 30m',
        overtime: '0h'
      },
      weeklyAttendance: [
        { date: '2024-01-15', punchIn: '09:00', punchOut: '18:00', hours: '9h' },
        { date: '2024-01-16', punchIn: '09:15', punchOut: '18:30', hours: '9h 15m' }
      ]
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'Marketing',
      position: 'Marketing Manager',
      avatar: 'JS',
      status: 'punched_out',
      todayAttendance: {
        punchIn: null,
        punchOut: null,
        breakStart: null,
        breakEnd: null,
        totalHours: '0h',
        overtime: '0h'
      },
      weeklyAttendance: [
        { date: '2024-01-15', punchIn: '08:45', punchOut: '17:30', hours: '8h 45m' }
      ]
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      department: 'Sales',
      position: 'Sales Executive',
      avatar: 'MJ',
      status: 'on_break',
      todayAttendance: {
        punchIn: '08:30 AM',
        punchOut: null,
        breakStart: '12:30 PM',
        breakEnd: null,
        totalHours: '4h',
        overtime: '0h'
      },
      weeklyAttendance: [
        { date: '2024-01-15', punchIn: '08:30', punchOut: '17:45', hours: '9h 15m' }
      ]
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      department: 'HR',
      position: 'HR Specialist',
      avatar: 'SW',
      status: 'punched_in',
      todayAttendance: {
        punchIn: '09:30 AM',
        punchOut: null,
        breakStart: null,
        breakEnd: null,
        totalHours: '3h 30m',
        overtime: '0h'
      },
      weeklyAttendance: [
        { date: '2024-01-15', punchIn: '09:30', punchOut: '18:15', hours: '8h 45m' }
      ]
    }
  ]);

  // Dummy all employees attendance data
  const [allAttendance, setAllAttendance] = useState([
    { id: 1, name: 'John Doe', date: '2024-01-15', punchIn: '09:00 AM', punchOut: '06:00 PM', hours: '9h', status: 'Present', overtime: '0h' },
    { id: 1, name: 'John Doe', date: '2024-01-16', punchIn: '09:15 AM', punchOut: '06:30 PM', hours: '9h 15m', status: 'Present', overtime: '0h 15m' },
    { id: 2, name: 'Jane Smith', date: '2024-01-15', punchIn: '08:45 AM', punchOut: '05:30 PM', hours: '8h 45m', status: 'Present', overtime: '0h' },
    { id: 3, name: 'Mike Johnson', date: '2024-01-15', punchIn: '08:30 AM', punchOut: '05:45 PM', hours: '9h 15m', status: 'Present', overtime: '0h 15m' },
    { id: 4, name: 'Sarah Wilson', date: '2024-01-15', punchIn: '09:30 AM', punchOut: '06:15 PM', hours: '8h 45m', status: 'Present', overtime: '0h' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem(`punchHistory_${user?.id || 'guest'}`);
    if (savedHistory) {
      setPunchHistory(JSON.parse(savedHistory));
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`punchHistory_${user.id}`, JSON.stringify(punchHistory));
    }
  }, [punchHistory, user]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePunch = async (type) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    const punchRecord = {
      id: Date.now(),
      type: type,
      timestamp: now.toISOString(),
      location: gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : 'Location not available',
      method: type === 'qr' ? 'QR Scan' : type === 'face' ? 'Face Recognition' : type === 'gps' ? 'GPS' : 'Manual',
      userId: user?.id,
      userName: user?.name
    };
    
    setPunchHistory(prev => [punchRecord, ...prev]);
    
    let newStatus = '';
    let message = '';
    
    switch(type) {
      case 'punch_in':
        newStatus = 'punched_in';
        message = 'Successfully punched in!';
        break;
      case 'punch_out':
        newStatus = 'punched_out';
        message = 'Successfully punched out!';
        break;
      case 'break_start':
        newStatus = 'on_break';
        message = 'Break started!';
        break;
      case 'break_end':
        newStatus = 'punched_in';
        message = 'Break ended!';
        break;
      case 'qr':
        newStatus = 'punched_in';
        message = 'QR scan successful! Punched in.';
        break;
      case 'face':
        newStatus = 'punched_in';
        message = 'Face recognition successful! Punched in.';
        break;
      case 'gps':
        newStatus = 'punched_in';
        message = 'GPS location verified! Punched in.';
        break;
      default:
        break;
    }
    
    setPunchStatus(newStatus);
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setLoading(false);
  };

  const handleQRScan = () => {
    setQrDialogOpen(false);
    handlePunch('qr');
  };

  const handleFaceRecognition = () => {
    setFaceDialogOpen(false);
    handlePunch('face');
  };

  const handleGPSPunch = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          handlePunch('gps');
        },
        (error) => {
          setNotificationMessage(`GPS error: ${error.message}`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          setLoading(false);
        }
      );
    } else {
      setNotificationMessage('Geolocation not supported by your browser');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      setLoading(false);
    }
  };

  const handleEditAttendance = (attendance) => {
    if (!canEditAttendance) {
      setNotificationMessage('You do not have permission to edit attendance');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    setNotificationMessage('Edit feature would open here');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleExportData = () => {
    if (!canExportData) {
      setNotificationMessage('You do not have permission to export data');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    setNotificationMessage('Exporting attendance data...');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'punched_in': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'punched_out': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'on_break': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status = punchStatus) => {
    const statusMap = {
      punched_in: 'Punched In',
      punched_out: 'Punched Out',
      on_break: 'On Break'
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'punched_in': return '✅';
      case 'punched_out': return '⭕';
      case 'on_break': return '☕';
      default: return '❓';
    }
  };

  const getPunchTime = () => {
    if (punchHistory.length > 0) {
      const lastPunch = punchHistory[0];
      return new Date(lastPunch.timestamp).toLocaleTimeString();
    }
    return '--:--:--';
  };

  const filteredAttendance = allAttendance.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || record.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const PunchCard = ({ icon: Icon, title, description, onClick, color = 'blue', disabled = false }) => (
    <div 
      onClick={disabled ? null : onClick}
      className={`bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center transition-all duration-300 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-95'
      } border border-gray-100`}
    >
      <div className={`w-16 h-16 rounded-2xl bg-${color}-100 flex items-center justify-center mb-4`}>
        <Icon className={`w-8 h-8 text-${color}-600`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">{title}</h3>
      <p className="text-sm text-gray-500 text-center">{description}</p>
    </div>
  );

  // Icons
  const LoginIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const PlayIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const StopIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );

  const QrIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  const FaceIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const TimeIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const ExportIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const EmployeeList = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Employee Directory</h3>
        <p className="text-sm text-gray-500 mt-1">View and manage employee attendance</p>
      </div>
      <div className="divide-y divide-gray-200">
        {employees.map(employee => (
          <div 
            key={employee.id}
            onClick={() => setSelectedEmployee(employee)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {employee.avatar}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                    {getStatusIcon(employee.status)} {getStatusLabel(employee.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{employee.position} • {employee.department}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Today: {employee.todayAttendance.punchIn || 'Not punched'} • {employee.todayAttendance.totalHours}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AttendanceTable = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">All Employees Attendance</h3>
            <p className="text-sm text-gray-500 mt-1">Complete attendance records for all employees</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {canExportData && (
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExportIcon />
                <span className="ml-2">Export</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {canEditAttendance && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttendance.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {record.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{record.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.punchIn}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.punchOut || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hours}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {record.status}
                  </span>
                </td>
                {canEditAttendance && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEditAttendance(record)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EditIcon />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // If not authenticated, show loading or redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance System
                </h1>
                <p className="text-sm text-gray-600 mt-1">{formatDate(currentTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Attendance
            </button>
            {(canViewAllEmployees || canManageAllEmployees) && (
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Employees
              </button>
            )}
          </nav>
        </div>

        {/* Personal Attendance Tab */}
        {activeTab === 'personal' && (
          <div className="py-6 space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Time</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatTime(currentTime)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <TimeIcon />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getStatusColor()}`}>
                      {getStatusIcon()} {getStatusLabel()}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckIcon />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Last Punch</p>
                    <p className="text-xl font-semibold text-gray-900 mt-1">{getPunchTime()}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <LoginIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Punch Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <PunchCard 
                  icon={LoginIcon} 
                  title="Punch In" 
                  description="Start work day"
                  onClick={() => handlePunch('punch_in')}
                  color="emerald"
                />
                <PunchCard 
                  icon={LogoutIcon} 
                  title="Punch Out" 
                  description="End work day"
                  onClick={() => handlePunch('punch_out')}
                  color="rose"
                />
                <PunchCard 
                  icon={PlayIcon} 
                  title="Break Start" 
                  description="Take a break"
                  onClick={() => handlePunch('break_start')}
                  color="amber"
                />
                <PunchCard 
                  icon={StopIcon} 
                  title="Break End" 
                  description="Return from break"
                  onClick={() => handlePunch('break_end')}
                  color="blue"
                />
              </div>
            </div>

            {/* Advanced Methods */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Advanced Methods</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PunchCard 
                  icon={QrIcon} 
                  title="QR Scan" 
                  description="Scan QR code"
                  onClick={() => setQrDialogOpen(true)}
                  color="purple"
                />
                <PunchCard 
                  icon={FaceIcon} 
                  title="Face Punch" 
                  description="Facial recognition"
                  onClick={() => setFaceDialogOpen(true)}
                  color="indigo"
                />
                <PunchCard 
                  icon={LocationIcon} 
                  title="GPS Punch" 
                  description="Verify location"
                  onClick={handleGPSPunch}
                  color="teal"
                />
              </div>
            </div>

            {/* Punch History */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Today's Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {punchHistory.length > 0 ? (
                  punchHistory.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-4 flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {record.type.includes('in') && <LoginIcon />}
                        {record.type.includes('out') && <LogoutIcon />}
                        {record.type.includes('break') && <PlayIcon />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {record.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleTimeString()} • {record.method}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No punch records for today
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Employees Tab */}
        {activeTab === 'all' && (
          <div className="py-6 space-y-6">
            {canManageAllEmployees && (
              <EmployeeList />
            )}
            <AttendanceTable />
          </div>
        )}
      </div>

      {/* Dialogs and Overlays remain the same */}
      {qrDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">QR Code Scan</h3>
            <div className="p-8 bg-gray-50 rounded-xl mb-4 text-center">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center bg-white rounded-xl">
                <QrIcon />
              </div>
              <p className="text-sm text-gray-500 mt-4">Position QR code within frame</p>
            </div>
            <input
              type="text"
              placeholder="Or enter QR code manually"
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg mb-4"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setQrDialogOpen(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQRScan}
                disabled={!scanInput}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {faceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Face Recognition</h3>
            <div className="p-8 bg-gray-50 rounded-xl mb-4 text-center">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-white">
                <FaceIcon />
              </div>
              <p className="text-sm text-gray-500 mt-4">Position face within frame</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFaceDialogOpen(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFaceRecognition}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notificationMessage}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PunchAttendance;