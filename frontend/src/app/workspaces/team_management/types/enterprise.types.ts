/**
 * Enterprise Career Services Type Definitions
 *
 * TypeScript interfaces for UC-114: Corporate Career Services Integration
 * Supports cohort management, program analytics, ROI tracking, branding,
 * compliance, and external integrations for enterprise customers.
 */

// ============================================================================
// ENUMS (matching database enum types)
// ============================================================================

export type CohortStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type OnboardingJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "partial";

export type IntegrationType =
  | "lms"
  | "sis"
  | "crm"
  | "calendar"
  | "sso"
  | "analytics"
  | "job_board"
  | "ats"
  | "custom_webhook";

export type ComplianceEventType =
  | "user_data_access"
  | "user_data_export"
  | "user_data_delete"
  | "settings_change"
  | "role_change"
  | "bulk_operation"
  | "integration_access"
  | "report_generated"
  | "login_attempt"
  | "permission_change";

export type ReportType = "program" | "cohort" | "quarterly" | "annual";

export type ReportStatus = "draft" | "published" | "archived";

export type CompletionStatus =
  | "in_progress"
  | "completed"
  | "withdrawn"
  | "placed";

export type SyncFrequency =
  | "realtime"
  | "hourly"
  | "daily"
  | "weekly"
  | "manual";

export type SyncDirection = "inbound" | "outbound" | "bidirectional";

export type AuthType = "api_key" | "oauth2" | "basic" | "jwt";

// ============================================================================
// DATABASE ROW TYPES (match table schemas exactly)
// ============================================================================

/**
 * Cohort table row
 * Represents a group of job seekers in a program
 */
export interface CohortRow {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  program_type: string | null;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  target_placement_rate: number | null;
  target_avg_salary: number | null;
  target_time_to_placement: number | null;
  settings: CohortSettings;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined field for member count (may not be in DB row)
  member_count?: number;
}

/**
 * Cohort member table row
 * Links users to cohorts with progress tracking
 */
export interface CohortMemberRow {
  id: string;
  cohort_id: string;
  user_id: string;
  enrolled_at: string;
  enrolled_by: string | null;
  is_active: boolean;
  completion_status: CompletionStatus;
  placed_at: string | null;
  placement_company: string | null;
  placement_role: string | null;
  placement_salary: number | null;
  progress_score: number;
  last_activity_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Program analytics table row
 * Aggregate metrics for cohorts and programs
 */
export interface ProgramAnalyticsRow {
  id: string;
  team_id: string;
  cohort_id: string | null;
  period_start: string;
  period_end: string;
  granularity: "daily" | "weekly" | "monthly" | "quarterly";
  total_enrolled: number;
  active_users: number;
  new_enrollments: number;
  withdrawals: number;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_placements: number;
  application_to_interview_rate: number | null;
  interview_to_offer_rate: number | null;
  offer_acceptance_rate: number | null;
  overall_placement_rate: number | null;
  avg_time_to_first_interview: number | null;
  avg_time_to_offer: number | null;
  avg_time_to_placement: number | null;
  avg_starting_salary: number | null;
  median_starting_salary: number | null;
  min_salary: number | null;
  max_salary: number | null;
  avg_weekly_applications: number | null;
  avg_profile_completeness: number | null;
  active_user_rate: number | null;
  industry_breakdown: Record<string, number>;
  role_breakdown: Record<string, number>;
  company_size_breakdown: Record<string, number>;
  calculated_at: string;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * ROI report table row
 * Program return on investment tracking
 */
export interface ROIReportRow {
  id: string;
  team_id: string;
  cohort_id: string | null;
  report_name: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  total_program_cost: number | null;
  cost_per_participant: number | null;
  staff_hours_invested: number | null;
  technology_costs: number | null;
  total_placements: number;
  placement_rate: number | null;
  avg_salary_increase: number | null;
  total_salary_value: number | null;
  cost_per_placement: number | null;
  roi_percentage: number | null;
  payback_period_months: number | null;
  industry_benchmark_placement_rate: number | null;
  performance_vs_benchmark: number | null;
  metrics_breakdown: Record<string, unknown>;
  recommendations: ROIRecommendation[];
  status: ReportStatus;
  generated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Enterprise branding table row
 * White-label customization for institutions
 */
export interface EnterpriseBrandingRow {
  id: string;
  team_id: string;
  organization_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  heading_font_family: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  ssl_certificate_expires_at: string | null;
  email_from_name: string | null;
  email_from_address: string | null;
  email_footer_text: string | null;
  email_logo_url: string | null;
  login_background_url: string | null;
  login_welcome_text: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  custom_legal_text: string | null;
  feature_flags: BrandingFeatureFlags;
  custom_css: string | null;
  custom_js: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Compliance log table row
 * Audit trail for data access and changes
 */
export interface ComplianceLogRow {
  id: string;
  team_id: string;
  event_type: ComplianceEventType;
  event_description: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_ip_address: string | null;
  actor_user_agent: string | null;
  target_user_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  data_classification: string | null;
  compliance_framework: string | null;
  retention_required_until: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * External integration table row
 * Connections to third-party platforms
 */
export interface ExternalIntegrationRow {
  id: string;
  team_id: string;
  name: string;
  integration_type: IntegrationType;
  provider: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
  auth_type: AuthType;
  credentials_encrypted: Record<string, unknown> | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error_message: string | null;
  sync_frequency: SyncFrequency;
  sync_direction: SyncDirection;
  field_mappings: Record<string, string>;
  sync_settings: IntegrationSyncSettings;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Bulk onboarding job table row
 * Track mass user imports
 */
export interface BulkOnboardingJobRow {
  id: string;
  team_id: string;
  cohort_id: string | null;
  job_name: string | null;
  status: OnboardingJobStatus;
  source_type: string;
  source_file_url: string | null;
  source_integration_id: string | null;
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  skipped_records: number;
  error_log: OnboardingError[];
  options: OnboardingOptions;
  started_at: string | null;
  completed_at: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NESTED JSONB TYPES
// ============================================================================

/**
 * Cohort settings stored in cohorts.settings column
 */
export interface CohortSettings {
  auto_assign_mentors: boolean;
  require_weekly_checkin: boolean;
  enable_peer_networking: boolean;
  share_aggregate_progress: boolean;
  notification_preferences?: {
    milestone_alerts: boolean;
    weekly_digest: boolean;
  };
}

/**
 * ROI report recommendation item
 */
export interface ROIRecommendation {
  category: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  potential_impact: string;
}

/**
 * Branding feature flags
 */
export interface BrandingFeatureFlags {
  show_powered_by: boolean;
  allow_social_login: boolean;
  enable_custom_css: boolean;
  enable_custom_js: boolean;
}

/**
 * Integration sync settings
 */
export interface IntegrationSyncSettings {
  auto_create_users: boolean;
  update_existing: boolean;
  sync_placements: boolean;
}

/**
 * Onboarding job options
 */
export interface OnboardingOptions {
  send_welcome_email: boolean;
  skip_duplicates: boolean;
  auto_assign_mentor: boolean;
  default_role: string;
}

/**
 * Onboarding error log entry
 */
export interface OnboardingError {
  row: number;
  error: string;
  data: Record<string, unknown>;
}

// ============================================================================
// ENRICHED TYPES (with joined data for UI)
// ============================================================================

/**
 * Cohort with member list and statistics
 */
export interface CohortWithMembers extends CohortRow {
  members: CohortMemberWithProfile[];
  stats?: CohortStats;
}

/**
 * Cohort member with user profile data
 */
export interface CohortMemberWithProfile extends CohortMemberRow {
  profile: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    professional_title: string | null;
  };
}

/**
 * Cohort statistics summary
 */
export interface CohortStats {
  enrolled_count: number;
  active_count: number;
  placed_count: number;
  placement_rate: number;
  avg_salary: number | null;
  avg_time_to_placement: number | null;
}

/**
 * Team-level cohort statistics
 */
export interface TeamCohortStats {
  total_cohorts: number;
  active_cohorts: number;
  total_enrolled: number;
  total_placed: number;
  avg_placement_rate: number;
}

/**
 * External integration with sync status
 */
export interface IntegrationWithStatus extends ExternalIntegrationRow {
  sync_health: "healthy" | "warning" | "error" | "unknown";
  last_sync_duration_ms?: number;
}

/**
 * Bulk onboarding job with progress percentage
 */
export interface OnboardingJobWithProgress extends BulkOnboardingJobRow {
  progress_percentage: number;
  estimated_time_remaining_ms?: number;
}

// ============================================================================
// FORM DATA TYPES (for creating/updating records)
// ============================================================================

/**
 * Form data for creating a new cohort
 */
export interface CreateCohortData {
  name: string;
  description?: string;
  program_type?: string;
  start_date?: string;
  end_date?: string;
  max_capacity?: number;
  target_placement_rate?: number;
  target_avg_salary?: number;
  target_time_to_placement?: number;
  settings?: Partial<CohortSettings>;
}

/**
 * Form data for updating a cohort
 */
export interface UpdateCohortData extends Partial<CreateCohortData> {
  status?: CohortStatus;
}

/**
 * Form data for adding members to a cohort
 */
export interface AddCohortMembersData {
  user_ids: string[];
  notes?: string;
}

/**
 * Form data for updating a cohort member
 */
export interface UpdateCohortMemberData {
  completion_status?: CompletionStatus;
  placed_at?: string;
  placement_company?: string;
  placement_role?: string;
  placement_salary?: number;
  progress_score?: number;
  notes?: string;
}

/**
 * Form data for creating an ROI report
 */
export interface CreateROIReportData {
  report_name: string;
  report_type: ReportType;
  cohort_id?: string;
  period_start: string;
  period_end: string;
  total_program_cost?: number;
  cost_per_participant?: number;
  staff_hours_invested?: number;
  technology_costs?: number;
}

/**
 * Form data for updating branding
 */
export interface UpdateBrandingData {
  organization_name?: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  heading_font_family?: string;
  custom_domain?: string;
  email_from_name?: string;
  email_from_address?: string;
  email_footer_text?: string;
  email_logo_url?: string;
  login_background_url?: string;
  login_welcome_text?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  custom_legal_text?: string;
  feature_flags?: Partial<BrandingFeatureFlags>;
  custom_css?: string;
  custom_js?: string;
}

/**
 * Form data for creating an external integration
 */
export interface CreateIntegrationData {
  name: string;
  integration_type: IntegrationType;
  provider?: string;
  api_endpoint?: string;
  webhook_url?: string;
  auth_type: AuthType;
  credentials?: Record<string, string>;
  sync_frequency?: SyncFrequency;
  sync_direction?: SyncDirection;
  field_mappings?: Record<string, string>;
  sync_settings?: Partial<IntegrationSyncSettings>;
}

/**
 * Form data for bulk onboarding
 */
export interface CreateBulkOnboardingData {
  job_name?: string;
  cohort_id?: string;
  source_type: "csv_upload" | "api_import" | "integration_sync";
  source_file_url?: string;
  source_integration_id?: string;
  users: BulkOnboardingUser[];
  options?: Partial<OnboardingOptions>;
}

/**
 * User data for bulk onboarding
 */
export interface BulkOnboardingUser {
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Form data for logging compliance events
 */
export interface LogComplianceEventData {
  event_type: ComplianceEventType;
  event_description: string;
  target_user_id?: string;
  target_resource_type?: string;
  target_resource_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  data_classification?: string;
  compliance_framework?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface EnterpriseApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    status: number | null;
  } | null;
}

/**
 * Analytics summary for dashboard
 */
export interface AnalyticsSummary {
  period: string;
  total_enrolled: number;
  active_users: number;
  total_placements: number;
  placement_rate: number;
  avg_salary: number | null;
  trend: "up" | "down" | "stable";
  trend_percentage: number;
}

/**
 * Program effectiveness metrics
 */
export interface ProgramEffectiveness {
  cohort_id: string;
  cohort_name: string;
  placement_rate: number;
  target_placement_rate: number;
  performance_vs_target: number;
  avg_time_to_placement: number;
  participant_satisfaction: number | null;
  roi_percentage: number | null;
}

/**
 * Compliance report summary
 */
export interface ComplianceReportSummary {
  total_events: number;
  events_by_type: Record<ComplianceEventType, number>;
  data_access_events: number;
  settings_changes: number;
  export_events: number;
  period_start: string;
  period_end: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Integration provider configuration
 */
export interface IntegrationProviderConfig {
  provider: string;
  integration_type: IntegrationType;
  display_name: string;
  description: string;
  logo_url: string;
  auth_type: AuthType;
  required_fields: string[];
  optional_fields: string[];
}

/**
 * Available integration providers
 */
export const INTEGRATION_PROVIDERS: IntegrationProviderConfig[] = [
  {
    provider: "salesforce",
    integration_type: "crm",
    display_name: "Salesforce",
    description: "Sync contacts and placement data with Salesforce CRM",
    logo_url: "/integrations/salesforce.svg",
    auth_type: "oauth2",
    required_fields: ["client_id", "client_secret"],
    optional_fields: ["sandbox_mode"],
  },
  {
    provider: "canvas",
    integration_type: "lms",
    display_name: "Canvas LMS",
    description: "Import students from Canvas Learning Management System",
    logo_url: "/integrations/canvas.svg",
    auth_type: "api_key",
    required_fields: ["api_key", "domain"],
    optional_fields: ["course_id"],
  },
  {
    provider: "handshake",
    integration_type: "job_board",
    display_name: "Handshake",
    description: "Connect with Handshake career services platform",
    logo_url: "/integrations/handshake.svg",
    auth_type: "oauth2",
    required_fields: ["client_id", "client_secret"],
    optional_fields: [],
  },
  {
    provider: "linkedin",
    integration_type: "job_board",
    display_name: "LinkedIn",
    description: "Track placements and job applications from LinkedIn",
    logo_url: "/integrations/linkedin.svg",
    auth_type: "oauth2",
    required_fields: ["client_id", "client_secret"],
    optional_fields: [],
  },
  {
    provider: "google_calendar",
    integration_type: "calendar",
    display_name: "Google Calendar",
    description: "Sync interview schedules with Google Calendar",
    logo_url: "/integrations/google-calendar.svg",
    auth_type: "oauth2",
    required_fields: ["client_id", "client_secret"],
    optional_fields: [],
  },
  {
    provider: "okta",
    integration_type: "sso",
    display_name: "Okta SSO",
    description: "Single sign-on integration with Okta",
    logo_url: "/integrations/okta.svg",
    auth_type: "oauth2",
    required_fields: ["domain", "client_id", "client_secret"],
    optional_fields: [],
  },
  {
    provider: "custom_webhook",
    integration_type: "custom_webhook",
    display_name: "Custom Webhook",
    description: "Send data to any system via custom webhooks",
    logo_url: "/integrations/webhook.svg",
    auth_type: "api_key",
    required_fields: ["webhook_url"],
    optional_fields: ["secret_key", "headers"],
  },
];

/**
 * Program type options for cohorts
 */
export const PROGRAM_TYPES = [
  "Career Bootcamp",
  "Alumni Services",
  "Graduate Program",
  "Corporate Training",
  "Workforce Development",
  "Internship Program",
  "Career Transition",
  "Executive Coaching",
  "Industry Partnership",
  "Custom Program",
] as const;

/**
 * Data classification levels
 */
export const DATA_CLASSIFICATIONS = [
  "public",
  "internal",
  "confidential",
  "restricted",
] as const;

/**
 * Compliance frameworks
 */
export const COMPLIANCE_FRAMEWORKS = [
  "GDPR",
  "FERPA",
  "SOC2",
  "HIPAA",
  "CCPA",
  "ISO27001",
] as const;

// ============================================================================
// TYPE ALIASES (for backward compatibility)
// ============================================================================

/**
 * Form data alias for cohort creation (used by CohortManager component)
 */
export type CohortFormData = CreateCohortData;

/**
 * Status enum alias (used by CohortManager component)
 */
export type CohortStatusEnum = CohortStatus;

/**
 * Branding form data for UI (used by BrandingEditor component)
 */
export interface BrandingFormData {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  custom_css: string;
  welcome_message: string;
  footer_text: string;
  is_active: boolean;
}

/**
 * Compliance action enum alias (used by CompliancePanel component)
 */
export type ComplianceActionEnum = ComplianceEventType;

/**
 * Integration type enum alias (used by IntegrationManager component)
 */
export type IntegrationTypeEnum = IntegrationType;

/**
 * Integration form data for UI (used by IntegrationManager component)
 */
export interface IntegrationFormData {
  name: string;
  integration_type: IntegrationType;
  api_endpoint: string;
  api_key: string;
  is_active: boolean;
  sync_frequency: string;
  settings: Record<string, unknown>;
}
