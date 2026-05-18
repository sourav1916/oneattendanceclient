import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePermissionAccess from "../hooks/usePermissionAccess";
import { toast } from "react-toastify";
import GlobalSkeleton from "./GlobalSkeletonComponent";

const ProtectedRoute = ({ children, pageKey }) => {
  const { user, loading, mustSelectCompany } = useAuth();
  const { checkPageAccess, getAccessMessage } = usePermissionAccess();
  const navigate = useNavigate();

  const access = pageKey ? checkPageAccess(pageKey) : { allowed: true };

  useEffect(() => {
    if (!loading && user && !mustSelectCompany && pageKey && !access.allowed) {
      toast.error(getAccessMessage(access));
      navigate(-1);
    }
  }, [loading, user, mustSelectCompany, pageKey, access.allowed, getAccessMessage, navigate]);

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
    return null;
  }

  return children;
};

export default ProtectedRoute;
