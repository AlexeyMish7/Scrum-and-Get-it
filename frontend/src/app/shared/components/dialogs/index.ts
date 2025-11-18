/**
 * DIALOG COMPONENTS
 *
 * Centralized exports for dialog-related UI components.
 *
 * Usage:
 *   // In your app root (main.tsx or App.tsx):
 *   import { ConfirmDialogProvider } from '@shared/components/dialogs';
 *
 *   <ConfirmDialogProvider>
 *     <App />
 *   </ConfirmDialogProvider>
 *
 *   // In any component:
 *   import { useConfirmDialog } from '@shared/hooks/useConfirmDialog';
 *   const { confirm } = useConfirmDialog();
 *
 * Note: The useConfirmDialog hook is located in @shared/hooks/useConfirmDialog
 * (not exported from this barrel to maintain separation of concerns).
 */

export { ConfirmDialogProvider } from "./ConfirmDialog";
export { ConfirmDialogContext } from "./ConfirmDialogContext";
export type {
  ConfirmDialogOptions,
  ConfirmDialogContextValue,
} from "./ConfirmDialogContext";
