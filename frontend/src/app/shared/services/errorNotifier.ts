/**
 * Error Notification Service
 *
 * Provides a global event system to notify the UI when errors occur.
 * This is used for API errors, generation failures, and other issues
 * that should be displayed as snackbar notifications.
 */

export interface ErrorNotification {
  message: string;
  severity?: "error" | "warning" | "info";
  context?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ErrorListener = (notification: ErrorNotification) => void;

class ErrorNotifier {
  private listeners: Set<ErrorListener> = new Set();

  /**
   * Subscribe to error notifications
   * Returns an unsubscribe function
   */
  subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of an error
   */
  notify(notification: ErrorNotification): void {
    this.listeners.forEach((listener) => listener(notification));
  }

  /**
   * Helper to notify from an Error object
   */
  notifyError(
    error: Error | unknown,
    context: string = "Operation failed"
  ): void {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    this.notify({
      message,
      severity: "error",
      context,
    });
  }

  /**
   * Helper to notify a warning
   */
  notifyWarning(message: string, context?: string): void {
    this.notify({
      message,
      severity: "warning",
      context,
    });
  }

  /**
   * Helper to notify info
   */
  notifyInfo(message: string, context?: string): void {
    this.notify({
      message,
      severity: "info",
      context,
    });
  }

  /**
   * Extract user-friendly error message from API response
   */
  extractErrorMessage(error: unknown): string {
    // Type guard for axios-like errors
    const hasResponse = (
      err: unknown
    ): err is {
      response: {
        data?: { error?: string; message?: string };
        status?: number;
      };
    } => {
      return typeof err === "object" && err !== null && "response" in err;
    };

    const hasMessage = (err: unknown): err is { message: string } => {
      return typeof err === "object" && err !== null && "message" in err;
    };

    const hasCode = (err: unknown): err is { code: string } => {
      return typeof err === "object" && err !== null && "code" in err;
    };

    // API error with error field
    if (hasResponse(error) && error.response?.data?.error) {
      return error.response.data.error;
    }

    // API error with message field
    if (hasResponse(error) && error.response?.data?.message) {
      return error.response.data.message;
    }

    // Network error
    if (hasMessage(error) && error.message === "Network Error") {
      return "Cannot connect to server. Please check your connection.";
    }

    // Timeout
    if (hasCode(error) && error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    // HTTP status errors
    if (hasResponse(error) && error.response?.status) {
      switch (error.response.status) {
        case 401:
          return "You are not authenticated. Please log in.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 429:
          return "Too many requests. Please slow down and try again.";
        case 500:
          return "Server error. Please try again later.";
        case 503:
          return "Service temporarily unavailable. Please try again later.";
        default:
          return `Request failed with status ${error.response.status}`;
      }
    }

    // Default fallback
    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred";
  }

  /**
   * Notify from an API error with smart message extraction
   */
  notifyApiError(error: unknown, context: string = "API request failed"): void {
    const message = this.extractErrorMessage(error);
    this.notify({
      message,
      severity: "error",
      context,
    });
  }
}

export const errorNotifier = new ErrorNotifier();
