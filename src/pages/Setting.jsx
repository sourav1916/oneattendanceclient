import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding, FaPlus, FaUser, FaBell, FaShieldAlt, FaCog,
  FaMoon, FaSun, FaBars, FaTimes, FaSave, FaSpinner
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import CompanyCard from "../components/Settings/CompanyCard";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";
import EditCompanyModal from "../components/CompanyModals/EditCompanyModal";
import ModalScrollLock from "../components/ModalScrollLock";
import Skeleton from "../components/SkeletonComponent";
import apiCall from "../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: "companies", label: "Companies", icon: FaBuilding },
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "security", label: "Security", icon: FaShieldAlt },
  { id: "preferences", label: "Preferences", icon: FaCog },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};



const SettingsPage = () => {
  const { user, loading, refreshUser, companies, setCompanies, company } = useAuth();

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [activeCompany, setActiveCompany] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);


  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("companies");

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name,
    phone: user?.phone
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  {/* ---- Active Sessions Card ---- */ }

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutId, setLoggingOutId] = useState(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    if (activeTab === "security") fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await apiCall('/auth/sessions', 'GET');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const forceLogout = async (sessionId) => {
    setLoggingOutId(sessionId);
    try {
      const response = await apiCall('/auth/logout-session', 'POST', { session_id: sessionId });
      const data = await response.json(); // ← add this
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Device logged out");
      } else {
        toast.error(data.message || "Failed to logout session");
      }
    } catch {
      toast.error("Failed to logout session");
    } finally {
      setLoggingOutId(null);
    }
  };

  const forceLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      const response = await apiCall('/auth/logout-all', 'POST');
      const data = await response.json(); // ← add this
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.is_current));
        toast.success("All other devices logged out");
      } else {
        toast.error(data.message || "Failed to logout all");
      }
    } catch {
      toast.error("Failed to logout all sessions");
    } finally {
      setLoggingOutAll(false);
    }
  };
  const getDeviceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("ios") || n.includes("safari")) return "🍎";
    if (n.includes("android") || n.includes("mobile")) return "📱";
    return "💻";
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr + " UTC")) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  useEffect(() => {
    loadActiveCompany();
  }, []);

  useEffect(() => {
    if (user && companies) {
      setCompanies(companies);

      if (company) {
        const matchedCompany = companies.find((item) => item.id === company.id) || company;
        setActiveCompany(matchedCompany);
        localStorage.setItem("company", JSON.stringify(matchedCompany));
        return;
      }

      const storedCompany = JSON.parse(localStorage.getItem("company"));
      if (storedCompany) {
        const companyExists = companies.some(c => c.id === storedCompany.id);
        if (!companyExists) {
          localStorage.removeItem("company");
          setActiveCompany(null);
        } else {
          setActiveCompany(storedCompany);
        }
      }
    }
  }, [user, companies, company, setCompanies]);


  const loadActiveCompany = () => {
    const storedCompany = JSON.parse(localStorage.getItem("company"));
    if (storedCompany) {
      setActiveCompany(storedCompany);
    }
  };

  const selectCompany = async (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    setActiveCompany(company);
    await refreshUser();
    toast.success(`Switched to ${company.name}`);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setOpenEditModal(true);
  };

  const handleEditSubmit = async (companyId, updatedData) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const payload = {
        id: companyId,
        ...Object.fromEntries(
          Object.entries(updatedData).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
        )
      };

      const response = await apiCall('/company/edit', 'PUT', payload);

      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Failed to update company");
        return;
      }

      if (result.success) {
        if (refreshUser) {
          await refreshUser();
        }

        setOpenEditModal(false);
        setEditingCompany(null);
        toast.success(result.message || "Company updated successfully! 🎉");
      }
    } catch (error) {
      console.error("Company update error:", error);
      toast.error("Network error. Please check your internet connection.");
    }
  };

  const handleDelete = (company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const response = await apiCall('/company/delete', 'DELETE', {
        id: companyToDelete.id
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await refreshUser();

        if (activeCompany?.id === companyToDelete.id) {
          localStorage.removeItem("company");
          setActiveCompany(null);
        }

        toast.success("Company deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete company");
      }

    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Network error. Please try again.");
    }

    setShowDeleteModal(false);
    setCompanyToDelete(null);
  };


  const handleAddCompanyClick = () => {
    setOpenCreateModal(true);
  };

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async () => {
    const changedFields = {};
    Object.keys(profileForm).forEach(key => {
      if (profileForm[key] !== originalProfile[key]) {
        changedFields[key] = profileForm[key];
      }
    });

    if (Object.keys(changedFields).length === 0) {
      toast.info("No changes detected");
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const payload = {
        user_id: user.id,
        ...changedFields
      };

      const response = await apiCall('/users/details/edit-profile', 'PUT', payload);

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to update profile");
        return;
      }

      if (result.success) {
        await refreshUser();
        setOriginalProfile({ ...profileForm });
        toast.success("Profile updated successfully! 🎉");
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Network error. Please check your internet connection.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password validation function
  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      toast.error('Current password is required');
      return false;
    }
    if (!newPassword.trim()) {
      toast.error('New password is required');
      return false;
    }
    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return false;
    }
    return true;
  };

  // Password update handler (no 2FA function)
  const handlePasswordUpdate = async () => {
    if (!validatePasswords()) return;

    setIsUpdatingPassword(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const response = await apiCall('/users/update-password', 'PUT', {
        user_id: user?.id,
        old_password: currentPassword,
        new_password: newPassword,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        if (response.status === 401) {
          toast.error("Current password is incorrect");
        } else {
          toast.error(data.message || "Failed to update password");
        }
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationSettings = () => {
    toast.success("Notification preferences updated!");
  };

  const ActiveIcon = SETTINGS_TABS.find(tab => tab.id === activeTab)?.icon || FaBuilding;

  if (loading) {
    return (
      <Skeleton />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center w-full max-w-[90%] sm:max-w-md mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Please login again to continue</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // (Handled by the find on SETTINGS_TABS above)

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Decorative Elements - Hidden on very small screens */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Mobile Tabs Dropdown - Visible on small screens */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-md border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <ActiveIcon className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-900">
                {SETTINGS_TABS.find(tab => tab.id === activeTab)?.label}
              </span>
            </div>
            {isMobileMenuOpen ? <FaTimes className="w-4 h-4 text-gray-500" /> : <FaBars className="w-4 h-4 text-gray-500" />}
          </button>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-[calc(100%-1.5rem)] mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              >
                {SETTINGS_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Tabs - Hidden on small screens */}
        <div className="hidden sm:block mb-6 lg:mb-8 border-b border-gray-200 overflow-x-auto text-center justify-center place-items-center">
          <nav className="flex space-x-4 lg:space-x-8 min-w-max pb-1 items-center justify-center">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-3 h-3 lg:w-4 lg:h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content - Fully Responsive */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Companies Tab */}
          {activeTab === "companies" && (
            <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              {/* Header - Responsive */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-gray-800">
                  <FaBuilding className="text-indigo-600 text-base sm:text-xl" />
                  <span>Manage Companies</span>
                </h2>

                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleAddCompanyClick}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl w-full xs:w-auto"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span className="whitespace-nowrap">Create Your Company</span>
                  </button>
                </div>
              </div>

              {/* Companies List - Responsive */}
              <div className="space-y-3">
                {companies.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 px-4">
                    <FaBuilding className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No companies found</p>
                    <button
                      onClick={() => setOpenCreateModal(true)}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base shadow-sm border border-gray-200 hover:border-indigo-300 transition-all"
                    >
                      <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Create your first company
                    </button>
                  </div>
                ) : (
                  companies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      isActive={activeCompany?.id === company.id}
                      canManageCompany={company.role !== "employee"}
                      onSwitch={selectCompany}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>

              {/* Active Company Info - Responsive */}
              {activeCompany && companies.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center gap-4">
                  {activeCompany.logo_url ? (
                    <img
                      src={activeCompany.logo_url.startsWith('http') ? activeCompany.logo_url : `https://api-attendance.onesaas.in${activeCompany.logo_url}`}
                      alt="Company Logo"
                      className="w-14 h-14 rounded-xl object-cover border border-indigo-200 shadow-sm bg-white shrink-0 hidden sm:block"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-14 h-14 rounded-xl bg-indigo-100 items-center justify-center border border-indigo-200 shadow-sm shrink-0 hidden sm:flex ${activeCompany.logo_url ? '!hidden' : ''}`}>
                    <FaBuilding className="text-indigo-500 text-2xl" />
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 flex-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-indigo-700 font-medium mb-1">Currently Active Company</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{activeCompany.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{activeCompany.legal_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab - Updated with working API integration */}
          {activeTab === "profile" && (
            <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Profile Information</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 sm:px-4 py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isUpdatingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab - Responsive */}
          {activeTab === "notifications" && (
            <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start xs:self-auto">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Push Notifications</p>
                    <p className="text-xs sm:text-sm text-gray-500">Receive push notifications in browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start xs:self-auto">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button
                  onClick={handleNotificationSettings}
                  className="w-full sm:w-auto mt-4 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <>
              {/* Change Password Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Security Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-3">Change Password</h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        disabled={isUpdatingPassword}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        disabled={isUpdatingPassword}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        disabled={isUpdatingPassword}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordUpdate}
                    disabled={isUpdatingPassword}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin inline mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </div>

              {/* Active Sessions Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mt-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Active Sessions</h3>
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {sessions.length} device{sessions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={forceLogoutAll}
                    disabled={loggingOutAll || sessions.filter((s) => !s.is_current).length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingOutAll ? (
                      <FaSpinner className="w-3 h-3 animate-spin" />
                    ) : (
                      <FiLogOut className="w-3 h-3" />
                    )}
                    Logout All Other Devices
                  </button>
                </div>

                {/* List */}
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                    <FaSpinner className="animate-spin w-4 h-4" /> Loading sessions...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all flex-wrap
                ${session.is_current
                            ? "bg-indigo-50/60 border-indigo-200"
                            : "bg-gray-50 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30"
                          }`}
                      >
                        {/* Left: icon + info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                  ${session.device_name.toLowerCase().includes("ios") ? "bg-pink-100"
                              : session.device_name.toLowerCase().includes("android") ? "bg-green-100"
                                : "bg-indigo-100"}`}>
                            {getDeviceIcon(session.device_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800 truncate">{session.device_name}</span>
                              {session.is_current && (
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  This Device
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-500">{session.ip_address}</span>
                              {session.location?.latitude && (
                                <span className="text-xs text-gray-400">
                                  📍 {parseFloat(session.location.latitude).toFixed(3)}, {parseFloat(session.location.longitude).toFixed(3)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Last active {timeAgo(session.last_active)} · Signed in {timeAgo(session.login_at)}
                            </p>
                          </div>
                        </div>

                        {/* Right: action */}
                        {session.is_current ? (
                          <span className="text-xs text-indigo-500 font-semibold px-2">✓ Active</span>
                        ) : (
                          <button
                            onClick={() => forceLogout(session.id)}
                            disabled={loggingOutId === session.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {loggingOutId === session.id ? (
                              <FaSpinner className="w-3 h-3 animate-spin" />
                            ) : (
                              <FiLogOut className="w-3 h-3" />
                            )}
                            Logout
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Preferences Tab - Responsive */}
          {activeTab === "preferences" && (
            <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Application Preferences</h2>

              <div className="space-y-4">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {darkMode ?
                      <FaMoon className="text-indigo-600 text-base sm:text-xl flex-shrink-0" /> :
                      <FaSun className="text-yellow-500 text-base sm:text-xl flex-shrink-0" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Dark Mode</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">Toggle between light and dark theme</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start xs:self-auto">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Language</p>
                    <p className="text-xs sm:text-sm text-gray-500">Select your preferred language</p>
                  </div>
                  <select className="w-full xs:w-auto px-3 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Time Zone</p>
                    <p className="text-xs sm:text-sm text-gray-500">Set your local time zone</p>
                  </div>
                  <select className="w-full xs:w-auto px-3 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>UTC (GMT+0)</option>
                    <option>IST (GMT+5:30)</option>
                    <option>EST (GMT-5)</option>
                    <option>PST (GMT-8)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <CreateCompanyModal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCompanyCreated={() => {
          refreshUser();
          setOpenCreateModal(false);
        }}
        userId={user?.id}
      />

      <EditCompanyModal
        isOpen={openEditModal}
        onClose={() => {
          setOpenEditModal(false);
          setEditingCompany(null);
        }}
        onSuccess={handleEditSubmit}
        company={editingCompany}
      />

      {/* delete modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-lg max-h-[90vh] flex-col justify-center overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Delete Company
              </h2>

              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{companyToDelete?.name}</span>?
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


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
        
        /* Custom breakpoint for extra small devices */
        @media (min-width: 480px) {
          .xs\\:flex-row {
            flex-direction: row;
          }
          .xs\\:self-auto {
            align-self: auto;
          }
          .xs\\:w-auto {
            width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
