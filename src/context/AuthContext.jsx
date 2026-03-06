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
    const { user, employee, permissions, role } = responseData.data;
    
    // Transform YOUR backend data to frontend structure
    const userData = {
      id: user.id,
      name: user.full_name || user.email.split('@')[0],
      email: user.email,
      full_name: user.full_name,
      roleBadge: role.charAt(0).toUpperCase() + role.slice(1), // "Employee"
      role: role,
      isOwner: role === 'owner',
      companies: [{
        id: employee.company_id,
        name: employee.company_name,
        roleBadge: role.charAt(0).toUpperCase() + role.slice(1),
        permissions: permissions.map(p => p.code) // ["TL_VEW"]
      }],
      employee: employee
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
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
