import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  FaUserPlus, FaUserTag, FaUserCog,
  FaTimes, FaCheck, FaSpinner, FaUserCircle,
  FaBriefcase, FaClock, FaShieldAlt, FaUserTie,
  FaSave, FaFingerprint, FaCamera, FaMapMarkerAlt, FaWifi,
  FaUserCheck, FaRobot, FaHandPaper, FaDollarSign,
  FaCalendarAlt, FaIdCard, FaNetworkWired
} from "react-icons/fa";

const API_BASE = "https://api-attendance.onesaas.in";

function EditStaffModal({ isOpen, onClose, onSuccess, staffData }) {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  
  // Dynamic data from API
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [salaryTypes, setSalaryTypes] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [attendanceMethods, setAttendanceMethods] = useState([]);
  
  // Selected values
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [staffType, setStaffType] = useState(null);
  const [employmentType, setEmploymentType] = useState(null);
  const [employmentStatus, setEmploymentStatus] = useState(null);
  
  // Attendance methods configuration
  const [attendanceMethodsConfig, setAttendanceMethodsConfig] = useState({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoadingConstants, setIsLoadingConstants] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Dynamic icon mapping based on key values
  const getIconForType = (key, type) => {
    const iconMap = {
      // Employment types
      FULL_TIME: FaClock,
      PART_TIME: FaClock,
      CONTRACT: FaBriefcase,
      INTERN: FaUserTag,
      FREELANCER: FaBriefcase,
      
      // Designations
      ADMIN: FaUserCog,
      HR_MANAGER: FaUserCog,
      HR_EXECUTIVE: FaUserCog,
      MANAGER: FaUserTie,
      SUPERVISOR: FaUserTag,
      TEAM_LEAD: FaUserTag,
      SENIOR_EMPLOYEE: FaUserCircle,
      
      // Salary types
      HOURLY: FaClock,
      MONTHLY: FaCalendarAlt,
      
      // Employment status
      ACTIVE: FaUserCheck,
      INACTIVE: FaUserCircle,
      RESIGNED: FaTimes,
      
      // Attendance methods
      MANUAL: FaHandPaper,
      GPS: FaMapMarkerAlt,
      FACE: FaCamera,
      QR: FaIdCard,
      FINGERPRINT: FaFingerprint,
      IP: FaNetworkWired
    };
    
    const Icon = iconMap[key] || FaUserCircle;
    return Icon;
  };

  // Internal method options
  const internalMethodOptions = [
    { value: "auto", label: "Auto", icon: FaRobot, description: "Automatically mark attendance" },
    { value: "manual", label: "Manual", icon: FaUserCheck, description: "Manually mark attendance" }
  ];

  // Fetch all constants from the provided data
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPermissions();
      fetchAllConstants();
    }
  }, [isOpen]);

  // Load staff data when constants are loaded
  useEffect(() => {
    if (isOpen && staffData && !isLoadingConstants && employmentTypes.length > 0) {
      loadStaffData();
    }
  }, [isOpen, staffData, isLoadingConstants, employmentTypes, designations, salaryTypes, attendanceMethods]);

  const fetchAllConstants = async () => {
    setIsLoadingConstants(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/constants/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        // Process employment types
        if (data.data.employment_types) {
          const formattedEmploymentTypes = data.data.employment_types.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key, 'employment')
          }));
          setEmploymentTypes(formattedEmploymentTypes);
        }

        // Process designations
        if (data.data.designations) {
          const formattedDesignations = data.data.designations.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key, 'designation')
          }));
          setDesignations(formattedDesignations);
        }

        // Process salary types
        if (data.data.salary_types) {
          const formattedSalaryTypes = data.data.salary_types.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key, 'salary')
          }));
          setSalaryTypes(formattedSalaryTypes);
        }

        // Process employment status
        if (data.data.employment_status) {
          const formattedStatus = data.data.employment_status.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key, 'status')
          }));
          setEmploymentStatuses(formattedStatus);
        }

        // Process attendance methods
        if (data.data.attendance_methods) {
          const formattedMethods = data.data.attendance_methods.map(item => ({
            id: item.key.toLowerCase(),
            name: item.value.label,
            icon: getIconForType(item.key, 'method'),
            description: item.value.description,
            available: item.value.is_available,
            requiresDevice: item.value.requiresDevice || false,
            requiresLocation: item.value.requiresLocation || false,
            requiresCamera: item.value.requiresCamera || false
          }));
          setAttendanceMethods(formattedMethods);
        }
      }
    } catch (err) {
      console.error("Failed to fetch constants", err);
      toast.error("Failed to fetch configuration data");
    } finally {
      setIsLoadingConstants(false);
    }
  };

  const loadStaffData = () => {
    setIsLoadingStaff(true);
    try {
      // Set selected user
      if (staffData.user) {
        setSelectedUser({
          id: staffData.user.id,
          full_name: staffData.user.name || staffData.user.email || "No Name",
          email: staffData.user.email,
          avatar: staffData.user.avatar || null,
          phone: staffData.user.phone || null
        });
      }

      // Set designation
      if (staffData.designation) {
        const foundDesignation = designations.find(d => d.value === staffData.designation);
        if (foundDesignation) {
          setDesignation(foundDesignation);
        } else {
          setDesignation({
            value: staffData.designation,
            label: staffData.designation
              .toLowerCase()
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
          });
        }
      }

      // Set employment type
      if (staffData.employment_type) {
        const foundEmploymentType = employmentTypes.find(e => e.value === staffData.employment_type);
        if (foundEmploymentType) {
          setEmploymentType(foundEmploymentType);
        } else {
          setEmploymentType({
            value: staffData.employment_type,
            label: staffData.employment_type
              .toLowerCase()
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
          });
        }
      }

      // Set employment status
      if (staffData.employment_status) {
        const foundStatus = employmentStatuses.find(s => s.value === staffData.employment_status);
        if (foundStatus) {
          setEmploymentStatus(foundStatus);
        }
      }

      // Set salary type
      if (staffData.salary_type) {
        const foundSalaryType = salaryTypes.find(s => s.value === staffData.salary_type);
        if (foundSalaryType) {
          setStaffType(foundSalaryType);
        } else {
          setStaffType({
            value: staffData.salary_type,
            label: staffData.salary_type.charAt(0) + staffData.salary_type.slice(1).toLowerCase()
          });
        }
      }

      // Set permissions
      if (staffData.permissions && staffData.permissions.length > 0) {
        const selectedPerms = staffData.permissions.map(p => ({
          value: p.id,
          label: p.name,
          description: p.description || p.name
        }));
        setSelectedPermissions(selectedPerms);
      }

      // Initialize attendance methods config
      const initialConfig = {};
      attendanceMethods.forEach(method => {
        initialConfig[method.id] = {
          enabled: false,
          internalMethods: [],
          available: method.available
        };
      });

      // Set attendance methods from staff data
      if (staffData.attendance_methods && staffData.attendance_methods.length > 0) {
        staffData.attendance_methods.forEach(method => {
          const methodId = method.method.toLowerCase();
          if (initialConfig[methodId]) {
            initialConfig[methodId] = {
              ...initialConfig[methodId],
              enabled: true,
              internalMethods: method.internal_methods || []
            };
          }
        });
      }

      setAttendanceMethodsConfig(initialConfig);
    } catch (err) {
      console.error("Error loading staff data:", err);
      toast.error("Failed to load staff data");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const fetchUsers = async (searchQuery = "") => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const company = JSON.parse(localStorage.getItem("company"));

      if (!company?.id) {
        console.error("No company selected");
        toast.error("Please select a company first");
        return;
      }

      const params = new URLSearchParams({
        page: "1",
        limit: "5",
        sort: "name",
        order: "asc"
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`${API_BASE}/company/${company.id}/users/available?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await res.json();

      if (result.success) {
        const usersData = result.data || result.users || [];

        const formatted = usersData.map(u => ({
          id: u.id,
          full_name: u.name || u.email || "No Name",
          email: u.email,
          avatar: u.avatar || null,
          phone: u.phone || null,
          role: u.role || null
        }));

        setUsers(formatted);
      } else {
        throw new Error(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchPermissions = async () => {
    setIsLoadingPermissions(true);
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
      toast.error("Failed to fetch permissions");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const permissionOptions = permissions.map(p => ({
    value: p.id,
    label: p.name,
    description: p.description || p.name
  }));

  // Handle attendance method toggle
  const handleToggleMethod = (methodId) => {
    setAttendanceMethodsConfig(prev => ({
      ...prev,
      [methodId]: {
        ...prev[methodId],
        enabled: !prev[methodId]?.enabled,
        internalMethods: !prev[methodId]?.enabled ? (prev[methodId]?.internalMethods || []) : []
      }
    }));
  };

  // Handle internal method selection
  const handleInternalMethodChange = (methodId, internalMethodValue) => {
    setAttendanceMethodsConfig(prev => {
      const currentInternalMethods = prev[methodId]?.internalMethods || [];
      let newInternalMethods;

      if (currentInternalMethods.includes(internalMethodValue)) {
        newInternalMethods = currentInternalMethods.filter(m => m !== internalMethodValue);
      } else {
        newInternalMethods = [...currentInternalMethods, internalMethodValue];
      }

      return {
        ...prev,
        [methodId]: {
          ...prev[methodId],
          internalMethods: newInternalMethods
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.warning("Please select a user");
      return;
    }

    if (!designation) {
      toast.warning("Please select designation");
      return;
    }

    if (!staffType) {
      toast.warning("Please select salary type");
      return;
    }

    if (!employmentType) {
      toast.warning("Please select employment type");
      return;
    }

    // Validate attendance methods
    const enabledMethods = Object.entries(attendanceMethodsConfig)
      .filter(([key, config]) => config?.enabled && config?.available !== false);

    if (enabledMethods.length === 0) {
      toast.warning("Please enable at least one attendance method");
      return;
    }

    for (const [methodId, config] of enabledMethods) {
      if (!config.internalMethods || config.internalMethods.length === 0) {
        const methodName = attendanceMethods.find(m => m.id === methodId)?.name || methodId;
        toast.warning(`Please select at least one internal method for ${methodName}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const company = JSON.parse(localStorage.getItem("company"));

      const attendanceMethodsData = enabledMethods.map(([methodId, config]) => ({
        method: methodId,
        internal_methods: config.internalMethods
      }));

      const payload = {
        company_id: company?.id || 6,
        user_id: selectedUser.id,
        permissions: selectedPermissions.map(p => p.value),
        employment_type: employmentType.value,
        designation: designation.value,
        salary_type: staffType.value,
        employment_status: employmentStatus?.value || 'active',
        attendance_methods: attendanceMethodsData
      };

      console.log("Updating staff with payload:", payload);

      const response = await fetch(`${API_BASE}/company/invites/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update staff");
      }

      toast.success("Staff updated successfully");
      onSuccess?.();
      handleClose();

    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error(error.message || "Failed to update staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setDesignation(null);
    setStaffType(null);
    setEmploymentType(null);
    setEmploymentStatus(null);
    setSelectedPermissions([]);
    setAttendanceMethodsConfig({});
    setIsSubmitting(false);
    onClose();
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "48px",
      borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
      "&:hover": {
        borderColor: "#6366f1"
      },
      borderRadius: "0.75rem",
      padding: "0 0.5rem"
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
      color: state.isSelected ? "white" : "#1e293b",
      "&:active": {
        backgroundColor: "#6366f1"
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#e0e7ff",
      borderRadius: "0.5rem"
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#4f46e5"
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#4f46e5",
      "&:hover": {
        backgroundColor: "#4f46e5",
        color: "white"
      }
    })
  };

  const isLoading = isLoadingConstants || isLoadingStaff;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FaUserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Staff Member</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Update employee details, permissions and attendance settings</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <FaSpinner className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading staff data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Employee Details */}
                  <div className="space-y-6">
                    {/* User Display */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FaUserCircle className="w-4 h-4 text-indigo-500" />
                        Employee
                      </label>
                      {selectedUser && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                              {selectedUser.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{selectedUser.full_name}</h4>
                              <p className="text-sm text-gray-500">{selectedUser.email}</p>
                              {selectedUser.phone && (
                                <p className="text-xs text-gray-400 mt-1">{selectedUser.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Employee Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Employment Type */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaBriefcase className="w-4 h-4 text-indigo-500" />
                          Employment Type
                        </label>
                        <Select
                          options={employmentTypes}
                          value={employmentType}
                          onChange={(option) => setEmploymentType(option)}
                          placeholder="Select type"
                          styles={customSelectStyles}
                          formatOptionLabel={({ label, description, icon: Icon }) => (
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                              <div className="flex-1">
                                <div className="font-medium">{label}</div>
                                {description && <div className="text-xs text-gray-400">{description}</div>}
                              </div>
                            </div>
                          )}
                        />
                      </motion.div>

                      {/* Designation */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaUserTie className="w-4 h-4 text-indigo-500" />
                          Designation
                        </label>
                        <Select
                          options={designations}
                          value={designation}
                          onChange={(option) => setDesignation(option)}
                          placeholder="Select designation"
                          styles={customSelectStyles}
                          formatOptionLabel={({ label, description, icon: Icon }) => (
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                              <div className="flex-1">
                                <div className="font-medium">{label}</div>
                                {description && <div className="text-xs text-gray-400">{description}</div>}
                              </div>
                            </div>
                          )}
                        />
                      </motion.div>

                      {/* Salary Type */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaDollarSign className="w-4 h-4 text-indigo-500" />
                          Salary Type
                        </label>
                        <Select
                          options={salaryTypes}
                          value={staffType}
                          onChange={(option) => setStaffType(option)}
                          placeholder="Select salary type"
                          styles={customSelectStyles}
                          formatOptionLabel={({ label, description, icon: Icon }) => (
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                              <div className="flex-1">
                                <div className="font-medium">{label}</div>
                                {description && <div className="text-xs text-gray-400">{description}</div>}
                              </div>
                            </div>
                          )}
                        />
                      </motion.div>

                      {/* Employment Status */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                      >
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaUserCheck className="w-4 h-4 text-indigo-500" />
                          Employment Status
                        </label>
                        <Select
                          options={employmentStatuses}
                          value={employmentStatus}
                          onChange={(option) => setEmploymentStatus(option)}
                          placeholder="Select status"
                          styles={customSelectStyles}
                          formatOptionLabel={({ label, description, icon: Icon }) => (
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                              <div className="flex-1">
                                <div className="font-medium">{label}</div>
                                {description && <div className="text-xs text-gray-400">{description}</div>}
                              </div>
                            </div>
                          )}
                        />
                      </motion.div>
                    </div>

                    {/* Permissions */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="space-y-2"
                    >
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FaShieldAlt className="w-4 h-4 text-indigo-500" />
                        Permissions & Access
                      </label>
                      {isLoadingPermissions ? (
                        <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                          <FaSpinner className="w-6 h-6 text-indigo-500 animate-spin" />
                          <span className="ml-2 text-sm text-gray-500">Loading permissions...</span>
                        </div>
                      ) : (
                        <Select
                          isMulti
                          options={permissionOptions}
                          value={selectedPermissions}
                          onChange={(options) => setSelectedPermissions(options)}
                          placeholder="Select permissions..."
                          styles={customSelectStyles}
                          formatOptionLabel={({ label, description }) => (
                            <div className="py-1">
                              <div className="font-medium">{label}</div>
                              {description && <div className="text-xs text-gray-400">{description}</div>}
                            </div>
                          )}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Right Column - Attendance Methods */}
                  <div className="space-y-6">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FaUserCheck className="w-4 h-4 text-indigo-500" />
                          Attendance Methods
                        </label>
                        <span className="text-xs text-gray-400">Configure how staff marks attendance</span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {attendanceMethods.map((method) => {
                          const config = attendanceMethodsConfig[method.id];
                          const isEnabled = config?.enabled || false;

                          return (
                            <div
                              key={method.id}
                              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                                isEnabled ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-gray-200 bg-white'
                              } ${!method.available ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isEnabled ? 'bg-indigo-100' : 'bg-gray-100'
                                  }`}>
                                    <method.icon className={`w-5 h-5 ${
                                      isEnabled ? 'text-indigo-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                                      {method.requiresDevice && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                          Requires Device
                                        </span>
                                      )}
                                      {!method.available && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                          Currently Unavailable
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                                    {method.requiresLocation && (
                                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <FaMapMarkerAlt className="w-3 h-3" />
                                        Location tracking required
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => method.available && handleToggleMethod(method.id)}
                                  disabled={!method.available}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                  } ${!method.available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* Internal Methods - Show only when enabled */}
                              {isEnabled && method.available && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="border-t border-indigo-100 px-4 py-3 bg-indigo-50/50"
                                >
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Marking Methods
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                      {internalMethodOptions.map((internalMethod) => (
                                        <label
                                          key={internalMethod.value}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={config?.internalMethods?.includes(internalMethod.value) || false}
                                            onChange={() => handleInternalMethodChange(method.id, internalMethod.value)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                          />
                                          <internalMethod.icon className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm text-gray-700">{internalMethod.label}</span>
                                          <span className="text-xs text-gray-400">({internalMethod.description})</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Updating Staff...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Update Staff
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditStaffModal;