import { describe, it, expect, vi, beforeEach } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
}));

async function importFresh() {
  vi.resetModules();
  return await import("@server/observability/sentry");
}

describe("Sentry Observability", () => {
  beforeEach(() => {
    sentry.init.mockReset();
    sentry.setUser.mockReset();
    sentry.setTag.mockReset();
    sentry.setContext.mockReset();
    sentry.captureException.mockReset();
    sentry.captureMessage.mockReset();
    sentry.flush.mockReset();
    sentry.flush.mockResolvedValue(undefined);

    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ENVIRONMENT;
    delete process.env.SENTRY_RELEASE;
    delete process.env.SENTRY_TRACES_SAMPLE_RATE;
    process.env.NODE_ENV = "test";
  });

  it("does not enable Sentry when SENTRY_DSN is missing", async () => {
    const mod = await importFresh();
    mod.__setSentryApiForTests(sentry);

    mod.initSentry();

    expect(sentry.init).not.toHaveBeenCalled();
    expect(mod.isSentryEnabled()).toBe(false);

    mod.captureException(new Error("nope"));
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("initializes once when SENTRY_DSN is set", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
    process.env.SENTRY_ENVIRONMENT = "unit-tests";
    process.env.SENTRY_RELEASE = "test-release";
    process.env.SENTRY_TRACES_SAMPLE_RATE = "0.25";

    const mod = await importFresh();
    mod.__setSentryApiForTests(sentry);

    mod.initSentry();
    mod.initSentry();

    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(mod.isSentryEnabled()).toBe(true);

    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: process.env.SENTRY_DSN,
        environment: "unit-tests",
        release: "test-release",
        tracesSampleRate: 0.25,
      })
    );
  });

  it("captureException sets context and forwards to Sentry", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

    const mod = await importFresh();
    mod.__setSentryApiForTests(sentry);
    mod.initSentry();

    const err = new Error("boom");
    mod.captureException(err, {
      userId: "user-1",
      requestId: "req-1",
      route: "/api/thing",
      method: "POST",
      status: 500,
      extra: { foo: "bar" },
    });

    expect(sentry.setUser).toHaveBeenCalledWith({ id: "user-1" });
    expect(sentry.setTag).toHaveBeenCalledWith("requestId", "req-1");
    expect(sentry.setTag).toHaveBeenCalledWith("route", "/api/thing");
    expect(sentry.setTag).toHaveBeenCalledWith("method", "POST");
    expect(sentry.setTag).toHaveBeenCalledWith("status", "500");
    expect(sentry.setContext).toHaveBeenCalledWith("extra", { foo: "bar" });
    expect(sentry.captureException).toHaveBeenCalledWith(err);
  });

  it("captureMessage forwards message when enabled", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

    const mod = await importFresh();
    mod.__setSentryApiForTests(sentry);
    mod.initSentry();

    mod.captureMessage("hello", "warning", { a: 1 });

    expect(sentry.setContext).toHaveBeenCalledWith("extra", { a: 1 });
    expect(sentry.captureMessage).toHaveBeenCalledWith("hello", "warning");
  });

  it("flushSentry calls Sentry.flush when enabled", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

    const mod = await importFresh();
    mod.__setSentryApiForTests(sentry);
    mod.initSentry();

    await mod.flushSentry(1234);
    expect(sentry.flush).toHaveBeenCalledWith(1234);
  });
});
