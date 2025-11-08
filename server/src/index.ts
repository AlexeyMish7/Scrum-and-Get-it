import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import orchestrator from "../orchestrator.js";

// Best-effort: load env vars from local .env if not already present
function loadEnvFromFile() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line || /^\s*#/.test(line)) continue;
      const m = line.match(/^\s*([^=\s]+)=(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2] ?? "";
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (e) {
    // ignore – non-fatal
  }
}

loadEnvFromFile();

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

function jsonReply(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body).toString(),
  });
  res.end(body);
}

async function readJson(req: http.IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function makePreview(content: any) {
  try {
    if (!content) return null;
    if (typeof content === "string") return content.slice(0, 400);
    if (content?.bullets && Array.isArray(content.bullets)) {
      return content.bullets
        .slice(0, 3)
        .map((b: any) => b.text ?? b)
        .join("\n");
    }
    // try to stringify small json parts
    const s = JSON.stringify(content);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch (e) {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url ?? "",
      `http://${req.headers.host ?? `localhost:${PORT}`}`
    );
    // Simple health endpoint
    if (req.method === "GET" && url.pathname === "/api/health") {
      const supaEnv = Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const aiProvider = process.env.AI_PROVIDER ?? "openai";
      const mockMode =
        (process.env.FAKE_AI ?? "false").toLowerCase() === "true";
      return jsonReply(res, 200, {
        status: "ok",
        supabase_env: supaEnv ? "present" : "missing",
        ai_provider: aiProvider,
        mock_mode: mockMode,
      });
    }
    if (req.method === "POST" && url.pathname === "/api/generate/resume") {
      // Very small auth: expect X-User-Id header (replace with real session validation)
      const userId = req.headers["x-user-id"] as string | undefined;
      if (!userId)
        return jsonReply(res, 401, { error: "missing X-User-Id header" });

      let body: any;
      try {
        body = await readJson(req);
      } catch (err: any) {
        return jsonReply(res, 400, {
          error: "invalid JSON body",
          detail: err?.message,
        });
      }

      const jobId = body?.jobId;
      // Basic validation: require numeric jobId
      if (
        jobId === undefined ||
        jobId === null ||
        Number.isNaN(Number(jobId))
      ) {
        return jsonReply(res, 400, {
          error: "jobId is required and must be a number",
        });
      }
      const options = body?.options ?? undefined;

      // Call orchestrator to produce a candidate artifact object (scaffold returns an artifact-like object)
      const start = Date.now();
      const result = await orchestrator.handleGenerateResume({
        userId,
        jobId,
        options,
      });
      const latencyMs = Date.now() - start;
      if (result.error) return jsonReply(res, 502, { error: result.error });
      const artifact = result.artifact;
      if (!artifact)
        return jsonReply(res, 500, { error: "no artifact produced" });

      // Try to persist to DB if service credentials exist; otherwise skip persistence (mock/dev mode)
      const canPersist = Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const metadata = {
        ...(artifact.metadata ?? {}),
        latency_ms: latencyMs,
        persisted: false,
      } as Record<string, unknown>;

      if (canPersist) {
        try {
          // dynamic import so file doesn't throw when env is missing
          const mod = await import("../supabaseAdmin.js");
          const insert = mod.insertAiArtifact as any;
          // mark persisted=true in metadata before insert
          const row = await insert({
            user_id: artifact.user_id,
            job_id: artifact.job_id ?? null,
            kind: artifact.kind,
            title: artifact.title ?? null,
            prompt: artifact.prompt ?? null,
            model: artifact.model ?? null,
            content: artifact.content,
            metadata: { ...metadata, persisted: true },
          });

          const preview = makePreview(artifact.content);

          return jsonReply(res, 201, {
            id: row.id,
            kind: row.kind,
            created_at: row.created_at,
            preview,
          });
        } catch (err: any) {
          console.error("failed to insert artifact", err);
          return jsonReply(res, 500, {
            error: "failed to persist artifact",
            detail: err?.message,
          });
        }
      }

      // Persistence skipped (dev/mock mode) — return temp id + preview
      try {
        metadata.persisted = false;
        const preview = makePreview(artifact.content);
        return jsonReply(res, 200, {
          id: `tmp-${Date.now()}`,
          kind: artifact.kind,
          created_at: artifact.created_at,
          persisted: false,
          preview,
          metadata,
        });
      } catch (err: any) {
        return jsonReply(res, 500, {
          error: "failed to build preview",
          detail: err?.message,
        });
      }
    }

    // Default 404
    jsonReply(res, 404, { error: "not found" });
  } catch (err: any) {
    console.error("server error", err);
    jsonReply(res, 500, { error: "server error", detail: err?.message });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI orchestrator listening on http://localhost:${PORT}`);
});

export default server;
