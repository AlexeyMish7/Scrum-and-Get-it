import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../feedback/LoadingSpinner";
type Props = { children: React.ReactNode };

/**
 * ProtectedRoute
 * - Simple wrapper for routes that require a logged-in user.
 * - Shows a loading placeholder while auth state is being determined.
 * - Redirects to /login when no user is present.
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // Show loading spinner while determining auth state
  if (loading) return <LoadingSpinner />;

  // Redirect to login if no authenticated user
  if (!user) return <Navigate to="/login" replace />;

  // User is authenticated, render protected content
  return <>{children}</>;
}
