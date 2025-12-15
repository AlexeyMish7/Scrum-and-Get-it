import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@shared/services/supabaseClient";
import { Box, Typography, AppBar, Toolbar, IconButton } from "@mui/material";
import type { Session } from "@supabase/auth-js";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeContext } from "@shared/context/ThemeContext";
import { consumeOAuthIntent } from "@shared/utils/oauthIntent";

type ProfileRow = {
  first_name: string;
  last_name: string;
  email: string;
  professional_title?: string | null;
  summary?: string | null;
  city?: string | null;
  state?: string | null;
  metadata?: Record<string, unknown> | null;
} | null;

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const oauthIntent = consumeOAuthIntent();

        // Try to read session (supabase-js may process the URL automatically)
        const { data: sessData, error: sessErr } =
          await supabase.auth.getSession();
        if (sessErr) {
          console.error("getSession error:", sessErr);
          if (mounted) setError(sessErr.message ?? "OAuth callback failed");
          return;
        }

        if (sessData?.session) {
          const s = sessData.session as Session & {
            provider_token?: string | null;
          };
          const user = s.user;

          // Prefill holds any discovered profile values to pass to the profile details form.
          // We only force the user into Profile Details when it's a registration intent or
          // we detect missing/placeholder profile values.
          let prefill: Record<string, unknown> | null = null;
          let shouldRouteToProfileDetails = oauthIntent?.source === "register";

          try {
            const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;

            const pickString = (...values: unknown[]) => {
              for (const v of values) {
                if (typeof v === "string" && v.trim()) return v.trim();
              }
              return null;
            };

            const fullNameFromMeta = pickString(
              meta["full_name"],
              meta["name"],
              // GitHub commonly provides a username but not always a full name.
              // We still prefer a real name if available.
              // Google OIDC fields
              [meta["given_name"], meta["family_name"]]
                .filter(Boolean)
                .join(" ")
            );

            const firstFromMeta = pickString(
              meta["first_name"],
              meta["given_name"]
            );
            const lastFromMeta = pickString(
              meta["last_name"],
              meta["family_name"]
            );

            const metaProfile = meta["profile"];
            const metaProfileObj =
              metaProfile && typeof metaProfile === "object"
                ? (metaProfile as Record<string, unknown>)
                : null;

            const headlineFromMeta = pickString(
              meta["headline"],
              metaProfileObj?.headline,
              meta["summary"]
            );

            const bioFromMeta = pickString(
              meta["bio"],
              metaProfileObj?.bio,
              meta["description"]
            );

            const locationFromMeta = pickString(
              meta["location"],
              metaProfileObj?.location
            );

            let usernameFromMeta: string | null = pickString(
              meta["user_name"],
              meta["preferred_username"],
              meta["username"],
              meta["login"]
            );

            // Try a few common metadata keys for avatar/picture
            let avatarSource: string | null = null;
            avatarSource = pickString(
              meta["picture"],
              meta["avatar_url"],
              meta["image"],
              metaProfileObj?.pictureUrl
            );

            // identities may include identity_data with profile picture fields (best-effort)
            const identities = (s.user?.identities ?? []) as Array<{
              provider?: unknown;
              identity_data?: Record<string, unknown>;
            }>;
            let fullNameFromIdentity: string | null = null;
            for (const id of identities) {
              const idData = id?.identity_data ?? {};
              avatarSource =
                avatarSource ||
                idData.picture ||
                idData.pictureUrl ||
                idData.profile_picture ||
                null;

              fullNameFromIdentity =
                fullNameFromIdentity ||
                pickString(idData.name, idData.full_name, idData.fullName);

              usernameFromMeta =
                usernameFromMeta ||
                pickString(
                  idData.user_name,
                  idData.preferred_username,
                  idData.username,
                  idData.login
                );
            }

            const fullName = fullNameFromMeta || fullNameFromIdentity;

            const providerFromIdentities: string | null =
              identities.find((i) => typeof i?.provider === "string")
                ?.provider ?? null;
            const providerFromIntent: string | null =
              (oauthIntent?.provider as string | undefined) ?? null;
            const providerUsed: string | null =
              providerFromIntent || providerFromIdentities;

            // Read existing profile so we only fill missing/placeholder values.
            const { data: existingProfile, error: existingErr } = await supabase
              .from("profiles")
              .select(
                "first_name,last_name,email,professional_title,summary,city,state,metadata"
              )
              .eq("id", user?.id)
              .maybeSingle();

            if (existingErr) {
              console.warn(
                "Failed to read existing profile during callback:",
                existingErr
              );
            }

            const existing = (existingProfile ?? null) as ProfileRow;

            const existingFirst = (existing?.first_name ?? "").trim();
            const existingLast = (existing?.last_name ?? "").trim();
            const existingEmail = (existing?.email ?? "").trim();
            const existingTitle = (existing?.professional_title ?? "").trim();
            const existingSummary = (existing?.summary ?? "").trim();
            const existingCity = (existing?.city ?? "").trim();

            const nameLooksPlaceholder =
              !existingFirst || existingFirst.toLowerCase() === "user";

            // Derive first/last name in a stable way.
            let derivedFirst = firstFromMeta;
            let derivedLast = lastFromMeta;
            if ((!derivedFirst || !derivedLast) && fullName) {
              const parts = String(fullName).split(/\s+/).filter(Boolean);
              if (!derivedFirst) derivedFirst = parts.shift() ?? null;
              if (!derivedLast)
                derivedLast = parts.length ? parts.join(" ") : null;
            }

            // Build prefill state for the profile form.
            prefill = {
              first_name: derivedFirst ?? undefined,
              last_name: derivedLast ?? undefined,
              professional_title: headlineFromMeta ?? undefined,
              headline: headlineFromMeta ?? undefined,
              bio: bioFromMeta ?? undefined,
              city: locationFromMeta ?? undefined,
              avatar_path: avatarSource ?? undefined,
              source: "oauth",
              provider: oauthIntent?.provider ?? undefined,
            };

            // Merge avatar_path into existing metadata (don't overwrite other keys)
            const existingMeta =
              (existing?.metadata as Record<string, unknown>) ?? {};
            const mergedMetadata: Record<string, unknown> = { ...existingMeta };
            if (avatarSource && !mergedMetadata.avatar_path) {
              mergedMetadata.avatar_path = avatarSource;
            }

            // Record last sign-in method/provider for UX (“Signed in with Google/LinkedIn”).
            // Keep it best-effort and do not overwrite if the user already has richer metadata.
            if (providerUsed && !mergedMetadata.auth_provider) {
              mergedMetadata.auth_provider = providerUsed;
            }
            if (!mergedMetadata.auth_method) {
              mergedMetadata.auth_method = providerUsed ? "oauth" : "email";
            }

            // Store GitHub username in metadata when available.
            if (
              providerUsed === "github" &&
              usernameFromMeta &&
              !mergedMetadata.github_username
            ) {
              mergedMetadata.github_username = usernameFromMeta;
            }
            mergedMetadata.last_auth_at = new Date().toISOString();

            const updatePayload: Record<string, unknown> = {
              updated_at: new Date().toISOString(),
            };

            if (nameLooksPlaceholder && derivedFirst) {
              updatePayload.first_name = derivedFirst;
            }
            if (!existingLast && derivedLast) {
              updatePayload.last_name = derivedLast;
            }
            if (
              (!existingEmail || existingEmail.endsWith("@no-email.local")) &&
              user?.email
            ) {
              updatePayload.email = String(user.email).trim().toLowerCase();
            }
            if (!existingTitle && headlineFromMeta) {
              updatePayload.professional_title = headlineFromMeta;
            }

            // Fill additional profile fields when empty.
            if (!existingSummary && bioFromMeta) {
              updatePayload.summary = bioFromMeta;
            }
            if (!existingCity && locationFromMeta) {
              updatePayload.city = locationFromMeta;
            }
            if (Object.keys(mergedMetadata).length > 0) {
              updatePayload.metadata = mergedMetadata;
            }

            // Only write when we have something beyond updated_at.
            if (Object.keys(updatePayload).length > 1 && user?.id) {
              const { error: updErr } = await supabase
                .from("profiles")
                .update(updatePayload)
                .eq("id", user.id);
              if (updErr) {
                console.warn(
                  "Failed to update profile after OAuth callback:",
                  updErr
                );
              }
            }

            // If this looks like a new/placeholder profile and the user came from login,
            // we still route them to profile details once to confirm.
            if (nameLooksPlaceholder) {
              shouldRouteToProfileDetails = true;
            }
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
            const identities = (s.user?.identities ?? []) as Array<{
              provider?: unknown;
            }>;

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

                  const updatePayload: Record<string, unknown> = {
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

          // Route decisions:
          // - Register intent: always send to Profile Details (linear onboarding)
          // - Login intent: send to dashboard unless the profile looks placeholder
          const returnTo = oauthIntent?.returnTo || "/profile";
          if (shouldRouteToProfileDetails) {
            navigate("/profile/details", {
              replace: true,
              state: {
                prefill,
                onboarding: oauthIntent?.source === "register",
              },
            });
          } else {
            navigate(returnTo, { replace: true });
          }
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
