const PERSIST_QUERY_GROUP_ALLOWLIST = new Set<string>([
  "jobs",
  "documents",
  "contacts",
  "contact_reminders",
  "informational_interviews",
  "scheduled_interviews",
  "job_locations",
  "user_locations",
  "document_versions",
  // Team membership tends to be small and is reused widely.
  "team_members",
  "accountability_partnerships",
]);

export function shouldPersistQueryKey(queryKey: unknown): boolean {
  if (!Array.isArray(queryKey)) return false;
  // Our canonical keys start with ["core", <group>, ...]
  if (queryKey[0] !== "core") return false;
  const group = queryKey[1];
  return typeof group === "string" && PERSIST_QUERY_GROUP_ALLOWLIST.has(group);
}
