import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../app/shared/services/supabaseClient";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        // Try to read session (supabase-js may process the URL automatically)
        const { data: sessData, error: sessErr } =
          await supabase.auth.getSession();
        if (sessErr) {
          console.error("getSession error:", sessErr);
          if (mounted) setError(sessErr.message ?? "OAuth callback failed");
          return;
        }

        if (sessData?.session) {
          navigate("/profile", { replace: true });
        } else {
          if (mounted)
            setError("No active session found after OAuth callback.");
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    }

    void handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Completing sign in...</h2>
      {error ? (
        <div style={{ color: "red" }}>
          <p>Sign-in failed:</p>
          <pre>{error}</pre>
        </div>
      ) : (
        <p>Please wait while we complete sign in and redirect you.</p>
      )}
    </div>
  );
};

export default AuthCallback;
