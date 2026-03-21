import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlobalSkeleton from "./GlobalSkeletonComponent";

const ProtectedRoute = ({ children }) => {
  const { user, loading, mustSelectCompany } = useAuth();

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

  return children;
};

export default ProtectedRoute;