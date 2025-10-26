// Shared application types used across services and components

export interface Profile {
  id: string; // equals auth.users.id
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string; // storage path or object key
  kind?: "resume" | "cover_letter" | "portfolio" | "other" | null;
  mime_type?: string | null;
  bytes?: number | null;
  uploaded_at?: string | null;
}

export interface CareerEvent {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export type MaybeError = { message?: string } | null;
