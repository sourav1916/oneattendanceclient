import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiCall from "../utils/api";
import { useAuth } from "../context/AuthContext";
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
  FaTimes,
  FaUserCircle,
  FaRegClock,
  FaRegCalendarAlt,
  FaExchangeAlt
} from "react-icons/fa";
import Skeleton from "../components/SkeletonComponent";
import AddStaffModal from "../components/StaffModals/AddStaffModal";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";



function HomePage() {
  const { user, loading, company, companies, selectCompany, refreshUser, activeRole } = useAuth();
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
        const response = await apiCall('/users/profile-role', 'GET');

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

  // Stats Cards Data
  const statsCards = [
    {
      title: "Total Employees",
      value: "24",
      icon: FaUsers,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Present Today",
      value: "18",
      icon: FaUserCheck,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      change: "+5%",
      trend: "up"
    },
    {
      title: "On Leave",
      value: "3",
      icon: FaRegClock,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      change: "-2%",
      trend: "down"
    },
    {
      title: "Late Arrivals",
      value: "2",
      icon: FaClock,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      change: "+1",
      trend: "up"
    }
  ];

  // Quick Actions
  const quickActions = [
    {
      title: "Punch Attendance",
      description: "Mark your attendance",
      icon: FaFingerprint,
      color: "from-indigo-500 to-purple-500",
      onClick: () => navigate('/attendance'),
      gradient: "bg-gradient-to-r from-indigo-500 to-purple-500"
    },
    {
      title: "Add Staff",
      description: "Onboard new team members",
      icon: FaUserPlus,
      color: "from-green-500 to-emerald-500",
      onClick: handleAddStaffClick,
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      title: "Company Invites",
      description: "Manage invitations",
      icon: FaEnvelope,
      color: "from-pink-500 to-rose-500",
      onClick: () => navigate('/my-invites'),
      gradient: "bg-gradient-to-r from-pink-500 to-rose-500"
    },
    {
      title: "Cashbook",
      description: "Track transactions",
      icon: FaChartLine,
      color: "from-amber-500 to-orange-500",
      onClick: () => navigate('/cashbook'),
      gradient: "bg-gradient-to-r from-amber-500 to-orange-500"
    }
  ];

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 to-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              {/* Company Info Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCompanySwitcher(true)}
                    className="group flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FaStore className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500">Current Company</p>
                      <p className="text-sm font-semibold text-slate-800">{company?.name || 'Select Company'}</p>
                    </div>
                    <FaExchangeAlt className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200">
                    <FaRegCalendarAlt className="w-3 h-3 text-indigo-500" />
                    <span className="text-xs text-slate-600">{currentDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-slate-800">{user?.name?.split(' ')[0]}</p>
                      <p className="text-xs text-slate-500">
                        {activeRole ? activeRole.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Employee'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Greeting */}
              <h1 className="text-3xl sm:text-4xl font-bold">
                <span className="text-slate-800">{getGreeting()},</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">
                  {user?.name?.split(' ')[0] || 'there'}!
                </span>
              </h1>
              <p className="text-slate-600 mt-1">Welcome back to your dashboard</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} bg-${stat.trend === 'up' ? 'green' : 'red'}-50 px-2 py-0.5 rounded-full`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.title}</p>
            </motion.div>
          ))}
        </motion.div>

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
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className={`absolute inset-0 ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-r ${action.color} shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{action.title}</h3>
              <p className="text-xs text-slate-500">{action.description}</p>
              <FaArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
            </motion.button>
          ))}
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-1">Your latest attendance and staff updates</p>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((item) => (
              <div key={item} className="p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FaClock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">John Doe checked in at 9:15 AM</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">On Time</span>
              </div>
            ))}
          </div>
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Modal Header */}
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
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                        <FaBuilding className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        No Companies Found
                      </h3>
                      <p className="text-sm text-slate-500 max-w-xs">
                        You are not associated with any company yet. Please contact your admin
                        or accept an invite to continue.
                      </p>
                    </div>
                  ) : (
                    /* Company List */
                    <div className="space-y-3">
                      {companies.map((comp) => (
                        <motion.button
                          key={comp.id}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSwitchCompany(comp)}
                          disabled={isSwitching}
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between ${
                            company?.id === comp.id
                              ? 'bg-indigo-50 border-2 border-indigo-200'
                              : 'bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          } ${isSwitching && selectedCompanyForSwitch?.id === comp.id ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                company?.id === comp.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'
                              }`}
                            >
                              <FaBuilding className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{comp.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                                {comp.role ? comp.role.replace(/_/g, ' ') : 'Member'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {company?.id === comp.id && (
                              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                <FaCheck className="w-3 h-3 text-white" />
                              </div>
                            )}

                            {isSwitching &&
                              selectedCompanyForSwitch?.id === comp.id && (
                                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowCompanySwitcher(false);
                      setOpenCreateCompanyModal(true);
                    }}
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
        onSuccess={() => {
          setOpenCreateCompanyModal(false);
          refreshUser();
        }}
        userId={user?.id}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-float {
          animation: float 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default HomePage;