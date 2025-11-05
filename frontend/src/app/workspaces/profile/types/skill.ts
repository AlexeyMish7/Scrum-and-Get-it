// Centralized types for skills

export type DbSkillRow = {
  id?: string;
  user_id?: string;
  skill_name?: string;
  proficiency_level?:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert"
    | string;
  skill_category?: string;
  meta?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

// UI representation used by AddSkills (label-friendly)
export type SkillItem = {
  id?: string;
  name: string;
  category: string;
  // Level can be either a label (string) or a numeric score (1..4).
  // We allow both because UI forms use labels while overview/drag
  // code commonly works with numeric levels for averaging/sorting.
  level: string | number; // e.g. "Beginner" or 1
  // Optional position used for client-side ordering. Stored in DB under
  // `meta.position` (JSON) to avoid an expensive schema migration.
  position?: number;
  // Preserve the raw meta object coming from the DB (if any). This is
  // helpful for future small feature flags without schema changes.
  meta?: Record<string, unknown> | null;
};

// Compact UI skill used by SkillsOverview mapping
export type UiSkill = {
  id: string;
  name: string;
  level: number; // 1..4
};

// Drag & drop and UI helper types used by SkillsOverview
import type { ReactNode } from "react";
// Use the official types from the drag/drop library to avoid type mismatches
// between our local definitions and the library's exported types.
import type {
  DroppableProvided as HPDroppableProvided,
  DraggableProvided as HPDraggableProvided,
  DropResult as HPDropResult,
} from "@hello-pangea/dnd";

export type DropResult = HPDropResult;

export type DroppableProvided = HPDroppableProvided & {
  placeholder?: ReactNode;
};

export type DraggableProvided = HPDraggableProvided;

export type Skill = {
  id: string;
  name: string;
  level: number; // 1–4
  position?: number;
};

export type Category = {
  id: string;
  name: string;
  skills: Skill[];
};
