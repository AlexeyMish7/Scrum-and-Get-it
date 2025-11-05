import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/shared/context/AuthContext";
import LoadingSpinner from "../../app/shared/components/common/LoadingSpinner";
type Props = { children: React.ReactNode };

/**
 * ProtectedRoute
 * - Simple wrapper for routes that require a logged-in user.
 * - Shows a loading placeholder while auth state is being determined.
 * - Redirects to /login when no user is present.
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
