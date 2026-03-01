// pages/admin/attendance/AttendanceList.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
    FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaEye,
    FaChevronLeft, FaChevronRight, FaUserCheck, FaUserClock,
    FaClock, FaCalendarAlt, FaMapMarkerAlt, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaDownload,
    FaUpload, FaTimes, FaCamera, FaUserCircle, FaIdCard,
    FaInfoCircle, FaChartLine, FaDollarSign, FaBuilding,
    FaBriefcase, FaUsers, FaCheck, FaBan, FaRegClock,
    FaHourglassHalf, FaUserGraduate, FaUserTie, FaUserMd,
    FaUserCog, FaUserNinja, FaUserAstronaut, FaUserSecret,
    FaUserCheck as FaUserCheckIcon, FaUserClock as FaUserClockIcon,
    FaMapPin, FaLocationArrow, FaHome, FaLaptop, FaCoffee,
    FaUtensils, FaMoon, FaSun, FaCloudSun, FaCloudRain,
    FaCloud, FaSnowflake, FaWind, FaTemperatureHigh,
    FaTemperatureLow, FaThermometerHalf, FaTint, FaLeaf,
    FaTree, FaMountain, FaWater, FaFire, FaBolt, FaBug,
    FaRocket, FaSpaceShuttle, FaSatellite, FaGlobe,
    FaGlobeAmericas, FaGlobeAsia, FaGlobeEurope,
    FaGlobeAfrica, FaGlobeOceania, FaMap, FaCompass,
    FaStreetView, FaSatelliteDish, FaRadar, FaRss,
    FaWifi, FaBluetooth, FaBluetoothB, FaNetworkWired,
    FaNetworkWireless, FaEthernet, FaUsb, FaSdCard,
    FaMemory, FaMicrochip, FaCpu, FaServer, FaDatabase,
    FaCloudUploadAlt, FaCloudDownloadAlt, FaCloudMoon,
    FaCloudSunRain, FaCloudMoonRain, FaCloudSnow,
    FaCloudHail, FaCloudFog, FaCloudMeatball, FaPoo,
    FaPooStorm, FaToilet, FaShower, FaBath, FaHotTub,
    FaHotTubPerson, FaHotTubPersonFilled, FaHotTubPersonOutline,
    FaHotTubPersonSlash, FaHotTubPersonCheck, FaHotTubPersonTimes
} from "react-icons/fa";

// Skeleton Component for Loading State
const AttendanceSkeleton = () => {
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                            <div className="w-12 h-4 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                    </div>
                ))}
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="h-8 bg-slate-200 rounded w-48"></div>
                <div className="flex items-center gap-2">
                    <div className="h-10 bg-slate-200 rounded-lg w-24"></div>
                    <div className="h-10 bg-slate-200 rounded-lg w-24"></div>
                    <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
                </div>
            </div>

            {/* Search Skeleton */}
            <div className="h-12 bg-slate-200 rounded-lg w-full"></div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-slate-50 border-b border-slate-200">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="h-4 bg-slate-200 rounded w-16"></div>
                    ))}
                </div>
                <div className="divide-y divide-slate-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4">
                            <div className="md:hidden space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-32"></div>
                                            <div className="h-3 bg-slate-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[1, 2, 3, 4].map((j) => (
                                        <div key={j} className="space-y-1">
                                            <div className="h-3 bg-slate-200 rounded w-16"></div>
                                            <div className="h-4 bg-slate-200 rounded w-20"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                    <div key={j} className="h-4 bg-slate-200 rounded w-20"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function AttendanceList() {
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [showCheckOutModal, setShowCheckOutModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [weatherData, setWeatherData] = useState(null);
    const itemsPerPage = 10;
    const isAnyModalOpen = showAddModal || showEditModal || showViewModal || showDeleteModal || showCheckInModal || showCheckOutModal || showBulkUploadModal;

    // Use the hook
    useBodyScrollLock(isAnyModalOpen);

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Get current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationError(null);
                    
                    // Simulate weather data based on coordinates
                    simulateWeatherData(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    setLocationError(error.message);
                    // Simulate default weather data
                    simulateWeatherData(40.7128, -74.0060); // Default to NYC
                }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser");
            // Simulate default weather data
            simulateWeatherData(40.7128, -74.0060);
        }
    }, []);

    // Simulate weather data based on coordinates
    const simulateWeatherData = (lat, lng) => {
        // This is a mock function - in real app, you'd call a weather API
        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy', 'Clear'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const randomTemp = Math.floor(Math.random() * 35) + 10; // 10-45°C
        const randomHumidity = Math.floor(Math.random() * 60) + 40; // 40-100%
        
        setWeatherData({
            condition: randomCondition,
            temperature: randomTemp,
            humidity: randomHumidity,
            location: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`
        });
    };

    // Get weather icon based on condition
    const getWeatherIcon = (condition) => {
        switch (condition?.toLowerCase()) {
            case 'sunny':
                return <FaSun className="w-6 h-6 text-yellow-500" />;
            case 'cloudy':
                return <FaCloud className="w-6 h-6 text-slate-500" />;
            case 'rainy':
                return <FaCloudRain className="w-6 h-6 text-blue-500" />;
            case 'snowy':
                return <FaSnowflake className="w-6 h-6 text-blue-300" />;
            case 'windy':
                return <FaWind className="w-6 h-6 text-slate-400" />;
            default:
                return <FaCloudSun className="w-6 h-6 text-yellow-500" />;
        }
    };

    // Form state for new attendance
    const [newAttendance, setNewAttendance] = useState({
        employeeId: "",
        employeeName: "",
        employeeEmail: "",
        employeeDepartment: "",
        employeeRole: "",
        date: new Date().toISOString().split('T')[0],
        checkIn: "",
        checkOut: "",
        status: "present",
        workHours: 0,
        overtime: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        location: "",
        ipAddress: "",
        deviceInfo: "",
        notes: "",
        checkInPhoto: null,
        checkOutPhoto: null,
        checkInLocation: {
            lat: null,
            lng: null
        },
        checkOutLocation: {
            lat: null,
            lng: null
        }
    });

    // Sample attendance data
    const [attendance, setAttendance] = useState([
        {
            id: 1,
            employeeId: "EMP001",
            employeeName: "John Smith",
            employeeEmail: "john.smith@company.com",
            employeeDepartment: "Engineering",
            employeeRole: "Senior Developer",
            date: "2024-03-15",
            checkIn: "09:00",
            checkOut: "18:00",
            status: "present",
            workHours: 8.5,
            overtime: 0.5,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            location: "Main Office",
            ipAddress: "192.168.1.101",
            deviceInfo: "MacBook Pro - Chrome",
            notes: "Working on project X",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 2,
            employeeId: "EMP002",
            employeeName: "Sarah Johnson",
            employeeEmail: "sarah.j@company.com",
            employeeDepartment: "Marketing",
            employeeRole: "Marketing Manager",
            date: "2024-03-15",
            checkIn: "09:15",
            checkOut: "17:30",
            status: "late",
            workHours: 8,
            overtime: 0,
            lateMinutes: 15,
            earlyDepartureMinutes: 30,
            location: "Main Office",
            ipAddress: "192.168.1.102",
            deviceInfo: "Windows PC - Firefox",
            notes: "Client meeting in the morning",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 3,
            employeeId: "EMP003",
            employeeName: "Michael Brown",
            employeeEmail: "michael.b@company.com",
            employeeDepartment: "Sales",
            employeeRole: "Sales Representative",
            date: "2024-03-15",
            checkIn: "08:45",
            checkOut: "17:45",
            status: "present",
            workHours: 8.5,
            overtime: 0.5,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            location: "Remote - Home Office",
            ipAddress: "192.168.1.103",
            deviceInfo: "iPad - Safari",
            notes: "Working from home today",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 4,
            employeeId: "EMP004",
            employeeName: "Emily Davis",
            employeeEmail: "emily.d@company.com",
            employeeDepartment: "HR",
            employeeRole: "HR Manager",
            date: "2024-03-15",
            checkIn: "09:30",
            checkOut: "18:30",
            status: "overtime",
            workHours: 9,
            overtime: 1,
            lateMinutes: 30,
            earlyDepartureMinutes: 0,
            location: "Main Office",
            ipAddress: "192.168.1.104",
            deviceInfo: "MacBook Air - Safari",
            notes: "Interviewing candidates",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 5,
            employeeId: "EMP005",
            employeeName: "David Wilson",
            employeeEmail: "david.w@company.com",
            employeeDepartment: "Engineering",
            employeeRole: "Frontend Developer",
            date: "2024-03-15",
            checkIn: null,
            checkOut: null,
            status: "absent",
            workHours: 0,
            overtime: 0,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            location: null,
            ipAddress: null,
            deviceInfo: null,
            notes: "Sick leave",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: null,
            checkOutLocation: null
        },
        {
            id: 6,
            employeeId: "EMP006",
            employeeName: "Lisa Anderson",
            employeeEmail: "lisa.a@company.com",
            employeeDepartment: "Finance",
            employeeRole: "Accountant",
            date: "2024-03-15",
            checkIn: "08:50",
            checkOut: "17:20",
            status: "present",
            workHours: 8,
            overtime: 0,
            lateMinutes: 0,
            earlyDepartureMinutes: 10,
            location: "Main Office",
            ipAddress: "192.168.1.105",
            deviceInfo: "Windows PC - Chrome",
            notes: "Monthly reports",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 7,
            employeeId: "EMP007",
            employeeName: "James Taylor",
            employeeEmail: "james.t@company.com",
            employeeDepartment: "Engineering",
            employeeRole: "Backend Developer",
            date: "2024-03-15",
            checkIn: "09:05",
            checkOut: "18:05",
            status: "present",
            workHours: 8.5,
            overtime: 0.5,
            lateMinutes: 5,
            earlyDepartureMinutes: 0,
            location: "Main Office",
            ipAddress: "192.168.1.106",
            deviceInfo: "Linux PC - Firefox",
            notes: "API development",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 8,
            employeeId: "EMP008",
            employeeName: "Patricia White",
            employeeEmail: "patricia.w@company.com",
            employeeDepartment: "Marketing",
            employeeRole: "Content Writer",
            date: "2024-03-15",
            checkIn: "09:20",
            checkOut: "17:20",
            status: "late",
            workHours: 7.5,
            overtime: 0,
            lateMinutes: 20,
            earlyDepartureMinutes: 40,
            location: "Remote - Coffee Shop",
            ipAddress: "192.168.1.107",
            deviceInfo: "MacBook Pro - Chrome",
            notes: "Writing blog posts",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 9,
            employeeId: "EMP009",
            employeeName: "Robert Martinez",
            employeeEmail: "robert.m@company.com",
            employeeDepartment: "Sales",
            employeeRole: "Sales Manager",
            date: "2024-03-15",
            checkIn: "08:30",
            checkOut: "18:30",
            status: "overtime",
            workHours: 9.5,
            overtime: 1.5,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            location: "Client Site",
            ipAddress: "192.168.1.108",
            deviceInfo: "iPhone - Safari",
            notes: "Client presentation",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        },
        {
            id: 10,
            employeeId: "EMP010",
            employeeName: "Jennifer Lee",
            employeeEmail: "jennifer.l@company.com",
            employeeDepartment: "HR",
            employeeRole: "Recruiter",
            date: "2024-03-15",
            checkIn: "09:10",
            checkOut: "17:40",
            status: "present",
            workHours: 8,
            overtime: 0,
            lateMinutes: 10,
            earlyDepartureMinutes: 20,
            location: "Main Office",
            ipAddress: "192.168.1.109",
            deviceInfo: "Windows PC - Edge",
            notes: "Interview scheduling",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: 40.7128, lng: -74.0060 },
            checkOutLocation: { lat: 40.7128, lng: -74.0060 }
        }
    ]);

    // Department options
    const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "IT", "Customer Support"];
    
    // Status options
    const statuses = ["Present", "Late", "Absent", "Overtime", "Half Day", "Leave", "Remote"];

    // Calculate summary statistics
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => record.date === today);
    
    const totalEmployees = 50; // This would come from your employees data
    const presentToday = todayAttendance.filter(record => record.status === 'present' || record.status === 'late' || record.status === 'overtime').length;
    const absentToday = todayAttendance.filter(record => record.status === 'absent').length;
    const lateToday = todayAttendance.filter(record => record.status === 'late').length;
    const onTimeToday = todayAttendance.filter(record => record.status === 'present' && record.lateMinutes === 0).length;
    const remoteToday = todayAttendance.filter(record => record.location?.includes('Remote')).length;
    const overtimeToday = todayAttendance.filter(record => record.status === 'overtime').length;

    // Calculate average work hours
    const totalWorkHours = todayAttendance.reduce((acc, record) => acc + record.workHours, 0);
    const avgWorkHours = (totalWorkHours / (presentToday || 1)).toFixed(1);

    // Calculate attendance rate
    const attendanceRate = ((presentToday / totalEmployees) * 100).toFixed(1);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (showEditModal && selectedAttendance) {
            setSelectedAttendance(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setNewAttendance(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle check-in
    const handleCheckIn = () => {
        const now = new Date();
        const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Determine status based on check-in time
        let status = "present";
        const checkInHour = now.getHours();
        const checkInMinute = now.getMinutes();
        
        // Assuming work starts at 9:00 AM
        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
            status = "late";
        }
        
        const newRecord = {
            id: attendance.length + 1,
            employeeId: "EMP011", // This would come from logged-in user
            employeeName: "Current User", // This would come from logged-in user
            employeeEmail: "user@company.com",
            employeeDepartment: "Engineering",
            employeeRole: "Developer",
            date: now.toISOString().split('T')[0],
            checkIn: currentTimeStr,
            checkOut: null,
            status: status,
            workHours: 0,
            overtime: 0,
            lateMinutes: status === "late" ? (checkInHour - 9) * 60 + checkInMinute : 0,
            earlyDepartureMinutes: 0,
            location: currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : "Unknown",
            ipAddress: "192.168.1.110", // This would be dynamic
            deviceInfo: navigator.userAgent,
            notes: "",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: currentLocation,
            checkOutLocation: null
        };
        
        setAttendance([newRecord, ...attendance]);
        setShowCheckInModal(false);
        setSuccessMessage("Check-in successful!");
        setShowSuccessMessage(true);
        
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 3000);
    };

    // Handle check-out
    const handleCheckOut = () => {
        if (selectedAttendance) {
            const now = new Date();
            const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);
            
            // Calculate work hours
            const checkInTime = new Date(`${selectedAttendance.date}T${selectedAttendance.checkIn}`);
            const checkOutTime = now;
            const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
            
            // Calculate overtime (assuming 8-hour workday)
            const overtime = Math.max(0, workHours - 8);
            
            const updatedAttendance = attendance.map(record =>
                record.id === selectedAttendance.id
                    ? {
                        ...record,
                        checkOut: currentTimeStr,
                        workHours: parseFloat(workHours.toFixed(1)),
                        overtime: parseFloat(overtime.toFixed(1)),
                        checkOutLocation: currentLocation,
                        status: overtime > 0 ? "overtime" : record.status
                    }
                    : record
            );
            
            setAttendance(updatedAttendance);
            setShowCheckOutModal(false);
            setSelectedAttendance(null);
            setSuccessMessage("Check-out successful!");
            setShowSuccessMessage(true);
            
            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        }
    };

    // Handle form submit for add
    const handleAddAttendance = () => {
        const record = {
            id: attendance.length + 1,
            ...newAttendance,
            workHours: newAttendance.checkIn && newAttendance.checkOut 
                ? calculateWorkHours(newAttendance.checkIn, newAttendance.checkOut)
                : 0,
            overtime: newAttendance.checkIn && newAttendance.checkOut
                ? calculateOvertime(newAttendance.checkIn, newAttendance.checkOut)
                : 0
        };
        
        setAttendance([...attendance, record]);
        setNewAttendance({
            employeeId: "",
            employeeName: "",
            employeeEmail: "",
            employeeDepartment: "",
            employeeRole: "",
            date: new Date().toISOString().split('T')[0],
            checkIn: "",
            checkOut: "",
            status: "present",
            workHours: 0,
            overtime: 0,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            location: "",
            ipAddress: "",
            deviceInfo: "",
            notes: "",
            checkInPhoto: null,
            checkOutPhoto: null,
            checkInLocation: { lat: null, lng: null },
            checkOutLocation: { lat: null, lng: null }
        });
        setShowAddModal(false);
        setSuccessMessage("Attendance record added successfully!");
        setShowSuccessMessage(true);
        
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 3000);
    };

    // Handle form submit for edit
    const handleEditAttendance = () => {
        if (selectedAttendance) {
            const updatedAttendance = attendance.map(record =>
                record.id === selectedAttendance.id
                    ? {
                        ...selectedAttendance,
                        workHours: selectedAttendance.checkIn && selectedAttendance.checkOut
                            ? calculateWorkHours(selectedAttendance.checkIn, selectedAttendance.checkOut)
                            : 0,
                        overtime: selectedAttendance.checkIn && selectedAttendance.checkOut
                            ? calculateOvertime(selectedAttendance.checkIn, selectedAttendance.checkOut)
                            : 0
                    }
                    : record
            );
            
            setAttendance(updatedAttendance);
            setShowEditModal(false);
            setSelectedAttendance(null);
            setSuccessMessage("Attendance record updated successfully!");
            setShowSuccessMessage(true);
            
            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        }
    };

    // Handle delete attendance
    const handleDeleteAttendance = () => {
        if (selectedAttendance) {
            setAttendance(attendance.filter(record => record.id !== selectedAttendance.id));
            setShowDeleteModal(false);
            setSelectedAttendance(null);
            setSuccessMessage("Attendance record deleted successfully!");
            setShowSuccessMessage(true);
            
            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        }
    };

    // Calculate work hours
    const calculateWorkHours = (checkIn, checkOut) => {
        const [inHour, inMin] = checkIn.split(':').map(Number);
        const [outHour, outMin] = checkOut.split(':').map(Number);
        
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        
        return parseFloat(((outMinutes - inMinutes) / 60).toFixed(1));
    };

    // Calculate overtime
    const calculateOvertime = (checkIn, checkOut) => {
        const workHours = calculateWorkHours(checkIn, checkOut);
        return Math.max(0, parseFloat((workHours - 8).toFixed(1)));
    };

    // Open view modal
    const handleViewAttendance = (record) => {
        setSelectedAttendance(record);
        setShowViewModal(true);
    };

    // Open edit modal
    const handleEditClick = (record) => {
        setSelectedAttendance(record);
        setShowEditModal(true);
    };

    // Open check-out modal
    const handleCheckOutClick = (record) => {
        setSelectedAttendance(record);
        setShowCheckOutModal(true);
    };

    // Filter attendance
    const filteredAttendance = attendance.filter(record => {
        const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.employeeDepartment.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = selectedDate === "all" || record.date === selectedDate;
        const matchesStatus = selectedStatus === "all" || record.status === selectedStatus.toLowerCase();
        const matchesDepartment = selectedDepartment === "all" || record.employeeDepartment === selectedDepartment;
        
        return matchesSearch && matchesDate && matchesStatus && matchesDepartment;
    });

    // Pagination
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAttendance = filteredAttendance.slice(startIndex, startIndex + itemsPerPage);

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-700';
            case 'late':
                return 'bg-amber-100 text-amber-700';
            case 'absent':
                return 'bg-red-100 text-red-700';
            case 'overtime':
                return 'bg-purple-100 text-purple-700';
            case 'half day':
                return 'bg-blue-100 text-blue-700';
            case 'leave':
                return 'bg-slate-100 text-slate-600';
            case 'remote':
                return 'bg-indigo-100 text-indigo-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <FaCheckCircle className="w-4 h-4" />;
            case 'late':
                return <FaClock className="w-4 h-4" />;
            case 'absent':
                return <FaTimesCircle className="w-4 h-4" />;
            case 'overtime':
                return <FaHourglassHalf className="w-4 h-4" />;
            default:
                return <FaInfoCircle className="w-4 h-4" />;
        }
    };

    // Get department icon
    const getDepartmentIcon = (department) => {
        switch (department) {
            case 'Engineering':
                return <FaMicrochip className="w-4 h-4" />;
            case 'Marketing':
                return <FaChartLine className="w-4 h-4" />;
            case 'Sales':
                return <FaDollarSign className="w-4 h-4" />;
            case 'HR':
                return <FaUsers className="w-4 h-4" />;
            case 'Finance':
                return <FaDatabase className="w-4 h-4" />;
            default:
                return <FaBriefcase className="w-4 h-4" />;
        }
    };

    // Summary card data
    const summaryCards = [
        {
            title: "Present Today",
            value: presentToday,
            icon: FaUserCheckIcon,
            bgColor: "bg-green-50",
            textColor: "text-green-600",
            subtext: `${attendanceRate}% of total`,
            change: `+${presentToday - 45}`,
            changeType: presentToday > 45 ? "increase" : "decrease"
        },
        {
            title: "Absent Today",
            value: absentToday,
            icon: FaUserClockIcon,
            bgColor: "bg-red-50",
            textColor: "text-red-600",
            subtext: `${((absentToday / totalEmployees) * 100).toFixed(1)}% of total`,
            change: `-${absentToday}`,
            changeType: "decrease"
        },
        {
            title: "Late Today",
            value: lateToday,
            icon: FaClock,
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
            subtext: `${((lateToday / presentToday) * 100).toFixed(1)}% of present`,
            change: `+${lateToday}`,
            changeType: "increase"
        },
        {
            title: "On Time",
            value: onTimeToday,
            icon: FaCheckCircle,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            subtext: `${((onTimeToday / presentToday) * 100).toFixed(1)}% of present`,
            change: `+${onTimeToday}`,
            changeType: "increase"
        },
        {
            title: "Remote Work",
            value: remoteToday,
            icon: FaLaptop,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            subtext: `${((remoteToday / presentToday) * 100).toFixed(1)}% remote`,
            change: `+${remoteToday}`,
            changeType: "increase"
        },
        {
            title: "Overtime",
            value: overtimeToday,
            icon: FaHourglassHalf,
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            subtext: `Avg ${overtimeToday > 0 ? (totalWorkHours / presentToday).toFixed(1) : 0} hrs`,
            change: `+${overtimeToday}`,
            changeType: "increase"
        }
    ];

    if (isLoading) {
        return <AttendanceSkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 sm:space-y-6 relative"
        >
            {/* Success Message Toast */}
            <AnimatePresence>
                {showSuccessMessage && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <FaCheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message Toast */}
            <AnimatePresence>
                {showErrorMessage && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-sm font-medium">{errorMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {summaryCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 ${card.textColor}`} />
                            </div>
                            {card.change && (
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                    card.changeType === 'increase'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {card.change}
                                </span>
                            )}
                        </div>

                        <h3 className="text-xs font-medium text-slate-500 mb-0.5">{card.title}</h3>
                        <p className="text-lg sm:text-xl font-bold text-slate-800">{card.value}</p>

                        {card.subtext && (
                            <p className="text-xs text-slate-400 mt-1">{card.subtext}</p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <motion.h1
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-xl sm:text-2xl font-bold text-slate-800"
                >
                    Attendance Management
                </motion.h1>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
                    >
                        <FaFilter className="w-4 h-4 text-slate-500" />
                        <span className="hidden sm:inline">Filters</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowBulkUploadModal(true)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
                    >
                        <FaUpload className="w-4 h-4 text-slate-500" />
                        <span className="hidden sm:inline">Bulk Upload</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
                    >
                        <FaDownload className="w-4 h-4 text-slate-500" />
                        <span className="hidden sm:inline">Export</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
                    >
                        <FaPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Record</span>
                        <span className="sm:hidden">Add</span>
                    </motion.button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by employee name, ID, email, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                    />
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Department
                                    </label>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="overtime">Overtime</option>
                                        <option value="half day">Half Day</option>
                                        <option value="leave">Leave</option>
                                        <option value="remote">Remote</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Table Header - Hidden on mobile */}
                <div className="hidden md:grid md:grid-cols-9 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase">
                    <div className="col-span-2">Employee</div>
                    <div>Department</div>
                    <div>Check In</div>
                    <div>Check Out</div>
                    <div>Hours</div>
                    <div>Status</div>
                    <div>Location</div>
                    <div>Actions</div>
                </div>

                {/* Attendance Rows */}
                <div className="divide-y divide-slate-200">
                    <AnimatePresence mode="wait">
                        {paginatedAttendance.map((record, index) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 hover:bg-slate-50 transition-colors"
                            >
                                {/* Mobile View */}
                                <div className="md:hidden space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-medium">
                                                    {record.employeeName.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-800">{record.employeeName}</h3>
                                                <p className="text-xs text-slate-500">{record.employeeId}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(record.status)}`}>
                                            {getStatusIcon(record.status)}
                                            {record.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Department</p>
                                            <p className="text-slate-700 flex items-center gap-1">
                                                {getDepartmentIcon(record.employeeDepartment)}
                                                {record.employeeDepartment}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Check In/Out</p>
                                            <p className="text-slate-700">
                                                {record.checkIn || '--'} / {record.checkOut || '--'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Work Hours</p>
                                            <p className="text-slate-700">{record.workHours}h {record.overtime > 0 && `(+${record.overtime}h OT)`}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Location</p>
                                            <p className="text-slate-700 truncate" title={record.location}>
                                                {record.location || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        {!record.checkOut && record.date === today && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleCheckOutClick(record)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                title="Check Out"
                                            >
                                                <FaClock className="w-4 h-4" />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleViewAttendance(record)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEditClick(record)}
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setSelectedAttendance(record);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:grid md:grid-cols-9 gap-4 items-center">
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-medium">
                                                {record.employeeName.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{record.employeeName}</p>
                                            <p className="text-xs text-slate-500">{record.employeeId}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 flex items-center gap-1">
                                        {getDepartmentIcon(record.employeeDepartment)}
                                        {record.employeeDepartment}
                                    </div>
                                    <div className="text-sm text-slate-600">{record.checkIn || '--'}</div>
                                    <div className="text-sm text-slate-600">{record.checkOut || '--'}</div>
                                    <div className="text-sm text-slate-600">
                                        {record.workHours}h
                                        {record.overtime > 0 && (
                                            <span className="text-xs text-green-600 ml-1">(+{record.overtime})</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${getStatusColor(record.status)}`}>
                                            {getStatusIcon(record.status)}
                                            {record.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600 truncate" title={record.location}>
                                        {record.location || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!record.checkOut && record.date === today && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleCheckOutClick(record)}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                title="Check Out"
                                            >
                                                <FaClock className="w-4 h-4" />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleViewAttendance(record)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEditClick(record)}
                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                            title="Edit"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setSelectedAttendance(record);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length} records
                    </p>

                    <div className="flex items-center justify-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border ${
                                currentPage === 1
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <FaChevronLeft className="w-4 h-4" />
                        </motion.button>

                        <span className="text-sm text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border ${
                                currentPage === totalPages
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <FaChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Check In Modal */}
            <AnimatePresence>
                {showCheckInModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important]"
                        onClick={() => setShowCheckInModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheckCircle className="w-8 h-8 text-green-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                                Check In
                            </h3>

                            <p className="text-sm text-slate-500 text-center mb-6">
                                Are you sure you want to check in now?
                            </p>

                            <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Current Time</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {currentTime.toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Current Date</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {currentTime.toLocaleDateString()}
                                    </span>
                                </div>
                                {currentLocation && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Location</span>
                                        <span className="text-sm font-medium text-slate-800">
                                            {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                                        </span>
                                    </div>
                                )}
                                {locationError && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">Location</span>
                                        <span className="text-sm font-medium text-amber-600">
                                            Unable to get location
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCheckInModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCheckIn}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Check In
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Check Out Modal */}
            <AnimatePresence>
                {showCheckOutModal && selectedAttendance && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important]"
                        onClick={() => setShowCheckOutModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaClock className="w-8 h-8 text-amber-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                                Check Out
                            </h3>

                            <p className="text-sm text-slate-500 text-center mb-6">
                                Are you sure you want to check out now?
                            </p>

                            <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Employee</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {selectedAttendance.employeeName}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Check In Time</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {selectedAttendance.checkIn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-500">Current Time</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {currentTime.toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-500">Work Hours So Far</span>
                                    <span className="text-sm font-medium text-slate-800">
                                        {calculateWorkHours(selectedAttendance.checkIn, currentTime.toTimeString().split(' ')[0].substring(0, 5))}h
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCheckOutModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCheckOut}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    Check Out
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Attendance Modal */}
            <AnimatePresence>
                {showViewModal && selectedAttendance && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
                        onClick={() => setShowViewModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <FaUserCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Attendance Details</h2>
                                        <p className="text-sm text-white/80">View complete attendance information</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowViewModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <FaTimes className="w-5 h-5 text-white" />
                                </motion.button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {/* Employee Header */}
                                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="text-white text-4xl font-bold">
                                                {selectedAttendance.employeeName.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-slate-800 mb-1">{selectedAttendance.employeeName}</h1>
                                        <p className="text-slate-500 mb-2">{selectedAttendance.employeeId} • {selectedAttendance.employeeRole}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${getStatusColor(selectedAttendance.status)}`}>
                                                {getStatusIcon(selectedAttendance.status)}
                                                {selectedAttendance.status}
                                            </span>
                                            <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-600">
                                                {selectedAttendance.employeeDepartment}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Work Hours</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedAttendance.workHours}h</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Overtime</p>
                                        <p className="text-xl font-bold text-green-600">{selectedAttendance.overtime}h</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Late Minutes</p>
                                        <p className="text-xl font-bold text-amber-600">{selectedAttendance.lateMinutes}m</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Early Departure</p>
                                        <p className="text-xl font-bold text-red-600">{selectedAttendance.earlyDepartureMinutes}m</p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Time Information */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaClock className="w-4 h-4 text-indigo-500" />
                                            Time Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <FaCalendarAlt className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Date</p>
                                                    <p className="text-sm text-slate-700">
                                                        {new Date(selectedAttendance.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaUserCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Check In Time</p>
                                                    <p className="text-sm text-slate-700">{selectedAttendance.checkIn || 'Not checked in'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaUserClock className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Check Out Time</p>
                                                    <p className="text-sm text-slate-700">{selectedAttendance.checkOut || 'Not checked out'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Information */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaMapMarkerAlt className="w-4 h-4 text-indigo-500" />
                                            Location Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <FaLocationArrow className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Location</p>
                                                    <p className="text-sm text-slate-700">{selectedAttendance.location || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaNetworkWired className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">IP Address</p>
                                                    <p className="text-sm text-slate-700">{selectedAttendance.ipAddress || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaLaptop className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Device Info</p>
                                                    <p className="text-sm text-slate-700 truncate" title={selectedAttendance.deviceInfo}>
                                                        {selectedAttendance.deviceInfo || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedAttendance.notes && (
                                        <div className="bg-slate-50 rounded-xl p-5 md:col-span-2">
                                            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                                <FaFileAlt className="w-4 h-4 text-indigo-500" />
                                                Notes
                                            </h3>
                                            <p className="text-sm text-slate-700">{selectedAttendance.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowViewModal(false)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Attendance Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FaPlus className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">Add Attendance Record</h2>
                                        <p className="text-sm text-slate-500">Fill in the attendance details below</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <FaTimes className="w-5 h-5 text-slate-500" />
                                </motion.button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Employee Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaUserCircle className="w-4 h-4 text-indigo-500" />
                                        Employee Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Employee ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeId"
                                                value={newAttendance.employeeId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="EMP001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Employee Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeName"
                                                value={newAttendance.employeeName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="employeeEmail"
                                                value={newAttendance.employeeEmail}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="john@company.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="employeeDepartment"
                                                value={newAttendance.employeeDepartment}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Role
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeRole"
                                                value={newAttendance.employeeRole}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Developer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaClock className="w-4 h-4 text-indigo-500" />
                                        Attendance Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={newAttendance.date}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Check In Time
                                            </label>
                                            <input
                                                type="time"
                                                name="checkIn"
                                                value={newAttendance.checkIn}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Check Out Time
                                            </label>
                                            <input
                                                type="time"
                                                name="checkOut"
                                                value={newAttendance.checkOut}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="status"
                                                value={newAttendance.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="present">Present</option>
                                                <option value="late">Late</option>
                                                <option value="absent">Absent</option>
                                                <option value="overtime">Overtime</option>
                                                <option value="half day">Half Day</option>
                                                <option value="leave">Leave</option>
                                                <option value="remote">Remote</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={newAttendance.location}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Main Office"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                IP Address
                                            </label>
                                            <input
                                                type="text"
                                                name="ipAddress"
                                                value={newAttendance.ipAddress}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="192.168.1.101"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaInfoCircle className="w-4 h-4 text-indigo-500" />
                                        Additional Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Late Minutes
                                            </label>
                                            <input
                                                type="number"
                                                name="lateMinutes"
                                                value={newAttendance.lateMinutes}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Early Departure Minutes
                                            </label>
                                            <input
                                                type="number"
                                                name="earlyDepartureMinutes"
                                                value={newAttendance.earlyDepartureMinutes}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={newAttendance.notes}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Additional notes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAddAttendance}
                                    disabled={!newAttendance.employeeId || !newAttendance.employeeName || !newAttendance.employeeEmail || !newAttendance.employeeDepartment || !newAttendance.date}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                >
                                    Add Record
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Attendance Modal */}
            <AnimatePresence>
                {showEditModal && selectedAttendance && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <FaEdit className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">Edit Attendance Record</h2>
                                        <p className="text-sm text-slate-500">Update attendance information</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <FaTimes className="w-5 h-5 text-slate-500" />
                                </motion.button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Employee Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaUserCircle className="w-4 h-4 text-amber-500" />
                                        Employee Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Employee ID
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeId"
                                                value={selectedAttendance.employeeId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Employee Name
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeName"
                                                value={selectedAttendance.employeeName}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="employeeEmail"
                                                value={selectedAttendance.employeeEmail}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Department
                                            </label>
                                            <select
                                                name="employeeDepartment"
                                                value={selectedAttendance.employeeDepartment}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                {departments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Role
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeRole"
                                                value={selectedAttendance.employeeRole}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaClock className="w-4 h-4 text-amber-500" />
                                        Attendance Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={selectedAttendance.date}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Check In Time
                                            </label>
                                            <input
                                                type="time"
                                                name="checkIn"
                                                value={selectedAttendance.checkIn}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Check Out Time
                                            </label>
                                            <input
                                                type="time"
                                                name="checkOut"
                                                value={selectedAttendance.checkOut}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={selectedAttendance.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="present">Present</option>
                                                <option value="late">Late</option>
                                                <option value="absent">Absent</option>
                                                <option value="overtime">Overtime</option>
                                                <option value="half day">Half Day</option>
                                                <option value="leave">Leave</option>
                                                <option value="remote">Remote</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={selectedAttendance.location || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                IP Address
                                            </label>
                                            <input
                                                type="text"
                                                name="ipAddress"
                                                value={selectedAttendance.ipAddress || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaInfoCircle className="w-4 h-4 text-amber-500" />
                                        Additional Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Late Minutes
                                            </label>
                                            <input
                                                type="number"
                                                name="lateMinutes"
                                                value={selectedAttendance.lateMinutes}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Early Departure Minutes
                                            </label>
                                            <input
                                                type="number"
                                                name="earlyDepartureMinutes"
                                                value={selectedAttendance.earlyDepartureMinutes}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={selectedAttendance.notes || ''}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleEditAttendance}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    Update Record
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important]"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="w-6 h-6 text-red-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                                Delete Attendance Record
                            </h3>

                            <p className="text-sm text-slate-500 text-center mb-6">
                                Are you sure you want to delete this attendance record for <span className="font-semibold">{selectedAttendance?.employeeName}</span>? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDeleteAttendance}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Upload Modal */}
            <AnimatePresence>
                {showBulkUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important]"
                        onClick={() => setShowBulkUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaUpload className="w-8 h-8 text-indigo-600" />
                            </div>

                            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                                Bulk Upload Attendance
                            </h3>

                            <p className="text-sm text-slate-500 text-center mb-6">
                                Upload a CSV or Excel file with attendance records
                            </p>

                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 mb-6 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                                <FaUpload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 mb-1">Click to upload or drag and drop</p>
                                <p className="text-xs text-slate-400">CSV or Excel files only</p>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                <p className="text-xs font-medium text-slate-500 mb-2">File Requirements:</p>
                                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                                    <li>File must be in CSV or Excel format</li>
                                    <li>Maximum file size: 10MB</li>
                                    <li>Required columns: Employee ID, Date, Check In, Check Out, Status</li>
                                    <li>Download template for correct format</li>
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowBulkUploadModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Upload
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}