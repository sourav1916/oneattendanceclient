import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import SearchableSelect from "./SearchableSelect";
import { toast } from "react-toastify";

const API_BASE = "https://api-attendance.onesaas.in";

function AddStaffModal({ isOpen, onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [staffType, setStaffType] = useState(null);

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

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchPermissions();
    }
  }, [isOpen]);

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

  const permissionOptions = permissions.map(p => ({
    value: p.id,
    label: p.name
  }));

  const handleSubmit = () => {
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
    onSuccess?.();
    handleClose();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setDesignation(null);
    setStaffType(null);
    setSelectedPermissions([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                onClick={handleClose}
                className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl text-sm"
              >
                Create Staff
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddStaffModal;