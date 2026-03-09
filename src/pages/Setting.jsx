import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBuilding, FaPlus, FaUser, FaBell, FaShieldAlt, FaCog, 
  FaMoon, FaSun, FaBars, FaTimes, FaSave, FaSpinner 
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";

import CompanyCard from "../components/Settings/CompanyCard";
import CreateCompanyModal from "../components/CompanyModals/CreateCompanyModal";
import EditCompanyModal from "../components/CompanyModals/EditCompanyModal";
// import SwitchCompanyModal from "../components/CompanyModals/SwitchCompanyModal";
import SelectCompanyModal from "../components/CompanyModals/SelectCompanyModal";

const API_BASE = "https://api-attendance.onesaas.in";

const SettingsPage = () => {
  const { user, loading, refreshUser } = useAuth();

  // Modal States
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openSwitchModal, setOpenSwitchModal] = useState(false);
  const [openSelectModal, setOpenSelectModal] = useState(false);

  // Data States
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);

  // Settings States
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("companies");

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({});

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadActiveCompany();
  }, []);

  useEffect(() => {
    if (user?.companies) {
      setCompanies(user.companies);

      // Verify that the active company from localStorage still exists
      const storedCompany = JSON.parse(localStorage.getItem("company"));
      if (storedCompany) {
        const companyExists = user.companies.some(c => c.id === storedCompany.id);
        if (!companyExists) {
          localStorage.removeItem("company");
          setActiveCompany(null);
        } else {
          setActiveCompany(storedCompany);
        }
      }
    }

    // Set profile form data when user loads
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || ""
      });
      setOriginalProfile({
        name: user.name || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  const loadActiveCompany = () => {
    // Only load active company from localStorage (this is the only thing we store)
    const storedCompany = JSON.parse(localStorage.getItem("company"));
    if (storedCompany) {
      setActiveCompany(storedCompany);
    }
  };

  const selectCompany = (company) => {
    // Only store the selected company in localStorage
    localStorage.setItem("company", JSON.stringify(company));
    setActiveCompany(company);
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

      // Filter out empty values
      const payload = {
        id: companyId,
        ...Object.fromEntries(
          Object.entries(updatedData).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
        )
      };

      console.log("Edit payload:", payload);

      const response = await fetch(`${API_BASE}/company/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Parse the response
      const result = await response.json();
      console.log("Edit response:", result);

      // Check both HTTP status and success field
      if (!response.ok || !result.success) {
        toast.error(result.message || "Failed to update company");
        return;
      }

      // Success case
      if (result.success) {
        // Refresh user data from API to get updated companies
        if (refreshUser) {
          await refreshUser();
        }

        // Update active company if it was edited
        if (activeCompany?.id === companyId) {
          // Use the data returned from API for consistency
          const updatedCompany = result.data;
          localStorage.setItem("company", JSON.stringify(updatedCompany));
          setActiveCompany(updatedCompany);
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

  const handleDelete = async (company) => {
    if (!window.confirm(`Are you sure you want to delete ${company.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE}/company/${company.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh user data from API
        await refreshUser();

        // Clear active company if it was deleted
        if (activeCompany?.id === company.id) {
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
  };

  const handleCompanyCreated = async (newCompany) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      // Make API call to create company
      const response = await fetch(`${API_BASE}/company/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCompany)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to create company");
        return;
      }

      if (result.success) {
        // Refresh user data from API to get updated companies
        await refreshUser();

        // Auto switch to new company (store in localStorage)
        selectCompany(result.data);
        setOpenCreateModal(false);
        toast.success("Company created successfully! 🎉");
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Company creation error:", error);
      toast.error("Network error. Please check your internet connection.");
    }
  };

  const handleSwitchFromModal = (company) => {
    selectCompany(company);
  };

  const handleAddCompanyClick = () => {
    setOpenCreateModal(true);
  };

  // Profile form handlers
  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async () => {
    // Check if any fields were changed
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

      // Prepare payload with user_id and changed fields
      const payload = {
        user_id: user.id,
        ...changedFields
      };

      console.log("Profile update payload:", payload);

      const response = await fetch(`${API_BASE}/users/details/edit-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("Profile update response:", result);

      if (!response.ok) {
        toast.error(result.message || "Failed to update profile");
        return;
      }

      if (result.success) {
        // Refresh user data to get updated information
        await refreshUser();
        
        // Update original profile state with new values
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

  const handleNotificationSettings = () => {
    toast.success("Notification preferences updated!");
  };

  const tabs = [
    { id: "companies", label: "Companies", icon: FaBuilding },
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "security", label: "Security", icon: FaShieldAlt },
    { id: "preferences", label: "Preferences", icon: FaCog },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg sm:text-xl font-semibold text-gray-700">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
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

  const ActiveIcon = tabs.find(tab => tab.id === activeTab)?.icon || FaBuilding;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
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
                {tabs.find(tab => tab.id === activeTab)?.label}
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
                {tabs.map((tab) => {
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
        <div className="hidden sm:block mb-6 lg:mb-8 border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 lg:space-x-8 min-w-max pb-1">
            {tabs.map((tab) => {
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
                    <span className="whitespace-nowrap">Add Company</span>
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
                      onSwitch={selectCompany}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>

              {/* Active Company Info - Responsive */}
              {activeCompany && companies.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
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

          {/* Security Tab - Responsive */}
          {activeTab === "security" && (
            <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">Security Settings</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-3">Change Password</h3>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Two-Factor Authentication</p>
                    <p className="text-xs sm:text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm sm:text-base hover:bg-indigo-700 transition-colors w-full xs:w-auto">
                    Enable
                  </button>
                </div>

                <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
                  Update Password
                </button>
              </div>
            </div>
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
        onSuccess={handleCompanyCreated}
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
{/* 
      <SwitchCompanyModal
        isOpen={openSwitchModal}
        onClose={() => setOpenSwitchModal(false)}
        companies={companies}
        onSwitch={handleSwitchFromModal}
      /> */}

      <SelectCompanyModal
        isOpen={openSelectModal}
        onClose={() => setOpenSelectModal(false)}
        companies={userCompanies}
        onSelect={(company) => {
          localStorage.setItem("company", JSON.stringify(company));
          setActiveCompany(company);
          setOpenSelectModal(false);
        }}
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
        toastClassName="!text-sm sm:!text-base"
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