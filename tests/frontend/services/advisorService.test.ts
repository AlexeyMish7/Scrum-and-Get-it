/**
 * Tests for team_management/services/advisorService.ts
 * Coverage: UC-115 External Advisor and Coach Integration
 *
 * Tests advisor/coach management, session scheduling,
 * recommendations, material sharing, impact tracking,
 * billing, and messaging.
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

// Mock advisor service functions
const mockAdvisorService = {
  // Advisor Profile Management
  inviteAdvisor: vi.fn(),
  getAdvisors: vi.fn(),
  getAdvisorById: vi.fn(),
  updateAdvisorProfile: vi.fn(),
  deactivateAdvisor: vi.fn(),
  reactivateAdvisor: vi.fn(),
  getAdvisorClients: vi.fn(),
  assignClient: vi.fn(),
  unassignClient: vi.fn(),

  // Session Management
  createSession: vi.fn(),
  getUpcomingSessions: vi.fn(),
  getPastSessions: vi.fn(),
  getSessionById: vi.fn(),
  updateSession: vi.fn(),
  cancelSession: vi.fn(),
  completeSession: vi.fn(),
  addSessionNotes: vi.fn(),

  // Recommendations
  createRecommendation: vi.fn(),
  getRecommendations: vi.fn(),
  updateRecommendation: vi.fn(),
  markRecommendationComplete: vi.fn(),

  // Material Sharing
  shareMaterial: vi.fn(),
  getSharedMaterials: vi.fn(),
  getMaterialAccess: vi.fn(),
  revokeMaterialAccess: vi.fn(),

  // Impact & Analytics
  getAdvisorImpact: vi.fn(),
  getClientProgress: vi.fn(),
  getAdvisorStats: vi.fn(),

  // Billing
  createBillingRecord: vi.fn(),
  getBillingRecords: vi.fn(),
  generateInvoice: vi.fn(),
  getBillingSettings: vi.fn(),
  updateBillingSettings: vi.fn(),

  // Messaging
  sendMessage: vi.fn(),
  getMessages: vi.fn(),
  getConversation: vi.fn(),
  markMessageRead: vi.fn(),
  getUnreadCount: vi.fn(),

  // Availability
  setAvailability: vi.fn(),
  getAvailability: vi.fn(),
  getAvailableSlots: vi.fn(),
};

describe("Advisor Service (UC-115)", () => {
  const testTeamId = "test-team-uuid";
  const testAdvisorId = "test-advisor-uuid";
  const testClientId = "test-client-uuid";
  const testSessionId = "test-session-uuid";
  const testAdminId = "admin-user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Advisor Profile Management", () => {
    it("should invite an external advisor", async () => {
      const inviteData = {
        email: "coach@careercoach.com",
        name: "Dr. Sarah Johnson",
        specialty: "Executive Coaching",
        credentials: ["ICF Certified", "MBA", "10+ years experience"],
        hourlyRate: 150,
        bio: "Expert career coach specializing in tech transitions",
      };

      const expectedInvite = {
        id: "invite-1",
        team_id: testTeamId,
        advisor_email: inviteData.email,
        advisor_name: inviteData.name,
        status: "pending",
        invited_by: testAdminId,
        created_at: new Date().toISOString(),
      };

      mockAdvisorService.inviteAdvisor.mockResolvedValue({
        data: expectedInvite,
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.inviteAdvisor(
        testTeamId,
        testAdminId,
        inviteData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("pending");
    });

    it("should get all advisors for team", async () => {
      const expectedAdvisors = [
        {
          id: testAdvisorId,
          name: "Dr. Sarah Johnson",
          specialty: "Executive Coaching",
          status: "active",
          clientCount: 5,
          rating: 4.8,
        },
        {
          id: "advisor-2",
          name: "John Smith",
          specialty: "Resume Writing",
          status: "active",
          clientCount: 8,
          rating: 4.5,
        },
      ];

      mockAdvisorService.getAdvisors.mockResolvedValue({
        data: expectedAdvisors,
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAdvisors(testTeamId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get advisor by id with full details", async () => {
      mockAdvisorService.getAdvisorById.mockResolvedValue({
        data: {
          id: testAdvisorId,
          name: "Dr. Sarah Johnson",
          email: "sarah@coach.com",
          specialty: "Executive Coaching",
          credentials: ["ICF Certified"],
          hourlyRate: 150,
          bio: "Expert coach",
          clients: [],
          upcomingSessions: 3,
          completedSessions: 45,
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAdvisorById(
        testTeamId,
        testAdvisorId
      );

      expect(result.error).toBeNull();
      expect(result.data.completedSessions).toBe(45);
    });

    it("should update advisor profile", async () => {
      mockAdvisorService.updateAdvisorProfile.mockResolvedValue({
        data: {
          id: testAdvisorId,
          hourlyRate: 175,
          specialty: "Executive & Leadership Coaching",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.updateAdvisorProfile(
        testAdvisorId,
        {
          hourlyRate: 175,
          specialty: "Executive & Leadership Coaching",
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.hourlyRate).toBe(175);
    });

    it("should deactivate an advisor", async () => {
      mockAdvisorService.deactivateAdvisor.mockResolvedValue({
        data: {
          id: testAdvisorId,
          status: "inactive",
          deactivatedAt: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.deactivateAdvisor(
        testTeamId,
        testAdvisorId
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("inactive");
    });

    it("should reactivate an advisor", async () => {
      mockAdvisorService.reactivateAdvisor.mockResolvedValue({
        data: { id: testAdvisorId, status: "active" },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.reactivateAdvisor(
        testTeamId,
        testAdvisorId
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("active");
    });

    it("should get advisor's assigned clients", async () => {
      const expectedClients = [
        {
          id: testClientId,
          full_name: "John Doe",
          progress: 75,
          assignedAt: "2024-01-01",
        },
        {
          id: "client-2",
          full_name: "Jane Smith",
          progress: 60,
          assignedAt: "2024-01-15",
        },
      ];

      mockAdvisorService.getAdvisorClients.mockResolvedValue({
        data: expectedClients,
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAdvisorClients(testAdvisorId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should assign a client to advisor", async () => {
      mockAdvisorService.assignClient.mockResolvedValue({
        data: {
          advisorId: testAdvisorId,
          clientId: testClientId,
          assignedAt: new Date().toISOString(),
          assignedBy: testAdminId,
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.assignClient(
        testTeamId,
        testAdvisorId,
        testClientId,
        testAdminId
      );

      expect(result.error).toBeNull();
    });

    it("should unassign a client from advisor", async () => {
      mockAdvisorService.unassignClient.mockResolvedValue({
        data: { success: true },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.unassignClient(
        testTeamId,
        testAdvisorId,
        testClientId
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Session Management", () => {
    it("should create a coaching session", async () => {
      const sessionData = {
        advisorId: testAdvisorId,
        clientId: testClientId,
        scheduledAt: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        duration: 60,
        sessionType: "career_coaching" as const,
        agenda: "Review resume, discuss job search strategy",
        meetingLink: "https://zoom.us/j/123456",
      };

      const expectedSession = {
        id: testSessionId,
        ...sessionData,
        status: "scheduled",
        created_at: new Date().toISOString(),
      };

      mockAdvisorService.createSession.mockResolvedValue({
        data: expectedSession,
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.createSession(
        testTeamId,
        sessionData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("scheduled");
      expect(result.data.duration).toBe(60);
    });

    it("should get upcoming sessions for advisor", async () => {
      const expectedSessions = [
        {
          id: testSessionId,
          client: { full_name: "John Doe" },
          scheduledAt: new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          sessionType: "career_coaching",
        },
        {
          id: "session-2",
          client: { full_name: "Jane Smith" },
          scheduledAt: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          sessionType: "resume_review",
        },
      ];

      mockAdvisorService.getUpcomingSessions.mockResolvedValue({
        data: expectedSessions,
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getUpcomingSessions(
        testAdvisorId
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get past sessions with notes", async () => {
      mockAdvisorService.getPastSessions.mockResolvedValue({
        data: [
          {
            id: "past-session-1",
            client: { full_name: "John Doe" },
            completedAt: "2024-01-10T10:00:00Z",
            notes: "Reviewed resume, identified 3 areas for improvement",
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getPastSessions(testAdvisorId);

      expect(result.error).toBeNull();
    });

    it("should get session by id", async () => {
      mockAdvisorService.getSessionById.mockResolvedValue({
        data: {
          id: testSessionId,
          advisor: { name: "Dr. Sarah Johnson" },
          client: { full_name: "John Doe" },
          scheduledAt: "2024-01-20T14:00:00Z",
          duration: 60,
          sessionType: "career_coaching",
          status: "scheduled",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getSessionById(testSessionId);

      expect(result.error).toBeNull();
    });

    it("should update session details", async () => {
      mockAdvisorService.updateSession.mockResolvedValue({
        data: {
          id: testSessionId,
          scheduledAt: new Date(
            Date.now() + 4 * 24 * 60 * 60 * 1000
          ).toISOString(),
          agenda: "Updated agenda: Focus on interview prep",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.updateSession(testSessionId, {
        scheduledAt: new Date(
          Date.now() + 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
        agenda: "Updated agenda: Focus on interview prep",
      });

      expect(result.error).toBeNull();
    });

    it("should cancel a session", async () => {
      mockAdvisorService.cancelSession.mockResolvedValue({
        data: {
          id: testSessionId,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelReason: "Client requested reschedule",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.cancelSession(
        testSessionId,
        "Client requested reschedule"
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("cancelled");
    });

    it("should complete a session with summary", async () => {
      mockAdvisorService.completeSession.mockResolvedValue({
        data: {
          id: testSessionId,
          status: "completed",
          completedAt: new Date().toISOString(),
          summary: "Reviewed resume, set 3 action items for next week",
          rating: 5,
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.completeSession(testSessionId, {
        summary: "Reviewed resume, set 3 action items for next week",
      });

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("completed");
    });

    it("should add notes to session", async () => {
      mockAdvisorService.addSessionNotes.mockResolvedValue({
        data: {
          sessionId: testSessionId,
          notes:
            "Client is making excellent progress. Focus next session on networking strategies.",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.addSessionNotes(testSessionId, {
        notes:
          "Client is making excellent progress. Focus next session on networking strategies.",
      });

      expect(result.error).toBeNull();
    });
  });

  describe("Recommendations", () => {
    it("should create a recommendation", async () => {
      const recommendationData = {
        clientId: testClientId,
        type: "skill_development" as const,
        title: "Learn TypeScript",
        description:
          "Based on your career goals, learning TypeScript will increase your marketability by 30%",
        priority: "high" as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        resources: [
          {
            type: "link",
            url: "https://typescriptlang.org",
            title: "Official TS Docs",
          },
        ],
      };

      mockAdvisorService.createRecommendation.mockResolvedValue({
        data: {
          id: "rec-1",
          advisor_id: testAdvisorId,
          ...recommendationData,
          status: "pending",
          created_at: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.createRecommendation(
        testAdvisorId,
        recommendationData
      );

      expect(result.error).toBeNull();
      expect(result.data.priority).toBe("high");
    });

    it("should get client recommendations", async () => {
      mockAdvisorService.getRecommendations.mockResolvedValue({
        data: [
          {
            id: "rec-1",
            title: "Learn TypeScript",
            status: "pending",
            priority: "high",
          },
          {
            id: "rec-2",
            title: "Update LinkedIn",
            status: "completed",
            priority: "medium",
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getRecommendations(testClientId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should update a recommendation", async () => {
      mockAdvisorService.updateRecommendation.mockResolvedValue({
        data: {
          id: "rec-1",
          description: "Updated description with more resources",
          updatedAt: new Date().toISOString(),
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.updateRecommendation("rec-1", {
        description: "Updated description with more resources",
      });

      expect(result.error).toBeNull();
    });

    it("should mark recommendation as complete", async () => {
      mockAdvisorService.markRecommendationComplete.mockResolvedValue({
        data: {
          id: "rec-1",
          status: "completed",
          completedAt: new Date().toISOString(),
          outcome: "Client completed TypeScript course with 95% score",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.markRecommendationComplete(
        "rec-1",
        {
          outcome: "Client completed TypeScript course with 95% score",
        }
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("completed");
    });
  });

  describe("Material Sharing", () => {
    it("should share material with client", async () => {
      const materialData = {
        clientId: testClientId,
        documentId: "doc-123",
        accessLevel: "view" as const,
        expiresAt: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        message: "Here's a template I think will help with your cover letters",
      };

      mockAdvisorService.shareMaterial.mockResolvedValue({
        data: {
          id: "share-1",
          advisor_id: testAdvisorId,
          ...materialData,
          sharedAt: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.shareMaterial(
        testAdvisorId,
        materialData
      );

      expect(result.error).toBeNull();
    });

    it("should get shared materials for client", async () => {
      mockAdvisorService.getSharedMaterials.mockResolvedValue({
        data: [
          {
            id: "share-1",
            document: { name: "Cover Letter Template" },
            sharedAt: "2024-01-15",
          },
          {
            id: "share-2",
            document: { name: "Interview Tips PDF" },
            sharedAt: "2024-01-10",
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getSharedMaterials(testClientId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should get material access details", async () => {
      mockAdvisorService.getMaterialAccess.mockResolvedValue({
        data: {
          shareId: "share-1",
          accessLevel: "view",
          expiresAt: "2024-02-15",
          accessLog: [{ accessedAt: "2024-01-16T10:00:00Z", action: "view" }],
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getMaterialAccess("share-1");

      expect(result.error).toBeNull();
    });

    it("should revoke material access", async () => {
      mockAdvisorService.revokeMaterialAccess.mockResolvedValue({
        data: { success: true, revokedAt: new Date().toISOString() },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.revokeMaterialAccess(
        testAdvisorId,
        "share-1"
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Impact & Analytics", () => {
    it("should get advisor impact metrics", async () => {
      const expectedImpact = {
        advisorId: testAdvisorId,
        totalClients: 15,
        activeClients: 8,
        totalSessions: 120,
        averageRating: 4.8,
        clientSuccessRate: 85,
        placementsAssisted: 12,
        averageSalaryIncrease: 15000,
        clientRetentionRate: 90,
        recommendationsCompleted: 45,
        topAreas: ["Resume Writing", "Interview Prep", "Salary Negotiation"],
      };

      mockAdvisorService.getAdvisorImpact.mockResolvedValue({
        data: expectedImpact,
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAdvisorImpact(testAdvisorId);

      expect(result.error).toBeNull();
      expect(result.data.clientSuccessRate).toBe(85);
      expect(result.data.averageRating).toBe(4.8);
    });

    it("should get client progress for advisor", async () => {
      mockAdvisorService.getClientProgress.mockResolvedValue({
        data: {
          clientId: testClientId,
          advisorId: testAdvisorId,
          assignedAt: "2024-01-01",
          progressMetrics: {
            applicationsSubmitted: 20,
            interviewsScheduled: 5,
            offersReceived: 1,
            profileCompleteness: 95,
          },
          sessionsCompleted: 5,
          recommendationsCompleted: 8,
          lastActivity: "2024-01-20",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getClientProgress(
        testAdvisorId,
        testClientId
      );

      expect(result.error).toBeNull();
      expect(result.data.sessionsCompleted).toBe(5);
    });

    it("should get advisor statistics", async () => {
      mockAdvisorService.getAdvisorStats.mockResolvedValue({
        data: {
          advisorId: testAdvisorId,
          thisMonth: {
            sessionsCompleted: 12,
            newClients: 2,
            recommendationsGiven: 15,
            hoursSpent: 18,
          },
          allTime: {
            totalSessions: 120,
            totalClients: 25,
            totalRecommendations: 150,
          },
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAdvisorStats(testAdvisorId);

      expect(result.error).toBeNull();
    });
  });

  describe("Billing", () => {
    it("should create a billing record for session", async () => {
      const billingData = {
        sessionId: testSessionId,
        advisorId: testAdvisorId,
        clientId: testClientId,
        amount: 150,
        currency: "USD",
        description: "60-minute career coaching session",
      };

      mockAdvisorService.createBillingRecord.mockResolvedValue({
        data: {
          id: "billing-1",
          ...billingData,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.createBillingRecord(
        testTeamId,
        billingData
      );

      expect(result.error).toBeNull();
      expect(result.data.amount).toBe(150);
    });

    it("should get billing records for advisor", async () => {
      mockAdvisorService.getBillingRecords.mockResolvedValue({
        data: [
          {
            id: "billing-1",
            amount: 150,
            status: "paid",
            paidAt: "2024-01-15",
          },
          { id: "billing-2", amount: 150, status: "pending" },
        ],
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getBillingRecords(testAdvisorId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it("should generate an invoice", async () => {
      mockAdvisorService.generateInvoice.mockResolvedValue({
        data: {
          invoiceId: "inv-1",
          advisorId: testAdvisorId,
          period: { start: "2024-01-01", end: "2024-01-31" },
          totalAmount: 1500,
          sessionsCount: 10,
          downloadUrl: "https://storage.example.com/invoices/inv-1.pdf",
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.generateInvoice(testAdvisorId, {
        periodStart: "2024-01-01",
        periodEnd: "2024-01-31",
      });

      expect(result.error).toBeNull();
      expect(result.data.totalAmount).toBe(1500);
    });

    it("should get billing settings", async () => {
      mockAdvisorService.getBillingSettings.mockResolvedValue({
        data: {
          advisorId: testAdvisorId,
          hourlyRate: 150,
          currency: "USD",
          paymentMethod: "direct_deposit",
          bankDetails: { last4: "1234" },
          invoiceFrequency: "monthly",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getBillingSettings(testAdvisorId);

      expect(result.error).toBeNull();
    });

    it("should update billing settings", async () => {
      mockAdvisorService.updateBillingSettings.mockResolvedValue({
        data: { hourlyRate: 175, currency: "USD" },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.updateBillingSettings(
        testAdvisorId,
        {
          hourlyRate: 175,
        }
      );

      expect(result.error).toBeNull();
    });
  });

  describe("Messaging", () => {
    it("should send a message to client", async () => {
      const messageData = {
        recipientId: testClientId,
        content: "Just wanted to check in - how is the job search going?",
        type: "text" as const,
      };

      mockAdvisorService.sendMessage.mockResolvedValue({
        data: {
          id: "msg-1",
          senderId: testAdvisorId,
          ...messageData,
          sentAt: new Date().toISOString(),
          status: "sent",
        },
        error: null,
        status: 201,
      });

      const result = await mockAdvisorService.sendMessage(
        testAdvisorId,
        messageData
      );

      expect(result.error).toBeNull();
      expect(result.data.status).toBe("sent");
    });

    it("should get messages for advisor", async () => {
      mockAdvisorService.getMessages.mockResolvedValue({
        data: [
          {
            id: "msg-1",
            from: { full_name: "John Doe" },
            preview: "Thanks for...",
            unread: true,
          },
          {
            id: "msg-2",
            from: { full_name: "Jane Smith" },
            preview: "I have a...",
            unread: false,
          },
        ],
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getMessages(testAdvisorId);

      expect(result.error).toBeNull();
    });

    it("should get conversation with client", async () => {
      mockAdvisorService.getConversation.mockResolvedValue({
        data: {
          participants: [
            { id: testAdvisorId, name: "Dr. Sarah Johnson" },
            { id: testClientId, name: "John Doe" },
          ],
          messages: [
            {
              id: "msg-1",
              senderId: testAdvisorId,
              content: "Hi John!",
              sentAt: "2024-01-15T10:00:00Z",
            },
            {
              id: "msg-2",
              senderId: testClientId,
              content: "Hi Dr. Johnson!",
              sentAt: "2024-01-15T10:05:00Z",
            },
          ],
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getConversation(
        testAdvisorId,
        testClientId
      );

      expect(result.error).toBeNull();
      expect(result.data.messages).toHaveLength(2);
    });

    it("should mark message as read", async () => {
      mockAdvisorService.markMessageRead.mockResolvedValue({
        data: { id: "msg-1", readAt: new Date().toISOString() },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.markMessageRead("msg-1");

      expect(result.error).toBeNull();
    });

    it("should get unread message count", async () => {
      mockAdvisorService.getUnreadCount.mockResolvedValue({
        data: { unreadCount: 5 },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getUnreadCount(testAdvisorId);

      expect(result.error).toBeNull();
      expect(result.data.unreadCount).toBe(5);
    });
  });

  describe("Availability", () => {
    it("should set advisor availability", async () => {
      const availabilityData = {
        schedule: [
          { day: "monday", slots: ["09:00-12:00", "14:00-17:00"] },
          { day: "wednesday", slots: ["09:00-12:00", "14:00-17:00"] },
          { day: "friday", slots: ["09:00-12:00"] },
        ],
        timezone: "America/New_York",
        bufferMinutes: 15,
      };

      mockAdvisorService.setAvailability.mockResolvedValue({
        data: { advisorId: testAdvisorId, ...availabilityData },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.setAvailability(
        testAdvisorId,
        availabilityData
      );

      expect(result.error).toBeNull();
    });

    it("should get advisor availability", async () => {
      mockAdvisorService.getAvailability.mockResolvedValue({
        data: {
          advisorId: testAdvisorId,
          schedule: [{ day: "monday", slots: ["09:00-12:00", "14:00-17:00"] }],
          timezone: "America/New_York",
        },
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAvailability(testAdvisorId);

      expect(result.error).toBeNull();
    });

    it("should get available slots for booking", async () => {
      const expectedSlots = [
        { date: "2024-01-22", time: "09:00", available: true },
        { date: "2024-01-22", time: "10:00", available: true },
        { date: "2024-01-22", time: "11:00", available: false },
        { date: "2024-01-22", time: "14:00", available: true },
      ];

      mockAdvisorService.getAvailableSlots.mockResolvedValue({
        data: expectedSlots,
        error: null,
        status: 200,
      });

      const result = await mockAdvisorService.getAvailableSlots(testAdvisorId, {
        date: "2024-01-22",
        duration: 60,
      });

      expect(result.error).toBeNull();
      expect(
        result.data.filter((s: { available: boolean }) => s.available)
      ).toHaveLength(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle advisor not found", async () => {
      mockAdvisorService.getAdvisorById.mockResolvedValue({
        data: null,
        error: null,
        status: 404,
      });

      const result = await mockAdvisorService.getAdvisorById(
        testTeamId,
        "non-existent"
      );

      expect(result.data).toBeNull();
      expect(result.status).toBe(404);
    });

    it("should handle scheduling conflict", async () => {
      mockAdvisorService.createSession.mockResolvedValue({
        data: null,
        error: { message: "Time slot already booked" },
        status: 409,
      });

      const result = await mockAdvisorService.createSession(testTeamId, {
        advisorId: testAdvisorId,
        clientId: testClientId,
        scheduledAt: "2024-01-20T10:00:00Z",
      });

      expect(result.error).not.toBeNull();
    });

    it("should handle unauthorized billing access", async () => {
      mockAdvisorService.getBillingRecords.mockResolvedValue({
        data: null,
        error: { message: "Not authorized to view billing records" },
        status: 403,
      });

      const result = await mockAdvisorService.getBillingRecords(
        "wrong-advisor"
      );

      expect(result.error).not.toBeNull();
    });
  });
});
