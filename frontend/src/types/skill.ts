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
  level: string; // e.g. "Beginner", "Intermediate"
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

export type DropResult = {
  source: { droppableId: string; index: number };
  destination?: { droppableId: string; index: number } | null;
};

export type DroppableProvided = {
  innerRef: (el: HTMLElement | null) => void;
  droppableProps: Record<string, unknown>;
  placeholder?: ReactNode;
};

export type DraggableProvided = {
  innerRef: (el: HTMLElement | null) => void;
  draggableProps: Record<string, unknown>;
  dragHandleProps?: Record<string, unknown>;
};

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
