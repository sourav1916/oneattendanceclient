import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Select from "react-select";
import SearchableSelect from "../components/SearchableSelect";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";

const API_BASE = "https://api-attendance.onesaas.in";

function HomePage() {
  const { user, loading } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [openCompanyModal, setOpenCompanyModal] = useState(false);
  const [openCompanySwitchModal, setOpenCompanySwitchModal] = useState(false);
  const [staffType, setStaffType] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [openCompanySelectModal, setOpenCompanySelectModal] = useState(false);
  const [userCompanies, setUserCompanies] = useState([]);

  const [companyForm, setCompanyForm] = useState({
    owner_user_id: null,
    name: "",
    legal_name: "",
    logo_url: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    latitude: "",
    longitude: ""
  });

  // Add effect to log state changes
  useEffect(() => {
    // console.log("loading changed:", loading);
  }, [loading]);

  useEffect(() => {
    // console.log("user changed:", user);
  }, [user]);

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

  // update owner
  useEffect(() => {
    if (user?.id) {
      setCompanyForm(prev => ({
        ...prev,
        owner_user_id: user.id
      }));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchPermissions();
    }
  }, [user]);

  const handleCompanyChange = (e) => {
    setCompanyForm({
      ...companyForm,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateCompany = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE}/company/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(companyForm)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to create company");
        return;
      }

      if (result.success) {
        localStorage.setItem("company", JSON.stringify(result.data));
        toast.success("Company created successfully 🎉");
        setOpenCompanyModal(false);

        // Reset form
        setCompanyForm({
          owner_user_id: user.id,
          name: "",
          legal_name: "",
          logo_url: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          postal_code: "",
          country: "India",
          latitude: "",
          longitude: ""
        });
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please check your internet connection.");
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();

      if (result.success) {
        const formatted = result.data.map(u => ({
          id: u.id,
          full_name: u.name || u.email || "No Name",
          email: u.email
        }));
        setUsers(formatted);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/permissions/list`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setPermissions(result.data);
      }
    } catch (err) {
      console.error("Permission error", err);
    }
  };

  const designationOptions = [
    { value: "manager", label: "Manager" },
    { value: "supervisor", label: "Supervisor" },
    { value: "staff", label: "Staff" }
  ];

  const staffTypeOptions = [
    { value: "monthly", label: "Monthly Staff" },
    { value: "weekly", label: "Weekly Staff" },
    { value: "hourly", label: "Hourly Staff" },
    { value: "work_basis", label: "Work Basis Staff" }
  ];

  const permissionOptions = permissions.map(p => ({
    value: p.id,
    label: p.name
  }));

  const handleopenCompanyModal = () => {
    setOpenCompanyModal(true);
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

          // ✅ Only one company → auto select
          if (companies.length === 1) {
            localStorage.setItem("company", JSON.stringify(companies[0]));
            setOpenModal(true);
            return;
          }

          // ✅ Multiple companies → choose company
          if (companies.length > 1) {
            setUserCompanies(companies);
            setOpenCompanySelectModal(true);
            return;
          }

          // ✅ No companies → create company
          toast.warning("Please create a company first");
          setOpenCompanyModal(true);

        }

      } catch (error) {
        console.error("Profile fetch failed:", error);
        toast.error("Something went wrong");
      }

      return;
    }

    setOpenModal(true);
  };

  const handleCreate = () => {
    if (!selectedUser) {
      toast.warning("Please select a user");
      return;
    }

    if (!designation) {
      toast.warning("Please select designation");
      return;
    }

    if (!staffType) {
      toast.warning("Please select staff type");
      return;
    }

    console.log({
      user_id: selectedUser.id,
      designation: designation.value,
      staff_type: staffType.value,
      permissions: selectedPermissions.map(p => p.value)
    });

    toast.success("Staff created successfully");
    setOpenModal(false);

    // Reset form
    setSelectedUser(null);
    setDesignation(null);
    setStaffType(null);
    setSelectedPermissions([]);
  };

  const fetchCompanies = () => {
    if (user?.companies && user.companies.length > 0) {
      setCompanies(user.companies);
    } else {
      setCompanies([]);
    }
  };

  const handleopenSwitchCompanyModal = () => {
    fetchCompanies();
    setOpenCompanySwitchModal(true);
  };

  const handleSwitchCompany = (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    toast.success(`Switched to ${company.name}`);
    setOpenCompanySwitchModal(false);
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
          {/* Add Staff Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">Add Staff</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Regular Staff and Contract Staff (Monthly, Weekly, Hourly and Work Basis)
            </p>

            <button
              onClick={handleAddStaffClick}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Staff
            </button>
          </motion.div>

          {/* Create Company Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Company</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Set up your organization profile with complete details and branding
            </p>

            <button
              onClick={handleopenCompanyModal}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Company
            </button>
          </motion.div>

          {/* Switch Company Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">Switch Company</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Quickly toggle between different organizations you manage
            </p>

            <button
              onClick={handleopenSwitchCompanyModal}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Switch Company
            </button>
          </motion.div>
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

      {/* MODAL - Add Staff */}
      <AnimatePresence>
        {openModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Add New Staff</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Select User
                    </label>
                    <SearchableSelect
                      users={users}
                      onSelect={(user) => setSelectedUser(user)}
                      className="[&>div]:border-gray-200 [&>div]:shadow-sm [&>div]:rounded-xl [&>div]:focus-within:border-blue-400 [&>div]:focus-within:ring-2 [&>div]:focus-within:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Designation
                    </label>
                    <Select
                      options={designationOptions}
                      value={designation}
                      onChange={(option) => setDesignation(option)}
                      placeholder="Select designation"
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Staff Type
                    </label>
                    <Select
                      options={staffTypeOptions}
                      value={staffType}
                      onChange={(option) => setStaffType(option)}
                      placeholder="Select staff type"
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Permissions
                    </label>
                    <Select
                      isMulti
                      options={permissionOptions}
                      value={selectedPermissions}
                      onChange={(options) => setSelectedPermissions(options)}
                      placeholder="Select permissions"
                      className="react-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setOpenModal(false);
                    setSelectedUser(null);
                    setDesignation(null);
                    setStaffType(null);
                    setSelectedPermissions([]);
                  }}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl text-sm"
                >
                  Create Staff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL - Create Company */}
      <AnimatePresence>
        {openCompanyModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl p-8 border border-gray-100 my-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Company</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="name"
                  placeholder="Company Name *"
                  value={companyForm.name}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="legal_name"
                  placeholder="Legal Name *"
                  value={companyForm.legal_name}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="logo_url"
                  placeholder="Logo URL"
                  value={companyForm.logo_url}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="address_line1"
                  placeholder="Address Line 1"
                  value={companyForm.address_line1}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="address_line2"
                  placeholder="Address Line 2"
                  value={companyForm.address_line2}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="city"
                  placeholder="City"
                  value={companyForm.city}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="state"
                  placeholder="State"
                  value={companyForm.state}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="postal_code"
                  placeholder="Postal Code"
                  value={companyForm.postal_code}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="country"
                  value="India"
                  readOnly
                  className="border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-600"
                />
                <input
                  name="latitude"
                  placeholder="Latitude"
                  value={companyForm.latitude}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <input
                  name="longitude"
                  placeholder="Longitude"
                  value={companyForm.longitude}
                  onChange={handleCompanyChange}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setOpenCompanyModal(false);
                    setCompanyForm({
                      owner_user_id: user.id,
                      name: "",
                      legal_name: "",
                      logo_url: "",
                      address_line1: "",
                      address_line2: "",
                      city: "",
                      state: "",
                      postal_code: "",
                      country: "India",
                      latitude: "",
                      longitude: ""
                    });
                  }}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCompany}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Company
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL - Switch Company */}
      <AnimatePresence>
        {openCompanySwitchModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Switch Company</h2>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {companies.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500">No companies found</p>
                  </div>
                )}

                {companies.map((company) => (
                  <motion.button
                    key={company.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => handleSwitchCompany(company)}
                    className="w-full text-left p-5 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group"
                  >
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {company.name || "Unnamed Company"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {company.legal_name || "No legal name"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {company.city}, {company.state}
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setOpenCompanySwitchModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCompanySelectModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl w-[420px] p-6 shadow-xl">

              <h2 className="text-lg font-semibold mb-4">
                Select Company
              </h2>

              <div className="space-y-3 max-h-[250px] overflow-y-auto">

                {userCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      localStorage.setItem("company", JSON.stringify(company));
                      setOpenCompanySelectModal(false);
                      setOpenModal(true);
                    }}
                    className="w-full text-left p-3 border rounded-lg hover:bg-slate-50 transition"
                  >
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.legal_name}</p>
                  </button>
                ))}

              </div>

              <div className="mt-5 text-right">
                <button
                  onClick={() => setOpenCompanySelectModal(false)}
                  className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>
        )}

      </AnimatePresence>

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