import { describe, it, expect, vi, beforeEach } from "vitest";

const http = vi.hoisted(() => ({
  readJson: vi.fn<[], Promise<any>>(),
  sendJson: vi.fn(),
}));

const service = vi.hoisted(() => ({
  listCoverLetterDrafts: vi.fn<[], Promise<any[]>>(),
  getCoverLetterDraft: vi.fn<[], Promise<any>>(),
  createCoverLetterDraft: vi.fn<[], Promise<any>>(),
  updateCoverLetterDraft: vi.fn<[], Promise<any>>(),
  deleteCoverLetterDraft: vi.fn<[], Promise<void>>(),
}));

vi.mock("@utils/http.js", () => http);
vi.mock("@server/services/coverLetterDraftsService.js", () => service);

async function importFreshRoutes() {
  vi.resetModules();
  return await import("@server/routes/cover-letter/drafts");
}

describe("Cover Letter Drafts Routes", () => {
  beforeEach(() => {
    http.readJson.mockReset();
    http.sendJson.mockReset();

    service.listCoverLetterDrafts.mockReset();
    service.getCoverLetterDraft.mockReset();
    service.createCoverLetterDraft.mockReset();
    service.updateCoverLetterDraft.mockReset();
    service.deleteCoverLetterDraft.mockReset();
  });

  it("list() calls service and returns drafts", async () => {
    const routes = await importFreshRoutes();
    const drafts = [{ id: "d1" }, { id: "d2" }];
    service.listCoverLetterDrafts.mockResolvedValue(drafts);

    await routes.list(
      {} as any,
      {} as any,
      new URL("/", "http://x"),
      "req-1",
      "user-1"
    );

    expect(service.listCoverLetterDrafts).toHaveBeenCalledWith("user-1");
    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
      drafts,
    });
  });

  it("get() throws bad_request when draftId is missing", async () => {
    const routes = await importFreshRoutes();

    await expect(
      routes.get(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1",
        ""
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("get() calls service and returns draft", async () => {
    const routes = await importFreshRoutes();
    const draft = { id: "d1", name: "Draft 1" };
    service.getCoverLetterDraft.mockResolvedValue(draft);

    await routes.get(
      {} as any,
      {} as any,
      new URL("/", "http://x"),
      "req-1",
      "user-1",
      "d1"
    );

    expect(service.getCoverLetterDraft).toHaveBeenCalledWith("d1", "user-1");
    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
      draft,
    });
  });

  it("post() throws bad_json when body is invalid JSON", async () => {
    const routes = await importFreshRoutes();
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      routes.post(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1"
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("post() throws bad_request when name is missing", async () => {
    const routes = await importFreshRoutes();
    http.readJson.mockResolvedValueOnce({});

    await expect(
      routes.post(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1"
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("post() creates draft and returns 201", async () => {
    const routes = await importFreshRoutes();
    http.readJson.mockResolvedValueOnce({
      name: "My Draft",
      template_id: "tpl-1",
      job_id: "job-1",
      company_name: "Acme",
      job_title: "SWE",
      content: "Hello",
      metadata: { a: 1 },
      company_research: { b: 2 },
    });

    const created = { id: "d1", name: "My Draft" };
    service.createCoverLetterDraft.mockResolvedValue(created);

    await routes.post(
      {} as any,
      {} as any,
      new URL("/", "http://x"),
      "req-1",
      "user-1"
    );

    expect(service.createCoverLetterDraft).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "My Draft",
      template_id: "tpl-1",
      job_id: "job-1",
      company_name: "Acme",
      job_title: "SWE",
      content: "Hello",
      metadata: { a: 1 },
      company_research: { b: 2 },
    });

    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 201, {
      draft: created,
    });
  });

  it("patch() throws bad_request when draftId is missing", async () => {
    const routes = await importFreshRoutes();

    await expect(
      routes.patch(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1",
        ""
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("patch() throws bad_json when body is invalid JSON", async () => {
    const routes = await importFreshRoutes();
    http.readJson.mockRejectedValueOnce(new Error("parse failed"));

    await expect(
      routes.patch(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1",
        "d1"
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_json" });
  });

  it("patch() updates draft and returns 200", async () => {
    const routes = await importFreshRoutes();
    http.readJson.mockResolvedValueOnce({ name: "Updated" });

    const updated = { id: "d1", name: "Updated" };
    service.updateCoverLetterDraft.mockResolvedValue(updated);

    await routes.patch(
      {} as any,
      {} as any,
      new URL("/", "http://x"),
      "req-1",
      "user-1",
      "d1"
    );

    expect(service.updateCoverLetterDraft).toHaveBeenCalledWith(
      "d1",
      "user-1",
      { name: "Updated" }
    );

    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 200, {
      draft: updated,
    });
  });

  it("del() throws bad_request when draftId is missing", async () => {
    const routes = await importFreshRoutes();

    await expect(
      routes.del(
        {} as any,
        {} as any,
        new URL("/", "http://x"),
        "req-1",
        "user-1",
        ""
      )
    ).rejects.toMatchObject({ status: 400, code: "bad_request" });
  });

  it("del() deletes draft and returns 204", async () => {
    const routes = await importFreshRoutes();
    service.deleteCoverLetterDraft.mockResolvedValue(undefined);

    await routes.del(
      {} as any,
      {} as any,
      new URL("/", "http://x"),
      "req-1",
      "user-1",
      "d1"
    );

    expect(service.deleteCoverLetterDraft).toHaveBeenCalledWith("d1", "user-1");
    expect(http.sendJson).toHaveBeenCalledWith(expect.anything(), 204, {});
  });
});
