// UI shape for the profile form
export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  headline: string;
  bio: string;
  industry: string;
  experience: string;
}

// DB row shape (partial) — for internal use in mapping functions
export type ProfileRow = Record<string, unknown>;
