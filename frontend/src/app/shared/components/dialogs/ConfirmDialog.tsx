import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useState, useCallback, type ReactNode } from "react";
import {
  ConfirmDialogContext,
  type ConfirmDialogOptions,
} from "./ConfirmDialogContext";

/**
 * CONFIRM DIALOG COMPONENT
 *
 * Provides a reusable confirmation dialog that can be triggered from anywhere in the app.
 * Uses React Context to avoid prop drilling and allow any component to show confirmations.
 *
 * Setup (in main.tsx or App root):
 *   import { ConfirmDialogProvider } from '@shared/components/dialogs';
 *
 *   <ConfirmDialogProvider>
 *     <App />
 *   </ConfirmDialogProvider>
 *
 * Usage in components:
 *   import { useConfirmDialog } from '@shared/hooks/useConfirmDialog';
 *
 *   function MyComponent() {
 *     const { confirm } = useConfirmDialog();
 *
 *     const handleDelete = async () => {
 *       const confirmed = await confirm({
 *         title: 'Delete Job?',
 *         message: 'This action cannot be undone.',
 *         confirmText: 'Delete',
 *         confirmColor: 'error'
 *       });
 *
 *       if (confirmed) {
 *         // User clicked "Delete" - proceed with deletion
 *       } else {
 *         // User clicked "Cancel" or closed dialog - do nothing
 *       }
 *     };
 *   }
 *
 * Features:
 * - Promise-based API (async/await friendly)
 * - Customizable title, message, and button text
 * - Customizable button colors (primary, error, warning, etc.)
 * - Keyboard accessible (Enter = confirm, Esc = cancel)
 * - Single dialog instance for entire app (memory efficient)
 * - Automatically manages focus restoration
 *
 * Performance:
 * - Only one dialog component rendered globally
 * - No need for useState + Dialog in every component
 * - Reduces component complexity and bundle size
 */

/**
 * Provider component that wraps the app and provides confirm dialog functionality
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    options: ConfirmDialogOptions | null;
    resolver: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: null,
    resolver: null,
  });

  /**
   * Show confirmation dialog and return a promise that resolves with user's choice
   */
  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          options,
          resolver: resolve,
        });
      });
    },
    []
  );

  /**
   * Handle user clicking "Confirm" button
   */
  const handleConfirm = useCallback(() => {
    if (dialogState.resolver) {
      dialogState.resolver(true);
    }
    setDialogState({ open: false, options: null, resolver: null });
  }, [dialogState]);

  /**
   * Handle user clicking "Cancel" button or closing dialog
   */
  const handleCancel = useCallback(() => {
    if (dialogState.resolver) {
      dialogState.resolver(false);
    }
    setDialogState({ open: false, options: null, resolver: null });
  }, [dialogState]);

  const { options, open } = dialogState;

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {/* Confirmation Dialog */}
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        maxWidth="xs"
        fullWidth
      >
        {options && (
          <>
            <DialogTitle id="confirm-dialog-title">{options.title}</DialogTitle>
            <DialogContent>
              <DialogContentText id="confirm-dialog-description">
                {options.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel} color="inherit">
                {options.cancelText || "Cancel"}
              </Button>
              <Button
                onClick={handleConfirm}
                color={options.confirmColor || "primary"}
                variant="contained"
                autoFocus
              >
                {options.confirmText || "Confirm"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export default ConfirmDialogProvider;
