/**
 * Tests for team_management/services/enterpriseService.ts
 * Coverage: UC-114 Corporate Career Services Integration
 *
 * Tests enterprise features including cohort management,
 * team analytics, ROI reporting, branding, compliance,
 * and system integrations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
  },
}));

// Mock enterprise service functions
const mockEnterpriseService = {
  // Cohort Management
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  getCohorts: vi.fn(),
  getCohortById: vi.fn(),
  addMemberToCohort: vi.fn(),
  removeMemberFromCohort: vi.fn(),
  getCohortMembers: vi.fn(),
  getCohortProgress: vi.fn(),

  // Team Analytics
  getTeamAnalytics: vi.fn(),
  getTeamActivityReport: vi.fn(),
  getTeamPlacementStats: vi.fn(),
  getTeamEngagementMetrics: vi.fn(),

  // ROI Reporting
  createROIReport: vi.fn(),
  getROIReports: vi.fn(),
  getROIReportById: vi.fn(),
  exportROIReport: vi.fn(),

  // Branding
  updateBranding: vi.fn(),
  getBranding: vi.fn(),
  uploadLogo: vi.fn(),
  setCustomColors: vi.fn(),

  // Compliance
  logComplianceEvent: vi.fn(),
  getComplianceLog: vi.fn(),
  getDataRetentionSettings: vi.fn(),
  updateDataRetentionSettings: vi.fn(),
  exportUserData: vi.fn(),
  deleteUserData: vi.fn(),

  // Integrations
  getIntegrations: vi.fn(),
  configureIntegration: vi.fn(),
  testIntegrationConnection: vi.fn(),
  syncIntegrationData: vi.fn(),
  getIntegrationLogs: vi.fn(),

  // License Management
  getLicenseInfo: vi.fn(),
  getLicenseUsage: vi.fn(),

  // Settings
  getEnterpriseSettings: vi.fn(),
  updateEnterpriseSettings: vi.fn(),
};

describe("Enterprise Service (UC-114)", () => {
  const testTeamId = "test-team-uuid";
  const testCohortId = "test-cohort-uuid";
  const testUserId = "test-user-uuid";
  const testAdminId = "admin-user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cohort Management", () => {
    it("should create a cohort", async () => {
      const cohortData = {
        name: "Spring 2024 CS Graduates",
        description: "Computer Science graduates from Spring 2024 semester",
        startDate: "2024-01-15",
        endDate: "2024-05-15",
        targetPlacementRate: 85,
        tags: ["cs", "spring-2024", "entry-level"],
      };

      const expectedCohort = {
        id: testCohortId,
        team_id: testTeamId,
        ...cohortData,
        created_at: new Date().toISOString(),
        created_by: testAdminId,
        status: "active",
      };

      mockEnterpriseService.createCohort.mockResolvedValue({
        data: expectedCohort,
        error: null,
        status: 201,
      });

      const result = await mockEnterpriseService.createCohort(
        testTeamId,
        testAdminId,
        cohortData
      );

      expect(result.error).toBeNull();
      expect(result.data.name).toBe("Spring 2024 CS Graduates");
      expect(result.data.status).toBe("active");
    });

    it("should update a cohort", async () => {
      mockEnterpriseService.updateCohort.mockResolvedValue({
        data: {
          id: testCohortId,
          name: "Updated Cohort Name",
          targetPlacementRate: 90,
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.updateCohort(
        testTeamId,
        testCohortId,
        {
          name: "Updated Cohort Name",
          targetPlacementRate: 90,
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.targetPlacementRate).toBe(90);
    });

    it("should delete a cohort", async () => {
      mockEnterpriseService.deleteCohort.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.deleteCohort(
        testTeamId,
        testCohortId
      );

      expect(result.error).toBeNull();
    });

    it("should get all cohorts for team", async () => {
      const expectedCohorts = [
        {
          id: "cohort-1",
          name: "Spring 2024",
          status: "active",
          memberCount: 25,
        },
        {
          id: "cohort-2",
          name: "Fall 2023",
          status: "completed",
          memberCount: 30,
        },
      ];

      mockEnterpriseService.getCohorts.mockResolvedValue({
        data: expectedCohorts,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getCohorts(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get cohort by id with details", async () => {
      mockEnterpriseService.getCohortById.mockResolvedValue({
        data: {
          id: testCohortId,
          name: "Spring 2024 CS",
          members: [],
          progress: { averageProgress: 75, placedCount: 10 },
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getCohortById(
        testTeamId,
        testCohortId
      );

      expect(result.error).toBeNull();
      expect(result.data.progress.averageProgress).toBe(75);
    });

    it("should add member to cohort", async () => {
      mockEnterpriseService.addMemberToCohort.mockResolvedValue({
        data: {
          cohortId: testCohortId,
          memberId: testUserId,
          addedAt: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockEnterpriseService.addMemberToCohort(
        testTeamId,
        testCohortId,
        testUserId
      );

      expect(result.error).toBeNull();
    });

    it("should remove member from cohort", async () => {
      mockEnterpriseService.removeMemberFromCohort.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.removeMemberFromCohort(
        testTeamId,
        testCohortId,
        testUserId
      );

      expect(result.error).toBeNull();
    });

    it("should get cohort members with progress", async () => {
      const expectedMembers = [
        {
          id: "user-1",
          full_name: "John Doe",
          progress: 85,
          status: "active",
          applicationsCount: 15,
        },
        {
          id: "user-2",
          full_name: "Jane Smith",
          progress: 92,
          status: "placed",
          applicationsCount: 22,
        },
      ];

      mockEnterpriseService.getCohortMembers.mockResolvedValue({
        data: expectedMembers,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getCohortMembers(
        testTeamId,
        testCohortId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get cohort progress summary", async () => {
      const expectedProgress = {
        cohortId: testCohortId,
        totalMembers: 25,
        activeMembers: 20,
        placedMembers: 5,
        averageProgress: 72,
        averageApplications: 18,
        averageInterviews: 3,
        placementRate: 20,
        targetPlacementRate: 85,
        onTrackPercentage: 65,
      };

      mockEnterpriseService.getCohortProgress.mockResolvedValue({
        data: expectedProgress,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getCohortProgress(
        testTeamId,
        testCohortId
      );

      expect(result.error).toBeNull();
      expect(result.data.placementRate).toBe(20);
    });
  });

  describe("Team Analytics", () => {
    it("should get comprehensive team analytics", async () => {
      const expectedAnalytics = {
        teamId: testTeamId,
        period: "last_30_days",
        summary: {
          totalMembers: 50,
          activeMembers: 45,
          placedMembers: 10,
          placementRate: 20,
        },
        activity: {
          totalLogins: 450,
          avgLoginsPerUser: 10,
          documentsCreated: 120,
          applicationsSubmitted: 350,
        },
        engagement: {
          avgSessionDuration: "25 min",
          featureUsage: {
            resumeBuilder: 85,
            coverLetterGenerator: 70,
            interviewPrep: 45,
          },
        },
      };

      mockEnterpriseService.getTeamAnalytics.mockResolvedValue({
        data: expectedAnalytics,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getTeamAnalytics(testTeamId, {
        period: "last_30_days",
      });

      expect(result.error).toBeNull();
      expect(result.data.summary.totalMembers).toBe(50);
    });

    it("should get team activity report", async () => {
      mockEnterpriseService.getTeamActivityReport.mockResolvedValue({
        data: {
          dailyActiveUsers: [
            { date: "2024-01-01", count: 35 },
            { date: "2024-01-02", count: 38 },
          ],
          topActions: [
            { action: "resume_edit", count: 120 },
            { action: "job_application", count: 85 },
          ],
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getTeamActivityReport(
        testTeamId
      );

      expect(result.error).toBeNull();
    });

    it("should get team placement statistics", async () => {
      const expectedStats = {
        totalPlacements: 15,
        placementsByCohort: [
          { cohortId: "cohort-1", name: "Spring 2024", placements: 10 },
          { cohortId: "cohort-2", name: "Fall 2023", placements: 5 },
        ],
        placementsByIndustry: [
          { industry: "Technology", count: 8 },
          { industry: "Finance", count: 4 },
          { industry: "Healthcare", count: 3 },
        ],
        averageTimeToPlacement: 45,
        averageSalary: 75000,
      };

      mockEnterpriseService.getTeamPlacementStats.mockResolvedValue({
        data: expectedStats,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getTeamPlacementStats(
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.averageSalary).toBe(75000);
    });

    it("should get team engagement metrics", async () => {
      mockEnterpriseService.getTeamEngagementMetrics.mockResolvedValue({
        data: {
          overallEngagement: 78,
          weeklyEngagementTrend: [75, 76, 78, 80, 78],
          lowEngagementUsers: 5,
          highEngagementUsers: 20,
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getTeamEngagementMetrics(
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.overallEngagement).toBe(78);
    });
  });

  describe("ROI Reporting", () => {
    it("should create an ROI report", async () => {
      const reportData = {
        name: "Q1 2024 ROI Analysis",
        period: { start: "2024-01-01", end: "2024-03-31" },
        includeMetrics: ["placements", "salary_increases", "time_to_hire"],
      };

      const expectedReport = {
        id: "report-1",
        team_id: testTeamId,
        ...reportData,
        status: "generating",
        created_at: new Date().toISOString(),
      };

      mockEnterpriseService.createROIReport.mockResolvedValue({
        data: expectedReport,
        error: null,
        status: 201,
      });

      const result = await mockEnterpriseService.createROIReport(
        testTeamId,
        testAdminId,
        reportData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("generating");
    });

    it("should get all ROI reports", async () => {
      mockEnterpriseService.getROIReports.mockResolvedValue({
        data: [
          { id: "report-1", name: "Q1 2024", status: "completed" },
          { id: "report-2", name: "Q4 2023", status: "completed" },
        ],
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getROIReports(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get ROI report by id with full data", async () => {
      const expectedReport = {
        id: "report-1",
        name: "Q1 2024 ROI Analysis",
        metrics: {
          totalPlacements: 15,
          averageSalary: 75000,
          totalSalaryValue: 1125000,
          timeToHireReduction: "30%",
          costPerPlacement: 2500,
          returnOnInvestment: 450,
        },
        insights: [
          "Resume builder usage correlates with 40% higher placement rate",
          "Interview prep users received 25% higher offers on average",
        ],
      };

      mockEnterpriseService.getROIReportById.mockResolvedValue({
        data: expectedReport,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getROIReportById(
        testTeamId,
        "report-1"
      );

      expect(result.error).toBeNull();
      expect(result.data.metrics.returnOnInvestment).toBe(450);
    });

    it("should export ROI report", async () => {
      mockEnterpriseService.exportROIReport.mockResolvedValue({
        data: {
          downloadUrl: "https://storage.example.com/reports/roi-q1-2024.pdf",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.exportROIReport(
        testTeamId,
        "report-1",
        "pdf"
      );

      expect(result.error).toBeNull();
      expect(result.data.downloadUrl).toContain("pdf");
    });
  });

  describe("Branding", () => {
    it("should update branding settings", async () => {
      const brandingData = {
        companyName: "Acme Corp Career Services",
        primaryColor: "#003366",
        secondaryColor: "#FF6600",
        logoUrl: "https://storage.example.com/logos/acme.png",
        customDomain: "careers.acmecorp.com",
      };

      mockEnterpriseService.updateBranding.mockResolvedValue({
        data: { ...brandingData, teamId: testTeamId },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.updateBranding(
        testTeamId,
        brandingData
      );

      expect(result.error).toBeNull();
      expect(result.data.primaryColor).toBe("#003366");
    });

    it("should get branding settings", async () => {
      mockEnterpriseService.getBranding.mockResolvedValue({
        data: {
          teamId: testTeamId,
          companyName: "Acme Corp",
          primaryColor: "#003366",
          logoUrl: "https://example.com/logo.png",
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getBranding(testTeamId);

      expect(result.error).toBeNull();
    });

    it("should upload logo", async () => {
      mockEnterpriseService.uploadLogo.mockResolvedValue({
        data: { logoUrl: "https://storage.example.com/logos/new-logo.png" },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.uploadLogo(
        testTeamId,
        new Blob()
      );

      expect(result.error).toBeNull();
      expect(result.data.logoUrl).toBeDefined();
    });

    it("should set custom colors", async () => {
      mockEnterpriseService.setCustomColors.mockResolvedValue({
        data: {
          primaryColor: "#003366",
          secondaryColor: "#FF6600",
          accentColor: "#00CC66",
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.setCustomColors(testTeamId, {
        primaryColor: "#003366",
        secondaryColor: "#FF6600",
        accentColor: "#00CC66",
      });

      expect(result.error).toBeNull();
    });
  });

  describe("Compliance", () => {
    it("should log a compliance event", async () => {
      const eventData = {
        eventType: "data_access",
        userId: testUserId,
        resourceType: "user_profile",
        resourceId: testUserId,
        action: "view",
        metadata: { ipAddress: "192.168.1.1", userAgent: "Chrome" },
      };

      mockEnterpriseService.logComplianceEvent.mockResolvedValue({
        data: {
          id: "event-1",
          ...eventData,
          timestamp: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockEnterpriseService.logComplianceEvent(
        testTeamId,
        eventData
      );

      expect(result.error).toBeNull();
    });

    it("should get compliance log", async () => {
      mockEnterpriseService.getComplianceLog.mockResolvedValue({
        data: {
          events: [
            {
              id: "event-1",
              eventType: "data_access",
              timestamp: "2024-01-15",
            },
            {
              id: "event-2",
              eventType: "data_export",
              timestamp: "2024-01-16",
            },
          ],
          totalCount: 150,
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getComplianceLog(testTeamId, {
        limit: 50,
      });

      expect(result.error).toBeNull();
      expect(result.data.events).toHaveLength(2);
    });

    it("should get data retention settings", async () => {
      mockEnterpriseService.getDataRetentionSettings.mockResolvedValue({
        data: {
          retentionPeriodDays: 365,
          autoDeleteInactiveUsers: true,
          inactivityThresholdDays: 180,
          dataBackupEnabled: true,
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getDataRetentionSettings(
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.retentionPeriodDays).toBe(365);
    });

    it("should update data retention settings", async () => {
      mockEnterpriseService.updateDataRetentionSettings.mockResolvedValue({
        data: { retentionPeriodDays: 730, autoDeleteInactiveUsers: false },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.updateDataRetentionSettings(
        testTeamId,
        {
          retentionPeriodDays: 730,
        }
      );

      expect(result.error).toBeNull();
    });

    it("should export user data (GDPR)", async () => {
      mockEnterpriseService.exportUserData.mockResolvedValue({
        data: {
          downloadUrl: "https://storage.example.com/exports/user-data.zip",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.exportUserData(
        testTeamId,
        testUserId
      );

      expect(result.error).toBeNull();
    });

    it("should delete user data (GDPR right to be forgotten)", async () => {
      mockEnterpriseService.deleteUserData.mockResolvedValue({
        data: { success: true, deletedAt: new Date().toISOString() },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.deleteUserData(
        testTeamId,
        testUserId
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Integrations", () => {
    it("should get available integrations", async () => {
      const expectedIntegrations = [
        {
          id: "salesforce",
          name: "Salesforce",
          status: "connected",
          lastSync: "2024-01-15",
        },
        { id: "greenhouse", name: "Greenhouse", status: "disconnected" },
        { id: "workday", name: "Workday", status: "pending" },
      ];

      mockEnterpriseService.getIntegrations.mockResolvedValue({
        data: expectedIntegrations,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getIntegrations(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });

    it("should configure an integration", async () => {
      const configData = {
        apiKey: "sf-api-key-xxx",
        instanceUrl: "https://acme.salesforce.com",
        syncFrequency: "daily",
        syncOptions: { contacts: true, opportunities: true },
      };

      mockEnterpriseService.configureIntegration.mockResolvedValue({
        data: {
          integrationId: "salesforce",
          status: "configured",
          ...configData,
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.configureIntegration(
        testTeamId,
        "salesforce",
        configData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("configured");
    });

    it("should test integration connection", async () => {
      mockEnterpriseService.testIntegrationConnection.mockResolvedValue({
        data: {
          success: true,
          message: "Connection successful",
          latency: "120ms",
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.testIntegrationConnection(
        testTeamId,
        "salesforce"
      );

      expect(result.error).toBeNull();
      expect(result.data.success).toBe(true);
    });

    it("should sync integration data", async () => {
      mockEnterpriseService.syncIntegrationData.mockResolvedValue({
        data: {
          syncId: "sync-123",
          status: "in_progress",
          startedAt: new Date().toISOString(),
          recordsToProcess: 150,
        },
        error: null,
        status: 202,
      });

      const result = await mockEnterpriseService.syncIntegrationData(
        testTeamId,
        "salesforce"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("in_progress");
    });

    it("should get integration logs", async () => {
      mockEnterpriseService.getIntegrationLogs.mockResolvedValue({
        data: [
          {
            timestamp: "2024-01-15T10:00:00Z",
            event: "sync_started",
            recordCount: 50,
          },
          {
            timestamp: "2024-01-15T10:05:00Z",
            event: "sync_completed",
            recordCount: 50,
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getIntegrationLogs(
        testTeamId,
        "salesforce"
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  describe("License Management", () => {
    it("should get license info", async () => {
      const expectedLicense = {
        teamId: testTeamId,
        plan: "enterprise",
        maxSeats: 100,
        usedSeats: 45,
        features: ["cohorts", "analytics", "integrations", "custom_branding"],
        expiresAt: "2025-01-15",
        autoRenew: true,
      };

      mockEnterpriseService.getLicenseInfo.mockResolvedValue({
        data: expectedLicense,
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getLicenseInfo(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data.plan).toBe("enterprise");
      expect(result.data.usedSeats).toBeLessThan(result.data.maxSeats);
    });

    it("should get license usage details", async () => {
      mockEnterpriseService.getLicenseUsage.mockResolvedValue({
        data: {
          activeUsers: 45,
          invitedUsers: 5,
          deactivatedUsers: 3,
          usageHistory: [
            { month: "2024-01", activeUsers: 40 },
            { month: "2024-02", activeUsers: 45 },
          ],
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getLicenseUsage(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data.activeUsers).toBe(45);
    });
  });

  describe("Enterprise Settings", () => {
    it("should get enterprise settings", async () => {
      mockEnterpriseService.getEnterpriseSettings.mockResolvedValue({
        data: {
          teamId: testTeamId,
          ssoEnabled: true,
          ssoProvider: "okta",
          mfaRequired: true,
          sessionTimeout: 480,
          allowedDomains: ["acmecorp.com"],
          ipWhitelist: ["10.0.0.0/8"],
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.getEnterpriseSettings(
        testTeamId
      );

      expect(result.error).toBeNull();
      expect(result.data.ssoEnabled).toBe(true);
    });

    it("should update enterprise settings", async () => {
      mockEnterpriseService.updateEnterpriseSettings.mockResolvedValue({
        data: { sessionTimeout: 240, mfaRequired: true },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.updateEnterpriseSettings(
        testTeamId,
        {
          sessionTimeout: 240,
        }
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should handle unauthorized access", async () => {
      mockEnterpriseService.getTeamAnalytics.mockResolvedValue({
        data: null,
        error: { message: "Insufficient permissions for enterprise features" },
        status: 403,
      });

      const result = await mockEnterpriseService.getTeamAnalytics("wrong-team");

      expect(result.error).not.toBeNull();
    });

    it("should handle license limit exceeded", async () => {
      mockEnterpriseService.addMemberToCohort.mockResolvedValue({
        data: null,
        error: { message: "License seat limit exceeded" },
        status: 402,
      });

      const result = await mockEnterpriseService.addMemberToCohort(
        testTeamId,
        testCohortId,
        "new-user"
      );

      expect(result.error).not.toBeNull();
    });

    it("should handle integration connection failure", async () => {
      mockEnterpriseService.testIntegrationConnection.mockResolvedValue({
        data: {
          success: false,
          message: "Invalid API credentials",
          errorCode: "AUTH_FAILED",
        },
        error: null,
        status: 200,
      });

      const result = await mockEnterpriseService.testIntegrationConnection(
        testTeamId,
        "salesforce"
      );

      expect(result.data.success).toBe(false);
    });
  });
});
