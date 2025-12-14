import { useQuery } from "@tanstack/react-query";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchContactById,
  fetchCoreContacts,
  fetchCoreDocuments,
  fetchCoreJobs,
  fetchCorePreparationActivities,
  fetchContactInteractions,
  fetchContactReminders,
  fetchNetworkingEventContacts,
  fetchInformationalInterviews,
  fetchScheduledInterviews,
  fetchJobNotesByJobId,
  fetchAnalyticsCacheDocumentMatchScores,
  fetchAccountabilityPartnershipsWithProfiles,
  fetchCoverLetterDrafts,
  fetchDocumentVersionAtsScores,
  fetchJobLocations,
  fetchProgressMessagesSince,
  fetchRecentProgressMessagesWithProfiles,
  fetchResumeDrafts,
  fetchTeamMembersWithProfiles,
  fetchTeamMessagesWithProfiles,
  fetchUserLocation,
} from "@shared/cache/coreFetchers";

const DEFAULT_CORE_STALE_TIME_MS = 60 * 60 * 1000; // 1 hour

function enabledForUser(userId: string | null | undefined, enabled?: boolean) {
  return Boolean(userId) && (enabled ?? true);
}

export function useCoreJobs<TJob = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.jobs(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchCoreJobs<TJob>(userId as string),
  });
}

export function useCoreDocuments(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.documents(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchCoreDocuments(userId as string),
  });
}

export function useCoreContacts<TContact = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.contacts(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchCoreContacts<TContact>(userId as string),
  });
}

export function useContactById<TContact = unknown>(
  userId: string | null | undefined,
  contactId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  const enabled = enabledForUser(userId, opts?.enabled) && Boolean(contactId);
  return useQuery({
    queryKey: coreKeys.contactById(userId ?? "anon", contactId ?? "none"),
    enabled,
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchContactById<TContact>(userId as string, contactId as string),
  });
}

export function useCorePreparationActivities<TPrep = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.preparationActivities(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchCorePreparationActivities<TPrep>(userId as string),
  });
}

export function useInformationalInterviews<TInterview = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.informationalInterviews(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchInformationalInterviews<TInterview>(userId as string),
  });
}

export function useScheduledInterviews<TInterview = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.scheduledInterviews(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchScheduledInterviews<TInterview>(userId as string),
  });
}

export function useJobNotesByJobId<TNote = unknown>(
  userId: string | null | undefined,
  jobId: string | number | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  const enabled = enabledForUser(userId, opts?.enabled) && jobId != null;
  return useQuery({
    queryKey: coreKeys.jobNotesByJobId(userId ?? "anon", jobId ?? "none"),
    enabled,
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchJobNotesByJobId<TNote>(userId as string, jobId as string | number),
  });
}

export function useAnalyticsCacheDocumentMatchScores<TCache = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.analyticsCacheDocumentMatchScores(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchAnalyticsCacheDocumentMatchScores<TCache>(userId as string),
  });
}

export function useContactReminders<TReminder = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number; refetchIntervalMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.contactReminders(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    refetchInterval: opts?.refetchIntervalMs,
    queryFn: () => fetchContactReminders<TReminder>(userId as string),
  });
}

export function useContactInteractions<TInteraction = unknown>(
  userId: string | null | undefined,
  contactId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  const enabled = enabledForUser(userId, opts?.enabled) && Boolean(contactId);
  return useQuery({
    queryKey: coreKeys.contactInteractions(
      userId ?? "anon",
      contactId ?? "none"
    ),
    enabled,
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchContactInteractions<TInteraction>(
        userId as string,
        contactId as string
      ),
  });
}

export function useNetworkingEventContacts<TLink = unknown>(
  userId: string | null | undefined,
  eventId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  const enabled = enabledForUser(userId, opts?.enabled) && Boolean(eventId);
  return useQuery({
    queryKey: coreKeys.networkingEventContacts(
      userId ?? "anon",
      eventId ?? "none"
    ),
    enabled,
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchNetworkingEventContacts<TLink>(userId as string, eventId as string),
  });
}

export function useDocumentVersionAtsScores(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.documentVersionAtsScores(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? 30 * 60 * 1000,
    queryFn: () => fetchDocumentVersionAtsScores(userId as string),
  });
}

export function useResumeDrafts<TDraft = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.resumeDrafts(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchResumeDrafts<TDraft>(userId as string),
  });
}

export function useCoverLetterDrafts<TDraft = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.coverLetterDrafts(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchCoverLetterDrafts<TDraft>(userId as string),
  });
}

export function useJobLocations<TLocation = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.jobLocations(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchJobLocations<TLocation>(userId as string),
  });
}

export function useUserLocation<TLocation = unknown>(
  userId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.userLocation(userId ?? "anon"),
    enabled: enabledForUser(userId, opts?.enabled),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () => fetchUserLocation<TLocation>(userId as string),
  });
}

export function useTeamMembers<TMember = unknown>(
  userId: string | null | undefined,
  teamId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.teamMembers(userId ?? "anon", teamId ?? "none"),
    enabled: enabledForUser(userId, opts?.enabled) && Boolean(teamId),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchTeamMembersWithProfiles<TMember>(userId as string, teamId as string),
  });
}

export function useAccountabilityPartnerships<TPartnership = unknown>(
  userId: string | null | undefined,
  teamId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.accountabilityPartnerships(
      userId ?? "anon",
      teamId ?? "none"
    ),
    enabled: enabledForUser(userId, opts?.enabled) && Boolean(teamId),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchAccountabilityPartnershipsWithProfiles<TPartnership>(
        userId as string,
        teamId as string
      ),
  });
}

export function useProgressMessagesSince<TMessage = unknown>(
  userId: string | null | undefined,
  teamId: string | null | undefined,
  sinceIso: string,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.progressMessagesSince(
      userId ?? "anon",
      teamId ?? "none",
      sinceIso
    ),
    enabled: enabledForUser(userId, opts?.enabled) && Boolean(teamId),
    staleTime: opts?.staleTimeMs ?? 5 * 60 * 1000,
    queryFn: () =>
      fetchProgressMessagesSince<TMessage>(
        userId as string,
        teamId as string,
        sinceIso
      ),
  });
}

export function useRecentProgressMessages<TMessage = unknown>(
  userId: string | null | undefined,
  teamId: string | null | undefined,
  limit: number,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.recentProgressMessages(
      userId ?? "anon",
      teamId ?? "none",
      limit
    ),
    enabled: enabledForUser(userId, opts?.enabled) && Boolean(teamId),
    staleTime: opts?.staleTimeMs ?? 30 * 1000,
    queryFn: () =>
      fetchRecentProgressMessagesWithProfiles<TMessage>(
        userId as string,
        teamId as string,
        limit
      ),
  });
}

export function useTeamMessages<TMessage = unknown>(
  userId: string | null | undefined,
  teamId: string | null | undefined,
  opts?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: coreKeys.teamMessages(userId ?? "anon", teamId ?? "none"),
    enabled: enabledForUser(userId, opts?.enabled) && Boolean(teamId),
    staleTime: opts?.staleTimeMs ?? DEFAULT_CORE_STALE_TIME_MS,
    queryFn: () =>
      fetchTeamMessagesWithProfiles<TMessage>(
        userId as string,
        teamId as string
      ),
  });
}
