import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { toast } from "react-toastify";
import apiCall from "../../utils/api";
import {
  FaUserPlus, FaUserTag, FaUserCog,
  FaTimes, FaCheck, FaSpinner, FaUserCircle,
  FaBriefcase, FaClock, FaShieldAlt, FaUserTie,
  FaSave, FaFingerprint, FaCamera, FaMapMarkerAlt, FaWifi,
  FaUserCheck, FaRobot, FaHandPaper, FaDollarSign,
  FaCalendarAlt, FaIdCard, FaNetworkWired
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";



function EditStaffModal({ isOpen, onClose, onSuccess, staffData }) {
  const [users, setUsers] = useState([]);
  const [permissionPackages, setPermissionPackages] = useState([]);

  // Dynamic data from API
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [salaryTypes, setSalaryTypes] = useState([]);
  const [attendanceMethods, setAttendanceMethods] = useState([]);

  // Selected values
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissionPackage, setSelectedPermissionPackage] = useState(null);
  const [staffType, setStaffType] = useState(null);
  const [employmentType, setEmploymentType] = useState(null);

  // Attendance methods configuration
  const [attendanceMethodsConfig, setAttendanceMethodsConfig] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoadingConstants, setIsLoadingConstants] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const getIconForType = (key) => {
    const iconMap = {
      FULL_TIME: FaClock,
      PART_TIME: FaClock,
      CONTRACT: FaBriefcase,
      INTERN: FaUserTag,
      FREELANCER: FaBriefcase,
      ADMIN: FaUserCog,
      HR_MANAGER: FaUserCog,
      HR_EXECUTIVE: FaUserCog,
      MANAGER: FaUserTie,
      SUPERVISOR: FaUserTag,
      TEAM_LEAD: FaUserTag,
      SENIOR_EMPLOYEE: FaUserCircle,
      HOURLY: FaClock,
      MONTHLY: FaCalendarAlt,
      ACTIVE: FaUserCheck,
      INACTIVE: FaUserCircle,
      RESIGNED: FaTimes,
      MANUAL: FaHandPaper,
      GPS: FaMapMarkerAlt,
      FACE: FaCamera,
      QR: FaIdCard,
      FINGERPRINT: FaFingerprint,
      IP: FaNetworkWired
    };
    return iconMap[key] || FaUserCircle;
  };

  const internalMethodOptions = [
    { value: "manual", label: "Manual", icon: FaUserCheck, description: "Manually mark attendance" },
    { value: "auto", label: "Auto", icon: FaRobot, description: "Automatically mark attendance" }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPermissionPackages();
      fetchAllConstants();
    }
  }, [isOpen]);

  // Load staff data once constants are ready and staffData changes
  useEffect(() => {
    if (isOpen && staffData && !isLoadingConstants && employmentTypes.length > 0) {
      loadStaffData();
    }
  }, [isOpen, staffData, isLoadingConstants, employmentTypes, designations, salaryTypes, attendanceMethods, permissionPackages]);

  const fetchAllConstants = async () => {
    setIsLoadingConstants(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/constants/', 'GET', null, company?.id);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        if (data.data.employment_types) {
          setEmploymentTypes(data.data.employment_types.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key)
          })));
        }
        if (data.data.designations) {
          setDesignations(data.data.designations.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key)
          })));
        }
        if (data.data.salary_types) {
          setSalaryTypes(data.data.salary_types.map(item => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key)
          })));
        }
        if (data.data.attendance_methods) {
          setAttendanceMethods(data.data.attendance_methods.map(item => ({
            id: item.key.toLowerCase(),
            name: item.value.label,
            icon: getIconForType(item.key),
            description: item.value.description,
            available: item.value.is_available,
            requiresDevice: item.value.requiresDevice || false,
            requiresLocation: item.value.requiresLocation || false,
            requiresCamera: item.value.requiresCamera || false
          })));
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


      // Load user data
      if (staffData.user) {
        setSelectedUser({
          id: staffData.user.id,
          full_name: staffData.user.name || staffData.user.email || "No Name",
          email: staffData.user.email,
          avatar: staffData.user.avatar || null,
          phone: staffData.user.phone || null
        });
      }

      // Load designation
      if (staffData.designation) {
        const found = designations.find(d => d.value === staffData.designation);
        if (found) {
          setDesignation(found);
        } else {
          // Create a temporary option if not found in list
          setDesignation({
            value: staffData.designation,
            label: staffData.designation.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
          });
        }
      }

      // Load employment type
      if (staffData.employment_type) {
        const found = employmentTypes.find(e => e.value === staffData.employment_type);
        if (found) {
          setEmploymentType(found);
        } else {
          setEmploymentType({
            value: staffData.employment_type,
            label: staffData.employment_type.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
          });
        }
      }

      // Load salary type
      if (staffData.salary_type) {
        const found = salaryTypes.find(s => s.value === staffData.salary_type);
        if (found) {
          setStaffType(found);
        } else {
          setStaffType({
            value: staffData.salary_type,
            label: staffData.salary_type.charAt(0).toUpperCase() + staffData.salary_type.slice(1).toLowerCase()
          });
        }
      }

      // Load permission package (from permission_package object)
      if (staffData.permission_package && staffData.permission_package.id) {
        const found = permissionPackages.find(p => p.value === staffData.permission_package.id);
        if (found) {
          setSelectedPermissionPackage(found);
        }
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

      // Load attendance methods from staff data
      if (staffData.attendance_methods && staffData.attendance_methods.length > 0) {
        staffData.attendance_methods.forEach(method => {
          const methodId = method.method.toLowerCase();
          if (initialConfig[methodId]) {
            const internalMethods = [];
            if (method.is_manual === true || method.is_manual === 1) internalMethods.push("manual");
            if (method.is_auto === true || method.is_auto === 1) internalMethods.push("auto");

            initialConfig[methodId] = {
              ...initialConfig[methodId],
              enabled: true,
              internalMethods: internalMethods
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
      const company = JSON.parse(localStorage.getItem("company"));

      if (!company?.id) {
        toast.error("Please select a company first");
        return;
      }

      const params = new URLSearchParams({ page: "1", limit: "5", sort: "name", order: "asc" });
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiCall(`/company/users/available?${params.toString()}`, 'GET', null, company?.id);

      if (!res.ok) throw new Error('Failed to fetch users');

      const result = await res.json();
      if (result.success) {
        const usersData = result.data || result.users || [];
        setUsers(usersData.map(u => ({
          id: u.id,
          full_name: u.name || u.email || "No Name",
          email: u.email,
          avatar: u.avatar || null,
          phone: u.phone || null,
          role: u.role || null
        })));
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

  const fetchPermissionPackages = async () => {
    setIsLoadingPermissions(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/permissions/permission-packages', 'GET', null, company?.id);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.success) {
        const packages = result.data?.packages || [];
        setPermissionPackages(packages.map(pkg => ({
          value: pkg.id,
          label: pkg.package_name,
          description: pkg.description,
          groupCode: pkg.group_code,
          permissions: pkg.permissions?.filter(p => p.is_active === 1) || [],
          isActive: pkg.is_active === 1
        })));
      }
    } catch (err) {
      console.error("Permission packages error", err);
      toast.error("Failed to fetch permission packages");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

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

  const handleInternalMethodChange = (methodId, internalMethodValue) => {
    setAttendanceMethodsConfig(prev => {
      const current = prev[methodId]?.internalMethods || [];
      const updated = current.includes(internalMethodValue)
        ? current.filter(m => m !== internalMethodValue)
        : [...current, internalMethodValue];
      return { ...prev, [methodId]: { ...prev[methodId], internalMethods: updated } };
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) { toast.warning("Please select a user"); return; }
    if (!designation) { toast.warning("Please select designation"); return; }
    if (!staffType) { toast.warning("Please select salary type"); return; }
    if (!employmentType) { toast.warning("Please select employment type"); return; }

    const enabledMethods = Object.entries(attendanceMethodsConfig)
      .filter(([, config]) => config?.enabled && config?.available !== false);

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
      const company = JSON.parse(localStorage.getItem('company'));
      const response = await apiCall(`/company/invites/${staffData.invite_id}`, 'PUT', {
        invite_id: staffData.invite_id,
        user_id: selectedUser.id,
        permission_package_id: selectedPermissionPackage?.value || null,
        employment_type: employmentType.value,
        designation: designation.value,
        salary_type: staffType.value,
        attendance_methods: enabledMethods.map(([methodId, config]) => ({
          method: methodId,
          is_manual: config.internalMethods.includes("manual") ? 1 : 0,
          is_auto: config.internalMethods.includes("auto") ? 1 : 0,
        }))
      }, company?.id);

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Failed to update staff");

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
    setSelectedPermissionPackage(null);
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
      "&:hover": { borderColor: "#6366f1" },
      borderRadius: "0.75rem",
      padding: "0 0.5rem"
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
      color: state.isSelected ? "white" : "#1e293b",
      "&:active": { backgroundColor: "#6366f1" }
    }),
    multiValue: (base) => ({ ...base, backgroundColor: "#e0e7ff", borderRadius: "0.5rem" }),
    multiValueLabel: (base) => ({ ...base, color: "#4f46e5" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#4f46e5",
      "&:hover": { backgroundColor: "#4f46e5", color: "white" }
    })
  };

  const isLoading = isLoadingConstants || isLoadingStaff;

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalScrollLock />
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
                  <div className="space-y-6">
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

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="space-y-2"
                    >
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FaShieldAlt className="w-4 h-4 text-indigo-500" />
                        Permission Package
                      </label>
                      {isLoadingPermissions ? (
                        <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                          <FaSpinner className="w-6 h-6 text-indigo-500 animate-spin" />
                          <span className="ml-2 text-sm text-gray-500">Loading permission packages...</span>
                        </div>
                      ) : (
                        <>
                          <Select
                            options={permissionPackages}
                            value={selectedPermissionPackage}
                            onChange={(option) => setSelectedPermissionPackage(option)}
                            placeholder="Select a permission package..."
                            isClearable
                            styles={customSelectStyles}
                            formatOptionLabel={({ label, description, groupCode, permissions }) => (
                              <div className="py-1">
                                <div className="flex items-center gap-2">
                                  <FaShieldAlt className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                  <span className="font-medium text-gray-900">{label}</span>
                                  {groupCode && (
                                    <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono">
                                      {groupCode}
                                    </span>
                                  )}
                                </div>
                                {description && (
                                  <div className="text-xs text-gray-400 mt-0.5 ml-5">{description}</div>
                                )}
                                {permissions?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                                    {permissions.slice(0, 3).map(p => (
                                      <span
                                        key={p.permission_id}
                                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full"
                                      >
                                        {p.permission_name}
                                      </span>
                                    ))}
                                    {permissions.length > 3 && (
                                      <span className="text-xs text-gray-400">+{permissions.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          />

                          {selectedPermissionPackage && selectedPermissionPackage.permissions?.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
                            >
                              <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                                <FaCheck className="w-3 h-3" />
                                Active Permissions in this Package
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedPermissionPackage.permissions.map(p => (
                                  <span
                                    key={p.permission_id}
                                    className="text-xs bg-white text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg font-medium shadow-sm"
                                  >
                                    {p.permission_name}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </>
                      )}
                    </motion.div>
                  </div>

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
                              className={`border rounded-xl transition-all duration-200 overflow-hidden ${isEnabled ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-gray-200 bg-white'
                                } ${!method.available ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-indigo-100' : 'bg-gray-100'
                                    }`}>
                                    <method.icon className={`w-5 h-5 ${isEnabled ? 'text-indigo-600' : 'text-gray-500'}`} />
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
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                    } ${!method.available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                              </div>

                              {isEnabled && method.available && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="border-t border-indigo-100 px-4 py-3 bg-indigo-50/50"
                                >
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Marking Methods</label>
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
