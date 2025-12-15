import React, { useState } from "react";
import { Button } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
// using supabase client directly for OAuth start
import { supabase } from "@shared/services/supabaseClient";

type Props = {
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  label?: string;
};

const LinkedInButton: React.FC<Props> = ({ fullWidth = true, sx, label }) => {
  // intentionally using supabase.auth.signInWithOAuth directly below
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Minimal sign-in call per Supabase docs — keep simple for testing
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        console.error("Supabase OAuth start error:", error);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="contained"
      disableElevation
      fullWidth={fullWidth}
      disabled={loading}
      sx={[
        {
          // Standard LinkedIn OAuth button styling
          backgroundColor: "#0A66C2",
          color: "#ffffff",
          borderRadius: 0,
          "&:hover": {
            backgroundColor: "#004182",
          },
          "&:disabled": {
            backgroundColor: "rgba(10, 102, 194, 0.5)",
            color: "rgba(255, 255, 255, 0.9)",
          },
        },
        ...(sx ? [sx] : []),
      ]}
      startIcon={<LinkedInIcon />}
    >
      {loading ? "Redirecting..." : label ?? "Continue with LinkedIn"}
    </Button>
  );
};

export default LinkedInButton;
