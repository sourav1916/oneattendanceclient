import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePermissionAccess from "../hooks/usePermissionAccess";
import { toast } from "react-toastify";
import GlobalSkeleton from "./GlobalSkeletonComponent";

const ProtectedRoute = ({ children, pageKey }) => {
  const { user, loading, mustSelectCompany } = useAuth();
  const { checkPageAccess, getAccessMessage } = usePermissionAccess();

  const access = pageKey ? checkPageAccess(pageKey) : { allowed: true };

  useEffect(() => {
    if (!loading && user && !mustSelectCompany && pageKey && !access.allowed) {
      toast.error(getAccessMessage(access));
    }
  }, [loading, user, mustSelectCompany, pageKey, access.allowed, getAccessMessage]);

  if (loading) {
    return (
      <GlobalSkeleton/>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (mustSelectCompany) {
    return <Navigate to="/login" replace />;
  }

  if (pageKey && !access.allowed) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;