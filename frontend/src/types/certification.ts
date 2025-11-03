// Certification DB row and UI types
export type CertificationRow = {
  id: string;
  user_id: string;
  name: string;
  issuing_org?: string | null;
  category?: string | null;
  date_earned?: string | null;
  expiration_date?: string | null;
  does_not_expire?: boolean | null;
  cert_id?: string | null;
  media_path?: string | null;
  verification_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  meta?: Record<string, unknown> | null;
};

export type Certification = {
  id: string;
  name: string;
  organization: string;
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string;
  media_path?: string | null;
  mediaUrl?: string | null;
  verification_status?: string | null;
};

// Helper type used by the Certifications page when building new/edit forms.
// Placed here so other components or tests can reuse it if needed.
export type NewCert = {
  name: string;
  organization: string;
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string;
  file?: File | null;
};
