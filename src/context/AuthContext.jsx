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

  const initialized = useRef(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setUser(null);
    setEmployee(null);
    setCompany(null);
    setCompanies([]);
    setPermissions([]);
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
        
        if (response.data.company) {
          const singleCompany = response.data.company;
          setCompanies([singleCompany]);
          setCompany(singleCompany);
          localStorage.setItem("company", JSON.stringify(singleCompany));
        }
        else if (response.data.companies && Array.isArray(response.data.companies)) {
          const userCompanies = response.data.companies;
          setCompanies(userCompanies);
          
          const storedCompany = JSON.parse(localStorage.getItem("company"));
          
          if (userCompanies.length === 1) {
            const singleCompany = userCompanies[0];
            setCompany(singleCompany);
            localStorage.setItem("company", JSON.stringify(singleCompany));
          }
          else if (userCompanies.length > 1 && storedCompany) {
            const companyStillExists = userCompanies.some(
              c => c.id === storedCompany.id
            );
            if (companyStillExists) {
              setCompany(storedCompany);
            } else {
              localStorage.removeItem("company");
              setCompany(null);
            }
          }
          else if (userCompanies.length > 1 && !storedCompany) {
            setCompany(null);
          }
        }
        else {
          setCompanies([]);
          setCompany(null);
          localStorage.removeItem("company");
        }

      } else {
        setUser(null);
        setEmployee(null);
        setCompany(null);
        setCompanies([]);
        setPermissions([]);
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
    loading,
    isAuthenticated: !!user,
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