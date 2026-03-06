import { Navigate } from 'react-router-dom';
import { usePermission } from '../context/PermissionContext';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredPermission }) => {
  const { hasPermission } = usePermission();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};