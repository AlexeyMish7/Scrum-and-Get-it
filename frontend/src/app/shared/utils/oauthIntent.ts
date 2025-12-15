export type OAuthIntentSource = "login" | "register" | "connect";

export type OAuthIntent = {
  source: OAuthIntentSource;
  /** Where to send the user after callback when no onboarding is needed */
  returnTo?: string;
  /** Provider key used to start OAuth (e.g. "google", "linkedin_oidc") */
  provider?: string;
  startedAt: number;
};

const OAUTH_INTENT_KEY = "app.auth.oauthIntent";

export function setOAuthIntent(intent: OAuthIntent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OAUTH_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // Swallow storage errors
  }
}

export function readOAuthIntent(): OAuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OAUTH_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OAuthIntent;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.startedAt || typeof parsed.startedAt !== "number") return null;
    if (
      parsed.source !== "login" &&
      parsed.source !== "register" &&
      parsed.source !== "connect"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consumeOAuthIntent(): OAuthIntent | null {
  if (typeof window === "undefined") return null;
  const intent = readOAuthIntent();
  try {
    window.localStorage.removeItem(OAUTH_INTENT_KEY);
  } catch {
    // Swallow
  }
  return intent;
}
