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

  const initialized = useRef(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setUser(null);
    setEmployee(null);
    setCompany(null);
    setCompanies([]);
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
        // Extract user data
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
        
        // Handle employee data if present
        if (response.data.employee) {
          setEmployee(response.data.employee);
        }
        
        // Handle companies data - this works for both employee and owner responses
        let userCompanies = [];
        
        // Case 1: Response has companies array (owner, admin)
        if (response.data.companies && Array.isArray(response.data.companies)) {
          userCompanies = response.data.companies;
          setCompanies(userCompanies);
          
          // Handle company selection for multiple companies
          const storedCompany = JSON.parse(localStorage.getItem("company"));
          
          // If there's exactly one company, auto-select it
          if (userCompanies.length === 1) {
            const singleCompany = userCompanies[0];
            setCompany(singleCompany);
            localStorage.setItem("company", JSON.stringify(singleCompany));
          }
          // If multiple companies, check if stored company still exists
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
          // If no stored company and multiple companies exist, don't set any
          else if (userCompanies.length > 1 && !storedCompany) {
            setCompany(null);
          }
        }
        // Case 2: Response has single company object (employee)
        else if (response.data.company) {
          const singleCompany = response.data.company;
          userCompanies = [singleCompany];
          setCompanies(userCompanies);
          setCompany(singleCompany);
          localStorage.setItem("company", JSON.stringify(singleCompany));
        }
        // Case 3: No companies at all
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

  // Select a specific company (for multi-company users)
  const selectCompany = (selectedCompany) => {
    setCompany(selectedCompany);
    localStorage.setItem("company", JSON.stringify(selectedCompany));
  };

  // Get the current company (either from state or localStorage)
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
    setCompanies,
    login,
    logout,
    refreshUser,
    selectCompany,
    loading,
    isAuthenticated: !!user,
    // Helper methods
    isEmployee: !!employee,
    isCompanyOwner: user?.role === "company_owner",
    hasMultipleCompanies: companies.length > 1,
    hasCompanies: companies.length > 0,
    // User role specific checks
    isSystemAdmin: user?.is_system_admin || false,
    isActive: user?.is_active || false,
    userRole: user?.role || null,
    // Employee specific data
    employeeDetails: employee,
    // Company specific data
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