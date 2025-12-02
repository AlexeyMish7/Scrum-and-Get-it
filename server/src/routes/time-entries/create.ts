/**
 * TIME ENTRIES API - Create new time tracking entries
 * POST /api/time-entries
 */

import type { IncomingMessage, ServerResponse } from "http";
import { readJson, sendJson } from "../../../utils/http.js";
import { requireAuth } from "../../middleware/auth.js";
import supabaseAdmin from "../../services/supabaseAdmin.js";

interface TimeEntryRequestBody {
  activity_type: string;
  duration_minutes: number;
  energy_level?: number;
  outcome_type?: string | null;
  notes?: string | null;
}

interface ApiResponseBody {
  success: boolean;
  data?: {
    id: string;
    created_at: string;
  };
  error?: string;
}

export async function handleCreateTimeEntry(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const userId = await requireAuth(req);

    const body = (await readJson(req)) as TimeEntryRequestBody;

    if (!body.activity_type || !body.duration_minutes) {
      return sendJson(res, 400, {
        success: false,
        error: "activity_type and duration_minutes are required",
      });
    }

    if (body.duration_minutes < 1) {
      return sendJson(res, 400, {
        success: false,
        error: "duration_minutes must be greater than 0",
      });
    }

    const validActivities = [
      "applications",
      "networking",
      "research",
      "interview_prep",
      "skill_building",
      "other",
    ];

    if (!validActivities.includes(body.activity_type)) {
      return sendJson(res, 400, {
        success: false,
        error: `activity_type must be one of: ${validActivities.join(", ")}`,
      });
    }

    if (
      body.energy_level !== undefined &&
      (body.energy_level < 1 || body.energy_level > 5)
    ) {
      return sendJson(res, 400, {
        success: false,
        error: "energy_level must be between 1 and 5",
      });
    }

    if (!supabaseAdmin) {
      return sendJson(res, 500, {
        success: false,
        error: "Database not configured",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("job_time_entries")
      .insert({
        user_id: userId,
        activity_type: body.activity_type,
        duration_minutes: body.duration_minutes,
        energy_level: body.energy_level || null,
        outcome_type: body.outcome_type || null,
        notes: body.notes || null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[createTimeEntry] DB error:", error);
      return sendJson(res, 500, {
        success: false,
        error: "Failed to save time entry",
      });
    }

    return sendJson(res, 201, {
      success: true,
      data: {
        id: data.id,
        created_at: data.created_at,
      },
    });
  } catch (err: any) {
    console.error("[createTimeEntry] Unexpected error:", err);
    return sendJson(res, 500, {
      success: false,
      error: err?.message || "Unexpected server error",
    });
  }
}
