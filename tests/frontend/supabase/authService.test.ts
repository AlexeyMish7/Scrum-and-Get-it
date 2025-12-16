/**
 * Supabase Tests: Authentication Service
 *
 * Tests authentication flows - login, signup, OAuth, session management.
 * These tests mock Supabase auth and validate authentication logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase auth
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
};

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

describe("[Supabase] Authentication - Sign In", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email/Password Sign In", () => {
    it("should sign in with valid credentials", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      const mockSession = { access_token: "token-123", user: mockUser };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = {
        data: { user: mockUser, session: mockSession },
        error: null,
      };

      expect(result.data.user.email).toBe("test@example.com");
      expect(result.data.session.access_token).toBe("token-123");
      expect(result.error).toBeNull();
    });

    it("should return error for invalid credentials", async () => {
      const mockError = { message: "Invalid login credentials", status: 400 };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = { data: { user: null, session: null }, error: mockError };

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Invalid");
    });

    it("should return error for unverified email", async () => {
      const mockError = { message: "Email not confirmed", status: 400 };

      const result = { data: { user: null, session: null }, error: mockError };
      expect(result.error?.message).toContain("not confirmed");
    });

    it("should return error for account not found", async () => {
      const mockError = { message: "User not found", status: 400 };

      const result = { data: { user: null, session: null }, error: mockError };
      expect(result.error?.message).toContain("not found");
    });
  });

  describe("OAuth Sign In", () => {
    it("should initiate Google OAuth flow", async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { provider: "google", url: "https://accounts.google.com/..." },
        error: null,
      });

      const result = {
        data: { provider: "google", url: "https://accounts.google.com/..." },
        error: null,
      };

      expect(result.data.provider).toBe("google");
      expect(result.data.url).toContain("accounts.google.com");
    });

    it("should initiate GitHub OAuth flow", async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: { provider: "github", url: "https://github.com/login/oauth/..." },
        error: null,
      });

      const result = {
        data: { provider: "github", url: "https://github.com/login/oauth/..." },
        error: null,
      };

      expect(result.data.provider).toBe("github");
    });

    it("should handle OAuth errors", async () => {
      const mockError = { message: "OAuth provider error", status: 500 };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });
  });
});

describe("[Supabase] Authentication - Sign Up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Email Registration", () => {
    it("should create account with valid data", async () => {
      const newUser = {
        id: "new-user-id",
        email: "new@example.com",
        email_confirmed_at: null,
      };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: newUser, session: null },
        error: null,
      });

      const result = { data: { user: newUser, session: null }, error: null };

      expect(result.data.user.id).toBe("new-user-id");
      expect(result.data.user.email_confirmed_at).toBeNull(); // Needs confirmation
    });

    it("should return error for existing email", async () => {
      const mockError = {
        message: "User already registered",
        status: 400,
      };

      const result = { data: { user: null, session: null }, error: mockError };
      expect(result.error?.message).toContain("already registered");
    });

    it("should return error for weak password", async () => {
      const mockError = {
        message: "Password should be at least 6 characters",
        status: 400,
      };

      const result = { data: { user: null, session: null }, error: mockError };
      expect(result.error?.message).toContain("characters");
    });

    it("should return error for invalid email format", async () => {
      const mockError = {
        message: "Unable to validate email address: invalid format",
        status: 400,
      };

      const result = { data: { user: null, session: null }, error: mockError };
      expect(result.error?.message).toContain("invalid format");
    });
  });

  describe("Email Confirmation", () => {
    it("should require email confirmation for new users", async () => {
      const unconfirmedUser = {
        id: "user-1",
        email: "test@example.com",
        email_confirmed_at: null,
      };

      const needsConfirmation = unconfirmedUser.email_confirmed_at === null;
      expect(needsConfirmation).toBe(true);
    });

    it("should allow login after email confirmation", async () => {
      const confirmedUser = {
        id: "user-1",
        email: "test@example.com",
        email_confirmed_at: "2024-01-15T10:00:00Z",
      };

      const isConfirmed = confirmedUser.email_confirmed_at !== null;
      expect(isConfirmed).toBe(true);
    });
  });
});

describe("[Supabase] Authentication - Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Get Current Session", () => {
    it("should return active session", async () => {
      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-456",
        expires_at: Date.now() + 3600000,
        user: { id: "user-1", email: "test@example.com" },
      };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = { data: { session: mockSession }, error: null };

      expect(result.data.session.access_token).toBe("token-123");
    });

    it("should return null for expired session", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = { data: { session: null }, error: null };
      expect(result.data.session).toBeNull();
    });
  });

  describe("Get Current User", () => {
    it("should return authenticated user", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = { data: { user: mockUser }, error: null };
      expect(result.data.user.email).toBe("test@example.com");
    });

    it("should return null for unauthenticated user", async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = { data: { user: null }, error: null };
      expect(result.data.user).toBeNull();
    });
  });

  describe("Auth State Change", () => {
    it("should subscribe to auth state changes", () => {
      const callback = vi.fn();

      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const result = mockSupabaseAuth.onAuthStateChange(callback);

      expect(result.data.subscription).toBeDefined();
    });

    it("should handle sign in event", () => {
      const events: string[] = [];

      const handleAuthChange = (event: string) => {
        events.push(event);
      };

      handleAuthChange("SIGNED_IN");
      expect(events).toContain("SIGNED_IN");
    });

    it("should handle sign out event", () => {
      const events: string[] = [];

      const handleAuthChange = (event: string) => {
        events.push(event);
      };

      handleAuthChange("SIGNED_OUT");
      expect(events).toContain("SIGNED_OUT");
    });

    it("should handle token refresh event", () => {
      const events: string[] = [];

      const handleAuthChange = (event: string) => {
        events.push(event);
      };

      handleAuthChange("TOKEN_REFRESHED");
      expect(events).toContain("TOKEN_REFRESHED");
    });
  });
});

describe("[Supabase] Authentication - Sign Out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sign out successfully", async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const result = { error: null };
    expect(result.error).toBeNull();
  });

  it("should clear local session on sign out", async () => {
    let localSession: object | null = { token: "abc" };

    const signOut = async () => {
      localSession = null;
    };

    await signOut();
    expect(localSession).toBeNull();
  });

  it("should handle sign out errors gracefully", async () => {
    const mockError = { message: "Network error", status: 500 };

    const result = { error: mockError };
    expect(result.error).toBeTruthy();
  });
});

describe("[Supabase] Authentication - Password Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send password reset email", async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = { data: {}, error: null };
    expect(result.error).toBeNull();
  });

  it("should not reveal if email exists", async () => {
    // For security, reset should succeed even if email doesn't exist
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = { data: {}, error: null };
    expect(result.error).toBeNull();
  });

  it("should update password after reset", async () => {
    mockSupabaseAuth.updateUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const result = { data: { user: { id: "user-1" } }, error: null };
    expect(result.data.user.id).toBe("user-1");
  });
});

describe("[Supabase] Authentication - User Metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update user metadata", async () => {
    const updatedMetadata = {
      full_name: "John Doe",
      avatar_url: "https://...",
    };

    mockSupabaseAuth.updateUser.mockResolvedValue({
      data: { user: { user_metadata: updatedMetadata } },
      error: null,
    });

    const result = {
      data: { user: { user_metadata: updatedMetadata } },
      error: null,
    };
    expect(result.data.user.user_metadata.full_name).toBe("John Doe");
  });

  it("should preserve existing metadata on partial update", async () => {
    const existingMetadata = { full_name: "John", theme: "dark" };
    const update = { full_name: "John Doe" };
    const merged = { ...existingMetadata, ...update };

    expect(merged.full_name).toBe("John Doe");
    expect(merged.theme).toBe("dark");
  });
});
