import { createContext, useContext, useState, useEffect } from "react";

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setPermissions(user.permissions || user.roles || []);
      } catch (e) {
        console.error("Failed to load permissions:", e);
      }
    }
  }, []);

  const hasPermission = (perm) => {
    return permissions.includes(perm);
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      setPermissions,
      hasPermission
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    return { permissions: [], hasPermission: () => false };
  }
  return context;
};
