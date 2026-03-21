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
  const [showCompanyModal, setShowCompanyModal] = useState(false);

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
    setShowCompanyModal(false);
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
          setShowCompanyModal(false);
        }
        else if (response.data.companies && Array.isArray(response.data.companies)) {
          const userCompanies = response.data.companies;
          setCompanies(userCompanies);

          const storedCompany = JSON.parse(localStorage.getItem("company"));

          if (userCompanies.length === 1) {
            const singleCompany = userCompanies[0];
            setCompany(singleCompany);
            localStorage.setItem("company", JSON.stringify(singleCompany));
            setMustSelectCompany(false);
            setShowCompanyModal(false);
          }
          else if (userCompanies.length > 1) {
            // Check if user has previously selected a company
            if (storedCompany) {
              const companyStillExists = userCompanies.some(
                c => c.id === storedCompany.id
              );
              if (companyStillExists) {
                setCompany(storedCompany);
                setMustSelectCompany(false);
                setShowCompanyModal(false);
              } else {
                // Previously selected company no longer exists
                localStorage.removeItem("company");
                setCompany(null);
                setMustSelectCompany(true);
                setShowCompanyModal(true);
              }
            } else {
              // No company selected yet, must select one
              setCompany(null);
              setMustSelectCompany(true);
              setShowCompanyModal(true);
            }
          }
        } else {
          setCompanies([]);
          setCompany(null);
          localStorage.removeItem("company");
          setMustSelectCompany(true);
          setShowCompanyModal(true);
        }

      } else {
        setUser(null);
        setEmployee(null);
        setCompany(null);
        setCompanies([]);
        setPermissions([]);
        setMustSelectCompany(false);
        setShowCompanyModal(false);
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

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    fetchUserProfile(token);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);
    // Clear company selection on new login
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
    setShowCompanyModal(false);
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
    showCompanyModal,
    setShowCompanyModal,
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