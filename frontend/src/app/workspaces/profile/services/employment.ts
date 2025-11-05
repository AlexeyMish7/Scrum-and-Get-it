import * as crud from "../../../shared/services/crud";
import type { EmploymentRow } from "../../../../types/employment";

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
