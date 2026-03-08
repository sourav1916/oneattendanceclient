import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";

import ActionCard from "../components/ActionCard";
import AddStaffModal from "../components/AddStaffModal";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";
import SwitchCompanyModal from "../components/CompanyModals/SwitchCompanyModal";
import SelectCompanyModal from "../components/CompanyModals/SelectCompanyModal";

const API_BASE = "https://api-attendance.onesaas.in";

function HomePage() {
  const { user, loading } = useAuth();
  
  // Modal States
  const [openAddStaffModal, setOpenAddStaffModal] = useState(false);
  const [openCreateCompanyModal, setOpenCreateCompanyModal] = useState(false);
  const [openSwitchCompanyModal, setOpenSwitchCompanyModal] = useState(false);
  const [openSelectCompanyModal, setOpenSelectCompanyModal] = useState(false);
  
  // Data States
  const [companies, setCompanies] = useState([]);
  const [userCompanies, setUserCompanies] = useState([]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">Please login again to continue</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const fetchCompanies = () => {
    if (user?.companies && user.companies.length > 0) {
      setCompanies(user.companies);
    } else {
      setCompanies([]);
    }
  };

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

  const handleCompanyCreated = (company) => {
    // Handle post-creation if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <div className="bg-white rounded-full px-6 py-2">
              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                🚀 Enterprise Attendance Management
              </span>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 mb-4">
            Welcome back, {user?.name || user?.email || 'User'}!
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your workforce management with intelligent attendance tracking
          </p>
        </motion.div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <ActionCard
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            title="Add Staff"
            description="Regular Staff and Contract Staff (Monthly, Weekly, Hourly and Work Basis)"
            buttonText="Add Staff"
            onClick={handleAddStaffClick}
            gradient="blue"
            delay={0.1}
          />

          <ActionCard
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="Create Company"
            description="Set up your organization profile with complete details and branding"
            buttonText="Create Company"
            onClick={() => setOpenCreateCompanyModal(true)}
            gradient="indigo"
            delay={0.2}
          />

          <ActionCard
            icon={
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            title="Switch Company"
            description="Quickly toggle between different organizations you manage"
            buttonText="Switch Company"
            onClick={() => {
              fetchCompanies();
              setOpenSwitchCompanyModal(true);
            }}
            gradient="purple"
            delay={0.3}
          />
        </div>

        {/* Help Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-gray-600 mb-6">Need assistance? We're here to help!</p>

          <a
            href="#"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-4 rounded-xl font-medium hover:from-gray-900 hover:to-black transition-all duration-200 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl group"
          >
            <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Get Help & Support
          </a>
        </motion.div>
      </div>

      {/* Modals */}
      <AddStaffModal
        isOpen={openAddStaffModal}
        onClose={() => setOpenAddStaffModal(false)}
        onSuccess={() => setOpenAddStaffModal(false)}
      />

      <CreateCompanyModal
        isOpen={openCreateCompanyModal}
        onClose={() => setOpenCreateCompanyModal(false)}
        onSuccess={handleCompanyCreated}
        userId={user?.id}
      />

      <SwitchCompanyModal
        isOpen={openSwitchCompanyModal}
        onClose={() => setOpenSwitchCompanyModal(false)}
        companies={companies}
        onSwitch={() => {}}
      />

      <SelectCompanyModal
        isOpen={openSelectCompanyModal}
        onClose={() => setOpenSelectCompanyModal(false)}
        companies={userCompanies}
        onSelect={handleCompanySelect}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="mt-12"
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
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