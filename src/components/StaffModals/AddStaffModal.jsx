import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "../SelectField";
import { toast } from "react-toastify";
import apiCall from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  FaUserPlus,
  FaUserTag,
  FaUserCog,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaUserCircle,
  FaBriefcase,
  FaClock,
  FaShieldAlt,
  FaUserTie,
  FaFingerprint,
  FaCalendarAlt,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaRegCheckCircle,
  FaListAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";
import TimeDurationPickerField from "../TimeDurationPicker";

const ATTENDANCE_LABELS = {
  manual: "Manual",
  gps: "GPS",
  face: "Face Recognition",
  qr: "QR Code",
  fingerprint: "Fingerprint",
  ip: "IP Address",
};

const DEFAULT_SHIFT_START = "09:00:00";
const DEFAULT_SHIFT_END = "18:00:00";
const DEFAULT_DURATION = "00:30";

const normalizeDuration = (value, fallback = DEFAULT_DURATION) => {
  if (typeof value === "number") {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (!value || typeof value !== "string") return fallback;
  const [hours = "00", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

function AddStaffModal({ isOpen, onClose, onSuccess, submitDisabled = false, submitTitle = "" }) {
  const { attendanceMethods: companyAttendanceMethods = [] } = useAuth();

  const [permissionPackages, setPermissionPackages] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [salaryTypes, setSalaryTypes] = useState([]);

  const [emailQuery, setEmailQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissionPackage, setSelectedPermissionPackage] = useState(null);
  const [staffType, setStaffType] = useState(null);
  const [employmentType, setEmploymentType] = useState(null);
  const [selectedAttendanceMethods, setSelectedAttendanceMethods] = useState([]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [shiftStart, setShiftStart] = useState(DEFAULT_SHIFT_START);
  const [shiftEnd, setShiftEnd] = useState(DEFAULT_SHIFT_END);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_DURATION);
  const [graceMinutes, setGraceMinutes] = useState(DEFAULT_DURATION);
  const [weekends, setWeekends] = useState([]); // Array of {day, type}

  const [invitePackages, setInvitePackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isWeekendsOpen, setIsWeekendsOpen] = useState(false);

  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoadingConstants, setIsLoadingConstants] = useState(false);

  const companyAttendanceMethodList = useMemo(() => {
    let methods = companyAttendanceMethods;
    if (!methods) return [];
    if (typeof methods === "string") {
      methods = methods.includes(",") ? methods.split(",").map((m) => m.trim()) : [methods];
    }

    if (!Array.isArray(methods)) return [];

    return methods
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return String(item.method || "").toLowerCase();
        }
        return String(item || "").toLowerCase();
      })
      .filter(Boolean);
  }, [companyAttendanceMethods]);

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
    };
    return iconMap[key] || FaUserCircle;
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "48px",
      borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
      "&:hover": { borderColor: "#6366f1" },
      borderRadius: "0.75rem",
      padding: "0 0.5rem",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
      color: state.isSelected ? "white" : "#1e293b",
      "&:active": { backgroundColor: "#6366f1" },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#e0e7ff",
      borderRadius: "0.5rem",
    }),
    multiValueLabel: (base) => ({ ...base, color: "#4f46e5" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#4f46e5",
      "&:hover": { backgroundColor: "#4f46e5", color: "white" },
    }),
  };

  useEffect(() => {
    if (!isOpen) return;

    setEmailQuery("");
    setSelectedUser(null);
    setDesignation(null);
    setSelectedPermissionPackage(null);
    setStaffType(null);
    setEmploymentType(null);
    setSelectedAttendanceMethods([]);
    setAutoApprove(false);
    setShiftStart(DEFAULT_SHIFT_START);
    setShiftEnd(DEFAULT_SHIFT_END);
    setBreakMinutes(DEFAULT_DURATION);
    setGraceMinutes(DEFAULT_DURATION);
    setWeekends([]);
    setSelectedPackage(null);
    fetchPermissionPackages();
    fetchAllConstants();
    fetchInvitePackages();
  }, [isOpen]);

  const fetchInvitePackages = async () => {
    setIsLoadingPackages(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const res = await apiCall("/company/invites/package-list", "GET", null, company?.id);
      const data = await res.json();
      if (data.success) {
        setInvitePackages(
          (data.data || [])
            .filter((pkg) => pkg.is_active)
            .map((pkg) => ({
              ...pkg,
              value: pkg.id,
              label: `${pkg.name} (${pkg.code})`,
            }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch invite packages", err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    if (!pkg) return;

    // Designation
    if (pkg.designation) {
      const found = designations.find((d) => d.value === pkg.designation);
      setDesignation(found || { value: pkg.designation, label: pkg.designation });
    }

    // Employment Type
    if (pkg.employment_type) {
      const found = employmentTypes.find((e) => e.value === pkg.employment_type);
      setEmploymentType(found || { value: pkg.employment_type, label: pkg.employment_type });
    }

    // Salary Type
    if (pkg.salary_type) {
      const found = salaryTypes.find((s) => s.value === pkg.salary_type);
      setStaffType(found || { value: pkg.salary_type, label: pkg.salary_type });
    }

    // Permission Package
    if (pkg.permission_package_id) {
      const found = permissionPackages.find((p) => p.value === pkg.permission_package_id);
      setSelectedPermissionPackage(found || null);
    }

    // Attendance Methods
    if (Array.isArray(pkg.attendance_methods)) {
      setSelectedAttendanceMethods(pkg.attendance_methods.map((m) => m.toLowerCase()));
    }

    // Auto Approve
    if (typeof pkg.auto_approve !== "undefined") {
      setAutoApprove(Boolean(pkg.auto_approve));
    }

    // Shift Times
    if (pkg.shift_start) setShiftStart(pkg.shift_start);
    if (pkg.shift_end) setShiftEnd(pkg.shift_end);
    if (typeof pkg.break_minutes !== "undefined") {
      setBreakMinutes(normalizeDuration(pkg.break_minutes));
    }
    if (typeof pkg.grace_minutes !== "undefined") {
      setGraceMinutes(normalizeDuration(pkg.grace_minutes));
    }

    // Weekends
    if (Array.isArray(pkg.weekends)) {
      setWeekends(pkg.weekends);
      if (pkg.weekends.length > 0) setIsWeekendsOpen(true);
    }

    toast.info(`Applied details from ${pkg.name}`);
  };

  const fetchAllConstants = async () => {
    setIsLoadingConstants(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const res = await apiCall("/constants/", "GET", null, company?.id);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to fetch configuration data");

      if (data.data.employment_types) {
        setEmploymentTypes(
          data.data.employment_types.map((item) => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key),
          }))
        );
      }

      if (data.data.designations) {
        setDesignations(
          data.data.designations.map((item) => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key),
          }))
        );
      }

      if (data.data.salary_types) {
        setSalaryTypes(
          data.data.salary_types.map((item) => ({
            value: item.value.value,
            key: item.key,
            label: item.value.label,
            description: item.value.description,
            icon: getIconForType(item.key),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch constants", err);
      toast.error(err.message || "Failed to fetch configuration data");
    } finally {
      setIsLoadingConstants(false);
    }
  };

  const fetchPermissionPackages = async () => {
    setIsLoadingPermissions(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const response = await apiCall("/permissions/permission-packages", "GET", null, company?.id);
      const result = await response.json();

      if (!response.ok) throw new Error(result?.message || "Failed to fetch permission packages");

      const packages = result.data?.packages || [];
      setPermissionPackages(
        packages.map((pkg) => ({
          value: pkg.id,
          label: pkg.package_name,
          description: pkg.description,
          groupCode: pkg.group_code,
          permissions: pkg.permissions?.filter((p) => p.is_active === 1) || [],
          isActive: pkg.is_active === 1,
        }))
      );
    } catch (err) {
      console.error("Permission packages error", err);
      toast.error(err.message || "Failed to fetch permission packages");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const resolveUserPayload = (result) => {
    const direct = result?.data;
    if (Array.isArray(direct)) return direct[0] || null;
    if (direct?.data) return direct.data;
    if (direct?.user) return direct.user;
    if (result?.user) return result.user;
    return direct || null;
  };

  const getResolvedUserId = (user) => user?.id ?? user?.user_id ?? user?.userId ?? user?.staff_id ?? user?.staffId ?? null;
  const getResolvedUserName = (user) =>
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "No Name";

  const handleSearchUser = async () => {
    const email = emailQuery.trim();
    if (!email) {
      toast.warning("Please enter a full email address");
      return;
    }

    setIsSearchingUser(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const encodedEmail = encodeURIComponent(email);
      const endpoints = [
        `/company/users/available?email=${encodedEmail}`,
      ];

      let lastError = null;
      let found = null;

      for (const endpoint of endpoints) {
        try {
          const res = await apiCall(endpoint, "GET", null, company?.id);
          const result = await res.json();
          if (!res.ok) {
            lastError = result?.message || "Failed to search user";
            continue;
          }

          if (result.success) {
            found = resolveUserPayload(result);
            if (found) break;
            lastError = result.message || "User not found";
          } else {
            lastError = result.message || "User not found";
          }
        } catch (err) {
          lastError = err.message || "Failed to search user";
        }
      }

      if (!found) {
        throw new Error(lastError || "User not found");
      }

      setSelectedUser({
        id: getResolvedUserId(found),
        full_name: getResolvedUserName(found),
        email: found.email,
        phone: found.phone || null,
        is_active: found.is_active,
        created_at: found.created_at || null,
      });

      toast.success("User retrieved successfully");
    } catch (err) {
      setSelectedUser(null);
      console.error("Error searching user:", err);
      toast.error(err.message || "Failed to find user");
    } finally {
      setIsSearchingUser(false);
    }
  };

  const formatDisplay = (value) =>
    value ? String(value).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";

  const handleSubmit = async () => {
    if (!selectedUser?.id) {
      toast.warning("Please search and select a user first");
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
    if (companyAttendanceMethodList.length === 0) {
      toast.warning("No attendance methods are configured for this company");
      return;
    }
    if (selectedAttendanceMethods.length === 0) {
      toast.warning("Please select at least one attendance method");
      return;
    }

    setIsSubmitting(true);
    try {
      const company = JSON.parse(localStorage.getItem("company"));
      const payload = {
        user_id: selectedUser.id,
        permission_package_id: selectedPermissionPackage?.value || null,
        employment_type: employmentType.value,
        salary_type: staffType.value,
        designation: designation.value,
        attendance_methods: selectedAttendanceMethods,
        auto_approve: autoApprove,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        break_minutes: normalizeDuration(breakMinutes),
        grace_minutes: normalizeDuration(graceMinutes),
        weekends: weekends,
      };

      const response = await apiCall("/company/invites/send", "POST", payload, company?.id);
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || "Failed to create staff");

      toast.success("Staff created successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error creating staff:", error);
      toast.error(error.message || "Failed to create staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmailQuery("");
    setSelectedUser(null);
    setDesignation(null);
    setStaffType(null);
    setEmploymentType(null);
    setSelectedPermissionPackage(null);
    setSelectedAttendanceMethods([]);
    setAutoApprove(false);
    setShiftStart(DEFAULT_SHIFT_START);
    setShiftEnd(DEFAULT_SHIFT_END);
    setBreakMinutes(DEFAULT_DURATION);
    setGraceMinutes(DEFAULT_DURATION);
    setWeekends([]);
    setSelectedPackage(null);
    setIsSubmitting(false);
    onClose();
  };

  const methodBadges = companyAttendanceMethodList.length
    ? companyAttendanceMethodList.map((method) => ({
      key: method,
      label: ATTENDANCE_LABELS[method] || formatDisplay(method),
    }))
    : [];

  const showInviteFields = Boolean(selectedUser);
  const canCreateInvite =
    Boolean(selectedUser) &&
    Boolean(designation) &&
    Boolean(staffType) &&
    Boolean(employmentType) &&
    selectedAttendanceMethods.length > 0 &&
    !isSubmitting &&
    !isLoadingConstants &&
    !isSearchingUser &&
    !submitDisabled;

  const toggleAttendanceMethod = (method) => {
    setSelectedAttendanceMethods((prev) =>
      prev.includes(method) ? prev.filter((item) => item !== method) : [...prev, method]
    );
  };

  const toggleWeekend = (day) => {
    setWeekends(prev => {
      const exists = prev.find(w => w.day === day);
      if (exists) {
        return prev.filter(w => w.day !== day);
      } else {
        return [...prev, { day, type: 'full' }];
      }
    });
  };

  const updateWeekendType = (day, type) => {
    setWeekends(prev => prev.map(w => w.day === day ? { ...w, type } : w));
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
          <ModalScrollLock />
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 18 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 m-auto"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 border border-indigo-100 shadow-sm">
                  <FaUserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Add New Staff Member</h2>
                  <p className="text-sm text-slate-500">Search user by email, then configure invite details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm hover:shadow-md bg-white border border-slate-100"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6 p-2 lg:p-0">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FaSearch className="h-4 w-4 text-indigo-500" />
                    Find User
                  </label>
                  <div className="flex items-center flex-col gap-3 lg:flex-row">
                    <input
                      type="email"
                      value={emailQuery}
                      onChange={(e) => setEmailQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchUser();
                        }
                      }}
                      placeholder="Enter full email address"
                      className="h-12 p-2.5 w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                      type="button"
                      onClick={handleSearchUser}
                      disabled={isSearchingUser}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                    >
                      {isSearchingUser ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSearch className="h-4 w-4" />}
                      Find User
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Search by email first. Once verified, the invitation fields will appear below.
                  </p>
                </div>

                {selectedUser && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FaRegCheckCircle className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-emerald-900">Verified User</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-lg font-bold text-emerald-700 border border-emerald-200">
                        {selectedUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <FaEnvelope className="h-3.5 w-3.5 text-slate-400" />
                          {selectedUser.email}
                        </p>
                        {selectedUser.phone && (
                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <FaPhone className="h-3.5 w-3.5 text-slate-400" />
                            {selectedUser.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser && (
                  <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FaListAlt className="h-4 w-4 text-indigo-500" />
                      Quick Fill via Package (Optional)
                    </label>
                    <Select
                      options={invitePackages}
                      value={selectedPackage}
                      onChange={handlePackageSelect}
                      placeholder={isLoadingPackages ? "Loading packages..." : "Optional: Select a package to auto-fill"}
                      isClearable
                      isLoading={isLoadingPackages}
                      styles={customSelectStyles}
                    />
                    <p className="text-[10px] text-slate-400 italic">Choosing a package will automatically populate all fields below.</p>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {showInviteFields ? (
                    <motion.div
                      key="invite-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 p-2 lg:p-0"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaBriefcase className="h-4 w-4 text-indigo-500" />
                            Designation
                          </label>
                          <Select
                            options={designations}
                            value={designation}
                            onChange={setDesignation}
                            placeholder="Select designation"
                            isClearable
                            styles={customSelectStyles}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaShieldAlt className="h-4 w-4 text-indigo-500" />
                            Permission Package
                          </label>
                          {isLoadingPermissions ? (
                            <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
                              <FaSpinner className="h-5 w-5 animate-spin text-indigo-500" />
                            </div>
                          ) : (
                            <Select
                              options={permissionPackages}
                              value={selectedPermissionPackage}
                              onChange={setSelectedPermissionPackage}
                              placeholder="Select permission package"
                              isClearable
                              styles={customSelectStyles}
                            />
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaUserTie className="h-4 w-4 text-indigo-500" />
                            Employment Type
                          </label>
                          <Select
                            options={employmentTypes}
                            value={employmentType}
                            onChange={setEmploymentType}
                            placeholder="Select employment type"
                            isClearable
                            styles={customSelectStyles}
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaClock className="h-4 w-4 text-indigo-500" />
                            Salary Type
                          </label>
                          <Select
                            options={salaryTypes}
                            value={staffType}
                            onChange={setStaffType}
                            placeholder="Select salary type"
                            isClearable
                            styles={customSelectStyles}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaFingerprint className="h-4 w-4 text-indigo-500" />
                            Attendance Methods
                          </label>
                          <span className="text-xs text-slate-500">Choose from company methods</span>
                        </div>
                        {methodBadges.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {methodBadges.map((method) => {
                              const active = selectedAttendanceMethods.includes(method.key);
                              return (
                                <button
                                  key={method.key}
                                  type="button"
                                  onClick={() => toggleAttendanceMethod(method.key)}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active
                                    ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                                    }`}
                                >
                                  {active && <FaCheck className="h-3 w-3" />}
                                  {method.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            No attendance methods available for this company.
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FaCheck className="h-4 w-4 text-indigo-500" />
                          Attendance Settings
                        </label>
                        <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            checked={autoApprove}
                            onChange={(e) => setAutoApprove(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">Auto approve Attendance</span>
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaClock className="h-4 w-4 text-indigo-500" />
                            Shift Timings
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <TimeDurationPickerField
                              label="Start Time"
                              value={shiftStart}
                              onChange={setShiftStart}
                              mode="time"
                            />
                            <TimeDurationPickerField
                              label="End Time"
                              value={shiftEnd}
                              onChange={setShiftEnd}
                              mode="time"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FaClock className="h-4 w-4 text-indigo-500" />
                            Duration Settings
                          </label>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <TimeDurationPickerField
                              label="Break Minutes"
                              value={breakMinutes}
                              onChange={setBreakMinutes}
                              mode="duration"
                            />
                            <TimeDurationPickerField
                              label="Grace Minutes"
                              value={graceMinutes}
                              onChange={setGraceMinutes}
                              mode="duration"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <button
                            type="button"
                            onClick={() => setIsWeekendsOpen(!isWeekendsOpen)}
                            className="flex w-full items-center justify-between"
                          >
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                              <FaCalendarAlt className="h-4 w-4 text-indigo-500" />
                              Weekends
                              {weekends.length > 0 && (
                                <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                                  {weekends.length} Selected
                                </span>
                              )}
                            </label>
                            {isWeekendsOpen ? (
                              <FaChevronUp className="h-3 w-3 text-slate-400" />
                            ) : (
                              <FaChevronDown className="h-3 w-3 text-slate-400" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isWeekendsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-col gap-2 pt-1">
                                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                    const config = weekends.find(w => w.day === day);
                                    return (
                                      <div key={day} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleWeekend(day)}
                                          className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${config
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                          <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${config ? 'bg-white border-white' : 'bg-slate-100 border-slate-200'}`}>
                                            {config && <FaCheck className="w-2.5 h-2.5 text-indigo-600" />}
                                          </div>
                                          {day.charAt(0).toUpperCase() + day.slice(1)}
                                        </button>
                                        {config && (
                                          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                                            {['full', 'half'].map(type => (
                                              <button
                                                key={type}
                                                type="button"
                                                onClick={() => updateWeekendType(day, type)}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${config.type === type
                                                  ? 'bg-slate-900 text-white'
                                                  : 'text-slate-400 hover:text-slate-600'
                                                  }`}
                                              >
                                                {type}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search-empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500"
                    >
                      Search a user to unlock the invite fields.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!canCreateInvite}
                title={
                  submitDisabled
                    ? submitTitle
                    : !selectedUser
                      ? "Search and verify a user first"
                      : !designation || !staffType || !employmentType || selectedAttendanceMethods.length === 0
                        ? "Complete all required fields"
                        : ""
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaCheck className="h-4 w-4" />}
                Send Invite
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AddStaffModal;
