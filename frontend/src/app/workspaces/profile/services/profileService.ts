import crud from "@shared/services/crud";
import type { ProfileData } from "@profile/types/profile";

/**
 * Map a DB profile row to the UI-friendly ProfileData shape
 */
export function mapRowToProfile(
  row: Record<string, unknown> | null
): ProfileData {
  const first = (row?.["first_name"] as string) ?? "";
  const last = (row?.["last_name"] as string) ?? "";
  const combinedName = `${first}${last ? ` ${last}` : ""}`.trim();

  return {
    fullName: combinedName,
    email: (row?.["email"] as string) ?? "",
    phone: (row?.["phone"] as string) ?? "",
    city: (row?.["city"] as string) ?? "",
    state: (row?.["state"] as string) ?? "",
    headline: (row?.["professional_title"] as string) ?? "",
    bio: (row?.["summary"] as string) ?? "",
    industry: (row?.["industry"] as string) ?? "",
    experience: row?.["experience_level"]
      ? String(row["experience_level"]).charAt(0).toUpperCase() +
        String(row["experience_level"]).slice(1)
      : "",
    zipcode: (row?.["zipcode"] as string) ?? null,
  };
}

/**
 * Fetch the profile row and return the mapped ProfileData
 */
export async function getProfile(userId: string) {
  return crud.getUserProfile(userId);
}

/**
 * Upsert a profile using a ProfileData shape. Returns the CRUD response.
 * Normalizes email and experience level for storage.
 */
export async function upsertProfile(userId: string, data: ProfileData) {
  const payload: Record<string, unknown> = {
    id: userId,
    // Split fullName into first_name / last_name to satisfy NOT NULL constraints
    first_name: (data.fullName || "").trim().split(/\s+/).slice(0, 1)[0] || "",
    last_name:
      (data.fullName || "").trim().split(/\s+/).slice(1).join(" ") || "",
    email: data.email?.trim().toLowerCase() ?? null,
    phone: data.phone ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    professional_title: data.headline ?? null,
    summary: data.bio ?? null,
    industry: data.industry ?? null,
    experience_level: data.experience ? data.experience.toLowerCase() : null,
    zipcode: data.zipcode ?? null,
  };

  return crud.upsertRow("profiles", payload, "id");
}

export default { mapRowToProfile, getProfile, upsertProfile };
