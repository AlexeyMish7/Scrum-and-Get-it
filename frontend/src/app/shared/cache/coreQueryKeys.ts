export const coreKeys = {
  all: ["core"] as const,

  // Base lists (user-scoped)
  jobs: (userId: string) => [...coreKeys.all, "jobs", userId] as const,
  documents: (userId: string) =>
    [...coreKeys.all, "documents", userId] as const,
  contacts: (userId: string) => [...coreKeys.all, "contacts", userId] as const,
  contactById: (userId: string, contactId: string) =>
    [...coreKeys.all, "contacts", userId, "by_id", contactId] as const,
  contactReminders: (userId: string) =>
    [...coreKeys.all, "contact_reminders", userId] as const,
  contactInteractions: (userId: string, contactId: string) =>
    [...coreKeys.all, "contact_interactions", userId, contactId] as const,
  networkingEventContacts: (userId: string, eventId: string) =>
    [...coreKeys.all, "networking_event_contacts", userId, eventId] as const,
  informationalInterviews: (userId: string) =>
    [...coreKeys.all, "informational_interviews", userId] as const,
  scheduledInterviews: (userId: string) =>
    [...coreKeys.all, "scheduled_interviews", userId] as const,
  jobNotesByJobId: (userId: string, jobId: string | number) =>
    [...coreKeys.all, "job_notes", userId, String(jobId)] as const,
  preparationActivities: (userId: string) =>
    [...coreKeys.all, "preparation_activities", userId] as const,

  // Draft artifacts (user-scoped)
  resumeDrafts: (userId: string) =>
    [...coreKeys.all, "resume_drafts", userId] as const,
  coverLetterDrafts: (userId: string) =>
    [...coreKeys.all, "cover_letter_drafts", userId] as const,

  // Location datasets (user-scoped via RLS)
  jobLocations: (userId: string) =>
    [...coreKeys.all, "job_locations", userId] as const,
  userLocation: (userId: string) =>
    [...coreKeys.all, "user_locations", userId] as const,

  // Team management datasets (team-scoped, but keyed by user to avoid cross-user collisions)
  teamMembers: (userId: string, teamId: string) =>
    [...coreKeys.all, "team_members", userId, teamId] as const,
  teamInsights: (userId: string, teamId: string) =>
    [...coreKeys.all, "team_insights", userId, teamId] as const,
  teamMessages: (userId: string, teamId: string) =>
    [...coreKeys.all, "team_messages", userId, teamId] as const,
  accountabilityPartnerships: (userId: string, teamId: string) =>
    [...coreKeys.all, "accountability_partnerships", userId, teamId] as const,
  progressMessagesPeriod: (userId: string, teamId: string, period: string) =>
    [
      ...coreKeys.all,
      "progress_messages",
      userId,
      teamId,
      "period",
      period,
    ] as const,
  progressMessagesSince: (userId: string, teamId: string, sinceIso: string) =>
    [
      ...coreKeys.all,
      "progress_messages",
      userId,
      teamId,
      "since",
      sinceIso,
    ] as const,
  recentProgressMessages: (userId: string, teamId: string, limit: number) =>
    [
      ...coreKeys.all,
      "progress_messages",
      userId,
      teamId,
      "recent",
      limit,
    ] as const,

  teamActivityLog: (userId: string, teamId: string, limit: number) =>
    [...coreKeys.all, "team_activity_log", userId, teamId, limit] as const,
  teamAchievements: (userId: string, teamId: string, limit: number) =>
    [...coreKeys.all, "team_achievements", userId, teamId, limit] as const,

  // Narrow/derived datasets that are still shared and cacheable
  documentVersionAtsScores: (userId: string) =>
    [...coreKeys.all, "document_versions", userId, "ats_score"] as const,

  // Job analytics cache (user-scoped via RLS)
  analyticsCacheDocumentMatchScores: (userId: string) =>
    [
      ...coreKeys.all,
      "analytics_cache",
      userId,
      "document-match-score",
    ] as const,
};
