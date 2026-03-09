import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { toast } from "react-toastify";
import { 
  FaUserPlus, FaUserTag, FaUserTie, FaKey, 
  FaTimes, FaCheck, FaSpinner, FaUserCircle,
  FaBriefcase, FaClock, FaShieldAlt, FaSearch
} from "react-icons/fa";
import SearchableSelect from "./SearchableSelect";

const API_BASE = "https://api-attendance.onesaas.in";

function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [staffType, setStaffType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const designationOptions = [
    { value: "manager", label: "Manager", icon: FaUserTie },
    { value: "supervisor", label: "Supervisor", icon: FaUserTag },
    { value: "staff", label: "Staff", icon: FaUserCircle }
  ];

  const staffTypeOptions = [
    { value: "monthly", label: "Monthly Staff", icon: FaClock, description: "Fixed monthly salary" },
    { value: "weekly", label: "Weekly Staff", icon: FaClock, description: "Weekly wage basis" },
    { value: "hourly", label: "Hourly Staff", icon: FaClock, description: "Hourly rate basis" },
    { value: "work_basis", label: "Work Basis Staff", icon: FaBriefcase, description: "Project/Work based" }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPermissions();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
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
          email: u.email,
          avatar: u.avatar || null
        }));
        setUsers(formatted);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to fetch users");
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
      toast.warning("Please select staff type");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log({
        user_id: selectedUser.id,
        designation: designation.value,
        staff_type: staffType.value,
        permissions: selectedPermissions.map(p => p.value)
      });

      toast.success("Staff created successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error creating staff:", error);
      toast.error("Failed to create staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setDesignation(null);
    setStaffType(null);
    setSelectedPermissions([]);
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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Gradient Header */}
            <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FaUserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Staff</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Add team members with roles and permissions</p>
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

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* User Selection */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaUserCircle className="w-4 h-4 text-indigo-500" />
                    Select User
                  </label>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                      <FaSpinner className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                    </div>
                  ) : (
                    <SearchableSelect
                      users={users}
                      onSelect={(user) => setSelectedUser(user)}
                      placeholder="Search and select user..."
                    />
                  )}
                </motion.div>

                {/* Designation & Staff Type - Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      options={designationOptions}
                      value={designation}
                      onChange={(option) => setDesignation(option)}
                      placeholder="Select designation"
                      styles={customSelectStyles}
                      formatOptionLabel={({ label, icon: Icon }) => (
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                          <span>{label}</span>
                        </div>
                      )}
                    />
                  </motion.div>

                  {/* Staff Type */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FaBriefcase className="w-4 h-4 text-indigo-500" />
                      Staff Type
                    </label>
                    <Select
                      options={staffTypeOptions}
                      value={staffType}
                      onChange={(option) => setStaffType(option)}
                      placeholder="Select staff type"
                      styles={customSelectStyles}
                      formatOptionLabel={({ label, description, icon: Icon }) => (
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                          <div>
                            <div>{label}</div>
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
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaShieldAlt className="w-4 h-4 text-indigo-500" />
                    Permissions
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
            </div>

            {/* Footer Actions */}
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
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Create Staff
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

export default AddStaffModal;