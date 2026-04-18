import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBox, FaCode, FaTag, FaBriefcase, FaDollarSign, FaUserTie,
  FaClock, FaCalendarAlt, FaSpinner, FaEye, FaEdit, FaTrash,
  FaCheckCircle, FaTimesCircle, FaSearch, FaTimes, FaShieldAlt,
  FaUserCheck, FaSave, FaPlus, FaTh, FaListUl, FaChevronDown,
  FaChevronUp, FaToggleOn, FaToggleOff, FaInfoCircle
} from "react-icons/fa";
import { toast } from 'react-toastify';
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";
import Skeleton from "../components/SkeletonComponent";
import ModalScrollLock from "../components/ModalScrollLock";
import ActionMenu from "../components/ActionMenu";
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import usePermissionAccess from "../hooks/usePermissionAccess";
import { useAuth } from "../context/AuthContext";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.9,  y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: "spring", duration: 0.5 } },
  exit:    { opacity: 0, scale: 0.9,  y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 }
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const formatDisplay = (str) => 
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";

const getStatusBadge = (isActive) => {
  if (isActive) {
    return { icon: FaCheckCircle, text: "Active", className: "bg-green-100 text-green-800 border border-green-200" };
  }
  return { icon: FaTimesCircle, text: "Inactive", className: "bg-gray-100 text-gray-800 border border-gray-200" };
};

// Weekday options
const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

const WEEKEND_TYPES = [
  { value: "none", label: "Working Day", color: "bg-gray-100 text-gray-600" },
  { value: "half", label: "Half Day", color: "bg-blue-500 text-white" },
  { value: "full", label: "Full Day", color: "bg-indigo-600 text-white" }
];

const normalizeAttendanceMethodValue = (value) => {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  if (value && typeof value === 'object') {
    return String(value.method || value.key || value.id || value.value || '').trim().toLowerCase();
  }

  return '';
};

const normalizeAttendanceMethods = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        return normalizeAttendanceMethodValue(item);
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeAttendanceMethods(parsed);
    } catch {
      return [value.trim().toLowerCase()].filter(Boolean);
    }
  }

  return [];
};

const formatAttendanceMethod = (value) => {
  const normalized = normalizeAttendanceMethodValue(value);
  if (!normalized) return 'N/A';
  return normalized.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
      {icon}{label}
    </label>
    <div className="text-gray-800 font-medium">{value}</div>
  </div>
);

const WeekendConfig = ({ weekends, onChange }) => {
  const getWeekendType = (day) => {
    const found = weekends?.find(w => w.day === day);
    return found?.type || "none";
  };

  const updateWeekend = (day, type) => {
    const existing = weekends?.filter(w => w.day !== day) || [];
    if (type !== "none") {
      onChange([...existing, { day, type }]);
    } else {
      onChange(existing);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FaCalendarAlt className="w-4 h-4 text-purple-500" />
        Weekend / Holiday Configuration
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WEEKDAYS.map((day) => {
          const currentType = getWeekendType(day.value);
          return (
            <div key={day.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
              <span className="capitalize font-medium text-gray-700 w-24">{day.label}</span>
              <div className="flex bg-white p-1 rounded-lg shadow-inner border border-gray-200">
                {WEEKEND_TYPES.map((opt) => {
                  const isActive = currentType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateWeekend(day.value, opt.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                        isActive ? opt.color + " shadow-md scale-105" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Create/Edit Modal ───────────────────────────────────────────────────────

function PackageFormModal({ isOpen, onClose, onSuccess, packageData, isEditing, submitDisabled, submitTitle }) {
  const { attendanceMethods: companyAttendanceMethods = [], loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    designation: "",
    salary_type: "",
    employment_type: "",
    permission_package_id: "",
    shift_start: "09:00:00",
    shift_end: "18:00:00",
    weekends: [],
    attendance_methods: [],
    auto_approve: false,
    remarks: ""
  });
  const [loading, setLoading] = useState(false);
  const [permissionPackages, setPermissionPackages] = useState([]);
  const [constants, setConstants] = useState({ designations: [], salary_types: [], employment_types: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const attendanceMethods = useMemo(() => companyAttendanceMethods, [companyAttendanceMethods]);

  // Fetch options
  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (packageData && isEditing) {
      setFormData({
        code: packageData.code || "",
        name: packageData.name || "",
        designation: packageData.designation || "",
        salary_type: packageData.salary_type || "",
        employment_type: packageData.employment_type || "",
        permission_package_id: packageData.permission_package_id?.toString() || "",
        shift_start: packageData.shift_start || "09:00:00",
        shift_end: packageData.shift_end || "18:00:00",
        weekends: packageData.weekends || [],
        attendance_methods: normalizeAttendanceMethods(packageData.attendance_methods || []),
        auto_approve: packageData.auto_approve || false,
        remarks: packageData.remarks || ""
      });
    } else {
      setFormData({
        code: "",
        name: "",
        designation: "",
        salary_type: "",
        employment_type: "",
        permission_package_id: "",
        shift_start: "09:00:00",
        shift_end: "18:00:00",
        weekends: [],
        attendance_methods: [],
        auto_approve: false,
        remarks: ""
      });
    }
  }, [packageData, isEditing, isOpen]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));

      await Promise.all([
        (async () => {
          try {
            const permRes = await apiCall('/permissions/permission-packages', 'GET', null, company?.id);
            const permJson = await permRes.json();
            if (permJson.success) {
              setPermissionPackages(permJson.data?.packages || []);
            }
          } catch (error) {
            console.error('Failed to fetch permission packages:', error);
          }
        })(),
        (async () => {
          try {
            const constRes = await apiCall('/constants/', 'GET', null, company?.id);
            const constJson = await constRes.json();
            if (constJson.success) {
              const data = constJson.data;
              setConstants({
                designations: data.designations?.map(d => ({ value: d.value.value, label: d.value.label })) || [],
                salary_types: data.salary_types?.map(s => ({ value: s.value.value, label: s.value.label })) || [],
                employment_types: data.employment_types?.map(e => ({ value: e.value.value, label: e.value.label })) || []
              });
            }
          } catch (error) {
            console.error('Failed to fetch form constants:', error);
          }
        })(),
      ]);
    } catch (error) {
      console.error("Failed to fetch options:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAttendanceToggle = (method) => {
    setFormData(prev => ({
      ...prev,
      attendance_methods: prev.attendance_methods.includes(method)
        ? prev.attendance_methods.filter(m => m !== method)
        : [...prev.attendance_methods, method]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitDisabled) return;
    
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const payload = {
        code: formData.code,
        name: formData.name,
        designation: formData.designation,
        salary_type: formData.salary_type,
        employment_type: formData.employment_type,
        permission_package_id: parseInt(formData.permission_package_id),
        shift_start: formData.shift_start,
        shift_end: formData.shift_end,
        weekends: formData.weekends,
        attendance_methods: formData.attendance_methods,
        auto_approve: formData.auto_approve,
        remarks: formData.remarks
      };

      let response;
      if (isEditing) {
        payload.package_id = packageData.id;
        response = await apiCall('/company/invites/package-update', 'PUT', payload, company?.id);
      } else {
        response = await apiCall('/company/invites/package-create', 'POST', payload, company?.id);
      }

      const result = await response.json();
      if (result.success) {
        toast.success(isEditing ? "Package updated successfully!" : "Package created successfully!");
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || "Operation failed");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              {isEditing ? <FaEdit className="w-6 h-6 text-white" /> : <FaPlus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Edit Package" : "Create New Package"}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Configure invite package settings</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center transition-colors">
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 mb-6 custom-scrollbar">
          {loadingOptions || authLoading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-500">Loading options...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaCode className="text-indigo-500" /> Package Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., DEV001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaBox className="text-indigo-500" /> Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Developer Package"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaUserTie className="text-indigo-500" /> Designation
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white"
                  >
                    <option value="">Select designation</option>
                    {constants.designations.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaBriefcase className="text-indigo-500" /> Employment Type
                  </label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white"
                  >
                    <option value="">Select type</option>
                    {constants.employment_types.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaDollarSign className="text-indigo-500" /> Salary Type
                  </label>
                  <select
                    name="salary_type"
                    value={formData.salary_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white"
                  >
                    <option value="">Select type</option>
                    {constants.salary_types.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaShieldAlt className="text-indigo-500" /> Permission Package
                  </label>
                  <select
                    name="permission_package_id"
                    value={formData.permission_package_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition bg-white"
                  >
                    <option value="">Select permission package</option>
                    {permissionPackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.package_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaTag className="text-indigo-500" /> Remarks
                  </label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Optional notes"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Shift Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaClock className="text-indigo-500" /> Shift Start
                  </label>
                  <input
                    type="time"
                    name="shift_start"
                    value={formData.shift_start}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <FaClock className="text-indigo-500" /> Shift End
                  </label>
                  <input
                    type="time"
                    name="shift_end"
                    value={formData.shift_end}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Weekend Config */}
              <WeekendConfig
                weekends={formData.weekends}
                onChange={(newWeekends) => setFormData(prev => ({ ...prev, weekends: newWeekends }))}
              />

              {/* Attendance Methods */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaUserCheck className="w-4 h-4 text-indigo-500" />
                  Attendance Methods
                </label>
                {attendanceMethods.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {attendanceMethods.map((method) => {
                      const isSelected = formData.attendance_methods.includes(method.method);

                      return (
                        <button
                          key={method.method}
                          type="button"
                          onClick={() => handleAttendanceToggle(method.method)}
                          className={`flex flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="font-semibold">{method.label || formatAttendanceMethod(method.method)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isSelected ? 'Selected' : 'Available'}
                            </span>
                          </div>
                          {method.is_auto && (
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              Auto method
                            </span>
                          )}
                          {method.is_manual && (
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              Manual method
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    No attendance methods are available for the current company.
                  </div>
                )}
              </div>

              {/* Auto Approve Toggle */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                      <FaCheckCircle className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Auto Approve Attendance</p>
                      <p className="text-xs text-gray-500">Automatically approve attendance records</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, auto_approve: !prev.auto_approve }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.auto_approve ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.auto_approve ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || submitDisabled}
              title={submitDisabled ? submitTitle : ""}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
              {isEditing ? "Update Package" : "Create Package"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── View Modal ──────────────────────────────────────────────────────────────

function ViewPackageModal({ isOpen, onClose, package: pkg }) {
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionDetails, setPermissionDetails] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  useEffect(() => {
    if (isOpen && pkg?.permission_package_id) {
      fetchPermissions();
    }
  }, [isOpen, pkg]);

  const fetchPermissions = async () => {
    setLoadingPerms(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const response = await apiCall(`/permissions/permission-packages/${pkg.permission_package_id}`, 'GET', null, company?.id);
      const result = await response.json();
      if (result.success) {
        setPermissionDetails(result.data?.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoadingPerms(false);
    }
  };

  if (!isOpen || !pkg) return null;

  const status = getStatusBadge(pkg.is_active);
  const StatusIcon = status.icon;

  return (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <FaBox className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Package Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{pkg.name}</h3>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <FaCode className="text-indigo-500" size={14} />
                {pkg.code}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border ${status.className}`}>
              <StatusIcon size={14} />{status.text}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <InfoItem icon={<FaUserTie className="text-blue-500" />} label="Designation" value={formatDisplay(pkg.designation)} />
            <InfoItem icon={<FaBriefcase className="text-purple-500" />} label="Employment Type" value={formatDisplay(pkg.employment_type)} />
            <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" value={formatDisplay(pkg.salary_type)} />
            <InfoItem icon={<FaClock className="text-orange-500" />} label="Shift Timing" value={`${pkg.shift_start} - ${pkg.shift_end}`} />
            <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Created At" value={formatDate(pkg.created_at)} />
            <InfoItem icon={<FaTag className="text-indigo-500" />} label="Remarks" value={pkg.remarks || "—"} />
          </div>

          {/* Auto Approve */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Auto Approve Attendance</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${pkg.auto_approve ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {pkg.auto_approve ? "Enabled" : "Disabled"}
            </span>
          </div>

          {/* Attendance Methods */}
          {pkg.attendance_methods?.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <FaUserCheck className="text-purple-500" /> Attendance Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {pkg.attendance_methods.map((method, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium capitalize border border-purple-200">
                    {formatAttendanceMethod(method)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weekends */}
          {pkg.weekends?.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <FaCalendarAlt className="text-indigo-500" /> Weekend Configuration
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {pkg.weekends.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="capitalize font-medium text-gray-700">{w.day}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.type === 'full' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                      {w.type === 'full' ? 'Full Day' : 'Half Day'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Section */}
          {pkg.permission_package_id && (
            <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowPermissions(!showPermissions)}
                className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-indigo-500" /> 
                  <span className="text-sm font-semibold text-gray-700">Permission Package</span>
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
                    Package ID: {pkg.permission_package_id}
                  </span>
                </div>
                <motion.div animate={{ rotate: showPermissions ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <FaChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showPermissions && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white">
                      {loadingPerms ? (
                        <div className="flex items-center justify-center py-8">
                          <FaSpinner className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                      ) : permissionDetails.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permissionDetails.map((perm, idx) => (
                            <div key={perm.permission_id || idx} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                              <span className="text-sm text-gray-700">{perm.permission_name || perm.name}</span>
                              <span className="text-xs text-indigo-600 font-mono">{perm.code}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">No permissions found for this package</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeletePackageModal({ isOpen, onClose, onConfirm, package: pkg, processing }) {
  if (!isOpen || !pkg) return null;

  return (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white">
          <div className="flex items-center gap-2">
            <FaTrash className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Delete Package</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <FaTrash className="text-3xl text-red-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">Are you sure?</p>
          <p className="text-gray-500 mb-6">
            You are about to delete <span className="font-semibold text-red-600">{pkg.name}</span> ({pkg.code}). 
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={() => onConfirm(pkg.id)} disabled={processing}
              className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition shadow-md flex items-center gap-2 disabled:opacity-50">
              {processing && <FaSpinner className="w-4 h-4 animate-spin" />}
              Delete Package
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Toggle Status Modal ──────────────────────────────────────────────────────

function ToggleStatusModal({ isOpen, onClose, onConfirm, package: pkg, processing, newStatus }) {
  if (!isOpen || !pkg) return null;

  const isActivating = newStatus === true;
  
  return (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>
        
        <div className={`flex justify-between items-center p-5 border-b ${isActivating ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-amber-600 to-orange-600'} text-white`}>
          <div className="flex items-center gap-2">
            {isActivating ? <FaToggleOn className="w-5 h-5" /> : <FaToggleOff className="w-5 h-5" />}
            <h2 className="text-xl font-semibold">{isActivating ? "Activate Package" : "Deactivate Package"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isActivating ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isActivating ? <FaCheckCircle className="text-3xl text-green-600" /> : <FaTimesCircle className="text-3xl text-amber-600" />}
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">
            {isActivating ? "Activate Package?" : "Deactivate Package?"}
          </p>
          <p className="text-gray-500 mb-6">
            {isActivating 
              ? `Are you sure you want to activate "${pkg.name}"? Active packages can be used for new invitations.`
              : `Are you sure you want to deactivate "${pkg.name}"? Inactive packages won't appear in invite creation.`}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={() => onConfirm(pkg.id, !pkg.is_active)} disabled={processing}
              className={`px-5 py-2 rounded-xl text-white transition shadow-md flex items-center gap-2 disabled:opacity-50 ${
                isActivating ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}>
              {processing && <FaSpinner className="w-4 h-4 animate-spin" />}
              {isActivating ? "Activate" : "Deactivate"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvitePackageManagement() {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggleNewStatus, setToggleNewStatus] = useState(false);
  const fetchInProgress = useRef(false);
  const isInitialLoad = useRef(true);

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  
  const createAccess = checkActionAccess("invitePackages", "create");
  const updateAccess = checkActionAccess("invitePackages", "update");
  const deleteAccess = checkActionAccess("invitePackages", "delete");
  const readAccess = checkActionAccess("invitePackages", "read");

  // Fetch packages
  const fetchPackages = useCallback(async (page = pagination.page, search = debouncedSearchTerm, resetLoading = true) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);

    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: pagination.limit.toString() 
      });
      if (search) params.append("search", search);
      
      const response = await apiCall(`/company/invites/package-list?${params.toString()}`, 'GET', null, company?.id);
      if (!response.ok) throw new Error("Failed to fetch packages");

      const result = await response.json();
      if (result.success) {
        setPackages(result.data || []);
        const meta = result.meta;
        updatePagination({
          page: meta?.page || page,
          limit: meta?.limit || pagination.limit,
          total: meta?.total || 0,
          total_pages: meta?.total_pages || 1,
          is_last_page: meta?.is_last_page || (page >= meta?.total_pages)
        });
      } else {
        throw new Error(result.message || "Failed to fetch packages");
      }
    } catch (err) {
      toast.error(err.message || "Failed to load packages.");
      console.error("Error fetching packages:", err);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
      isInitialLoad.current = false;
    }
  }, [pagination.limit, pagination.page, updatePagination, debouncedSearchTerm]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchPackages(1, "", true);
  }, []);

  // Handle page/search changes
  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page) {
      goToPage(newPage);
      fetchPackages(newPage, debouncedSearchTerm, true);
    }
  }, [pagination.page, goToPage, fetchPackages, debouncedSearchTerm]);

  useEffect(() => {
    if (!isInitialLoad.current) {
      if (pagination.page !== 1) goToPage(1);
      else fetchPackages(1, debouncedSearchTerm, true);
    }
  }, [debouncedSearchTerm]);

  // CRUD Operations
  const handleCreateSuccess = () => {
    fetchPackages(1, debouncedSearchTerm, true);
    setIsCreateModalOpen(false);
  };

  const handleEditClick = (pkg) => {
    if (updateAccess.disabled) return;
    setEditingPackage(pkg);
    setIsEditModalOpen(true);
    setActiveActionMenu(null);
  };

  const handleEditSuccess = () => {
    toast.success("Package updated successfully!");
    fetchPackages(pagination.page, debouncedSearchTerm, false);
    setIsEditModalOpen(false);
    setEditingPackage(null);
  };

  const handleDelete = async (packageId) => {
    setProcessingId(packageId);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const response = await apiCall('/company/invites/package-delete', 'DELETE', { package_id: packageId }, company?.id);
      const result = await response.json();
      if (result.success) {
        toast.success("Package deleted successfully!");
        fetchPackages(pagination.page, debouncedSearchTerm, false);
        setModalType(null);
        setSelectedPackage(null);
      } else {
        throw new Error(result.message || "Delete failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete package");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (packageId, newStatus) => {
    setProcessingId(packageId);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const response = await apiCall('/company/invites/package-update', 'PUT', { package_id: packageId, is_active: newStatus }, company?.id);
      const result = await response.json();
      if (result.success) {
        toast.success(`Package ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchPackages(pagination.page, debouncedSearchTerm, false);
        setModalType(null);
        setSelectedPackage(null);
        setToggleTarget(null);
      } else {
        throw new Error(result.message || "Status update failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update package status");
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (pkg, type) => {
    setSelectedPackage(pkg);
    setModalType(type);
    setActiveActionMenu(null);
  };

  const openToggleModal = (pkg, newStatus) => {
    setSelectedPackage(pkg);
    setToggleTarget(pkg);
    setToggleNewStatus(newStatus);
    setModalType("toggle");
    setActiveActionMenu(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedPackage(null);
    setToggleTarget(null);
  };

  // Responsive columns
  const [visibleColumns, setVisibleColumns] = useState(() => ({
    showCode: window.innerWidth >= 420,
    showName: true,
    showDesignation: window.innerWidth >= 540,
    showEmployment: window.innerWidth >= 1024,
    showStatus: window.innerWidth >= 768,
    showCreated: window.innerWidth >= 1280
  }));

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setVisibleColumns({
        showCode: window.innerWidth >= 420,
        showName: true,
        showDesignation: window.innerWidth >= 540,
        showEmployment: window.innerWidth >= 1024,
        showStatus: window.innerWidth >= 768,
        showCreated: window.innerWidth >= 1280
      }), 150);
    };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  if (isInitialLoad.current && loading) return <Skeleton />;

  return (
    <div className="min-h-screen p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Invite Packages
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <FaBox className="w-4 h-4 text-indigo-500" />
              <span className="font-medium text-gray-700">{pagination.total}</span>
              <span className="text-gray-500">packages</span>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => !createAccess.disabled && setIsCreateModalOpen(true)}
              disabled={createAccess.disabled}
              title={createAccess.disabled ? getAccessMessage(createAccess) : ""}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FaPlus className="w-4 h-4" />
              Create Package
            </motion.button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input type="text" placeholder="Search by name, code, or designation..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-lg transition-all" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            )}
          </div>
        </motion.div>

        {/* View Toggle */}
        <div className="flex justify-end gap-2 mb-6">
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="indigo" />
        </div>

        {/* Loading */}
        {loading && !packages.length && <Skeleton />}

        {/* Empty State */}
        {!loading && packages.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-xl">
            <FaBox className="text-8xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No packages found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm ? "Try adjusting your search" : "Create your first invite package to get started"}
            </p>
            {!createAccess.disabled && (
              <button onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                Create Package
              </button>
            )}
          </motion.div>
        )}

        {/* Table View */}
        {!loading && packages.length > 0 && viewMode === "table" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-visible">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs xsm:hidden">
                  <tr>
                    {visibleColumns.showCode && <th className="px-6 py-4">Code</th>}
                    {visibleColumns.showName && <th className="px-6 py-4">Package Name</th>}
                    {visibleColumns.showDesignation && <th className="px-6 py-4">Designation</th>}
                    {visibleColumns.showEmployment && <th className="px-6 py-4">Employment</th>}
                    {visibleColumns.showStatus && <th className="px-6 py-4">Status</th>}
                    {visibleColumns.showCreated && <th className="px-6 py-4">Created</th>}
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {packages.map((pkg, index) => {
                    const status = getStatusBadge(pkg.is_active);
                    const StatusIcon = status.icon;
                    return (
                      <motion.tr key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => readAccess.enabled && openModal(pkg, "view")}
                        className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300">
                        {visibleColumns.showCode && (
                          <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">{pkg.code}</td>
                        )}
                        {visibleColumns.showName && (
                          <td className="px-6 py-4 font-semibold text-gray-800">{pkg.name}</td>
                        )}
                        {visibleColumns.showDesignation && (
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                              {formatDisplay(pkg.designation)}
                            </span>
                          </td>
                        )}
                        {visibleColumns.showEmployment && (
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                {formatDisplay(pkg.employment_type)}
                              </span>
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                                {formatDisplay(pkg.salary_type)}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.showStatus && (
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                              <StatusIcon size={12} />{status.text}
                            </span>
                          </td>
                        )}
                        {visibleColumns.showCreated && (
                          <td className="px-6 py-4 text-xs text-gray-500">{formatDate(pkg.created_at)}</td>
                        )}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            menuId={pkg.id}
                            activeId={activeActionMenu}
                            onToggle={(e, id) => setActiveActionMenu(prev => prev === id ? null : id)}
                            actions={[
                              {
                                label: 'View Details',
                                icon: <FaEye size={14} />,
                                onClick: () => openModal(pkg, "view"),
                                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                              },
                              {
                                label: pkg.is_active ? 'Deactivate' : 'Activate',
                                icon: pkg.is_active ? <FaToggleOff size={14} /> : <FaToggleOn size={14} />,
                                onClick: () => openToggleModal(pkg, !pkg.is_active),
                                disabled: updateAccess.disabled,
                                title: updateAccess.disabled ? getAccessMessage(updateAccess) : "",
                                className: pkg.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
                              },
                              {
                                label: 'Edit',
                                icon: <FaEdit size={14} />,
                                onClick: () => handleEditClick(pkg),
                                disabled: updateAccess.disabled,
                                title: updateAccess.disabled ? getAccessMessage(updateAccess) : "",
                                className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              },
                              {
                                label: 'Delete',
                                icon: <FaTrash size={14} />,
                                onClick: () => openModal(pkg, "delete"),
                                disabled: deleteAccess.disabled,
                                title: deleteAccess.disabled ? getAccessMessage(deleteAccess) : "",
                                className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                              }
                            ]}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Card View */}
        {!loading && packages.length > 0 && viewMode === "card" && (
          <ManagementGrid viewMode={viewMode}>
            {packages.map((pkg, index) => {
              const status = getStatusBadge(pkg.is_active);
              const StatusIcon = status.icon;
              return (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => readAccess.enabled && openModal(pkg, "view")}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl">
                      <FaBox className="text-white text-2xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-800 truncate">{pkg.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
                          <StatusIcon size={10} />{status.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">{pkg.code}</p>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <FaUserTie className="text-indigo-500" />{formatDisplay(pkg.designation)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{formatDisplay(pkg.employment_type)}</span>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{formatDisplay(pkg.salary_type)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaClock className="text-yellow-500" />
                            {pkg.shift_start} - {pkg.shift_end}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaCalendarAlt className="text-blue-500" />
                            {formatDate(pkg.created_at).split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openModal(pkg, "view")}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                      <FaEye size={14} />
                    </button>
                    <button onClick={() => openToggleModal(pkg, !pkg.is_active)} disabled={updateAccess.disabled}
                      title={updateAccess.disabled ? getAccessMessage(updateAccess) : ""}
                      className={`p-2.5 rounded-xl transition ${pkg.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} disabled:opacity-50`}>
                      {pkg.is_active ? <FaToggleOff size={14} /> : <FaToggleOn size={14} />}
                    </button>
                    <button onClick={() => handleEditClick(pkg)} disabled={updateAccess.disabled}
                      title={updateAccess.disabled ? getAccessMessage(updateAccess) : ""}
                      className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition disabled:opacity-50">
                      <FaEdit size={14} />
                    </button>
                    <button onClick={() => openModal(pkg, "delete")} disabled={deleteAccess.disabled}
                      title={deleteAccess.disabled ? getAccessMessage(deleteAccess) : ""}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition disabled:opacity-50">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </ManagementGrid>
        )}

        {/* Pagination */}
        {!loading && (packages.length > 0 || pagination.total > 0) && (
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={(newLimit) => { changeLimit(newLimit); fetchPackages(1, debouncedSearchTerm, true); }}
            showInfo={true}
          />
        )}

        {/* Modals */}
        <AnimatePresence>
          {modalType === "view" && selectedPackage && (
            <ViewPackageModal isOpen={true} onClose={closeModal} package={selectedPackage} />
          )}
          {modalType === "delete" && selectedPackage && (
            <DeletePackageModal 
              isOpen={true} onClose={closeModal} onConfirm={handleDelete} 
              package={selectedPackage} processing={processingId === selectedPackage.id} 
            />
          )}
          {modalType === "toggle" && selectedPackage && (
            <ToggleStatusModal 
              isOpen={true} onClose={closeModal} onConfirm={handleToggleStatus}
              package={selectedPackage} processing={processingId === selectedPackage.id}
              newStatus={toggleNewStatus}
            />
          )}
        </AnimatePresence>

        {/* Create/Edit Modals */}
        <PackageFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          packageData={null}
          isEditing={false}
          submitDisabled={createAccess.disabled}
          submitTitle={createAccess.disabled ? getAccessMessage(createAccess) : ""}
        />

        <PackageFormModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingPackage(null); }}
          onSuccess={handleEditSuccess}
          packageData={editingPackage}
          isEditing={true}
          submitDisabled={updateAccess.disabled}
          submitTitle={updateAccess.disabled ? getAccessMessage(updateAccess) : ""}
        />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
