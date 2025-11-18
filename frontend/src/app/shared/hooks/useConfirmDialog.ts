import { useContext } from "react";
import { ConfirmDialogContext } from "@shared/components/dialogs/ConfirmDialogContext";
import type { ConfirmDialogContextValue } from "@shared/components/dialogs/ConfirmDialogContext";

/**
 * Hook to access confirm dialog from any component
 * Must be used within ConfirmDialogProvider
 *
 * Usage:
 *   const { confirm } = useConfirmDialog();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item?',
 *       message: 'This cannot be undone.',
 *       confirmColor: 'error'
 *     });
 *
 *     if (confirmed) {
 *       // proceed
 *     }
 *   };
 */
export function useConfirmDialog(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider"
    );
  }

  return context;
}

export default useConfirmDialog;
