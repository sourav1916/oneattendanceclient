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

  const initialized = useRef(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setUser(null);
    setEmployee(null);
    setCompany(null);
    setCompanies([]);
    setPermissions([]);
    setMustSelectCompany(false);
    setShowCompanySelection(false);
    setLoading(false);
  };

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
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name || "User",
          email: response.data.user.email,
          phone: response.data.user.phone,
          is_active: response.data.user.is_active === 1,
          is_system_admin: response.data.user.is_system_admin === 1,
          role: response.role || "employee"
        };

        setUser(userData);

        if (response.data.employee) {
          setEmployee(response.data.employee);
        }

        if (response.data.permissions && Array.isArray(response.data.permissions)) {
          setPermissions(response.data.permissions);
        }

        // Handle company data
        if (response.data.company) {
          const singleCompany = response.data.company;
          setCompanies([singleCompany]);
          setCompany(singleCompany);
          localStorage.setItem("company", JSON.stringify(singleCompany));
          setMustSelectCompany(false);
          setShowCompanySelection(false);
        }
        else if (response.data.companies && Array.isArray(response.data.companies)) {
          const userCompanies = response.data.companies;
          setCompanies(userCompanies);

          const storedCompany = localStorage.getItem("company");

          if (userCompanies.length === 1) {
            // Auto-select single company
            const singleCompany = userCompanies[0];
            setCompany(singleCompany);
            localStorage.setItem("company", JSON.stringify(singleCompany));
            setMustSelectCompany(false);
            setShowCompanySelection(false);
          }
          else if (userCompanies.length > 1) {
            // Multiple companies - check if already have a valid selection
            if (storedCompany) {
              const companyStillExists = userCompanies.some(
                c => c.id === JSON.parse(storedCompany).id
              );
              if (companyStillExists) {
                setCompany(JSON.parse(storedCompany));
                setMustSelectCompany(false);
                setShowCompanySelection(false);
              } else {
                // Previously selected company no longer exists
                localStorage.removeItem("company");
                setCompany(null);
                setMustSelectCompany(true);
                setShowCompanySelection(true);
              }
            } else {
              // No company selected yet
              setCompany(null);
              setMustSelectCompany(true);
              setShowCompanySelection(true);
            }
          }
        } else {
          setCompanies([]);
          setCompany(null);
          localStorage.removeItem("company");
          setMustSelectCompany(true);
          setShowCompanySelection(true);
        }

      } else {
        setUser(null);
        setEmployee(null);
        setCompany(null);
        setCompanies([]);
        setPermissions([]);
        setMustSelectCompany(false);
        setShowCompanySelection(false);
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

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

  const login = async (token) => {
    localStorage.setItem("token", token);
    // Clear any existing company selection on new login
    localStorage.removeItem("company");
    setLoading(true);
    await fetchUserProfile(token);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const selectCompany = (selectedCompany) => {
    setCompany(selectedCompany);
    localStorage.setItem("company", JSON.stringify(selectedCompany));
    setMustSelectCompany(false);
    setShowCompanySelection(false);
  };

  const getCurrentCompany = () => {
    if (company) return company;
    const storedCompany = localStorage.getItem("company");
    return storedCompany ? JSON.parse(storedCompany) : null;
  };

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
    rawPermissions: permissions,
    isEmployee: !!employee,
    isCompanyOwner: user?.role === "company_owner",
    hasMultipleCompanies: companies.length > 1,
    hasCompanies: companies.length > 0,
    isSystemAdmin: user?.is_system_admin || false,
    isActive: user?.is_active || false,
    userRole: user?.role || null,
    employeeDetails: employee,
    companyDetails: getCurrentCompany(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};