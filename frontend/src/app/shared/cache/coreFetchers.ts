import { withUser } from "@shared/services/crud";
import * as db from "@shared/services/dbMappers";
import type { DocumentRow } from "@shared/types/database";
import { supabase } from "@shared/services/supabaseClient";

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function fetchCoreJobs<TJob = unknown>(
  userId: string
): Promise<TJob[]> {
  try {
    const res = await db.listJobs(userId);
    if (res.error) throw new Error(res.error.message || "Failed to load jobs");
    return (Array.isArray(res.data) ? (res.data as TJob[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load jobs: ${toErrorMessage(e)}`);
  }
}

export async function fetchCoreDocuments(
  userId: string
): Promise<DocumentRow[]> {
  try {
    const res = await db.listDocuments(userId);
    if (res.error)
      throw new Error(res.error.message || "Failed to load documents");
    return (Array.isArray(res.data) ? (res.data as DocumentRow[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load documents: ${toErrorMessage(e)}`);
  }
}

export async function fetchCoreContacts<TContact = unknown>(
  userId: string
): Promise<TContact[]> {
  try {
    const res = await db.listContacts(userId);
    if (res.error)
      throw new Error(res.error.message || "Failed to load contacts");
    return (Array.isArray(res.data) ? (res.data as TContact[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load contacts: ${toErrorMessage(e)}`);
  }
}

export async function fetchContactById<TContact = unknown>(
  userId: string,
  contactId: string
): Promise<TContact | null> {
  try {
    const res = await db.getContact(userId, contactId);
    if (res.error)
      throw new Error(res.error.message || "Failed to load contact");
    return (res.data as TContact | null) ?? null;
  } catch (e) {
    throw new Error(`Failed to load contact: ${toErrorMessage(e)}`);
  }
}

export async function fetchCorePreparationActivities<TPrep = unknown>(
  userId: string
): Promise<TPrep[]> {
  try {
    const res = await db.listPreparationActivities(userId, { limit: 1000 });
    if (res.error)
      throw new Error(
        res.error.message || "Failed to load preparation activities"
      );
    return (Array.isArray(res.data) ? (res.data as TPrep[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load preparation activities: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchInformationalInterviews<TInterview = unknown>(
  userId: string
): Promise<TInterview[]> {
  try {
    const res = await db.listInformationalInterviews(userId, {
      order: { column: "created_at", ascending: false },
      limit: 1000,
    });
    if (res.error)
      throw new Error(
        res.error.message || "Failed to load informational interviews"
      );
    return (Array.isArray(res.data) ? (res.data as TInterview[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load informational interviews: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchScheduledInterviews<TInterview = unknown>(
  userId: string
): Promise<TInterview[]> {
  try {
    const res = await db.listScheduledInterviews(userId);
    if (res.error)
      throw new Error(
        res.error.message || "Failed to load scheduled interviews"
      );
    return (Array.isArray(res.data) ? (res.data as TInterview[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load scheduled interviews: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchJobNotesByJobId<TNote = unknown>(
  userId: string,
  jobId: string | number
): Promise<TNote[]> {
  try {
    const res = await db.listJobNotes(userId, {
      eq: { job_id: jobId },
      order: { column: "created_at", ascending: false },
      limit: 2000,
    });
    if (res.error)
      throw new Error(res.error.message || "Failed to load job notes");
    return (Array.isArray(res.data) ? (res.data as TNote[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load job notes: ${toErrorMessage(e)}`);
  }
}

export async function fetchAnalyticsCacheDocumentMatchScores<TCache = unknown>(
  userId: string
): Promise<TCache[]> {
  try {
    const userCrud = withUser(userId);
    const res = await userCrud.listRows<TCache>(
      "analytics_cache",
      "job_id, analytics_type, data, match_score, created_at",
      {
        eq: { analytics_type: "document-match-score" },
        order: { column: "created_at", ascending: false },
        limit: 2000,
      }
    );

    if (res.error) {
      throw new Error(res.error.message || "Failed to load analytics cache");
    }

    return (Array.isArray(res.data) ? (res.data as TCache[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load analytics cache: ${toErrorMessage(e)}`);
  }
}

export async function fetchContactReminders<TReminder = unknown>(
  userId: string
): Promise<TReminder[]> {
  try {
    const res = await db.listContactReminders(userId, {
      order: { column: "remind_at", ascending: true },
      limit: 2000,
    });
    if (res.error)
      throw new Error(res.error.message || "Failed to load contact reminders");
    return (Array.isArray(res.data) ? (res.data as TReminder[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load contact reminders: ${toErrorMessage(e)}`);
  }
}

export async function fetchContactInteractions<TInteraction = unknown>(
  userId: string,
  contactId: string
): Promise<TInteraction[]> {
  try {
    const res = await db.listContactInteractions(userId, {
      eq: { contact_id: contactId },
      order: { column: "occurred_at", ascending: false },
      limit: 2000,
    });
    if (res.error)
      throw new Error(
        res.error.message || "Failed to load contact interactions"
      );
    return (Array.isArray(res.data) ? (res.data as TInteraction[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load contact interactions: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchNetworkingEventContacts<TLink = unknown>(
  userId: string,
  eventId: string
): Promise<TLink[]> {
  try {
    const res = await db.listNetworkingEventContacts(userId, {
      eq: { event_id: eventId },
      limit: 2000,
    });
    if (res.error)
      throw new Error(
        res.error.message || "Failed to load networking event contacts"
      );
    return (Array.isArray(res.data) ? (res.data as TLink[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load networking event contacts: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchResumeDrafts<TDraft = unknown>(
  userId: string
): Promise<TDraft[]> {
  try {
    const { data, error } = await supabase
      .from("resume_drafts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? (data as TDraft[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load resume drafts: ${toErrorMessage(e)}`);
  }
}

export async function fetchCoverLetterDrafts<TDraft = unknown>(
  userId: string
): Promise<TDraft[]> {
  try {
    const { data, error } = await supabase
      .from("cover_letter_drafts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? (data as TDraft[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load cover letter drafts: ${toErrorMessage(e)}`);
  }
}

export async function fetchJobLocations<TLocation = unknown>(
  userId: string
): Promise<TLocation[]> {
  try {
    // RLS should scope these rows to the signed-in user.
    // We include userId in the cache key, but the query itself relies on RLS.
    void userId;
    const { data, error } = await supabase
      .from("job_locations")
      .select("id,full_address,latitude,longitude,job_id");
    if (error) throw error;
    return (Array.isArray(data) ? (data as TLocation[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load job locations: ${toErrorMessage(e)}`);
  }
}

export async function fetchUserLocation<TLocation = unknown>(
  userId: string
): Promise<TLocation | null> {
  try {
    const { data, error } = await supabase
      .from("user_locations")
      .select("latitude,longitude")
      .eq("user_id", userId)
      .limit(1);
    if (error) throw error;
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    return (data[0] as unknown as TLocation) ?? null;
  } catch (e) {
    throw new Error(`Failed to load user location: ${toErrorMessage(e)}`);
  }
}

export async function fetchTeamMembersWithProfiles<TMember = unknown>(
  userId: string,
  teamId: string
): Promise<TMember[]> {
  try {
    // RLS scopes rows to the signed-in user; we include userId in the cache key for safety.
    void userId;
    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
          user_id,
          profiles!team_members_user_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `
      )
      .eq("team_id", teamId)
      .neq("status", "removed");
    if (error) throw error;
    return (Array.isArray(data) ? (data as TMember[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load team members: ${toErrorMessage(e)}`);
  }
}

export async function fetchAccountabilityPartnershipsWithProfiles<
  TPartnership = unknown
>(userId: string, teamId: string): Promise<TPartnership[]> {
  try {
    const { data, error } = await supabase
      .from("accountability_partnerships")
      .select(
        `
          *,
          partner:profiles!partner_id(full_name, email, professional_title),
          user:profiles!user_id(full_name, email, professional_title)
        `
      )
      .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? (data as TPartnership[]) : []) ?? [];
  } catch (e) {
    throw new Error(
      `Failed to load accountability partnerships: ${toErrorMessage(e)}`
    );
  }
}

export async function fetchProgressMessagesSince<TMessage = unknown>(
  userId: string,
  teamId: string,
  sinceIso: string
): Promise<TMessage[]> {
  try {
    const { data, error } = await supabase
      .from("progress_messages")
      .select("id,sender_id,recipient_id,message_type,created_at")
      .eq("team_id", teamId)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .gte("created_at", sinceIso);
    if (error) throw error;
    return (Array.isArray(data) ? (data as TMessage[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load progress messages: ${toErrorMessage(e)}`);
  }
}

export async function fetchRecentProgressMessagesWithProfiles<
  TMessage = unknown
>(userId: string, teamId: string, limit: number): Promise<TMessage[]> {
  try {
    const { data, error } = await supabase
      .from("progress_messages")
      .select(
        `
          *,
          sender:profiles!sender_id(full_name, email, professional_title),
          recipient:profiles!recipient_id(full_name, email, professional_title)
        `
      )
      .eq("team_id", teamId)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (Array.isArray(data) ? (data as TMessage[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load recent messages: ${toErrorMessage(e)}`);
  }
}

export async function fetchTeamMessagesWithProfiles<TMessage = unknown>(
  userId: string,
  teamId: string
): Promise<TMessage[]> {
  try {
    // RLS scopes rows to the signed-in user; we include userId in the cache key for safety.
    void userId;
    const { data, error } = await supabase
      .from("team_messages")
      .select(
        `
          id,
          sender_id,
          message_text,
          created_at,
          metadata,
          sender:profiles!sender_id(full_name, first_name, last_name)
        `
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (Array.isArray(data) ? (data as TMessage[]) : []) ?? [];
  } catch (e) {
    throw new Error(`Failed to load team messages: ${toErrorMessage(e)}`);
  }
}

export async function fetchDocumentVersionAtsScores(
  userId: string
): Promise<Array<{ ats_score: number | null }>> {
  try {
    const userCrud = withUser(userId);
    const res = await userCrud.listRows<{ ats_score: number | null }>(
      "document_versions",
      "ats_score",
      {}
    );
    if (res.error)
      throw new Error(res.error.message || "Failed to load ATS scores");
    return (
      Array.isArray(res.data)
        ? (res.data as Array<{ ats_score: number | null }>)
        : []
    ) as Array<{ ats_score: number | null }>;
  } catch (e) {
    throw new Error(`Failed to load ATS scores: ${toErrorMessage(e)}`);
  }
}
