import { useState } from "react";
import type { CrudError } from "../services/types";

// Types for our centralized error handling
export type ErrorSeverity = "error" | "warning" | "info" | "success";

export interface ErrorNotification {
  open: boolean;
  message: string;
  severity: ErrorSeverity;
  autoHideDuration?: number;
}

// Hook for managing error notifications with snackbar
export const useErrorHandler = () => {
  const [notification, setNotification] = useState<ErrorNotification>({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: 4000,
  });

  // Close the notification
  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Show a notification with custom message and severity
  const showNotification = (
    message: string,
    severity: ErrorSeverity = "info",
    autoHideDuration: number = 4000
  ) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration,
    });
  };

  // Handle errors and convert them to user-friendly messages
  const handleError = (
    error: CrudError | unknown,
    customMessage?: string,
    severity: ErrorSeverity = "error"
  ) => {
    const message = customMessage || getErrorMessage(error);
    showNotification(message, severity);
  };

  // Handle success messages
  const showSuccess = (message: string, autoHideDuration?: number) => {
    showNotification(message, "success", autoHideDuration);
  };

  // Handle warning messages
  const showWarning = (message: string, autoHideDuration?: number) => {
    showNotification(message, "warning", autoHideDuration);
  };

  // Handle info messages
  const showInfo = (message: string, autoHideDuration?: number) => {
    showNotification(message, "info", autoHideDuration);
  };

  return {
    notification,
    closeNotification,
    showNotification,
    handleError,
    showSuccess,
    showWarning,
    showInfo,
  };
};

// Centralized error message processing function
export const getErrorMessage = (error: CrudError | unknown): string => {
  // Handle CrudError (standardized backend errors)
  if (error && typeof error === "object" && "message" in error) {
    const crudError = error as CrudError;

    if (crudError.message) {
      // Handle specific PostgreSQL error codes
      if (crudError.code === "23505") {
        return "This entry already exists. Please check for duplicates.";
      }
      if (crudError.code === "23514") {
        return "Please check your input format and try again.";
      }
      if (crudError.code === "23503") {
        return "Cannot complete action due to related data constraints.";
      }
      if (crudError.code === "42501") {
        return "You don't have permission to perform this action.";
      }

      // Handle HTTP status codes
      if (crudError.status === 400) {
        return "Invalid request. Please check your input and try again.";
      }
      if (crudError.status === 401) {
        return "Access denied. Please log in and try again.";
      }
      if (crudError.status === 403) {
        return "You don't have permission to perform this action.";
      }
      if (crudError.status === 404) {
        return "The requested item was not found.";
      }
      if (crudError.status === 409) {
        return "Conflict detected. This action cannot be completed.";
      }
      if (crudError.status === 422) {
        return "Invalid data format. Please check your input.";
      }
      if (crudError.status && crudError.status >= 500) {
        return "Server error. Please try again later.";
      }

      // Handle Supabase-specific errors
      if (crudError.message.includes("Row Level Security")) {
        return "Access denied. Please make sure you're logged in.";
      }
      if (crudError.message.includes("JWT expired")) {
        return "Your session has expired. Please log in again.";
      }
      if (crudError.message.includes("JWT malformed")) {
        return "Authentication error. Please log in again.";
      }

      // Return the original message if it's user-friendly
      return crudError.message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle generic error objects (frontend errors)
  if (error && typeof error === "object") {
    const errorObj = error as {
      message?: string;
      details?: string;
      name?: string;
    };

    if (errorObj.message) {
      // Network and connection errors
      if (errorObj.message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }
      if (errorObj.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
      if (errorObj.message.includes("CORS")) {
        return "Connection error. Please refresh the page and try again.";
      }

      // JavaScript/Frontend errors
      if (errorObj.name === "TypeError") {
        return "A technical error occurred. Please refresh the page.";
      }
      if (errorObj.name === "ReferenceError") {
        return "A technical error occurred. Please refresh the page.";
      }

      // Database constraint errors (fallback)
      if (errorObj.message.includes("duplicate key value")) {
        return "This entry already exists. Please check for duplicates.";
      }
      if (errorObj.message.includes("invalid input syntax")) {
        return "Please check your input format and try again.";
      }
      if (errorObj.message.includes("permission denied")) {
        return "You don't have permission to perform this action.";
      }
      if (errorObj.message.includes("network")) {
        return "Network error. Please check your connection and try again.";
      }

      // Return original message if it seems user-friendly
      return errorObj.message;
    }

    if (errorObj.details) {
      return errorObj.details;
    }
  }

  // Default fallback message
  return "An unexpected error occurred. Please try again.";
};

// Validation helper for common form validation
export const validateRequired = (
  fields: Record<string, unknown>
): string | null => {
  const emptyFields = Object.entries(fields)
    .filter(
      ([, value]) => !value || (typeof value === "string" && !value.trim())
    )
    .map(([key]) => key);

  if (emptyFields.length > 0) {
    return `Please fill in the following required fields: ${emptyFields.join(
      ", "
    )}`;
  }

  return null;
};

// Helper for handling async operations with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorHandler: (error: unknown) => void,
  successMessage?: string,
  successHandler?: (result: T) => void
): Promise<T | null> => {
  try {
    const result = await operation();
    if (successMessage && successHandler) {
      successHandler(result);
    }
    return result;
  } catch (error) {
    errorHandler(error);
    return null;
  }
};
