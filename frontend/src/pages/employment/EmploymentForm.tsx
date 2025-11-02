import React from "react";
/*
  EmploymentForm (shared)
  -------------------------
  A small, reusable form fragment used by both AddEmployment and
  EditEmploymentModal. This component accepts a controlled `value` object
  and an `onFieldChange` callback and is intentionally dumb — it does not
  perform side-effects or submit data.

  User-facing behavior described here:
  - Marks required fields visually and exposes inline helper text for errors.
  - When the end date is cleared, the form automatically marks the position
    as "current" to match the common UX expectation and the database semantics.
  - Date inputs use `InputLabelProps={{ shrink: true }}` to keep the label
    floating and avoid overlapping the browser's native date hint (e.g. mm/dd/yyyy).
*/
import type { EmploymentFormData } from "../../types/employment";
import { TextField, FormControlLabel, Checkbox, Box } from "@mui/material";

type Props = {
  value: EmploymentFormData;
  onFieldChange: (
    name: keyof EmploymentFormData,
    value: string | boolean
  ) => void;
  errors?: Partial<Record<keyof EmploymentFormData, string>>;
  firstFieldRef?: React.RefObject<HTMLInputElement> | null;
};

export default function EmploymentForm({
  value,
  onFieldChange,
  errors,
  firstFieldRef,
}: Props) {
  const handleInput =
    (name: keyof EmploymentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Normalize the event value and forward to the parent. The parent is
      // responsible for updating the form state (this component is controlled).
      const target = e.target as HTMLInputElement;
      const val = target.type === "checkbox" ? target.checked : target.value;
      onFieldChange(name, val as unknown as string | boolean);
    };

  // If endDate is cleared we treat the job as current (sync UI)
  const handleEndDateBlur = () => {
    // When the user clears the end date, automatically flip the "current"
    // checkbox on so the form stays consistent with the user's intent.
    if (!value.endDate || value.endDate.trim() === "") {
      onFieldChange("isCurrent", true);
    }
  };

  return (
    <Box>
      <TextField
        label="Job Title *"
        name="jobTitle"
        value={value.jobTitle}
        onChange={handleInput("jobTitle")}
        fullWidth
        required
        margin="normal"
        inputRef={firstFieldRef ?? undefined}
        error={Boolean(errors?.jobTitle)}
        helperText={errors?.jobTitle}
      />

      <TextField
        label="Company Name *"
        name="companyName"
        value={value.companyName}
        onChange={handleInput("companyName")}
        fullWidth
        required
        margin="normal"
        error={Boolean(errors?.companyName)}
        helperText={errors?.companyName}
      />

      <TextField
        label="Location"
        name="location"
        value={value.location ?? ""}
        onChange={handleInput("location")}
        fullWidth
        margin="normal"
        error={Boolean(errors?.location)}
        helperText={errors?.location}
      />

      <TextField
        label="Start Date *"
        type="date"
        name="startDate"
        value={value.startDate}
        onChange={handleInput("startDate")}
        fullWidth
        required
        InputLabelProps={{ shrink: true }}
        margin="normal"
        error={Boolean(errors?.startDate)}
        helperText={errors?.startDate}
      />

      {!value.isCurrent && (
        <TextField
          label="End Date"
          type="date"
          name="endDate"
          value={value.endDate ?? ""}
          onChange={handleInput("endDate")}
          onBlur={handleEndDateBlur}
          fullWidth
          InputLabelProps={{ shrink: true }}
          margin="normal"
          error={Boolean(errors?.endDate)}
          helperText={errors?.endDate}
        />
      )}

      <FormControlLabel
        control={
          <Checkbox
            name="isCurrent"
            checked={Boolean(value.isCurrent)}
            onChange={(e) => onFieldChange("isCurrent", e.target.checked)}
          />
        }
        label="Current Position"
      />

      <TextField
        label="Job Description (max 1000 characters)"
        name="description"
        value={value.description ?? ""}
        onChange={handleInput("description")}
        fullWidth
        multiline
        rows={4}
        inputProps={{ maxLength: 1000 }}
        margin="normal"
        error={Boolean(errors?.description)}
        helperText={errors?.description}
      />
    </Box>
  );
}
