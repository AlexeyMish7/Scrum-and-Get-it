import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const tracesSampleRateRaw = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
  const tracesSampleRate = tracesSampleRateRaw
    ? Number(tracesSampleRateRaw)
    : 0;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  });
}

export function captureException(
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.captureException(error, {
    extra,
  });
}
