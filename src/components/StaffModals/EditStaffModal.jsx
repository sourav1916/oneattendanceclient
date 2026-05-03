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
  FaSave,
} from "react-icons/fa";
import TimeDurationPickerField from "../TimeDurationPicker";
import ModalScrollLock from "../ModalScrollLock";
import Modal from "../Modal";

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

function EditStaffModal({ isOpen, onClose, onSuccess, staffData, submitDisabled = false, submitTitle = "" }) {
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
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

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
          return String(item.method || item.value || "").toLowerCase();
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
    multiValue: (base) => ({ ...base, backgroundColor: "#e0e7ff", borderRadius: "0.5rem" }),
    multiValueLabel: (base) => ({ ...base, color: "#4f46e5" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#4f46e5",
      "&:hover": { backgroundColor: "#4f46e5", color: "white" },
    }),
  };

  useEffect(() => {
    if (!isOpen) return;

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

  useEffect(() => {
    if (!isOpen) return;
    if (!isLoadingConstants && employmentTypes.length > 0) {
      loadStaffData();
    }
  }, [isOpen, isLoadingConstants, staffData, employmentTypes, designations, salaryTypes, permissionPackages]);

  useEffect(() => {
    if (!isOpen) return;
    if (staffData?.user?.email) {
      setEmailQuery(staffData.user.email);
    }
  }, [isOpen, staffData]);

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

  const loadStaffData = () => {
    if (!staffData) return;

    setIsLoadingStaff(true);
    try {
      if (staffData.user) {
        setSelectedUser({
          id: getResolvedUserId(staffData.user),
          full_name: getResolvedUserName(staffData.user),
          email: staffData.user.email,
          phone: staffData.user.phone || null,
          is_active: staffData.user.is_active,
          created_at: staffData.user.created_at || null,
        });
      } else if (staffData.user_id) {
        setSelectedUser({
          id: staffData.user_id,
          full_name: staffData.user_name || staffData.name || `User #${staffData.user_id}`,
          email: staffData.email || "",
          phone: staffData.phone || null,
          is_active: staffData.is_active,
          created_at: staffData.created_at || null,
        });
      }

      if (staffData.designation) {
        const found = designations.find((d) => d.value === staffData.designation);
        setDesignation(
          found || {
            value: staffData.designation,
            label: formatDisplay(staffData.designation),
          }
        );
      }

      if (staffData.employment_type) {
        const found = employmentTypes.find((e) => e.value === staffData.employment_type);
        setEmploymentType(
          found || {
            value: staffData.employment_type,
            label: formatDisplay(staffData.employment_type),
          }
        );
      }

      if (staffData.salary_type) {
        const found = salaryTypes.find((s) => s.value === staffData.salary_type);
        setStaffType(
          found || {
            value: staffData.salary_type,
            label: formatDisplay(staffData.salary_type),
          }
        );
      }

      const permissionPackageId = staffData.permission_package?.id ?? staffData.permission_package_id ?? null;
      if (permissionPackageId) {
        const found = permissionPackages.find((p) => p.value === permissionPackageId);
        setSelectedPermissionPackage(found || null);
      }

      if (Array.isArray(staffData.attendance_methods)) {
        const normalized = staffData.attendance_methods
          .map((item) => {
            if (typeof item === "string") return item.toLowerCase();
            if (typeof item === "object" && item) return String(item.method || item.value || "").toLowerCase();
            return "";
          })
          .filter(Boolean);
        setSelectedAttendanceMethods(normalized);
      }

      if (typeof staffData.auto_approve !== "undefined") {
        setAutoApprove(Boolean(staffData.auto_approve));
      } else {
        setAutoApprove(false);
      }

      setShiftStart(staffData.shift_start || DEFAULT_SHIFT_START);
      setShiftEnd(staffData.shift_end || DEFAULT_SHIFT_END);
      setBreakMinutes(normalizeDuration(staffData.break_minutes));
      setGraceMinutes(normalizeDuration(staffData.grace_minutes));
      setWeekends(Array.isArray(staffData.weekends) ? staffData.weekends : []);
      if (Array.isArray(staffData.weekends) && staffData.weekends.length > 0) {
        setIsWeekendsOpen(true);
      }
    } catch (err) {
      console.error("Error loading staff data:", err);
      toast.error("Failed to load staff data");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const methodBadges = companyAttendanceMethodList.length
    ? companyAttendanceMethodList.map((method) => ({
      key: method,
      label: ATTENDANCE_LABELS[method] || formatDisplay(method),
    }))
    : [];

  const showInviteFields = Boolean(selectedUser || staffData);

  const initialInviteState = useMemo(() => {
    const initialUserId = getResolvedUserId(staffData?.user) ?? staffData?.user_id ?? null;
    const initialPermissionPackageId = staffData?.permission_package?.id ?? staffData?.permission_package_id ?? null;
    const initialAttendanceMethods = Array.isArray(staffData?.attendance_methods)
      ? staffData.attendance_methods
        .map((item) => {
          if (typeof item === "string") return item.toLowerCase();
          if (typeof item === "object" && item) return String(item.method || item.value || "").toLowerCase();
          return "";
        })
        .filter(Boolean)
        .sort()
      : [];

    return {
      userId: initialUserId,
      designation: staffData?.designation ?? null,
      employmentType: staffData?.employment_type ?? null,
      salaryType: staffData?.salary_type ?? null,
      permissionPackageId: initialPermissionPackageId,
      attendanceMethods: initialAttendanceMethods,
      autoApprove: Boolean(staffData?.auto_approve),
      shiftStart: staffData?.shift_start ?? DEFAULT_SHIFT_START,
      shiftEnd: staffData?.shift_end ?? DEFAULT_SHIFT_END,
      breakMinutes: normalizeDuration(staffData?.break_minutes),
      graceMinutes: normalizeDuration(staffData?.grace_minutes),
      weekends: Array.isArray(staffData?.weekends) ? [...staffData.weekends].sort((a, b) => a.day.localeCompare(b.day)) : [],
    };
  }, [staffData]);

  const currentAttendanceMethods = useMemo(() => [...selectedAttendanceMethods].sort(), [selectedAttendanceMethods]);

  const isUpdateDirty = useMemo(() => {
    if (!selectedUser) return false;

    const currentPermissionPackageId = selectedPermissionPackage?.value ?? null;
    return (
      selectedUser.id !== initialInviteState.userId ||
      (designation?.value ?? null) !== initialInviteState.designation ||
      (employmentType?.value ?? null) !== initialInviteState.employmentType ||
      (staffType?.value ?? null) !== initialInviteState.salaryType ||
      currentPermissionPackageId !== initialInviteState.permissionPackageId ||
      autoApprove !== initialInviteState.autoApprove ||
      shiftStart !== initialInviteState.shiftStart ||
      shiftEnd !== initialInviteState.shiftEnd ||
      breakMinutes !== initialInviteState.breakMinutes ||
      graceMinutes !== initialInviteState.graceMinutes ||
      JSON.stringify([...weekends].sort((a, b) => a.day.localeCompare(b.day))) !== JSON.stringify(initialInviteState.weekends) ||
      JSON.stringify(currentAttendanceMethods) !== JSON.stringify(initialInviteState.attendanceMethods)
    );
  }, [
    selectedUser,
    selectedPermissionPackage,
    designation,
    employmentType,
    staffType,
    autoApprove,
    currentAttendanceMethods,
    shiftStart,
    shiftEnd,
    breakMinutes,
    graceMinutes,
    weekends,
    initialInviteState,
  ]);

  const canUpdateInvite =
    Boolean(selectedUser) &&
    Boolean(designation) &&
    Boolean(staffType) &&
    Boolean(employmentType) &&
    selectedAttendanceMethods.length > 0 &&
    isUpdateDirty &&
    !isSubmitting &&
    !isLoadingConstants &&
    !isLoadingStaff &&
    !submitDisabled;

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
        invite_id: staffData?.id || staffData?.invite_id,
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

      const response = await apiCall("/company/invites/update", "PUT", payload, company?.id);
      const result = await response.json();

      if (!response.ok) throw new Error(result?.message || "Failed to update staff");

      toast.success("Invitation updated successfully");
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

  const formatDisplay = (value) =>
    value ? String(value).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Staff Invitation"
      subtitle="Update configuration for this staff member"
      icon={<FaUserCog className="h-6 w-6" />}
      size="4xl"
      footer={
        <>
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
            disabled={!canUpdateInvite}
            title={
              submitDisabled
                ? submitTitle
                : !selectedUser
                  ? "Search and verify a user first"
                  : !designation || !staffType || !employmentType || selectedAttendanceMethods.length === 0
                    ? "Complete all required fields"
                    : !isUpdateDirty
                      ? "Make a change before updating"
                      : ""
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSave className="h-4 w-4" />}
            Update Invite
          </motion.button>
        </>
      }
    >
      <div className="space-y-6 p-2 lg:p-0">
        {selectedUser && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaRegCheckCircle className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-900">Current User</h3>
              </div>
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
          <motion.div
            key="invite-fields"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {showInviteFields ? (
              <>
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
                    <Select
                      options={permissionPackages}
                      value={selectedPermissionPackage}
                      onChange={setSelectedPermissionPackage}
                      placeholder={isLoadingPermissions ? "Loading..." : "Select permission package"}
                      isClearable
                      isLoading={isLoadingPermissions}
                      styles={customSelectStyles}
                    />
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
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500 text-center">
                Invite details are not available.
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {isLoadingStaff && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 flex items-center justify-center gap-3">
            <FaSpinner className="h-4 w-4 animate-spin text-indigo-500" />
            Loading invite details...
          </div>
        )}
      </div>
    </Modal>
  );
}

export default EditStaffModal;
