/**
 * UC-115: External Advisor and Coach Integration
 * Service layer for external advisor CRUD operations
 *
 * Purpose:
 * - Manage external advisor relationships (invite, update, remove)
 * - Handle coaching session scheduling and tracking
 * - Track advisor recommendations and implementation
 * - Share job materials with advisors
 * - Measure advisor impact on job search success
 */

import { supabase } from "@shared/services/supabaseClient";
import type {
  ExternalAdvisorRow,
  ExternalAdvisor,
  AdvisorInvitationRow,
  AdvisorSessionRow,
  AdvisorSession,
  AdvisorRecommendationRow,
  AdvisorRecommendation,
  AdvisorSharedMaterialRow,
  AdvisorSharedMaterial,
  AdvisorBillingRow,
  AdvisorMessageRow,
  AdvisorMessage,
  InviteAdvisorData,
  UpdateAdvisorData,
  UpdateAdvisorPermissionsData,
  CreateSessionData,
  UpdateSessionData,
  CreateRecommendationData,
  UpdateRecommendationData,
  ShareMaterialData,
  CreateBillingData,
  SendMessageData,
  AdvisorImpactMetrics,
  UpcomingSession,
  PendingRecommendation,
  AdvisorDashboardSummary,
  MessageThread,
  AdvisorFilters,
  SessionFilters,
  RecommendationFilters,
  SessionStatus,
} from "../types/advisor.types";
import type { Result } from "@shared/services/types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a secure random token for invitations
 */
function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Get current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Enrich advisor row with computed display fields
 */
function enrichAdvisor(row: ExternalAdvisorRow): ExternalAdvisor {
  // Get initials from advisor name
  const nameParts = row.advisor_name.trim().split(" ");
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : row.advisor_name.substring(0, 2).toUpperCase();

  return {
    ...row,
    display_name: row.advisor_name,
    initials,
  };
}

// ============================================================================
// ADVISOR MANAGEMENT
// ============================================================================

/**
 * Invite a new external advisor
 * Creates advisor record and sends invitation
 */
export async function inviteAdvisor(
  data: InviteAdvisorData
): Promise<Result<ExternalAdvisor>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Check if advisor already exists for this user
  const { data: existingAdvisor } = await supabase
    .from("external_advisors")
    .select("id, status")
    .eq("user_id", userId)
    .eq("advisor_email", data.advisor_email)
    .single();

  if (existingAdvisor) {
    if (existingAdvisor.status === "active") {
      return {
        data: null,
        error: {
          message: "This advisor is already connected to your account",
          status: 409,
        },
        status: 409,
      };
    }
  }

  // Create advisor record
  const advisorData: Partial<ExternalAdvisorRow> = {
    user_id: userId,
    advisor_email: data.advisor_email,
    advisor_name: data.advisor_name,
    advisor_type: data.advisor_type,
    custom_type_name: data.custom_type_name,
    organization_name: data.organization_name,
    organization_website: data.organization_website,
    advisor_title: data.advisor_title,
    status: "pending",
    can_view_profile: data.can_view_profile ?? true,
    can_view_jobs: data.can_view_jobs ?? true,
    can_view_documents: data.can_view_documents ?? false,
    can_view_analytics: data.can_view_analytics ?? false,
    can_view_interviews: data.can_view_interviews ?? false,
    can_add_recommendations: data.can_add_recommendations ?? true,
    can_schedule_sessions: data.can_schedule_sessions ?? true,
    can_send_messages: data.can_send_messages ?? true,
  };

  const { data: advisor, error: advisorError } = await supabase
    .from("external_advisors")
    .insert(advisorData)
    .select()
    .single();

  if (advisorError) {
    console.error("Error creating advisor:", advisorError);
    return {
      data: null,
      error: { message: "Failed to create advisor relationship", status: null },
      status: null,
    };
  }

  // Create invitation record
  const invitationData: Partial<AdvisorInvitationRow> = {
    advisor_id: advisor.id,
    user_id: userId,
    invitation_token: generateInvitationToken(),
    invitation_message: data.invitation_message,
    status: "pending",
  };

  const { error: invitationError } = await supabase
    .from("advisor_invitations")
    .insert(invitationData);

  if (invitationError) {
    console.error("Error creating invitation:", invitationError);
    // Rollback advisor creation
    await supabase.from("external_advisors").delete().eq("id", advisor.id);
    return {
      data: null,
      error: { message: "Failed to create invitation", status: null },
      status: null,
    };
  }

  return { data: enrichAdvisor(advisor), error: null, status: 201 };
}

/**
 * Get all advisors for the current user
 */
export async function getAdvisors(
  filters?: AdvisorFilters
): Promise<Result<ExternalAdvisor[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  let query = supabase
    .from("external_advisors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.advisor_type) {
    if (Array.isArray(filters.advisor_type)) {
      query = query.in("advisor_type", filters.advisor_type);
    } else {
      query = query.eq("advisor_type", filters.advisor_type);
    }
  }

  if (filters?.search) {
    query = query.or(
      `advisor_name.ilike.%${filters.search}%,advisor_email.ilike.%${filters.search}%,organization_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching advisors:", error);
    return {
      data: null,
      error: { message: "Failed to fetch advisors", status: null },
      status: null,
    };
  }

  return {
    data: (data as ExternalAdvisorRow[]).map(enrichAdvisor),
    error: null,
    status: 200,
  };
}

/**
 * Get a single advisor by ID
 */
export async function getAdvisor(
  advisorId: string
): Promise<Result<ExternalAdvisor>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase
    .from("external_advisors")
    .select("*")
    .eq("id", advisorId)
    .single();

  if (error) {
    console.error("Error fetching advisor:", error);
    return {
      data: null,
      error: { message: "Advisor not found", status: 404 },
      status: 404,
    };
  }

  // Verify access
  if (data.user_id !== userId && data.advisor_user_id !== userId) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  return {
    data: enrichAdvisor(data as ExternalAdvisorRow),
    error: null,
    status: 200,
  };
}

/**
 * Update advisor relationship details
 */
export async function updateAdvisor(
  advisorId: string,
  data: UpdateAdvisorData
): Promise<Result<ExternalAdvisor>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Handle status changes
  const updateData: Partial<ExternalAdvisorRow> = { ...data };
  if (data.status === "active" && !updateData.relationship_started_at) {
    updateData.relationship_started_at = new Date().toISOString();
  }
  if (data.status === "ended") {
    updateData.relationship_ended_at = new Date().toISOString();
  }

  const { data: advisor, error } = await supabase
    .from("external_advisors")
    .update(updateData)
    .eq("id", advisorId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating advisor:", error);
    return {
      data: null,
      error: { message: "Failed to update advisor", status: null },
      status: null,
    };
  }

  return {
    data: enrichAdvisor(advisor as ExternalAdvisorRow),
    error: null,
    status: 200,
  };
}

/**
 * Update advisor permissions
 */
export async function updateAdvisorPermissions(
  advisorId: string,
  permissions: UpdateAdvisorPermissionsData
): Promise<Result<ExternalAdvisor>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data: advisor, error } = await supabase
    .from("external_advisors")
    .update(permissions)
    .eq("id", advisorId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating permissions:", error);
    return {
      data: null,
      error: { message: "Failed to update permissions", status: null },
      status: null,
    };
  }

  return {
    data: enrichAdvisor(advisor as ExternalAdvisorRow),
    error: null,
    status: 200,
  };
}

/**
 * Remove an advisor relationship
 */
export async function removeAdvisor(
  advisorId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("external_advisors")
    .delete()
    .eq("id", advisorId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing advisor:", error);
    return {
      data: null,
      error: { message: "Failed to remove advisor", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Resend invitation to advisor
 */
export async function resendInvitation(
  advisorId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Verify advisor exists and is pending
  const { data: advisor, error: advisorError } = await supabase
    .from("external_advisors")
    .select("id, status")
    .eq("id", advisorId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .single();

  if (advisorError || !advisor) {
    return {
      data: null,
      error: {
        message: "Advisor not found or not in pending status",
        status: 404,
      },
      status: 404,
    };
  }

  // Update invitation with new token and reset expiry
  const { error } = await supabase
    .from("advisor_invitations")
    .update({
      invitation_token: generateInvitationToken(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      reminder_sent_at: new Date().toISOString(),
    })
    .eq("advisor_id", advisorId)
    .eq("status", "pending");

  if (error) {
    console.error("Error resending invitation:", error);
    return {
      data: null,
      error: { message: "Failed to resend invitation", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new coaching session
 */
export async function createSession(
  data: CreateSessionData
): Promise<Result<AdvisorSession>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Verify advisor relationship is active
  const { data: advisor, error: advisorError } = await supabase
    .from("external_advisors")
    .select("id, advisor_name, advisor_email, advisor_type, status")
    .eq("id", data.advisor_id)
    .single();

  if (advisorError || !advisor) {
    return {
      data: null,
      error: { message: "Advisor not found", status: 404 },
      status: 404,
    };
  }

  if (advisor.status !== "active") {
    return {
      data: null,
      error: { message: "Advisor relationship is not active", status: 400 },
      status: 400,
    };
  }

  const sessionData: Partial<AdvisorSessionRow> = {
    advisor_id: data.advisor_id,
    user_id: userId,
    title: data.title,
    description: data.description,
    session_type: data.session_type ?? "coaching",
    scheduled_start: data.scheduled_start,
    scheduled_end: data.scheduled_end,
    timezone: data.timezone ?? "America/New_York",
    location_type: data.location_type,
    meeting_url: data.meeting_url,
    meeting_id: data.meeting_id,
    phone_number: data.phone_number,
    physical_location: data.physical_location,
    status: "scheduled",
    agenda: data.agenda ?? [],
    action_items: [],
    related_job_id: data.related_job_id,
    related_document_id: data.related_document_id,
  };

  const { data: session, error } = await supabase
    .from("advisor_sessions")
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return {
      data: null,
      error: { message: "Failed to create session", status: null },
      status: null,
    };
  }

  return {
    data: {
      ...(session as AdvisorSessionRow),
      advisor: {
        id: advisor.id,
        advisor_name: advisor.advisor_name,
        advisor_email: advisor.advisor_email,
        advisor_type: advisor.advisor_type,
      },
    },
    error: null,
    status: 201,
  };
}

/**
 * Get sessions for the current user
 */
export async function getSessions(
  filters?: SessionFilters
): Promise<Result<AdvisorSession[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  let query = supabase
    .from("advisor_sessions")
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name, advisor_email, advisor_type)
    `
    )
    .eq("user_id", userId)
    .order("scheduled_start", { ascending: true });

  // Apply filters
  if (filters?.advisor_id) {
    query = query.eq("advisor_id", filters.advisor_id);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.session_type) {
    if (Array.isArray(filters.session_type)) {
      query = query.in("session_type", filters.session_type);
    } else {
      query = query.eq("session_type", filters.session_type);
    }
  }

  if (filters?.date_from) {
    query = query.gte("scheduled_start", filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte("scheduled_start", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sessions:", error);
    return {
      data: null,
      error: { message: "Failed to fetch sessions", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorSession[], error: null, status: 200 };
}

/**
 * Get upcoming sessions using database function
 */
export async function getUpcomingSessions(
  limit: number = 10
): Promise<Result<UpcomingSession[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase.rpc("get_upcoming_advisor_sessions", {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching upcoming sessions:", error);
    return {
      data: null,
      error: { message: "Failed to fetch upcoming sessions", status: null },
      status: null,
    };
  }

  return { data: data as UpcomingSession[], error: null, status: 200 };
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  data: UpdateSessionData
): Promise<Result<AdvisorSession>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Handle session completion
  const updateData: Partial<AdvisorSessionRow> = { ...data };
  if (data.status === "completed") {
    updateData.actual_end = new Date().toISOString();
  }

  const { data: session, error } = await supabase
    .from("advisor_sessions")
    .update(updateData)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name, advisor_email, advisor_type)
    `
    )
    .single();

  if (error) {
    console.error("Error updating session:", error);
    return {
      data: null,
      error: { message: "Failed to update session", status: null },
      status: null,
    };
  }

  return { data: session as AdvisorSession, error: null, status: 200 };
}

/**
 * Cancel a session
 */
export async function cancelSession(
  sessionId: string,
  reason?: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("advisor_sessions")
    .update({
      status: "cancelled" as SessionStatus,
      cancelled_by: userId,
      cancellation_reason: reason,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error cancelling session:", error);
    return {
      data: null,
      error: { message: "Failed to cancel session", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Delete a session
 */
export async function deleteSession(
  sessionId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("advisor_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting session:", error);
    return {
      data: null,
      error: { message: "Failed to delete session", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// RECOMMENDATION MANAGEMENT
// ============================================================================

/**
 * Create a new recommendation
 */
export async function createRecommendation(
  data: CreateRecommendationData
): Promise<Result<AdvisorRecommendation>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Generate IDs for implementation steps
  const implementationSteps =
    data.implementation_steps?.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
      completed: false,
    })) ?? [];

  const recommendationData: Partial<AdvisorRecommendationRow> = {
    advisor_id: data.advisor_id,
    user_id: userId,
    session_id: data.session_id,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority ?? "medium",
    status: "pending",
    target_date: data.target_date,
    expected_impact: data.expected_impact,
    implementation_steps: implementationSteps,
    related_job_id: data.related_job_id,
    related_document_id: data.related_document_id,
    related_skill: data.related_skill,
  };

  const { data: recommendation, error } = await supabase
    .from("advisor_recommendations")
    .insert(recommendationData)
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name, advisor_type)
    `
    )
    .single();

  if (error) {
    console.error("Error creating recommendation:", error);
    return {
      data: null,
      error: { message: "Failed to create recommendation", status: null },
      status: null,
    };
  }

  return {
    data: recommendation as AdvisorRecommendation,
    error: null,
    status: 201,
  };
}

/**
 * Get recommendations for the current user
 */
export async function getRecommendations(
  filters?: RecommendationFilters
): Promise<Result<AdvisorRecommendation[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  let query = supabase
    .from("advisor_recommendations")
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name, advisor_type),
      session:advisor_sessions(id, title, scheduled_start)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.advisor_id) {
    query = query.eq("advisor_id", filters.advisor_id);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.category) {
    if (Array.isArray(filters.category)) {
      query = query.in("category", filters.category);
    } else {
      query = query.eq("category", filters.category);
    }
  }

  if (filters?.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in("priority", filters.priority);
    } else {
      query = query.eq("priority", filters.priority);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching recommendations:", error);
    return {
      data: null,
      error: { message: "Failed to fetch recommendations", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorRecommendation[], error: null, status: 200 };
}

/**
 * Get pending recommendations using database function
 */
export async function getPendingRecommendations(): Promise<
  Result<PendingRecommendation[]>
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase.rpc("get_pending_recommendations", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching pending recommendations:", error);
    return {
      data: null,
      error: {
        message: "Failed to fetch pending recommendations",
        status: null,
      },
      status: null,
    };
  }

  return { data: data as PendingRecommendation[], error: null, status: 200 };
}

/**
 * Update a recommendation
 */
export async function updateRecommendation(
  recommendationId: string,
  data: UpdateRecommendationData
): Promise<Result<AdvisorRecommendation>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Handle completion timestamp
  const updateData: Partial<AdvisorRecommendationRow> = { ...data };
  if (data.status === "implemented" && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: recommendation, error } = await supabase
    .from("advisor_recommendations")
    .update(updateData)
    .eq("id", recommendationId)
    .eq("user_id", userId)
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name, advisor_type)
    `
    )
    .single();

  if (error) {
    console.error("Error updating recommendation:", error);
    return {
      data: null,
      error: { message: "Failed to update recommendation", status: null },
      status: null,
    };
  }

  return {
    data: recommendation as AdvisorRecommendation,
    error: null,
    status: 200,
  };
}

/**
 * Delete a recommendation
 */
export async function deleteRecommendation(
  recommendationId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("advisor_recommendations")
    .delete()
    .eq("id", recommendationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting recommendation:", error);
    return {
      data: null,
      error: { message: "Failed to delete recommendation", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// SHARED MATERIALS
// ============================================================================

/**
 * Share a document or job with an advisor
 */
export async function shareMaterial(
  data: ShareMaterialData
): Promise<Result<AdvisorSharedMaterial>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const materialData: Partial<AdvisorSharedMaterialRow> = {
    advisor_id: data.advisor_id,
    user_id: userId,
    material_type: data.material_type,
    document_id: data.document_id,
    document_version_id: data.document_version_id,
    job_id: data.job_id,
    share_message: data.share_message,
    expires_at: data.expires_at,
    is_active: true,
  };

  const { data: material, error } = await supabase
    .from("advisor_shared_materials")
    .insert(materialData)
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name)
    `
    )
    .single();

  if (error) {
    console.error("Error sharing material:", error);
    return {
      data: null,
      error: { message: "Failed to share material", status: null },
      status: null,
    };
  }

  return { data: material as AdvisorSharedMaterial, error: null, status: 201 };
}

/**
 * Get shared materials for an advisor
 */
export async function getSharedMaterials(
  advisorId: string
): Promise<Result<AdvisorSharedMaterial[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase
    .from("advisor_shared_materials")
    .select(
      `
      *,
      advisor:external_advisors(id, advisor_name),
      document:documents(id, type, name),
      job:jobs(id, company_name, job_title)
    `
    )
    .eq("advisor_id", advisorId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("shared_at", { ascending: false });

  if (error) {
    console.error("Error fetching shared materials:", error);
    return {
      data: null,
      error: { message: "Failed to fetch shared materials", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorSharedMaterial[], error: null, status: 200 };
}

/**
 * Revoke shared material access
 */
export async function revokeMaterialAccess(
  materialId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("advisor_shared_materials")
    .update({ is_active: false })
    .eq("id", materialId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error revoking material access:", error);
    return {
      data: null,
      error: { message: "Failed to revoke access", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// BILLING
// ============================================================================

/**
 * Create a billing record
 */
export async function createBilling(
  data: CreateBillingData
): Promise<Result<AdvisorBillingRow>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const billingData: Partial<AdvisorBillingRow> = {
    advisor_id: data.advisor_id,
    user_id: userId,
    session_id: data.session_id,
    billing_type: data.billing_type,
    description: data.description,
    amount_cents: data.amount_cents,
    currency: data.currency ?? "USD",
    status: data.status ?? "pending",
    payment_method: data.payment_method,
    due_date: data.due_date,
    notes: data.notes,
  };

  const { data: billing, error } = await supabase
    .from("advisor_billing")
    .insert(billingData)
    .select()
    .single();

  if (error) {
    console.error("Error creating billing:", error);
    return {
      data: null,
      error: { message: "Failed to create billing record", status: null },
      status: null,
    };
  }

  return { data: billing as AdvisorBillingRow, error: null, status: 201 };
}

/**
 * Get billing records for an advisor
 */
export async function getBillingRecords(
  advisorId?: string
): Promise<Result<AdvisorBillingRow[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  let query = supabase
    .from("advisor_billing")
    .select("*")
    .eq("user_id", userId)
    .order("invoice_date", { ascending: false });

  if (advisorId) {
    query = query.eq("advisor_id", advisorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching billing records:", error);
    return {
      data: null,
      error: { message: "Failed to fetch billing records", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorBillingRow[], error: null, status: 200 };
}

/**
 * Mark a billing record as paid
 */
export async function markBillingAsPaid(
  billingId: string,
  paymentReference?: string
): Promise<Result<AdvisorBillingRow>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase
    .from("advisor_billing")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference,
    })
    .eq("id", billingId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error marking billing as paid:", error);
    return {
      data: null,
      error: { message: "Failed to update billing record", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorBillingRow, error: null, status: 200 };
}

// ============================================================================
// MESSAGING
// ============================================================================

/**
 * Send a message to an advisor
 */
export async function sendMessage(
  data: SendMessageData
): Promise<Result<AdvisorMessage>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const messageData: Partial<AdvisorMessageRow> = {
    advisor_id: data.advisor_id,
    sender_id: userId,
    sender_type: "user",
    message_text: data.message_text,
    attachments: data.attachments ?? [],
    parent_message_id: data.parent_message_id,
  };

  const { data: message, error } = await supabase
    .from("advisor_messages")
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return {
      data: null,
      error: { message: "Failed to send message", status: null },
      status: null,
    };
  }

  return { data: message as AdvisorMessage, error: null, status: 201 };
}

/**
 * Get messages for an advisor conversation
 */
export async function getMessages(
  advisorId: string
): Promise<Result<AdvisorMessage[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase
    .from("advisor_messages")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return {
      data: null,
      error: { message: "Failed to fetch messages", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorMessage[], error: null, status: 200 };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  advisorId: string
): Promise<Result<boolean>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { error } = await supabase
    .from("advisor_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("advisor_id", advisorId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking messages as read:", error);
    return {
      data: null,
      error: { message: "Failed to mark messages as read", status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Get message threads (conversations) summary
 */
export async function getMessageThreads(): Promise<Result<MessageThread[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Get all active advisors with their latest messages
  const { data: advisors, error: advisorError } = await supabase
    .from("external_advisors")
    .select("id, advisor_name, advisor_email")
    .eq("user_id", userId)
    .eq("status", "active");

  if (advisorError) {
    console.error("Error fetching advisors for threads:", advisorError);
    return {
      data: null,
      error: { message: "Failed to fetch message threads", status: null },
      status: null,
    };
  }

  const threads: MessageThread[] = [];

  // Get messages and unread count for each advisor
  for (const advisor of advisors ?? []) {
    const { data: messages } = await supabase
      .from("advisor_messages")
      .select("*")
      .eq("advisor_id", advisor.id)
      .order("created_at", { ascending: false });

    const { count: unreadCount } = await supabase
      .from("advisor_messages")
      .select("*", { count: "exact", head: true })
      .eq("advisor_id", advisor.id)
      .neq("sender_id", userId)
      .eq("is_read", false);

    threads.push({
      advisor_id: advisor.id,
      advisor_name: advisor.advisor_name,
      advisor_email: advisor.advisor_email,
      last_message: messages?.[0] ?? null,
      unread_count: unreadCount ?? 0,
      messages: messages ?? [],
    });
  }

  // Sort by last message date
  threads.sort((a, b) => {
    if (!a.last_message) return 1;
    if (!b.last_message) return -1;
    return (
      new Date(b.last_message.created_at).getTime() -
      new Date(a.last_message.created_at).getTime()
    );
  });

  return { data: threads, error: null, status: 200 };
}

// ============================================================================
// ANALYTICS & IMPACT
// ============================================================================

/**
 * Get advisor impact metrics
 */
export async function getAdvisorImpact(
  advisorId?: string
): Promise<Result<AdvisorImpactMetrics[]>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  const { data, error } = await supabase.rpc("get_advisor_impact", {
    p_user_id: userId,
    p_advisor_id: advisorId ?? null,
  });

  if (error) {
    console.error("Error fetching advisor impact:", error);
    return {
      data: null,
      error: { message: "Failed to fetch advisor impact", status: null },
      status: null,
    };
  }

  return { data: data as AdvisorImpactMetrics[], error: null, status: 200 };
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(): Promise<
  Result<AdvisorDashboardSummary>
> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { message: "User not authenticated", status: 401 },
      status: 401,
    };
  }

  // Get advisor counts
  const { data: advisors } = await supabase
    .from("external_advisors")
    .select("status")
    .eq("user_id", userId);

  const totalAdvisors = advisors?.length ?? 0;
  const activeAdvisors =
    advisors?.filter((a) => a.status === "active").length ?? 0;
  const pendingInvitations =
    advisors?.filter((a) => a.status === "pending").length ?? 0;

  // Get upcoming sessions count
  const { count: upcomingSessions } = await supabase
    .from("advisor_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("scheduled_start", new Date().toISOString())
    .in("status", ["scheduled", "confirmed"]);

  // Get pending recommendations count
  const { count: pendingRecommendations } = await supabase
    .from("advisor_recommendations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "in_progress"]);

  // Get total hours and average rating
  const { data: sessionStats } = await supabase
    .from("advisor_sessions")
    .select("duration_minutes, user_rating")
    .eq("user_id", userId)
    .eq("status", "completed");

  const totalHoursCoached =
    (sessionStats?.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) ??
      0) / 60;

  const ratings = sessionStats
    ?.filter((s) => s.user_rating !== null)
    .map((s) => s.user_rating!);
  const averageRating =
    ratings && ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  return {
    data: {
      total_advisors: totalAdvisors,
      active_advisors: activeAdvisors,
      pending_invitations: pendingInvitations,
      upcoming_sessions: upcomingSessions ?? 0,
      pending_recommendations: pendingRecommendations ?? 0,
      total_hours_coached: totalHoursCoached,
      average_rating: averageRating,
    },
    error: null,
    status: 200,
  };
}
