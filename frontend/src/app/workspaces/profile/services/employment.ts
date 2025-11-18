import * as crud from "@shared/services/crud";
import { supabase } from "@shared/services/supabaseClient";
import type { EmploymentRow } from "@profile/types/employment";

const listEmployment = async (userId: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.listRows("employment", "*", {
    order: { column: "start_date", ascending: false },
  });
};

const insertEmployment = async (
  userId: string,
  payload: Partial<EmploymentRow>
) => {
  const userCrud = crud.withUser(userId);

  // Ensure profile exists (employment table has FK to profiles)
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!profileData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        first_name: user.user_metadata?.first_name || "User",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
      });
      if (profileError) {
        console.error("Profile creation failed:", profileError);
      }
    }
  }

  return await userCrud.insertRow("employment", payload, "*");
};

const updateEmployment = async (
  userId: string,
  id: string,
  payload: Partial<EmploymentRow>
) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.updateRow("employment", payload, { eq: { id } });
};

const deleteEmployment = async (userId: string, id: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.deleteRow("employment", { eq: { id } });
};

export default {
  listEmployment,
  insertEmployment,
  updateEmployment,
  deleteEmployment,
};
