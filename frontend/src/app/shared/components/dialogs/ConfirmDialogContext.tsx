import { createContext } from "react";

/**
 * Confirm Dialog Context
 *
 * Provides access to the confirm dialog functionality throughout the app.
 */

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
}

export interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

export const ConfirmDialogContext = createContext<
  ConfirmDialogContextValue | undefined
>(undefined);

export default ConfirmDialogContext;
