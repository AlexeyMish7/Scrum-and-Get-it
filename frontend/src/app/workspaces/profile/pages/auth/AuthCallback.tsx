import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@shared/services/supabaseClient";
import { Box, Typography, AppBar, Toolbar, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeContext } from "@shared/context/ThemeContext";

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
          const s = sessData.session as any;
          const user = s.user;

          // Upsert a minimal profile record so the frontend has a profile row to read
          // prefill will hold any discovered profile values to pass to the profile details form
          let prefill: Record<string, any> | null = null;

          try {
            const meta = user?.user_metadata ?? {};

            // Build best-effort profile enrichment fields from user metadata and identities
            const fullNameFromMeta =
              meta.full_name ||
              meta.name ||
              `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() ||
              null;
            const headlineFromMeta =
              meta.headline || meta.profile?.headline || meta.summary || null;

            // Try a few common metadata keys for avatar/picture
            let avatarSource: string | null = null;
            avatarSource =
              avatarSource ||
              meta.picture ||
              meta.avatar_url ||
              meta.image ||
              meta.profile?.pictureUrl ||
              null;

            // identities may include identity_data with profile picture fields (best-effort)
            const identities: Array<any> = s.user?.identities ?? [];
            for (const id of identities) {
              const idData = id?.identity_data ?? {};
              avatarSource =
                avatarSource ||
                idData.picture ||
                idData.pictureUrl ||
                idData.profile_picture ||
                null;
            }

            // Prepare base upsert. The `profiles` table requires `first_name` and `last_name` NOT NULL,
            // so provide empty strings if we can't derive them yet. We'll let the user confirm/complete
            // the profile on the `/profile/details` page — we pass any discovered values there as state.
            let first_name_base: string = "";
            let last_name_base: string = "";
            if (fullNameFromMeta) {
              const parts = fullNameFromMeta.split(" ").filter(Boolean);
              first_name_base = parts.shift() ?? "";
              last_name_base = parts.length ? parts.join(" ") : "";
            } else if (meta.first_name || meta.last_name) {
              first_name_base = meta.first_name ?? "";
              last_name_base = meta.last_name ?? "";
            }

            const baseUpsert: any = {
              id: user?.id,
              email: user?.email ?? null,
              first_name: first_name_base,
              last_name: last_name_base,
              updated_at: new Date().toISOString(),
            };

            if (headlineFromMeta)
              baseUpsert.professional_title = headlineFromMeta;

            // Build a prefill object from metadata so `/profile/details` can prefill the form even
            // if the provider_token flow hasn't run yet.
            prefill = {
              first_name: first_name_base || undefined,
              last_name: last_name_base || undefined,
              professional_title: headlineFromMeta ?? undefined,
              avatar_path: avatarSource ?? undefined,
            };

            // First, check if profile exists and merge metadata to preserve existing data
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("metadata")
              .eq("id", user?.id)
              .single();

            // Merge avatar_path into existing metadata (don't overwrite other keys)
            const existingMeta =
              (existingProfile?.metadata as Record<string, unknown>) ?? {};
            const mergedMetadata: Record<string, unknown> = { ...existingMeta };
            if (avatarSource) mergedMetadata.avatar_path = avatarSource;

            // Only include metadata in upsert if we have something to save
            if (Object.keys(mergedMetadata).length > 0) {
              baseUpsert.metadata = mergedMetadata;
            }

            // Upsert profile row - this handles both new users and existing users
            const { error: upsertErr } = await supabase
              .from("profiles")
              .upsert(baseUpsert);
            if (upsertErr)
              console.warn(
                "Failed to upsert profile after OAuth callback:",
                upsertErr
              );
          } catch (err) {
            console.error(
              "Error creating/updating profile after OAuth callback:",
              err
            );
          }

          // If a LinkedIn OIDC identity exists and a provider token is present,
          // invoke the server-side edge function to fetch fuller profile data.
          // Add debug logs to help diagnose whether a provider token is available
          try {
            const identities: Array<any> = s.user?.identities ?? [];

            const hasLinkedInIdentity = identities.some(
              (i) => i.provider === "linkedin_oidc"
            );
            const provider_token = s.provider_token ?? null;

            // If we have a provider token for LinkedIn, fetch profile directly from LinkedIn APIs
            // and upsert into the profiles table. This avoids CORS / storage upload issues and
            // doesn't require an edge function when the token is available client-side.
            if (hasLinkedInIdentity && provider_token && user?.id) {
              try {
                // Fetch basic profile (first/last name, localizedHeadline) and picture in one request.
                // Request `localizedHeadline` because LinkedIn returns the headline as a localized field.
                const linkedInUrl =
                  "https://api.linkedin.com/v2/me?projection=(localizedFirstName,localizedLastName,localizedHeadline,profilePicture(displayImage~:playableStreams))";
                let first_name: string | null = null;
                let last_name: string | null = null;
                let professional_title: string | null = null;
                let pictureUrl: string | null = null;

                try {
                  const profileRes = await fetch(linkedInUrl, {
                    headers: {
                      Authorization: `Bearer ${provider_token}`,
                      // LinkedIn sometimes requires this header for newer APIs
                      "X-Restli-Protocol-Version": "2.0.0",
                    },
                  });

                  if (profileRes.ok) {
                    const profileJson = await profileRes
                      .json()
                      .catch(() => ({}));
                    first_name = profileJson?.localizedFirstName ?? null;
                    last_name = profileJson?.localizedLastName ?? null;
                    // localizedHeadline is commonly provided as a string
                    professional_title = profileJson?.localizedHeadline ?? null;

                    // fallback: older responses sometimes include `headline` as an object
                    if (!professional_title && profileJson?.headline) {
                      if (typeof profileJson.headline === "string")
                        professional_title = profileJson.headline;
                      else if (profileJson.headline.localized) {
                        professional_title =
                          profileJson.headline.localized.en_US ??
                          Object.values(profileJson.headline.localized)[0] ??
                          null;
                      }
                    }

                    // parse picture elements (largest available)
                    try {
                      const elements =
                        profileJson?.profilePicture?.["displayImage~"]
                          ?.elements ?? [];
                      if (Array.isArray(elements) && elements.length > 0) {
                        const elem = elements[elements.length - 1];
                        const identifier = elem?.identifiers?.[0]?.identifier;
                        if (identifier) pictureUrl = identifier;
                      }
                    } catch (e) {
                      console.warn(
                        "Failed to parse LinkedIn picture response",
                        e
                      );
                    }
                  } else {
                    console.warn(
                      "LinkedIn profile fetch failed",
                      profileRes.status
                    );
                  }
                } catch (fetchErr) {
                  console.error(
                    "Failed to fetch LinkedIn profile directly:",
                    fetchErr
                  );
                }

                // Prepare a prefill object to pass to the profile details page so the user can confirm
                prefill = {
                  first_name: first_name ?? undefined,
                  last_name: last_name ?? undefined,
                  professional_title: professional_title ?? undefined,
                  // map professional_title -> headline so the profile form picks it up
                  headline: professional_title ?? undefined,
                  avatar_path: pictureUrl ?? undefined,
                };

                // Merge metadata and upsert only the non-sensitive fields (professional_title + avatar_path)
                try {
                  const { data: existing } = await supabase
                    .from("profiles")
                    .select("metadata")
                    .eq("id", user.id)
                    .single();
                  const existingMetadata =
                    existing && existing.metadata ? existing.metadata : {};
                  const newMetadata = { ...(existingMetadata ?? {}) };
                  if (pictureUrl) newMetadata.avatar_path = pictureUrl;

                  const updatePayload: any = {
                    updated_at: new Date().toISOString(),
                  };
                  if (professional_title)
                    updatePayload.professional_title = professional_title;
                  if (Object.keys(newMetadata).length)
                    updatePayload.metadata = newMetadata;

                  const { error: updErr } = await supabase
                    .from("profiles")
                    .update(updatePayload)
                    .eq("id", user.id);
                  if (updErr)
                    console.error(
                      "Failed to upsert LinkedIn profile data into profiles:",
                      updErr
                    );
                } catch (dbErr) {
                  console.error(
                    "Failed to merge/upsert profile metadata:",
                    dbErr
                  );
                }
              } catch (fnErr) {
                console.error(
                  "Failed to fetch LinkedIn profile directly:",
                  fnErr
                );
              }
            }
          } catch (e) {
            console.error("LinkedIn sync step failed:", e);
          }

          // Redirect user to profile details page after sync/upsert.
          // Pass discovered values in navigation state so the form can prefill them.
          navigate("/profile/details", { replace: true, state: { prefill } });
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

  const { mode, toggleMode } = useThemeContext();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ mb: 2 }}
      >
        <Toolbar>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={toggleMode}
            aria-label="Toggle theme"
            color="inherit"
          >
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Completing sign in...
        </Typography>

        {error ? (
          <Box sx={{ color: "error.main" }}>
            <Typography variant="body2">Sign-in failed:</Typography>
            <pre>{error}</pre>
          </Box>
        ) : (
          <Typography>
            Please wait while we complete sign in and redirect you.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AuthCallback;
