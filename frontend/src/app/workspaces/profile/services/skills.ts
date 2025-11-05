import crud from "@shared/services/crud";
import type { DbSkillRow, SkillItem } from "@profile/types/skill";

const PROJECTION =
  "id,skill_name,proficiency_level,skill_category,meta,created_at,updated_at";

function mapRowToSkill(r: DbSkillRow): SkillItem {
  return {
    id: r.id,
    name: r.skill_name ?? "",
    category: r.skill_category ?? "Technical",
    level: (r.proficiency_level ?? "beginner").replace(/^./, (c: string) =>
      c.toUpperCase()
    ),
    // read position from meta if present (may be number or string)
    position: (() => {
      const m = (r.meta as Record<string, unknown> | null) ?? null;
      if (!m) return undefined;
      const pVal =
        (m as Record<string, unknown>)["position"] ??
        (m as Record<string, unknown>)["pos"] ??
        (m as Record<string, unknown>)["order"];
      if (typeof pVal === "number") return pVal;
      if (typeof pVal === "string") return parseInt(pVal, 10) || undefined;
      return undefined;
    })(),
    meta: r.meta ?? null,
  };
}

export async function listSkills(userId: string) {
  const userCrud = crud.withUser(userId);
  // We intentionally do NOT request a server-side ordering here because
  // ordering is driven by `meta.position` (a JSON column) which may not
  // be expressible via the generic order helper. Instead fetch the rows
  // and let the client normalize/sort by meta.position (see below).
  const res = await userCrud.listRows("skills", PROJECTION);
  if (res.error) return { data: null, error: res.error };
  const rows = Array.isArray(res.data)
    ? (res.data as DbSkillRow[])
    : res.data
    ? [res.data as DbSkillRow]
    : [];
  const mapped = rows.map(mapRowToSkill);
  return { data: mapped, error: null };
}

export async function createSkill(userId: string, payload: DbSkillRow) {
  const userCrud = crud.withUser(userId);
  const res = await userCrud.insertRow("skills", payload, "*");
  if (res.error) return { data: null, error: res.error };
  const inserted = Array.isArray(res.data) ? res.data[0] : res.data;
  return { data: mapRowToSkill(inserted as DbSkillRow), error: null };
}

export async function updateSkill(
  userId: string,
  id: string,
  payload: Partial<DbSkillRow>
) {
  const userCrud = crud.withUser(userId);
  // If caller provided `meta`, merge it with existing row.meta to avoid
  // clobbering other metadata keys (position is stored inside meta).
  const toUpdate: Record<string, unknown> = {
    ...(payload as Record<string, unknown>),
  };
  const payloadObj = payload as Record<string, unknown>;
  if (
    payload &&
    typeof payloadObj.meta === "object" &&
    payloadObj.meta !== null
  ) {
    try {
      const existing = await userCrud.getRow<Record<string, unknown>>(
        "skills",
        "meta",
        { eq: { id }, single: true }
      );
      if (existing.error) return { data: null, error: existing.error };
      const existingData = existing.data as Record<string, unknown> | null;
      const existingMeta =
        (existingData?.meta as Record<string, unknown> | null) ?? null;
      const incomingMeta = payloadObj.meta as Record<string, unknown>;
      toUpdate.meta = {
        ...(existingMeta ?? {}),
        ...(incomingMeta ?? {}),
      } as Record<string, unknown>;
    } catch {
      // If merging fails for any reason, fall back to using the provided meta
      toUpdate.meta = payloadObj.meta as Record<string, unknown>;
    }
  }

  const res = await userCrud.updateRow("skills", toUpdate, { eq: { id } }, "*");
  if (res.error) return { data: null, error: res.error };
  const updated = Array.isArray(res.data) ? res.data[0] : res.data;
  return { data: mapRowToSkill(updated as DbSkillRow), error: null };
}

export async function deleteSkill(userId: string, id: string) {
  const userCrud = crud.withUser(userId);
  const res = await userCrud.deleteRow("skills", { eq: { id } });
  return { error: res.error };
}

export async function batchUpdateSkills(
  userId: string,
  updates: Array<{
    id: string;
    skill_category?: string;
    meta?: Record<string, unknown>;
  }>
) {
  const userCrud = crud.withUser(userId);

  // Fetch existing meta for all affected rows in one call
  const ids = updates.map((u) => u.id);
  const existingRes = await userCrud.listRows("skills", "id,meta", {
    in: { id: ids },
  });
  if (existingRes.error) return { data: null, error: existingRes.error };
  const existingRows = (existingRes.data ?? []) as Array<
    Record<string, unknown>
  >;
  const metaById: Record<string, Record<string, unknown>> = {};
  existingRows.forEach((r) => {
    const id = String(r.id ?? "");
    metaById[id] = (r.meta as Record<string, unknown>) ?? {};
  });

  const updatedRows: Array<ReturnType<typeof mapRowToSkill>> = [];

  // Apply updates sequentially to avoid race conditions merging meta.
  // Collect the updated DB rows and map them to SkillItem so the
  // caller can reconcile UI state from authoritative data immediately.
  for (const u of updates) {
    const existingMeta = metaById[u.id] ?? {};
    const incomingMeta = u.meta ?? {};
    const mergedMeta = {
      ...(existingMeta ?? {}),
      ...(incomingMeta ?? {}),
    } as Record<string, unknown>;

    const payload: Record<string, unknown> = {};
    if (u.skill_category !== undefined)
      payload.skill_category = u.skill_category;
    payload.meta = mergedMeta;

    const res = await userCrud.updateRow(
      "skills",
      payload,
      { eq: { id: u.id } },
      "*"
    );
    if (res.error) {
      return { data: null, error: res.error };
    }
    const updated = Array.isArray(res.data) ? res.data[0] : res.data;
    updatedRows.push(mapRowToSkill(updated as DbSkillRow));
  }

  return { data: updatedRows, error: null };
}

export default {
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  batchUpdateSkills,
};
