import crud from "../app/shared/services/crud";
import type {
  DbEducationRow,
  EducationEntry,
  EducationFormData,
} from "../types/education";
import { dbDateToYYYYMM, formatToSqlDate } from "../utils/date";

// Central place for education table access and mapping. This keeps SELECT strings,
// mapping logic and CRUD calls in one file so components remain simple.

const PROJECTION =
  "id,degree_type,institution_name,field_of_study,graduation_date,start_date,gpa,honors,enrollment_status,meta,created_at,updated_at";

function mapRowToEntry(r: DbEducationRow): EducationEntry {
  return {
    id: r.id ?? crypto.randomUUID(),
    degree: r.degree_type ?? "",
    institution: r.institution_name ?? "",
    fieldOfStudy: r.field_of_study ?? "",
    startDate: dbDateToYYYYMM(r.start_date) ?? "",
    endDate: dbDateToYYYYMM(r.graduation_date) ?? undefined,
    gpa: r.gpa ?? undefined,
    gpaPrivate: r.meta?.privateGpa ?? false,
    honors: r.honors ?? undefined,
    active: r.enrollment_status === "enrolled",
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}

// List education entries for a specific user
export async function listEducation(userId: string) {
  const userCrud = crud.withUser(userId);
  const res = await userCrud.listRows("education", PROJECTION, {
    order: { column: "graduation_date", ascending: false },
  });
  if (res.error) return { data: null, error: res.error };
  const rows = Array.isArray(res.data)
    ? (res.data as DbEducationRow[])
    : res.data
    ? [res.data as DbEducationRow]
    : [];
  const mapped = rows.map(mapRowToEntry);
  return { data: mapped, error: null };
}

// Create a new education entry for the current user
export async function createEducation(
  userId: string,
  payload: EducationFormData
) {
  const userCrud = crud.withUser(userId);
  const dbPayload: Record<string, unknown> = {
    institution_name: payload.institution ?? null,
    degree_type: payload.degree ?? null,
    field_of_study: payload.fieldOfStudy ?? null,
    graduation_date: formatToSqlDate(payload.endDate ?? null),
    start_date: formatToSqlDate(payload.startDate ?? null),
    gpa: payload.gpa ?? null,
    enrollment_status: payload.active ? "enrolled" : "not_enrolled",
    honors: payload.honors ?? null,
    meta: { privateGpa: !!payload.gpaPrivate },
  };
  const res = await userCrud.insertRow("education", dbPayload, "*");
  if (res.error) return { data: null, error: res.error };
  const row = res.data as DbEducationRow;
  return { data: mapRowToEntry(row), error: null };
}

// Update an existing entry (id must belong to user because withUser is used)
export async function updateEducation(
  userId: string,
  id: string,
  payload: EducationFormData
) {
  const userCrud = crud.withUser(userId);
  const dbPayload: Record<string, unknown> = {
    institution_name: payload.institution ?? null,
    degree_type: payload.degree ?? null,
    field_of_study: payload.fieldOfStudy ?? null,
    graduation_date: formatToSqlDate(payload.endDate ?? null),
    start_date: formatToSqlDate(payload.startDate ?? null),
    gpa: payload.gpa ?? null,
    enrollment_status: payload.active ? "enrolled" : "not_enrolled",
    honors: payload.honors ?? null,
    meta: { privateGpa: !!payload.gpaPrivate },
  };
  const res = await userCrud.updateRow(
    "education",
    dbPayload,
    { eq: { id } },
    "*"
  );
  if (res.error) return { data: null, error: res.error };
  const row = res.data as DbEducationRow;
  return { data: mapRowToEntry(row), error: null };
}

// Delete an education entry for the user
export async function deleteEducation(userId: string, id: string) {
  const userCrud = crud.withUser(userId);
  const res = await userCrud.deleteRow("education", { eq: { id } });
  return { error: res.error };
}

export default {
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
};
