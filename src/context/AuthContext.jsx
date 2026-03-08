import { createContext, useContext, useState, useEffect, useRef } from "react";
import React from "react";

const AuthContext = createContext();

const API_BASE = "https://api-attendance.onesaas.in";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);
  // Remove isMounted ref - it's causing the issue
  // We'll use a different approach

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setUser(null);
    setLoading(false);
  };

  const fetchUserProfile = async (token) => {
    try {
      // console.log("Fetching user profile with token:", token);
      const res = await fetch(`${API_BASE}/users/profile-role`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log("Response status:", res.status);

      if (!res.ok) {
        // console.log("Response not OK, logging out");
        logout();
        return;
      }

      const response = await res.json();
      // console.log("API Response:", response);

      // Remove the isMounted check
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
          role: response.data.user.role || "user"
        };

        // console.log("Setting user data:", userData);
        setUser(userData);

        if (response.data.companies && response.data.companies.length === 1) {
          localStorage.setItem(
            "company",
            JSON.stringify(response.data.companies[0])
          );
        } else {
          localStorage.removeItem("company");
        }
      } else {
        // console.log("Response success false or no data");
        setUser(null);
      }
    } catch (error) {
      // console.error("Profile fetch failed:", error);
      logout();
    } finally {
      // console.log("Finally block - setting loading to false");
      setLoading(false); // Remove isMounted check
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem("token");
    // console.log("Initial token:", token);

    if (!token) {
      // console.log("No token, setting loading false");
      setLoading(false);
      return;
    }

    // Add timeout fallback
    const timeoutId = setTimeout(() => {
      // console.log("Timeout reached - forcing loading to false");
      setLoading(false);
    }, 5000);

    fetchUserProfile(token);

    // Don't set isMounted to false in cleanup
    // Just clear the timeout
    return () => {
      // console.log("AuthProvider cleanup - clearing timeout");
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array

  const login = async (token) => {
    // console.log("Login called with token:", token);
    localStorage.setItem("token", token);
    setLoading(true);
    await fetchUserProfile(token);
  };

  const value = {
    user,
    login,
    logout,
    loading,
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