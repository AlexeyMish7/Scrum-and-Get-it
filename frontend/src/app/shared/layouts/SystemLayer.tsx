import { Box } from "@mui/material";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/common/ErrorSnackbar";
// Disabled for demo - Sprint task tracking
// import SprintTaskSnackbar from "@shared/components/common/SprintTaskSnackbar";
// import useSprintTasks from "@shared/hooks/useSprintTasks";

export default function SystemLayer() {
  // Use centralized error handler and render the snackbar here so it's available
  // across the app without adding the component to each page.
  const { notification, closeNotification } = useErrorHandler();
  // Disabled for demo - Sprint task tracking
  // const { tasks, open, setOpen } = useSprintTasks();

  return (
    <Box>
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
      {/* Sprint task overview - DISABLED FOR DEMO */}
      {/* {tasks.length > 0 && (
        <SprintTaskSnackbar
          items={tasks}
          open={open}
          onClose={() => setOpen(false)}
          autoHideMs={15000}
        />
      )} */}
      {/* Add global modals and confirm dialogs here as needed */}
    </Box>
  );
}
