import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getAppQueryClient } from "@shared/cache";
import { captureException as captureSentryException } from "@/sentry";

/**
 * ERROR BOUNDARY COMPONENT
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Features:
 * - Catches errors in render, lifecycle methods, and constructors
 * - Displays user-friendly error message
 * - Provides "Try Again" button to recover
 * - Logs errors to console (can be extended to send to monitoring service)
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error callback
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   * This lifecycle method is called after an error has been thrown by a descendant component
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and call optional error handler
   * This lifecycle method is called after an error has been thrown and logged
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Store error info in state for display
    this.setState({ errorInfo });

    // Call optional error handler (can be used to send to monitoring service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    captureSentryException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Reset error state and attempt to recover
   * This allows users to try again without a full page refresh
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reset React Query cache as a last resort
   * This avoids a full page reload while still clearing potentially-corrupted app state.
   */
  handleReload = async (): Promise<void> => {
    try {
      const queryClient = getAppQueryClient();
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {
      // ignore
    }

    this.handleReset();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    // If no error, render children normally
    if (!hasError) {
      return children;
    }

    // If custom fallback provided, use it
    if (fallback) {
      return fallback;
    }

    // Default fallback UI
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            py: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              maxWidth: 500,
              width: "100%",
            }}
          >
            {/* Error Icon */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <AlertCircle size={64} color="error" />
            </Box>

            {/* Error Title */}
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>

            {/* Error Description */}
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry for the inconvenience. An unexpected error has
              occurred.
            </Typography>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && error && (
              <Box
                sx={{
                  mt: 2,
                  mb: 3,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 200,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {error.toString()}
                </Typography>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshCw size={18} />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={this.handleReload}
              >
                Reset App
              </Button>
            </Box>

            {/* Support Link */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block" }}
            >
              If this problem persists, please contact support.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }
}

export default ErrorBoundary;
