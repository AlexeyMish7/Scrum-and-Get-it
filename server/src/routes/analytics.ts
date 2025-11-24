// Lightweight analytics route handlers (stubs)
// Exports follow the project's route conventions: get/post/getTrends/getBenchmarks

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../utils/http.js";
import { tryAuth } from "../middleware/auth.js";
import supabaseAdmin from "../services/supabaseAdmin.js";
import {
  computeOverview,
  computeTrends,
  computeBenchmarks,
  seedInMemory,
} from "../services/analyticsService.js";

export async function post(req: IncomingMessage, res: ServerResponse) {
  // POST /api/analytics/ingest
  // Accepts payload: { interview: {...}, feedbacks?: [...], confidenceLogs?: [...] }
  try {
    const body = (await readJson(req)) as any;
    const client = supabaseAdmin;
    if (!client) {
      // Supabase not configured — seed into in-memory store for local QA
      const targetUser = body.interview?.user_id ?? (body.confidenceLogs && body.confidenceLogs[0]?.user_id);
      if (!targetUser) return sendJson(res, 400, { error: "Missing user_id in payload" });
      seedInMemory(targetUser, body);
      return sendJson(res, 201, { ok: true, seeded: true });
    }

    let createdInterview: any = null;
    if (body.interview) {
      const row = { ...body.interview };
      const { data, error } = await client.from("interviews").insert([row]).select().single();
      if (error) throw error;
      createdInterview = data;
    }

    if (Array.isArray(body.feedbacks) && body.feedbacks.length > 0) {
      const rows = body.feedbacks.map((f: any) => ({
        interview_id: f.interview_id ?? createdInterview?.id,
        provider: f.provider,
        feedback_text: f.feedback_text,
        themes: f.themes ?? [],
        rating: f.rating ?? null,
      }));
      const { error } = await client.from("interview_feedback").insert(rows);
      if (error) throw error;
    }

    if (Array.isArray(body.confidenceLogs) && body.confidenceLogs.length > 0) {
      const rows = body.confidenceLogs.map((c: any) => ({
        user_id: c.user_id,
        interview_id: c.interview_id ?? createdInterview?.id,
        logged_at: c.logged_at ?? new Date().toISOString(),
        confidence_level: c.confidence_level ?? null,
        anxiety_level: c.anxiety_level ?? null,
        notes: c.notes ?? null,
      }));
      const { error } = await client.from("confidence_logs").insert(rows);
      if (error) throw error;
    }

    return sendJson(res, 201, { ok: true, created: createdInterview });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message ?? String(err) });
  }
}

export async function get(req: IncomingMessage, res: ServerResponse) {
  // GET /api/analytics/overview
  try {
    // allow optional dev query override: /api/analytics/overview?userId=<id>
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const queryUser = url.searchParams.get("userId");
    let userId: string | null = null;
    try {
      userId = await tryAuth(req);
    } catch {
      // try query param fallback
      if (queryUser) userId = queryUser;
    }

    if (!userId) {
      // Fallback: return a sample response for anonymous requests
      return sendJson(res, 200, {
        conversionRate: 0.12,
        interviewsCount: 34,
        offersCount: 4,
      });
    }
    const data = await computeOverview(userId);
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message ?? String(err) });
  }
}

export async function getTrends(req: IncomingMessage, res: ServerResponse) {
  // GET /api/analytics/trends
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const queryUser = url.searchParams.get("userId");
    let userId: string | null = null;
    try {
      userId = await tryAuth(req);
    } catch {
      if (queryUser) userId = queryUser;
    }

    if (!userId) {
      return sendJson(res, 200, {
        conversionTimeseries: [
          { date: "2025-07-01", conversion: 0.05 },
          { date: "2025-08-01", conversion: 0.1 },
          { date: "2025-09-01", conversion: 0.08 },
          { date: "2025-10-01", conversion: 0.12 },
          { date: "2025-11-01", conversion: 0.15 },
        ],
        confidenceTimeseries: [],
        industryComparison: [],
      });
    }

    const data = await computeTrends(userId);
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message ?? String(err) });
  }
}

export async function getBenchmarks(req: IncomingMessage, res: ServerResponse) {
  try {
    const data = await computeBenchmarks();
    return sendJson(res, 200, data);
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message ?? String(err) });
  }
}
