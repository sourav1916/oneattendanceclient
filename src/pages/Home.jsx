import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiCall from "../utils/api";
import { useAuth } from "../context/AuthContext";
import usePermissionAccess from "../hooks/usePermissionAccess";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaQuestionCircle,
  FaArrowRight,
  FaClock,
  FaBuilding,
  FaCheck,
  FaEnvelope,
  FaUserPlus,
  FaStore,
  FaChartLine,
  FaFingerprint,
  FaUserCheck,
  FaPlusCircle,
  FaTimes,
  FaUserCircle,
  FaCalendarAlt,
  FaRegCalendarAlt,
  FaExchangeAlt,
  FaCog,
  FaUmbrellaBeach,
  FaFileInvoiceDollar,
  FaUserShield,
  FaHistory
} from "react-icons/fa";
import Skeleton from "../components/SkeletonComponent";
import AddStaffModal from "../components/StaffModals/AddStaffModal";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";
import ModalScrollLock from "../components/ModalScrollLock";



function HomePage() {
  const { user, loading, company, companies, selectCompany, refreshUser } = useAuth();
  const { checkPageAccess, checkActionAccess } = usePermissionAccess();
  const navigate = useNavigate();
  const [openAddStaffModal, setOpenAddStaffModal] = useState(false);
  const [openCreateCompanyModal, setOpenCreateCompanyModal] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedCompanyForSwitch, setSelectedCompanyForSwitch] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);

  // Show loading state
  if (loading) {
    return <Skeleton />;
  }

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <FaQuestionCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Expired</h2>
          <p className="text-slate-600 mb-8">Please login again to continue</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="group px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Go to Login
            <FaArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  const handleAddStaffClick = async () => {
    const storedCompany = localStorage.getItem("company");

    if (!storedCompany) {
      try {
        const res = await apiCall('/users/profile-role', 'GET');
        const response = await res.json();

        if (response.success && response.data) {
          const ownedCompanies = response.data.companies?.owned_companies || [];
          const memberCompanies = response.data.companies?.companies || [];
          const userCompaniesData = [...ownedCompanies, ...memberCompanies];

          // Only one company → auto select
          if (userCompaniesData.length === 1) {
            localStorage.setItem("company", JSON.stringify(userCompaniesData[0]));
            setOpenAddStaffModal(true);
            return;
          }

          // Multiple companies → open company switcher
          if (userCompaniesData.length > 1) {
            setUserCompanies(userCompaniesData);
            setShowCompanySwitcher(true);
            return;
          }

          // No companies → create company
          setOpenCreateCompanyModal(true);
          return;
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
        return;
      }
    }

    setOpenAddStaffModal(true);
  };

  const handleSwitchCompany = async (selectedCompany) => {
    setSelectedCompanyForSwitch(selectedCompany);
    setIsSwitching(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    selectCompany(selectedCompany);
    await refreshUser();
    setIsSwitching(false);
    setShowCompanySwitcher(false);
    setSelectedCompanyForSwitch(null);
  };

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Quick Actions Definition based on Role
  const getQuickActions = () => {
    const attendancePageAccess = checkPageAccess("attendance");
    const punchActionAccess = checkActionAccess("attendance", "punch");
    const attendanceHistoryAccess = checkPageAccess("attendanceHistory");
    const myShiftsAccess = checkPageAccess("myShifts");
    const myLeavesAccess = checkPageAccess("myLeaves");
    const mySalaryAccess = checkPageAccess("mySalary");
    const myInvitesAccess = checkPageAccess("myInvites");
    const addStaffAccess = checkActionAccess("workspace", "addStaff");
    const inviteMgmtAccess = checkPageAccess("companyInvites");
    const employeeMgmtAccess = checkPageAccess("employeeManagement");
    const permissionMgmtAccess = checkPageAccess("permissionManagement");
    const attendanceMgmtAccess = checkPageAccess("attendanceManagement");
    const salaryMgmtAccess = checkPageAccess("salaryManagement");
    const employeeShiftsAccess = checkPageAccess("employeesShifts");
    const leaveMgmtAccess = checkPageAccess("leaveManagement");
    const holidayMgmtAccess = checkPageAccess("holidayManagement");
    const holidaysAccess = checkPageAccess("holidays");
    const companySettingsAccess = checkPageAccess("companySettings");

    return [
      {
        title: "Punch Attendance",
        description: punchActionAccess.allowed
          ? "Mark your work session"
          : attendancePageAccess.allowed
            ? "View attendance details"
            : "No permission",
        icon: FaFingerprint,
        color: attendancePageAccess.allowed ? "from-indigo-500 to-purple-500" : "from-slate-400 to-slate-500",
        onClick: () => attendancePageAccess.allowed && navigate('/attendance'),
        gradient: attendancePageAccess.allowed ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-slate-200",
        disabled: !attendancePageAccess.allowed
      },
      {
        title: "My Leaves",
        description: myLeavesAccess.allowed ? "Apply & view leaves" : "No permission",
        icon: FaUmbrellaBeach,
        color: myLeavesAccess.allowed ? "from-cyan-500 to-blue-500" : "from-slate-400 to-slate-500",
        onClick: () => myLeavesAccess.allowed && navigate('/my-leaves'),
        gradient: myLeavesAccess.allowed ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-slate-200",
        disabled: !myLeavesAccess.allowed
      },
      {
        title: "Attendance History",
        description: attendanceHistoryAccess.allowed ? "Review your past records" : "No permission",
        icon: FaHistory,
        color: attendanceHistoryAccess.allowed ? "from-violet-500 to-fuchsia-500" : "from-slate-400 to-slate-500",
        onClick: () => attendanceHistoryAccess.allowed && navigate('/attendance-history'),
        gradient: attendanceHistoryAccess.allowed ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-slate-200",
        disabled: !attendanceHistoryAccess.allowed
      },
      {
        title: "My Shifts",
        description: myShiftsAccess.allowed ? "View shift hours and summaries" : "No permission",
        icon: FaClock,
        color: myShiftsAccess.allowed ? "from-blue-500 to-indigo-500" : "from-slate-400 to-slate-500",
        onClick: () => myShiftsAccess.allowed && navigate('/my-shifts'),
        gradient: myShiftsAccess.allowed ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-slate-200",
        disabled: !myShiftsAccess.allowed
      },
      {
        title: "My Salary",
        description: mySalaryAccess.allowed ? "View financial logs" : "No permission",
        icon: FaFileInvoiceDollar,
        color: mySalaryAccess.allowed ? "from-amber-500 to-orange-500" : "from-slate-400 to-slate-500",
        onClick: () => mySalaryAccess.allowed && navigate('/my-salary'),
        gradient: mySalaryAccess.allowed ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-slate-200",
        disabled: !mySalaryAccess.allowed
      },
      {
        title: "My Invites",
        description: "View personal invitations",
        icon: FaEnvelope,
        color: "from-pink-500 to-rose-500",
        onClick: () => myInvitesAccess.allowed && navigate('/my-invites'),
        gradient: "bg-gradient-to-r from-pink-500 to-rose-500",
        disabled: !myInvitesAccess.allowed
      },
      {
        title: "Add Staff",
        description: addStaffAccess.allowed ? "Onboard new members" : "No permission",
        icon: FaUserPlus,
        color: addStaffAccess.allowed ? "from-green-500 to-emerald-500" : "from-slate-400 to-slate-500",
        onClick: () => addStaffAccess.allowed && handleAddStaffClick(),
        gradient: addStaffAccess.allowed ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-slate-200",
        disabled: !addStaffAccess.allowed
      },
      {
        title: "Invites Mgmt",
        description: inviteMgmtAccess.allowed ? "Manage team invites" : "No permission",
        icon: FaBuilding,
        color: inviteMgmtAccess.allowed ? "from-indigo-600 to-blue-600" : "from-slate-400 to-slate-500",
        onClick: () => inviteMgmtAccess.allowed && navigate('/company-invites'),
        gradient: inviteMgmtAccess.allowed ? "bg-gradient-to-r from-indigo-600 to-blue-600" : "bg-slate-200",
        disabled: !inviteMgmtAccess.allowed
      },
      {
        title: "Employee Mgmt",
        description: employeeMgmtAccess.allowed ? "Manage directory" : "No permission",
        icon: FaUsers,
        color: employeeMgmtAccess.allowed ? "from-blue-500 to-cyan-500" : "from-slate-400 to-slate-500",
        onClick: () => employeeMgmtAccess.allowed && navigate('/employee-management'),
        gradient: employeeMgmtAccess.allowed ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-slate-200",
        disabled: !employeeMgmtAccess.allowed
      },
      {
        title: "Permissions",
        description: permissionMgmtAccess.allowed ? "Manage roles" : "No permission",
        icon: FaUserShield,
        color: permissionMgmtAccess.allowed ? "from-purple-500 to-pink-500" : "from-slate-400 to-slate-500",
        onClick: () => permissionMgmtAccess.allowed && navigate('/permission-management'),
        gradient: permissionMgmtAccess.allowed ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-slate-200",
        disabled: !permissionMgmtAccess.allowed
      },
      {
        title: "Attendance Mgmt",
        description: attendanceMgmtAccess.allowed ? "Review & edit records" : "No permission",
        icon: FaClock,
        color: attendanceMgmtAccess.allowed ? "from-teal-500 to-emerald-500" : "from-slate-400 to-slate-500",
        onClick: () => attendanceMgmtAccess.allowed && navigate('/attendance-management'),
        gradient: attendanceMgmtAccess.allowed ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-slate-200",
        disabled: !attendanceMgmtAccess.allowed
      },
      {
        title: "Salary Mgmt",
        description: salaryMgmtAccess.allowed ? "Assign and manage employee salaries" : "No permission",
        icon: FaFileInvoiceDollar,
        color: salaryMgmtAccess.allowed ? "from-emerald-500 to-teal-500" : "from-slate-400 to-slate-500",
        onClick: () => salaryMgmtAccess.allowed && navigate('/salary-management'),
        gradient: salaryMgmtAccess.allowed ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-slate-200",
        disabled: !salaryMgmtAccess.allowed
      },
      {
        title: "Employee Shifts",
        description: employeeShiftsAccess.allowed ? "Monitor team shift summaries" : "No permission",
        icon: FaUserCheck,
        color: employeeShiftsAccess.allowed ? "from-indigo-500 to-cyan-500" : "from-slate-400 to-slate-500",
        onClick: () => employeeShiftsAccess.allowed && navigate('/employees-shifts'),
        gradient: employeeShiftsAccess.allowed ? "bg-gradient-to-r from-indigo-500 to-cyan-500" : "bg-slate-200",
        disabled: !employeeShiftsAccess.allowed
      },
      {
        title: "Leave Mgmt",
        description: leaveMgmtAccess.allowed ? "Review applications" : "No permission",
        icon: FaUmbrellaBeach,
        color: leaveMgmtAccess.allowed ? "from-orange-500 to-red-500" : "from-slate-400 to-slate-500",
        onClick: () => leaveMgmtAccess.allowed && navigate('/leave-management'),
        gradient: leaveMgmtAccess.allowed ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-slate-200",
        disabled: !leaveMgmtAccess.allowed
      },
      {
        title: "Holiday Mgmt",
        description: holidayMgmtAccess.allowed ? "Configure company holidays" : "No permission",
        icon: FaCalendarAlt,
        color: holidayMgmtAccess.allowed ? "from-sky-500 to-indigo-500" : "from-slate-400 to-slate-500",
        onClick: () => holidayMgmtAccess.allowed && navigate('/holiday-management'),
        gradient: holidayMgmtAccess.allowed ? "bg-gradient-to-r from-sky-500 to-indigo-500" : "bg-slate-200",
        disabled: !holidayMgmtAccess.allowed
      },
      {
        title: "Holidays",
        description: holidaysAccess.allowed ? "View company holiday calendars" : "Select company first",
        icon: FaRegCalendarAlt,
        color: holidaysAccess.allowed ? "from-rose-500 to-orange-500" : "from-slate-400 to-slate-500",
        onClick: () => holidaysAccess.allowed && navigate('/holidays'),
        gradient: holidaysAccess.allowed ? "bg-gradient-to-r from-rose-500 to-orange-500" : "bg-slate-200",
        disabled: !holidaysAccess.allowed
      },
      {
        title: "Company Config",
        description: companySettingsAccess.allowed ? "Manage settings & shifts" : "No permission",
        icon: FaCog, 
        color: companySettingsAccess.allowed ? "from-slate-600 to-slate-800" : "from-slate-400 to-slate-500",
        onClick: () => companySettingsAccess.allowed && navigate('/company-settings'),
        gradient: companySettingsAccess.allowed ? "bg-gradient-to-r from-slate-600 to-slate-800" : "bg-slate-200",
        disabled: !companySettingsAccess.allowed
      },
      {
        title: "Create Company",
        description: "Launch a new organization",
        icon: FaBuilding,
        color: "from-blue-600 to-indigo-700",
        onClick: () => setOpenCreateCompanyModal(true),
        gradient: "bg-gradient-to-r from-blue-600 to-indigo-700",
        disabled: false // Global action
      }
    ];
  };

  const quickActions = getQuickActions();
  const punchActionAccess = checkActionAccess("attendance", "punch");
  const canPunch = punchActionAccess.allowed;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 to-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Remade Organized Header (min-h 400px) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-12 overflow-hidden min-h-[300px] flex flex-col md:flex-row group"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-6 relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Workspace Dashboard</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  {getGreeting()}, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-gradient">
                    {user?.name?.split(' ')[0]}!
                  </span>
                </h1>
                <p className="text-base text-slate-500 font-medium max-w-lg">
                  Welcome back! Your workspace is organized and ready. Manage your team, track attendance, and stay on top of your tasks.
                </p>
              </div>
            </div>

            {/* Bottom: Action Chips */}
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => canPunch && navigate('/attendance')}
                className={`group/chip flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 ${!canPunch ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-md hover:border-indigo-300'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${!canPunch ? 'bg-slate-100' : 'bg-indigo-50 group-hover/chip:bg-indigo-600'}`}>
                  <FaFingerprint className={`w-4 h-4 ${!canPunch ? 'text-slate-400' : 'text-indigo-600 group-hover/chip:text-white'}`} />
                </div>
                <span className={`text-sm font-bold ${!canPunch ? 'text-slate-400' : 'text-slate-700'}`}>Punch Now</span>
              </button>
              <button
                onClick={() => navigate('/my-invites')}
                className="group/chip flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center group-hover/chip:bg-pink-600 transition-colors">
                  <FaEnvelope className="w-4 h-4 text-pink-600 group-hover/chip:text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Check Invites</span>
              </button>
            </div>
          </div>

          {/* Right Column: Compact Context (Prev Styled) */}
          <div className="md:w-[32%] p-8 flex flex-col justify-start items-center lg:items-end gap-3 relative z-10 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/20">
            <button
              onClick={() => setShowCompanySwitcher(true)}
              className="group flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {company?.logo_url ? (
                <img 
                  src={company.logo_url.startsWith('http') ? company.logo_url : `https://api-attendance.onesaas.in${company.logo_url}`} 
                  alt="Company Logo" 
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 bg-white"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl items-center justify-center ${company?.logo_url ? 'hidden' : 'flex'}`}>
                <FaStore className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Company</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{company?.name || 'Select Company'}</p>
              </div>
              <FaExchangeAlt className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors ml-1" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200">
              <FaRegCalendarAlt className="w-3 h-3 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{currentDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-slate-200"></div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Your Workspace</h2>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300 text-left ${action.disabled ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
            >
              <div className={`absolute inset-0 ${action.gradient} opacity-0 ${!action.disabled && 'group-hover:opacity-10'} transition-opacity duration-300`}></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-r ${action.color} shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{action.title}</h3>
              <p className="text-xs text-slate-500">{action.description}</p>
              {!action.disabled && <FaArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Fullscreen Company Switcher Modal */}
      <AnimatePresence>
        {showCompanySwitcher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => !isSwitching && setShowCompanySwitcher(false)}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Switch Company</h2>
                      <p className="text-indigo-100 text-sm mt-1">Select a company to continue working with</p>
                    </div>
                    <button
                      onClick={() => !isSwitching && setShowCompanySwitcher(false)}
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <FaTimes className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4">
                  {companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                        <FaBuilding className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">No Companies Found</h3>
                      <p className="text-sm text-slate-500 max-w-xs">You are not associated with any company yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {companies.map((comp) => (
                        <motion.button
                          key={comp.id}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSwitchCompany(comp)}
                          disabled={isSwitching}
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between ${company?.id === comp.id ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50 border border-slate-200 hover:border-indigo-300'}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {comp?.logo_url ? (
                              <img 
                                src={comp.logo_url.startsWith('http') ? comp.logo_url : `https://api-attendance.onesaas.in${comp.logo_url}`} 
                                alt="Company Logo" 
                                className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white border border-indigo-100 shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 rounded-xl items-center justify-center shrink-0 ${company?.id === comp.id ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'} ${comp?.logo_url ? 'hidden' : 'flex'}`}>
                              <FaBuilding className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{comp.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5 capitalize">{comp.role ? comp.role.replace(/_/g, ' ') : 'Member'}</p>
                            </div>
                          </div>
                          {company?.id === comp.id && (
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <FaCheck className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => { setShowCompanySwitcher(false); setOpenCreateCompanyModal(true); }}
                    className="w-full text-center py-2.5 text-indigo-600 font-medium text-sm hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    Create New Company
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddStaffModal
        isOpen={openAddStaffModal}
        onClose={() => setOpenAddStaffModal(false)}
        onSuccess={() => setOpenAddStaffModal(false)}
      />

      <CreateCompanyModal
        isOpen={openCreateCompanyModal}
        onClose={() => setOpenCreateCompanyModal(false)}
        onSuccess={() => { setOpenCreateCompanyModal(false); refreshUser(); }}
        userId={user?.id}
      />

      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, -10px); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
      `}</style>
    </div>
  );
}

export default HomePage;
