import * as Sentry from "@sentry/node";

let sentryEnabled = false;
let sentryInitialized = false;

type SentryApi = Pick<
  typeof Sentry,
  | "init"
  | "setUser"
  | "setTag"
  | "setContext"
  | "captureException"
  | "captureMessage"
  | "flush"
>;

let sentryApi: SentryApi = Sentry;

export function __setSentryApiForTests(api: SentryApi): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__setSentryApiForTests is only available in test env");
  }
  sentryApi = api;
}

export function __resetSentryForTests(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("__resetSentryForTests is only available in test env");
  }
  sentryApi = Sentry;
  sentryEnabled = false;
  sentryInitialized = false;
}

export function initSentry(): void {
  if (sentryInitialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    sentryEnabled = false;
    sentryInitialized = true;
    return;
  }

  const environment =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "development";

  const tracesSampleRateRaw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  const tracesSampleRate = tracesSampleRateRaw
    ? Number(tracesSampleRateRaw)
    : 0;

  sentryApi.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  });

  sentryEnabled = true;
  sentryInitialized = true;
}

export function isSentryEnabled(): boolean {
  return sentryEnabled;
}

export function captureException(
  err: unknown,
  context?: {
    requestId?: string;
    userId?: string;
    route?: string;
    method?: string;
    status?: number;
    extra?: Record<string, unknown>;
  }
): void {
  if (!sentryEnabled) return;

  if (context?.userId) {
    sentryApi.setUser({ id: context.userId });
  }

  if (context?.requestId) {
    sentryApi.setTag("requestId", context.requestId);
  }

  if (context?.route) {
    sentryApi.setTag("route", context.route);
  }

  if (context?.method) {
    sentryApi.setTag("method", context.method);
  }

  if (typeof context?.status === "number") {
    sentryApi.setTag("status", String(context.status));
  }

  if (context?.extra) {
    sentryApi.setContext("extra", context.extra);
  }

  sentryApi.captureException(err);
}

export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "error",
  extra?: Record<string, unknown>
): void {
  if (!sentryEnabled) return;
  if (extra) {
    sentryApi.setContext("extra", extra);
  }
  sentryApi.captureMessage(message, level);
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentryEnabled) return;
  try {
    await sentryApi.flush(timeoutMs);
  } catch {
    // ignore flush failures
  }
}
