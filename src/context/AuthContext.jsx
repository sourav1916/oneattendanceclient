import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (responseData) => {
    console.log("Login response data:", responseData); // Debug log
    
    let userData = null;

    // Handle different response structures
    if (responseData.data && responseData.data.user) {
      // Structure: { data: { user: {...}, employee: {...}, permissions: [...], role: "..." } }
      const { user, employee, permissions, role } = responseData.data;
      
      userData = {
        id: user.id,
        name: user.full_name || user.email?.split('@')[0] || "User",
        email: user.email,
        full_name: user.full_name,
        roleBadge: role ? (role.charAt(0).toUpperCase() + role.slice(1)) : "Employee",
        role: role || "employee",
        isOwner: role === 'owner',
        companies: employee ? [{
          id: employee.company_id,
          name: employee.company_name,
          roleBadge: role ? (role.charAt(0).toUpperCase() + role.slice(1)) : "Employee",
          permissions: permissions ? permissions.map(p => p.code || p) : []
        }] : [],
        employee: employee
      };
    } 
    else if (responseData.user) {
      // Structure: { user: {...}, token: "..." }
      const { user } = responseData;
      
      userData = {
        id: user.id,
        name: user.full_name || user.name || user.email?.split('@')[0] || "User",
        email: user.email,
        full_name: user.full_name || user.name,
        roleBadge: user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Employee",
        role: user.role || "employee",
        isOwner: user.role === 'owner',
        companies: user.companies || [],
        employee: user.employee || null
      };
    }
    else if (responseData.id || responseData.email) {
      // Structure: Direct user object { id: 1, email: "...", ... }
      userData = {
        id: responseData.id,
        name: responseData.full_name || responseData.name || responseData.email?.split('@')[0] || "User",
        email: responseData.email,
        full_name: responseData.full_name || responseData.name,
        roleBadge: responseData.role ? (responseData.role.charAt(0).toUpperCase() + responseData.role.slice(1)) : "Employee",
        role: responseData.role || "employee",
        isOwner: responseData.role === 'owner',
        companies: responseData.companies || [],
        employee: responseData.employee || null
      };
    }

    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("User data saved:", userData); // Debug log
    } else {
      console.error("Could not parse user data from response:", responseData);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = { user, login, logout, loading };

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