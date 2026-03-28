import { createContext, useContext, useState, useEffect, useRef } from "react";
import React from "react";

const AuthContext = createContext();

const API_BASE = "https://api-attendance.onesaas.in";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [mustSelectCompany, setMustSelectCompany] = useState(false);
  const [showCompanySelection, setShowCompanySelection] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [attendanceMethods, setAttendanceMethods] = useState([]);

  const initialized = useRef(false);

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");

    setUser(null);
    setEmployee(null);
    setCompany(null);
    setCompanies([]);
    setPermissions([]);
    setUserDetails(null);
    setAttendanceMethods([]);

    setMustSelectCompany(false);
    setShowCompanySelection(false);
    setLoading(false);
  };

  // ✅ FETCH PROFILE
  const fetchUserProfile = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/users/profile-role`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        logout();
        return;
      }

      const response = await res.json();

      if (response.success && response.data) {
        const data = response.data;

        setUserDetails(data);

        // ✅ USER
        const userData = {
          id: data.user?.id,
          name: data.user?.name || "User",
          email: data.user?.email,
          phone: data.user?.phone,
          is_active: data.user?.is_active === 1,
          is_system_admin: data.meta?.is_system_admin === 1,
          role: response.role || "employee",
        };

        setUser(userData);

        // ✅ ATTENDANCE METHODS handled below during company selection

        // ✅ EMPLOYEE FLAG
        if (data.meta?.is_employee) {
          setEmployee(data.user);
        } else {
          setEmployee(null);
        }

        // ✅ COMPANIES (MERGE)
        const ownedCompanies = data.companies?.owned_companies || [];
        const memberCompanies = data.companies?.companies || [];
        const allCompanies = [...ownedCompanies, ...memberCompanies];

        setCompanies(allCompanies);

        const storedCompany = localStorage.getItem("company");

        if (allCompanies.length === 1) {
          const single = allCompanies[0];
          setCompany(single);
          setPermissions(single.permissions || []);
          setAttendanceMethods(single.attendance_methods || []);
          localStorage.setItem("company", JSON.stringify(single));
          setMustSelectCompany(false);
          setShowCompanySelection(false);
        } 
        else if (allCompanies.length > 1) {
          if (storedCompany) {
            const parsed = JSON.parse(storedCompany);

            const found = allCompanies.find(c => c.id === parsed.id);

            if (found) {
              setCompany(found);
              setPermissions(found.permissions || []);
              setAttendanceMethods(found.attendance_methods || []);
              setMustSelectCompany(false);
              setShowCompanySelection(false);
            } else {
              localStorage.removeItem("company");
              setCompany(null);
              setMustSelectCompany(true);
              setShowCompanySelection(true);
            }
          } else {
            setCompany(null);
            setMustSelectCompany(true);
            setShowCompanySelection(true);
          }
        } 
        else {
          // No companies
          setCompanies([]);
          setCompany(null);
          setPermissions([]);
          localStorage.removeItem("company");
          setMustSelectCompany(false);
          setShowCompanySelection(false);
        }

      } else {
        logout();
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ INIT
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    fetchUserProfile(token);
  }, []);

  // ✅ LOGIN
  const login = async (token) => {
    localStorage.setItem("token", token);
    localStorage.removeItem("company");
    setLoading(true);
    await fetchUserProfile(token);
  };

  // ✅ REFRESH
  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetchUserProfile(token);
    }
  };

  // ✅ SELECT COMPANY
  const selectCompany = (selectedCompany) => {
    setCompany(selectedCompany);
    setPermissions(selectedCompany.permissions || []);
    setAttendanceMethods(selectedCompany.attendance_methods || []);
    localStorage.setItem("company", JSON.stringify(selectedCompany));
    setMustSelectCompany(false);
    setShowCompanySelection(false);
  };

  // ✅ GET CURRENT COMPANY
  const getCurrentCompany = () => {
    if (company) return company;
    const storedCompany = localStorage.getItem("company");
    return storedCompany ? JSON.parse(storedCompany) : null;
  };

  // ✅ PERMISSION HELPER 🔥
  const hasPermission = (code) => {
    return permissions.some(p => p.code === code && p.is_allowed === 1);
  };

  // ✅ FINAL VALUE
  const value = {
    user,
    employee,
    company: getCurrentCompany(),
    companies,
    permissions,
    setCompanies,

    login,
    logout,
    refreshUser,
    selectCompany,

    mustSelectCompany,
    showCompanySelection,
    setShowCompanySelection,

    loading,
    isAuthenticated: !!user && !mustSelectCompany,

    // ✅ FLAGS
    rawPermissions: permissions,
    hasPermission,

    isEmployee: userDetails?.meta?.is_employee || false,
    isCompanyOwner: userDetails?.meta?.is_owner || false,
    isSystemAdmin: userDetails?.meta?.is_system_admin === 1,

    hasMultipleCompanies: companies.length > 1,
    hasCompanies: companies.length > 0,

    isActive: user?.is_active || false,
    userRole: user?.role || null,

    employeeDetails: employee,
    companyDetails: getCurrentCompany(),
    userDetails,
    attendanceMethods,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
