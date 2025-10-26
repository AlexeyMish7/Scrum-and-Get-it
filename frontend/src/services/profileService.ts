import type { Profile } from "../types";
import * as crud from "./crud";

const TABLE = "profiles";

export async function getProfile(userId: string) {
  return crud.getById<Profile>(
    TABLE,
    userId,
    "first_name,last_name,full_name,email,created_at,updated_at"
  );
}

export async function upsertProfile(userId: string, payload: Partial<Profile>) {
  const row: Partial<Profile> = { id: userId, ...payload };
  return crud.upsertRow<Profile>(TABLE, row, "id");
}

export async function deleteProfile(userId: string) {
  return crud.deleteById(TABLE, userId);
}
