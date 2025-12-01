/**
 * Tests for familySupportService.ts (UC-113: Family and Personal Support Integration)
 * Moved from frontend/src to tests/frontend to centralize tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as familySupportService from "@workspaces/network_hub/services/familySupportService";
import { supabase } from "@shared/services/supabaseClient";
import type {
  FamilySupporterRow,
  FamilySupportSettingsRow,
  FamilyMilestoneRow,
  StressMetricsRow,
  InviteSupporterData,
} from "@workspaces/network_hub/types/familySupport.types";

// Mock Supabase client
vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Helper to create chainable mock that ends with .single()
function createChainableMock(finalValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  mock.select = vi.fn().mockReturnValue(mock);
  mock.insert = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.delete = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);
  mock.neq = vi.fn().mockReturnValue(mock);
  mock.in = vi.fn().mockReturnValue(mock);
  mock.gte = vi.fn().mockReturnValue(mock);
  mock.lte = vi.fn().mockReturnValue(mock);
  mock.contains = vi.fn().mockReturnValue(mock);
  mock.order = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.single = vi.fn().mockResolvedValue(finalValue);

  return mock;
}

// Helper to create chainable mock that ends with array query
function createArrayMock(finalValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  mock.select = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);
  mock.neq = vi.fn().mockReturnValue(mock);
  mock.gte = vi.fn().mockReturnValue(mock);
  mock.lte = vi.fn().mockReturnValue(mock);
  mock.contains = vi.fn().mockReturnValue(mock);
  mock.order = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockResolvedValue(finalValue);
  // Make the chain awaitable when service does `await query` without calling limit()
  (mock as any).then = (resolve: (v: typeof finalValue) => unknown) =>
    resolve(finalValue);

  return mock;
}

describe("FamilySupportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // SUPPORTER MANAGEMENT
  // ========================================================================

  describe("getSupporters", () => {
    const mockSupporters: FamilySupporterRow[] = [
      {
        id: "supporter-001",
        user_id: "user-123",
        supporter_email: "jane@example.com",
        supporter_name: "Jane Doe",
        supporter_user_id: null,
        role: "spouse",
        custom_role_name: null,
        status: "active",
        invitation_token: null,
        invitation_message: null,
        invited_at: "2025-11-01T00:00:00Z",
        accepted_at: "2025-11-02T00:00:00Z",
        declined_at: null,
        can_view_applications: true,
        can_view_interviews: true,
        can_view_progress: true,
        can_view_milestones: true,
        can_view_stress: false,
        can_send_encouragement: true,
        last_viewed_at: null,
        view_count: 0,
        encouragements_sent: 0,
        notify_on_milestones: true,
        notify_on_updates: true,
        notify_frequency: "weekly",
        created_at: "2025-11-01T00:00:00Z",
        updated_at: "2025-11-02T00:00:00Z",
      },
    ];

    it("should get all supporters for a user", async () => {
      const mockQuery = createArrayMock({ data: mockSupporters, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getSupporters("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockSupporters);
      expect(supabase.from).toHaveBeenCalledWith("family_supporters");
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should filter by status when provided", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getSupporters("user-123", {
        status: "pending",
      });

      expect(mockQuery.eq).toHaveBeenCalledWith("status", "pending");
    });

    it("should filter by role when provided", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getSupporters("user-123", { role: "parent" });

      expect(mockQuery.eq).toHaveBeenCalledWith("role", "parent");
    });

    it("should handle errors", async () => {
      const mockQuery = createArrayMock({
        data: null,
        error: { message: "Database error" },
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getSupporters("user-123");

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe("Database error");
    });
  });

  describe("inviteSupporter", () => {
    const mockInviteData: InviteSupporterData = {
      supporterEmail: "john@example.com",
      supporterName: "John Smith",
      role: "parent",
      invitationMessage: "Please help support my job search!",
      permissions: {
        canViewApplications: true,
        canViewInterviews: true,
        canViewProgress: true,
        canViewMilestones: true,
        canViewStress: false,
        canSendEncouragement: true,
      },
    };

    it("should create a new supporter invitation", async () => {
      const existingCheckMock = createChainableMock({
        data: null,
        error: null,
      });
      const createMock = createChainableMock({
        data: { id: "supporter-new", ...mockInviteData },
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? (existingCheckMock as never)
          : (createMock as never);
      });

      const result = await familySupportService.inviteSupporter(
        "user-123",
        mockInviteData
      );

      expect(result.status).toBe(201);
      expect(result.data).toBeDefined();
    });

    it("should reject if supporter already exists and is active", async () => {
      const existingMock = createChainableMock({
        data: { id: "supporter-existing", status: "active" },
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(existingMock as never);

      const result = await familySupportService.inviteSupporter(
        "user-123",
        mockInviteData
      );

      expect(result.status).toBe(400);
      expect(result.error?.message).toContain("already a supporter");
    });
  });

  describe("updateSupporterPermissions", () => {
    it("should update permissions successfully", async () => {
      const mockUpdated = {
        id: "supporter-001",
        can_view_stress: true,
      };
      const chainMock = createChainableMock({ data: mockUpdated, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.updateSupporterPermissions(
        "user-123",
        "supporter-001",
        { canViewStress: true }
      );

      expect(result.status).toBe(200);
      expect(chainMock.update).toHaveBeenCalled();
      expect(chainMock.eq).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("removeSupporter", () => {
    it("should mark supporter as removed", async () => {
      const chainMock = createChainableMock({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.removeSupporter(
        "user-123",
        "supporter-001"
      );

      expect(result.status).toBe(200);
      expect(result.data).toBe(true);
    });
  });

  // ========================================================================
  // SETTINGS MANAGEMENT
  // ========================================================================

  describe("getFamilySupportSettings", () => {
    const mockSettings: FamilySupportSettingsRow = {
      id: "settings-001",
      user_id: "user-123",
      family_support_enabled: true,
      auto_share_milestones: false,
      default_view_applications: true,
      default_view_interviews: true,
      default_view_progress: true,
      default_view_milestones: true,
      default_view_stress: false,
      hide_salary_info: true,
      hide_rejection_details: true,
      hide_company_names: false,
      digest_frequency: "weekly",
      stress_tracking_enabled: true,
      stress_alert_threshold: "high",
      created_at: "2025-11-01T00:00:00Z",
      updated_at: "2025-11-01T00:00:00Z",
    };

    it("should return existing settings", async () => {
      const chainMock = createChainableMock({
        data: mockSettings,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.getFamilySupportSettings(
        "user-123"
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockSettings);
    });

    it("should create default settings if none exist", async () => {
      const noSettingsMock = createChainableMock({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      const createMock = createChainableMock({
        data: mockSettings,
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? (noSettingsMock as never)
          : (createMock as never);
      });

      const result = await familySupportService.getFamilySupportSettings(
        "user-123"
      );

      expect(result.data).toBeDefined();
    });
  });

  describe("updateFamilySupportSettings", () => {
    it("should update settings successfully", async () => {
      const getSettingsMock = createChainableMock({
        data: { id: "settings-001" },
        error: null,
      });
      const updateMock = createChainableMock({
        data: { id: "settings-001", hide_salary_info: false },
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? (getSettingsMock as never)
          : (updateMock as never);
      });

      const result = await familySupportService.updateFamilySupportSettings(
        "user-123",
        { hideSalaryInfo: false }
      );

      expect(result.status).toBe(200);
    });
  });

  // ========================================================================
  // MILESTONES
  // ========================================================================

  describe("getMilestones", () => {
    const mockMilestones: FamilyMilestoneRow[] = [
      {
        id: "milestone-001",
        user_id: "user-123",
        milestone_type: "first_application",
        title: "First Application Sent!",
        description: "Started my job search journey",
        milestone_value: 1,
        related_job_id: null,
        celebration_message: "Let's celebrate!",
        celebration_emoji: "🎉",
        is_shared: true,
        shared_at: "2025-11-15T00:00:00Z",
        shared_with_all: true,
        shared_with_supporters: [],
        view_count: 5,
        reactions: [],
        is_auto_generated: false,
        achieved_at: "2025-11-15T00:00:00Z",
        created_at: "2025-11-15T00:00:00Z",
        updated_at: "2025-11-15T00:00:00Z",
      },
    ];

    it("should get milestones for a user", async () => {
      const mockQuery = createArrayMock({ data: mockMilestones, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getMilestones("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockMilestones);
      expect(supabase.from).toHaveBeenCalledWith("family_milestones");
    });

    it("should filter by milestone type", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getMilestones("user-123", {
        milestoneType: "first_interview",
      });

      expect(mockQuery.eq).toHaveBeenCalledWith(
        "milestone_type",
        "first_interview"
      );
    });

    it("should filter by shared status", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getMilestones("user-123", { isShared: true });

      expect(mockQuery.eq).toHaveBeenCalledWith("is_shared", true);
    });
  });

  describe("createMilestone", () => {
    it("should create a milestone successfully", async () => {
      const mockMilestone = {
        id: "milestone-new",
        title: "Got an Interview!",
        milestone_type: "first_interview",
      };
      const chainMock = createChainableMock({
        data: mockMilestone,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.createMilestone("user-123", {
        milestoneType: "first_interview",
        title: "Got an Interview!",
        isShared: true,
      });

      expect(result.status).toBe(201);
      expect(chainMock.insert).toHaveBeenCalled();
    });
  });

  describe("toggleMilestoneSharing", () => {
    it("should toggle milestone sharing", async () => {
      const mockMilestone = { id: "milestone-001", is_shared: true };
      const chainMock = createChainableMock({
        data: mockMilestone,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.toggleMilestoneSharing(
        "user-123",
        "milestone-001",
        true
      );

      expect(result.status).toBe(200);
      expect(chainMock.update).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // STRESS TRACKING
  // ========================================================================

  describe("getStressMetrics", () => {
    const mockMetrics: StressMetricsRow[] = [
      {
        id: "stress-001",
        user_id: "user-123",
        check_in_date: "2025-11-29",
        check_in_time: "2025-11-29T09:00:00Z",
        stress_level: "moderate",
        mood: "okay",
        stress_score: 5,
        energy_level: 6,
        motivation_level: 7,
        notes: "Feeling okay today",
        stress_factors: ["Waiting to hear back"],
        positive_factors: ["Got exercise"],
        self_care_activities: ["Walking"],
        sleep_quality: 7,
        job_search_hours: 4,
        applications_today: 3,
        created_at: "2025-11-29T09:00:00Z",
        updated_at: "2025-11-29T09:00:00Z",
      },
    ];

    it("should get stress metrics for a user", async () => {
      const mockQuery = createArrayMock({ data: mockMetrics, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getStressMetrics("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockMetrics);
      expect(supabase.from).toHaveBeenCalledWith("stress_metrics");
    });

    it("should filter by date range", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getStressMetrics("user-123", {
        dateFrom: "2025-11-01",
        dateTo: "2025-11-30",
      });

      expect(mockQuery.gte).toHaveBeenCalledWith("check_in_date", "2025-11-01");
      expect(mockQuery.lte).toHaveBeenCalledWith("check_in_date", "2025-11-30");
    });
  });

  describe("getTodaysCheckIn", () => {
    it("should return today's check-in if exists", async () => {
      const mockCheckIn = {
        id: "stress-today",
        check_in_date: new Date().toISOString().split("T")[0],
      };
      const chainMock = createChainableMock({ data: mockCheckIn, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.getTodaysCheckIn("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });

    it("should return null if no check-in today", async () => {
      const chainMock = createChainableMock({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.getTodaysCheckIn("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe("submitStressCheckIn", () => {
    const checkInData = {
      stressLevel: "moderate" as const,
      mood: "okay" as const,
      stressScore: 5,
      energyLevel: 6,
      motivationLevel: 7,
      notes: "Feeling okay",
      stressFactors: ["Waiting to hear back"],
      positiveFactors: ["Got exercise"],
      selfCareActivities: ["Walking"],
    };

    it("should create new check-in if none exists today", async () => {
      const noExistingMock = createChainableMock({ data: null, error: null });
      const createMock = createChainableMock({
        data: { id: "stress-new", ...checkInData },
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? (noExistingMock as never)
          : (createMock as never);
      });

      const result = await familySupportService.submitStressCheckIn(
        "user-123",
        checkInData
      );

      expect(result.status).toBe(201);
    });

    it("should update existing check-in", async () => {
      const existingMock = createChainableMock({
        data: { id: "stress-existing" },
        error: null,
      });
      const updateMock = createChainableMock({
        data: { id: "stress-existing", ...checkInData },
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1
          ? (existingMock as never)
          : (updateMock as never);
      });

      const result = await familySupportService.submitStressCheckIn(
        "user-123",
        checkInData
      );

      expect(result.status).toBe(200);
    });
  });

  describe("getWellBeingAnalytics", () => {
    it("should return analytics with trends", async () => {
      const mockMetrics = [
        {
          stress_score: 7,
          mood: "struggling",
          stress_factors: ["Rejections"],
          positive_factors: ["Family support"],
          self_care_activities: ["Walking"],
        },
        {
          stress_score: 6,
          mood: "okay",
          stress_factors: ["Waiting"],
          positive_factors: ["Exercise"],
          self_care_activities: ["Walking"],
        },
        {
          stress_score: 5,
          mood: "good",
          stress_factors: ["Waiting"],
          positive_factors: ["Got interview"],
          self_care_activities: ["Meditation"],
        },
        {
          stress_score: 4,
          mood: "good",
          stress_factors: [],
          positive_factors: ["Progress"],
          self_care_activities: ["Walking", "Meditation"],
        },
      ];

      const mockQuery = createArrayMock({ data: mockMetrics, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getWellBeingAnalytics(
        "user-123",
        30
      );

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data?.stressTrend).toBeDefined();
      expect(result.data?.topStressFactors).toBeDefined();
    });

    it("should return default values when no metrics", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getWellBeingAnalytics(
        "user-123"
      );

      expect(result.status).toBe(200);
      expect(result.data?.averageStress).toBe(0);
      expect(result.data?.stressTrend).toBe("stable");
    });
  });

  // ========================================================================
  // SUPPORT BOUNDARIES
  // ========================================================================

  describe("getBoundaries", () => {
    it("should get active boundaries for a user", async () => {
      const mockBoundaries = [
        {
          id: "boundary-001",
          user_id: "user-123",
          boundary_type: "topic_restriction",
          title: "No job search talk at dinner",
          description: "Please don't bring up my job search during meals",
          is_active: true,
        },
      ];

      const mockQuery = createArrayMock({ data: mockBoundaries, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getBoundaries("user-123");

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockBoundaries);
      expect(mockQuery.eq).toHaveBeenCalledWith("is_active", true);
    });
  });

  describe("createBoundary", () => {
    it("should create a boundary", async () => {
      const countMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      const insertMock = createChainableMock({
        data: {
          id: "boundary-new",
          title: "Weekly updates only",
          boundary_type: "communication_frequency",
        },
        error: null,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? (countMock as never) : (insertMock as never);
      });

      const result = await familySupportService.createBoundary("user-123", {
        boundaryType: "communication_frequency",
        title: "Weekly updates only",
        description: "I will share updates once a week",
      });

      expect(result.status).toBe(201);
    });
  });

  describe("deleteBoundary", () => {
    it("should soft delete a boundary", async () => {
      const chainMock = createChainableMock({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.deleteBoundary(
        "user-123",
        "boundary-001"
      );

      expect(result.status).toBe(200);
      expect(result.data).toBe(true);
      expect(chainMock.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  // ========================================================================
  // RESOURCES
  // ========================================================================

  describe("getResources", () => {
    it("should get active resources", async () => {
      const mockResources = [
        {
          id: "resource-001",
          title: "How to Support a Job Seeker",
          category: "effective_support",
          is_active: true,
        },
      ];

      const mockQuery = createArrayMock({ data: mockResources, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getResources();

      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockResources);
      expect(mockQuery.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should filter by category", async () => {
      const mockQuery = createArrayMock({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      await familySupportService.getResources({ category: "what_not_to_say" });

      expect(mockQuery.eq).toHaveBeenCalledWith("category", "what_not_to_say");
    });
  });

  // ========================================================================
  // COMMUNICATIONS
  // ========================================================================

  describe("sendCommunication", () => {
    it("should send a communication", async () => {
      const mockCommunication = {
        id: "comm-new",
        communication_type: "progress_update",
        message_body: "Here is my weekly update!",
        is_sent: true,
      };
      const chainMock = createChainableMock({
        data: mockCommunication,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(chainMock as never);

      const result = await familySupportService.sendCommunication("user-123", {
        communicationType: "progress_update",
        messageBody: "Here is my weekly update!",
        sentToAll: true,
      });

      expect(result.status).toBe(201);
      expect(chainMock.insert).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // DASHBOARD
  // ========================================================================

  describe("getFamilySupportDashboard", () => {
    it("should aggregate dashboard data", async () => {
      const mockSettings = { id: "settings-001" };
      const mockSupporters: never[] = [];
      const mockMilestones: never[] = [];

      const settingsMock = createChainableMock({
        data: mockSettings,
        error: null,
      });
      const supportersMock = createArrayMock({
        data: mockSupporters,
        error: null,
      });
      const pendingMock = createArrayMock({ data: [], error: null });
      const milestonesMock = createArrayMock({
        data: mockMilestones,
        error: null,
      });
      const summaryMock = createArrayMock({ data: [], error: null });
      const stressMock = createChainableMock({
        data: null,
        error: { code: "PGRST116" },
      });
      const boundariesMock = createArrayMock({ data: [], error: null });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        const mocks = [
          settingsMock,
          supportersMock,
          pendingMock,
          milestonesMock,
          summaryMock,
          stressMock,
          boundariesMock,
        ];
        return mocks[(callCount - 1) % mocks.length] as never;
      });

      const result = await familySupportService.getFamilySupportDashboard(
        "user-123"
      );

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("settings");
      expect(result.data).toHaveProperty("activeSupporters");
      expect(result.data).toHaveProperty("pendingInvitations");
      expect(result.data).toHaveProperty("recentMilestones");
    });
  });

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  describe("error handling", () => {
    it("should handle unexpected exceptions", async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Unexpected error");
      });
    });

    it("should handle null data gracefully", async () => {
      const mockQuery = createArrayMock({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery as never);

      const result = await familySupportService.getSupporters("user-123");

      expect(result).toBeDefined();
    });
  });
});
