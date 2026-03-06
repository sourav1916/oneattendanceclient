import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [isTeamLead, setIsTeamLead] = useState(false);

  useEffect(() => {
    if (user?.companies && user.companies.length > 0) {
      // Get permissions from the active company or first company
      const userPermissions = user.companies[0]?.permissions || [];
      setPermissions(userPermissions);
      
      // Check if user has team lead permission
      setIsTeamLead(userPermissions.includes('TL_VEW'));
    } else {
      setPermissions([]);
      setIsTeamLead(false);
    }
  }, [user]);

  // Simple check if user has a specific permission code
  const hasPermission = (permissionCode) => {
    return permissions.includes(permissionCode);
  };

  const value = { 
    permissions, 
    hasPermission,
    isTeamLead  // Convenience flag for team lead specific features
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within PermissionProvider");
  }
  return context;
};