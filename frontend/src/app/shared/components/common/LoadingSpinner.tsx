import { CircularProgress, Box } from "@mui/material";
import theme from "../../../../theme/theme";

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        height: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress size={70} sx={{ color: theme.palette.primary.main }} />
    </Box>
  );
}
