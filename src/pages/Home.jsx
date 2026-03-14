import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineUserGroup,
  HiOutlineQuestionMarkCircle,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUsers
} from "react-icons/hi";

import AddStaffModal from "../components/AddStaffModal";
import SelectCompanyModal from "../components/CompanyModals/SelectCompanyModal";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";

const API_BASE = "https://api-attendance.onesaas.in";

function HomePage() {
  const { user, loading } = useAuth();
  const [openAddStaffModal, setOpenAddStaffModal] = useState(false);
  const [openCreateCompanyModal, setOpenCreateCompanyModal] = useState(false);
  const [openSelectCompanyModal, setOpenSelectCompanyModal] = useState(false);
  const [userCompanies, setUserCompanies] = useState([]);
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <HiOutlineSparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <p className="text-xl font-semibold text-slate-800">Loading your workspace...</p>
          <p className="text-sm text-slate-500 mt-2">Please wait</p>
        </div>
      </div>
    );
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
            <HiOutlineQuestionMarkCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Expired</h2>
          <p className="text-slate-600 mb-8">Please login again to continue</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="group px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Go to Login
            <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  const handleAddStaffClick = async () => {
    const company = localStorage.getItem("company");

    if (!company) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/users/profile-role`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const response = await res.json();

        if (response.success && response.data) {
          const companies = response.data.companies || [];

          // Only one company → auto select
          if (companies.length === 1) {
            localStorage.setItem("company", JSON.stringify(companies[0]));
            setOpenAddStaffModal(true);
            return;
          }

          // Multiple companies → choose company
          if (companies.length > 1) {
            setUserCompanies(companies);
            setOpenSelectCompanyModal(true);
            return;
          }

          // No companies → create company
          toast.warning("Please create a company first");
          setOpenCreateCompanyModal(true);
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
        toast.error("Something went wrong");
      }
      return;
    }

    setOpenAddStaffModal(true);
  };

  const handleCompanySelect = (company) => {
    setOpenAddStaffModal(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/10 to-purple-100/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 mb-6 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600">Active Session</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-indigo-600">{currentDate}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <span className="text-slate-800">{getGreeting()},</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">
                  {user?.name?.split(' ')[0] || 'there'}!
                </span>
              </h1>

              <p className="text-lg text-slate-600 mt-4 max-w-2xl">
                Ready to manage your workforce? Add team members and start tracking attendance seamlessly.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3 sm:flex-col">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <HiOutlineUsers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{user?.companies?.length || 0}</p>
                    <p className="text-xs text-slate-500">Companies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Action Card - Add Staff */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden group hover:shadow-3xl transition-all duration-500">
            {/* Card Header with Gradient */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                {/* Left Content */}
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-6">
                    <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      Quick Action
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
                    Add Staff Member
                  </h2>

                  <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                    Onboard new team members with flexible employment types. Choose from regular, contract, or work-based arrangements.
                  </p>

                  {/* Employee Types Tags */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                      👥 Regular Staff
                    </span>
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                      📅 Monthly Contract
                    </span>
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                      ⏰ Weekly Contract
                    </span>
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-200">
                      💼 Work Basis
                    </span>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddStaffClick}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-xl hover:shadow-2xl overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <HiOutlineUserGroup className="w-6 h-6" />
                      Start Adding Staff
                      <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </motion.button>
                </div>

                {/* Right Visual Element */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl rotate-3 transform group-hover:rotate-6 transition-transform duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <HiOutlineUserGroup className="w-24 h-24 text-indigo-600/30" />
                      </div>
                    </div>
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl -rotate-12 flex items-center justify-center shadow-lg">
                      <HiOutlineClock className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl rotate-12 flex items-center justify-center shadow-lg">
                      <HiOutlineCalendar className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Tips</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 text-sm font-bold">1</span>
                </div>
                <p className="text-sm text-slate-600">Select employee type based on work arrangement</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 text-sm font-bold">2</span>
                </div>
                <p className="text-sm text-slate-600">Add multiple companies to manage different organizations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 text-sm font-bold">3</span>
                </div>
                <p className="text-sm text-slate-600">Switch between companies from settings page</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 text-sm font-bold">4</span>
                </div>
                <p className="text-sm text-slate-600">Need help? Click support button below</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Help Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-slate-500 mb-4 text-sm">Need assistance? We're here to help!</p>

          <button
            onClick={() => window.location.href = '/support'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl font-medium hover:bg-white hover:shadow-lg transition-all duration-200 border border-slate-200 group"
          >
            <HiOutlineQuestionMarkCircle className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span>Get Help & Support</span>
          </button>
        </motion.div>
      </div>

      {/* Modals */}
      <AddStaffModal
        isOpen={openAddStaffModal}
        onClose={() => setOpenAddStaffModal(false)}
        onSuccess={() => setOpenAddStaffModal(false)}
      />

      <SelectCompanyModal
        isOpen={openSelectCompanyModal}
        onClose={() => setOpenSelectCompanyModal(false)}
        companies={userCompanies}
        onSelect={handleCompanySelect}
      />

      <CreateCompanyModal
        isOpen={openCreateCompanyModal}
        onClose={() => setOpenCreateCompanyModal(false)}
        onSuccess={() => { }}
        userId={user?.id}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="mt-12"
        toastClassName="!bg-white !text-slate-800 !rounded-2xl !shadow-xl"
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
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #818cf8;
        }
      `}</style>
    </div>
  );
}

export default HomePage;