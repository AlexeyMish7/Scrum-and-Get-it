import { createContext } from "react";

/**
 * CONFIRM DIALOG CONTEXT
 *
 * Provides access to the confirm dialog functionality throughout the app.
 *
 * This context is created by ConfirmDialogProvider and consumed by useConfirmDialog hook.
 * You should not need to use this context directly - use the hook instead.
 *
 * Type Definitions:
 * - ConfirmDialogOptions: Configuration for showing a confirmation dialog
 * - ConfirmDialogContextValue: The context value shape (contains confirm function)
 *
 * @see ConfirmDialogProvider for setup
 * @see useConfirmDialog for usage
 */

/**
 * Configuration options for a confirmation dialog
 */
export interface ConfirmDialogOptions {
  /** Dialog title (e.g., "Delete Item?") */
  title: string;

  /** Main message/question to display (e.g., "This action cannot be undone.") */
  message: string;

  /** Text for the confirm button (default: "Confirm") */
  confirmText?: string;

  /** Text for the cancel button (default: "Cancel") */
  cancelText?: string;

  /**
   * Color variant for the confirm button
   * Use 'error' for destructive actions, 'warning' for caution, 'primary' for normal confirmations
   * @default 'primary'
   */
  confirmColor?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
}

/**
 * Context value shape - provides the confirm function
 */
export interface ConfirmDialogContextValue {
  /**
   * Show a confirmation dialog and wait for user response
   *
   * @param options - Dialog configuration
   * @returns Promise that resolves to true if confirmed, false if cancelled
   *
   * @example
   * const confirmed = await confirm({
   *   title: 'Delete Item?',
   *   message: 'This cannot be undone.',
   *   confirmText: 'Delete',
   *   confirmColor: 'error'
   * });
   */
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<
  ConfirmDialogContextValue | undefined
>(undefined);

export default ConfirmDialogContext;
