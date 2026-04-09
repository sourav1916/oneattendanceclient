import { useAuth } from "../context/AuthContext";

const ACCESS_REASONS = {
  ALLOWED: "allowed",
  NO_PERMISSION: "no_permission",
  NO_COMPANY: "no_company",
  OWNER_RESTRICTED: "owner_restricted",
  MISSING_CONFIG: "missing_config",
};

const PERMISSION_ACCESS_CONFIG = {
  pages: {
    home: { permissions: null },
    attendance: {
      permissions: ["att_punch", "att_view_own"],
      disableForCompanyOwner: true,
    },
    attendanceHistory: {
      permissions: ["att_punch", "att_view_own"],
      disableForCompanyOwner: true,
    },
    myShifts: {
      permissions: ["att_punch", "att_view_own"],
      disableForCompanyOwner: true,
    },
    myLeaves: {
      permissions: ["leave_apply", "leave_view_own", "leave_cancel_own"],
      disableForCompanyOwner: true,
    },
    mySalary: {
      permissions: ["salary_view_own", "salary_advance_view"],
      disableForCompanyOwner: true,
    },
    myInvites: { permissions: null },
    holidays: {
      permissions: null,
      requireCompany: true,
    },
    companyInvites: {
      permissions: ["emp_invite", "emp_invite_cancel_admin"],
    },
    employeeManagement: {
      permissions: ["emp_create", "emp_view", "emp_update", "emp_delete", "report_emp", "export_emp"],
    },
    permissionManagement: {
      permissions: ["pkg_create", "pkg_view", "pkg_update", "pkg_delete", "pkg_assign"],
    },
    attendanceManagement: {
      permissions: [
        "att_view_all",
        "att_review",
        "att_edit",
        "att_delete",
        "att_method_assign",
        "att_method_update",
        "att_method_remove",
        "report_att",
        "export_att",
      ],
    },
    salaryManagement: {
      permissions: ["salary_view_all", "salary_assign", "salary_update", "salary_delete"],
      allowCompanyOwner: true,
    },
    salaryComponentsManagement: {
      permissions: ["salary_view_all", "salary_assign", "salary_update", "salary_delete"],
      allowCompanyOwner: true,
    },
    salaryPackageManagement: {
      permissions: ["salary_view_all", "salary_assign", "salary_update", "salary_delete"],
      allowCompanyOwner: true,
    },
    employeesShifts: {
      permissions: ["shift_view", "shift_create", "shift_update", "shift_delete"],
    },
    leaveManagement: {
      permissions: [
        "leave_view_all",
        "leave_review",
        "leave_cancel_admin",
        "leave_type_create",
        "leave_type_update",
        "leave_type_delete",
      ],
    },
    leaveConfig: {
      permissions: ["leave_type_create", "leave_type_update", "leave_type_delete"],
    },
    leaveBalance: {
      permissions: ["leave_view_all", "leave_review"],
    },
    pendingAttendance: {
      permissions: ["att_view_all", "att_review"],
    },
    companySettings: {
      permissions: ["cmp_update_own", "cmp_delete", "shift_create", "shift_view", "shift_update", "shift_delete"],
    },
    holidayManagement: {
      permissions: ["hd_create", "hd_view_company", "hd_update", "hd_delete"],
    },
    help: { permissions: null },
    createCompany: { permissions: null },
  },
  actions: {
    attendance: {
      punch: {
        permissions: "att_punch",
        disableForCompanyOwner: true,
      },
      viewOwn: {
        permissions: "att_view_own",
        disableForCompanyOwner: true,
      },
    },
    myLeaves: {
      apply: {
        permissions: "leave_apply",
        disableForCompanyOwner: true,
      },
      viewOwn: {
        permissions: "leave_view_own",
        disableForCompanyOwner: true,
      },
      cancelOwn: {
        permissions: "leave_cancel_own",
        disableForCompanyOwner: true,
      },
    },
    mySalary: {
      viewOwn: {
        permissions: "salary_view_own",
        disableForCompanyOwner: true,
      },
      advanceView: {
        permissions: "salary_advance_view",
        disableForCompanyOwner: true,
      },
    },
    companyInvites: {
      create: { permissions: "emp_invite" },
      update: { permissions: "emp_invite" },
      cancel: { permissions: "emp_invite_cancel_admin" },
      read: { permissions: ["emp_invite", "emp_invite_cancel_admin"] },
    },
    employeeManagement: {
      create: { permissions: "emp_create" },
      read: { permissions: "emp_view" },
      update: { permissions: "emp_update" },
      delete: { permissions: "emp_delete" },
      report: { permissions: "report_emp" },
      export: { permissions: "export_emp" },
    },
    permissionManagement: {
      create: { permissions: "pkg_create" },
      read: { permissions: "pkg_view" },
      update: { permissions: "pkg_update" },
      delete: { permissions: "pkg_delete" },
      assign: { permissions: "pkg_assign" },
    },
    attendanceManagement: {
      read: { permissions: "att_view_all" },
      review: { permissions: "att_review" },
      approve: { permissions: "att_review" },
      reject: { permissions: "att_review" },
      edit: { permissions: "att_edit" },
      delete: { permissions: "att_delete" },
      assignMethod: { permissions: "att_method_assign" },
      updateMethod: { permissions: "att_method_update" },
      removeMethod: { permissions: "att_method_remove" },
      report: { permissions: "report_att" },
      export: { permissions: "export_att" },
    },
    salaryManagement: {
      create: {
        permissions: "salary_assign",
        allowCompanyOwner: true,
      },
      read: {
        permissions: "salary_view_all",
        allowCompanyOwner: true,
      },
      assign: {
        permissions: "salary_assign",
        allowCompanyOwner: true,
      },
      update: {
        permissions: "salary_update",
        allowCompanyOwner: true,
      },
      revise: {
        permissions: "salary_update",
        allowCompanyOwner: true,
      },
      delete: {
        permissions: "salary_delete",
        allowCompanyOwner: true,
      },
    },
    salaryComponentsManagement: {
      create: {
        permissions: "salary_assign",
        allowCompanyOwner: true,
      },
      read: {
        permissions: "salary_view_all",
        allowCompanyOwner: true,
      },
      update: {
        permissions: "salary_update",
        allowCompanyOwner: true,
      },
      delete: {
        permissions: "salary_delete",
        allowCompanyOwner: true,
      },
    },
    salaryPackageManagement: {
      create: {
        permissions: "salary_assign",
        allowCompanyOwner: true,
      },
      read: {
        permissions: "salary_view_all",
        allowCompanyOwner: true,
      },
      update: {
        permissions: "salary_update",
        allowCompanyOwner: true,
      },
      delete: {
        permissions: "salary_delete",
        allowCompanyOwner: true,
      },
    },
    employeesShifts: {
      create: { permissions: "shift_create" },
      read: { permissions: "shift_view" },
      update: { permissions: "shift_update" },
      delete: { permissions: "shift_delete" },
    },
    leaveManagement: {
      read: { permissions: "leave_view_all" },
      review: { permissions: "leave_review" },
      approve: { permissions: "leave_review" },
      reject: { permissions: "leave_review" },
      update: { permissions: "leave_review" },
      cancel: { permissions: "leave_cancel_admin" },
    },
    leaveConfig: {
      create: { permissions: "leave_type_create" },
      read: { permissions: ["leave_type_create", "leave_type_update", "leave_type_delete"] },
      update: { permissions: "leave_type_update" },
      delete: { permissions: "leave_type_delete" },
    },
    leaveBalance: {
      create: { permissions: ["leave_view_all", "leave_review"] },
      update: { permissions: ["leave_view_all", "leave_review"] },
      delete: { permissions: ["leave_view_all", "leave_review"] },
      read: { permissions: ["leave_view_all", "leave_review"] },
    },
    companySettings: {
      read: { permissions: ["cmp_update_own", "cmp_delete", "shift_create", "shift_view", "shift_update", "shift_delete"] },
      updateCompany: { permissions: "cmp_update_own" },
      updateSettings: { permissions: "cmp_update_own" },
      updateBranding: { permissions: "cmp_update_own" },
      updateSecurity: { permissions: "cmp_update_own" },
      updateNotifications: { permissions: "cmp_update_own" },
      update: { permissions: "cmp_update_own" },
      delete: { permissions: "cmp_delete" },
      shiftCreate: { permissions: "shift_create" },
      shiftRead: { permissions: "shift_view" },
      shiftUpdate: { permissions: "shift_update" },
      shiftDelete: { permissions: "shift_delete" },
    },
    holidayManagement: {
      create: { permissions: "hd_create" },
      read: { permissions: "hd_view_company" },
      update: { permissions: "hd_update" },
      delete: { permissions: "hd_delete" },
    },
    pendingAttendance: {
      read: { permissions: "att_view_all" },
      review: { permissions: "att_review" },
      approve: { permissions: "att_review" },
      reject: { permissions: "att_review" },
    },
    workspace: {
      addStaff: { permissions: ["emp_create", "emp_invite"] },
    },
  },
};

const normalizeAccessConfig = (configEntry) => {
  if (configEntry === null) {
    return { permissions: null };
  }

  if (typeof configEntry === "string" || Array.isArray(configEntry)) {
    return { permissions: configEntry };
  }

  return configEntry || null;
};

const normalizePermissions = (permissions) => {
  if (!permissions) {
    return [];
  }

  return (Array.isArray(permissions) ? permissions : [permissions]).filter(Boolean);
};

const buildAccessResult = (allowed, reason, permissions = []) => ({
  allowed,
  enabled: allowed,
  disabled: !allowed,
  reason,
  permissions,
});

const getAccessMessage = (access) => {
  if (access.reason === ACCESS_REASONS.OWNER_RESTRICTED) {
    return "Disabled for company owner";
  }

  if (access.reason === ACCESS_REASONS.NO_COMPANY) {
    return "Select a company first";
  }

  if (access.reason === ACCESS_REASONS.MISSING_CONFIG) {
    return "Permission config missing";
  }

  return "You don't have permission for this action";
};

export const usePermissionAccess = () => {
  const { permissions = [], userDetails, activeRole, company } = useAuth();

  const isSystemAdmin = userDetails?.meta?.is_system_admin === 1;
  const isCompanyOwnerForCurrentCompany =
    activeRole === "company_owner" || company?.role === "company_owner";

  const hasPermissionCode = (permissionCode) => {
    if (!permissionCode) {
      return true;
    }

    if (isSystemAdmin) {
      return true;
    }

    return permissions.some(
      (permission) => permission.code === permissionCode && permission.is_allowed === 1
    );
  };

  const matchPermissions = (requiredPermissions, match = "any") => {
    const normalizedPermissions = normalizePermissions(requiredPermissions);

    if (normalizedPermissions.length === 0 || isSystemAdmin) {
      return true;
    }

    if (match === "all") {
      return normalizedPermissions.every(hasPermissionCode);
    }

    return normalizedPermissions.some(hasPermissionCode);
  };

  const resolveAccess = ({
    requiredPermissions,
    match = "any",
    allowCompanyOwner = false,
    disableForCompanyOwner = false,
    requireCompany = false,
  }) => {
    const normalizedPermissions = normalizePermissions(requiredPermissions);

    if (isSystemAdmin) {
      return buildAccessResult(true, ACCESS_REASONS.ALLOWED, normalizedPermissions);
    }

    if (disableForCompanyOwner && isCompanyOwnerForCurrentCompany) {
      return buildAccessResult(false, ACCESS_REASONS.OWNER_RESTRICTED, normalizedPermissions);
    }

    if (allowCompanyOwner && isCompanyOwnerForCurrentCompany) {
      return buildAccessResult(true, ACCESS_REASONS.ALLOWED, normalizedPermissions);
    }

    if (requireCompany && !company?.id && !isCompanyOwnerForCurrentCompany) {
      return buildAccessResult(false, ACCESS_REASONS.NO_COMPANY, normalizedPermissions);
    }

    const hasRequiredPermission = matchPermissions(normalizedPermissions, match);

    return buildAccessResult(
      hasRequiredPermission,
      hasRequiredPermission ? ACCESS_REASONS.ALLOWED : ACCESS_REASONS.NO_PERMISSION,
      normalizedPermissions
    );
  };

  const checkPageAccess = (pageKey, overrideOptions = {}) => {
    const pageConfig = normalizeAccessConfig(PERMISSION_ACCESS_CONFIG.pages[pageKey]);

    if (!pageConfig && overrideOptions.requiredPermissions === undefined) {
      return buildAccessResult(false, ACCESS_REASONS.MISSING_CONFIG);
    }

    return resolveAccess({
      ...pageConfig,
      ...overrideOptions,
      requiredPermissions: overrideOptions.requiredPermissions ?? pageConfig?.permissions,
    });
  };

  const checkActionAccess = (pageKey, actionKey, overrideOptions = {}) => {
    const actionConfig = normalizeAccessConfig(
      PERMISSION_ACCESS_CONFIG.actions[pageKey]?.[actionKey]
    );

    if (!actionConfig && overrideOptions.requiredPermissions === undefined) {
      return buildAccessResult(false, ACCESS_REASONS.MISSING_CONFIG);
    }

    return resolveAccess({
      ...actionConfig,
      ...overrideOptions,
      requiredPermissions: overrideOptions.requiredPermissions ?? actionConfig?.permissions,
    });
  };

  return {
    accessReasons: ACCESS_REASONS,
    permissionAccessConfig: PERMISSION_ACCESS_CONFIG,
    isSystemAdmin,
    isCompanyOwnerForCurrentCompany,
    hasPermissionCode,
    hasAnyPermission: (requiredPermissions) => matchPermissions(requiredPermissions, "any"),
    hasAllPermissions: (requiredPermissions) => matchPermissions(requiredPermissions, "all"),
    checkPageAccess,
    checkActionAccess,
    getAccessMessage,
  };
};

export default usePermissionAccess;
