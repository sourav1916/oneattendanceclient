import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
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
  FaSave,
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";

const ATTENDANCE_LABELS = {
  manual: "Manual",
  gps: "GPS",
  face: "Face Recognition",
  qr: "QR Code",
  fingerprint: "Fingerprint",
  ip: "IP Address",
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

  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isLoadingConstants, setIsLoadingConstants] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const companyAttendanceMethodList = useMemo(() => {
    return (companyAttendanceMethods || [])
      .map((item) => String(item || "").toLowerCase())
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
  }, [isOpen]);

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
        `/company/users/search?email=${encodedEmail}`,
        `/company/users/find?email=${encodedEmail}`,
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

      if (staffData.permission_package?.id) {
        const found = permissionPackages.find((p) => p.value === staffData.permission_package.id);
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
    const initialUserId = getResolvedUserId(staffData?.user);
    const initialPermissionPackageId = staffData?.permission_package?.id ?? null;
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
        invite_id: staffData?.invite_id,
        user_id: selectedUser.id,
        permission_package_id: selectedPermissionPackage?.value || null,
        employment_type: employmentType.value,
        salary_type: staffType.value,
        designation: designation.value,
        attendance_methods: selectedAttendanceMethods,
        auto_approve: autoApprove,
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
    setIsSubmitting(false);
    onClose();
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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-200">
                  <FaUserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Staff Invitation</h2>
                  <p className="text-sm text-slate-500">Search by email, then update invite details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-700"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {selectedUser && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FaRegCheckCircle className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-emerald-900">Current User</h3>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-emerald-700 border border-emerald-200">
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
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                            ID: {selectedUser.id}
                          </span>
                          {selectedUser.created_at && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                              Created: {selectedUser.created_at}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                        Invite fields are shown below.
                      </div>
                    )}

                    {showInviteFields && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                    active
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
                    )}

                    {showInviteFields && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <FaCheck className="h-4 w-4 text-indigo-500" />
                          Invite Settings
                        </label>
                        <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            checked={autoApprove}
                            onChange={(e) => setAutoApprove(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700">Auto approve invite</span>
                        </label>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {isLoadingStaff && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Loading invite details...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditStaffModal;
