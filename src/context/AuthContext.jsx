import { createContext, useContext, useState, useEffect, useRef } from "react";
import React from "react";

const AuthContext = createContext();

const API_BASE = "https://api-attendance.onesaas.in";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setUser(null);
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
          is_active: response.data.user.is_active,
          is_system_admin: response.data.user.is_system_admin,
          companies: response.data.companies || [],
          total_companies: response.data.total_companies || 0,
          role: response.role ||"User"
        };

        setUser(userData);

        // Get currently stored company
        const storedCompany = JSON.parse(localStorage.getItem("company"));
        
        // If there's only one company, always set it
        if (response.data.companies && response.data.companies.length === 1) {
          localStorage.setItem(
            "company",
            JSON.stringify(response.data.companies[0])
          );
        } 
        // If there are multiple companies
        else if (response.data.companies && response.data.companies.length > 1) {
          // Check if stored company exists and still belongs to user's companies
          if (storedCompany) {
            const companyStillExists = response.data.companies.some(
              c => c.id === storedCompany.id
            );
            
            // If stored company no longer belongs to user, remove it
            if (!companyStillExists) {
              localStorage.removeItem("company");
            }
            // Otherwise keep the stored company (do nothing)
          }
          // If no stored company, don't set one
        }
        // If no companies, remove company
        else {
          localStorage.removeItem("company");
        }
      } else {
        setUser(null);
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

  const value = {
    user,
    login,
    logout,
    loading,
    refreshUser,
    isAuthenticated: !!user,
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