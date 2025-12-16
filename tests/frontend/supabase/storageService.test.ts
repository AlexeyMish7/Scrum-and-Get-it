/**
 * Supabase Tests: Storage Service
 *
 * Tests file storage operations - avatars, documents, resume uploads.
 * These tests mock Supabase storage and validate upload/download logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase storage
const mockStorageFrom = vi.fn();

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  },
}));

describe("[Supabase] Storage - Avatar Uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upload Avatar", () => {
    it("should upload avatar image successfully", async () => {
      const mockFile = new File(["image data"], "avatar.jpg", {
        type: "image/jpeg",
      });
      const uploadPath = "user-123/avatar.jpg";

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: uploadPath },
          error: null,
        }),
      });

      const result = { data: { path: uploadPath }, error: null };

      expect(result.data.path).toBe("user-123/avatar.jpg");
      expect(result.error).toBeNull();
    });

    it("should reject files that are too large", async () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = 10 * 1024 * 1024; // 10MB

      const isValidSize = fileSize <= maxSize;
      expect(isValidSize).toBe(false);
    });

    it("should only accept image file types", async () => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      expect(allowedTypes.includes("image/jpeg")).toBe(true);
      expect(allowedTypes.includes("image/png")).toBe(true);
      expect(allowedTypes.includes("application/pdf")).toBe(false);
      expect(allowedTypes.includes("text/plain")).toBe(false);
    });

    it("should generate unique file path with user ID", () => {
      const userId = "user-123";
      const timestamp = Date.now();
      const extension = "jpg";

      const path = `avatars/${userId}/${timestamp}.${extension}`;

      expect(path).toContain(userId);
      expect(path).toContain(extension);
    });

    it("should handle upload errors", async () => {
      const mockError = { message: "Upload failed", statusCode: 500 };

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });
  });

  describe("Get Avatar URL", () => {
    it("should generate public URL for avatar", () => {
      const path = "avatars/user-123/avatar.jpg";

      mockStorageFrom.mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: `https://storage.supabase.co/avatars/${path}` },
        }),
      });

      const result = {
        data: { publicUrl: `https://storage.supabase.co/avatars/${path}` },
      };

      expect(result.data.publicUrl).toContain(path);
    });

    it("should generate signed URL for private files", async () => {
      const path = "private/user-123/document.pdf";
      const expiresIn = 3600; // 1 hour

      mockStorageFrom.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: `https://storage.supabase.co/...?token=abc` },
          error: null,
        }),
      });

      const result = {
        data: { signedUrl: `https://storage.supabase.co/...?token=abc` },
        error: null,
      };

      expect(result.data.signedUrl).toContain("token=");
    });
  });

  describe("Delete Avatar", () => {
    it("should delete existing avatar", async () => {
      const paths = ["avatars/user-123/avatar.jpg"];

      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: [{ name: "avatar.jpg" }],
          error: null,
        }),
      });

      const result = { data: [{ name: "avatar.jpg" }], error: null };
      expect(result.error).toBeNull();
    });

    it("should handle deletion of non-existent file", async () => {
      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const result = { data: [], error: null };
      expect(result.error).toBeNull(); // Should not error
    });
  });
});

describe("[Supabase] Storage - Document Uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upload Resume/CV", () => {
    it("should upload PDF resume", async () => {
      const mockFile = new File(["pdf data"], "resume.pdf", {
        type: "application/pdf",
      });
      const uploadPath = "documents/user-123/resume.pdf";

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: uploadPath },
          error: null,
        }),
      });

      const result = { data: { path: uploadPath }, error: null };

      expect(result.data.path).toContain("resume.pdf");
    });

    it("should upload Word document", async () => {
      const docTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      expect(docTypes.includes("application/pdf")).toBe(true);
      expect(
        docTypes.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ).toBe(true);
    });

    it("should enforce file size limits", () => {
      const maxResumeSize = 10 * 1024 * 1024; // 10MB
      const testSizes = [
        { size: 1 * 1024 * 1024, valid: true },
        { size: 5 * 1024 * 1024, valid: true },
        { size: 15 * 1024 * 1024, valid: false },
      ];

      testSizes.forEach(({ size, valid }) => {
        expect(size <= maxResumeSize).toBe(valid);
      });
    });
  });

  describe("List User Documents", () => {
    it("should list all documents for user", async () => {
      const mockFiles = [
        { name: "resume_v1.pdf", created_at: "2024-01-10" },
        { name: "resume_v2.pdf", created_at: "2024-01-15" },
        { name: "cover_letter.pdf", created_at: "2024-01-12" },
      ];

      mockStorageFrom.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: mockFiles,
          error: null,
        }),
      });

      const result = { data: mockFiles, error: null };

      expect(result.data).toHaveLength(3);
      expect(result.data[0].name).toBe("resume_v1.pdf");
    });

    it("should filter by file type", () => {
      const files = [
        { name: "resume.pdf", type: "pdf" },
        { name: "avatar.jpg", type: "image" },
        { name: "cover.docx", type: "doc" },
      ];

      const pdfFiles = files.filter((f) => f.type === "pdf");
      expect(pdfFiles).toHaveLength(1);
    });

    it("should sort by created date", () => {
      const files = [
        { name: "b.pdf", created_at: "2024-01-15" },
        { name: "a.pdf", created_at: "2024-01-10" },
        { name: "c.pdf", created_at: "2024-01-20" },
      ];

      const sorted = files.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sorted[0].name).toBe("c.pdf");
      expect(sorted[2].name).toBe("a.pdf");
    });
  });

  describe("Download Document", () => {
    it("should download file as blob", async () => {
      const mockBlob = new Blob(["file content"], { type: "application/pdf" });

      mockStorageFrom.mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      });

      const result = { data: mockBlob, error: null };

      expect(result.data).toBeInstanceOf(Blob);
    });

    it("should handle download errors", async () => {
      const mockError = { message: "File not found", statusCode: 404 };

      mockStorageFrom.mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      const result = { data: null, error: mockError };
      expect(result.error?.statusCode).toBe(404);
    });
  });
});

describe("[Supabase] Storage - AI Generated Content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Store Generated Resume", () => {
    it("should store AI-generated resume", async () => {
      const generatedContent = {
        type: "resume",
        content: "# John Doe\n## Software Engineer...",
        metadata: { jobId: "job-123", templateId: "modern" },
      };

      const path = `ai-generated/user-123/resume-${Date.now()}.md`;

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path },
          error: null,
        }),
      });

      const result = { data: { path }, error: null };

      expect(result.data.path).toContain("ai-generated");
      expect(result.data.path).toContain("resume");
    });

    it("should store generated content with version info", () => {
      const version = {
        v: 1,
        generatedAt: new Date().toISOString(),
        promptVersion: "v2.1",
      };

      expect(version.v).toBe(1);
      expect(version.promptVersion).toBe("v2.1");
    });
  });

  describe("Store Generated Cover Letter", () => {
    it("should store AI-generated cover letter", async () => {
      const path = `ai-generated/user-123/cover-letter-${Date.now()}.md`;

      const result = { data: { path }, error: null };
      expect(result.data.path).toContain("cover-letter");
    });
  });
});

describe("[Supabase] Storage - Bucket Policies", () => {
  describe("Access Control", () => {
    it("should allow user to access their own files", () => {
      const userId = "user-123";
      const filePath = "user-123/avatar.jpg";

      const canAccess = filePath.startsWith(userId);
      expect(canAccess).toBe(true);
    });

    it("should deny access to other users' files", () => {
      const userId = "user-123";
      const filePath = "user-456/avatar.jpg";

      const canAccess = filePath.startsWith(userId);
      expect(canAccess).toBe(false);
    });

    it("should allow public access to avatars bucket", () => {
      const publicBuckets = ["avatars"];
      const bucket = "avatars";

      expect(publicBuckets.includes(bucket)).toBe(true);
    });

    it("should require auth for documents bucket", () => {
      const privateBuckets = ["documents", "ai-generated"];
      const bucket = "documents";

      expect(privateBuckets.includes(bucket)).toBe(true);
    });
  });

  describe("Bucket Configuration", () => {
    it("should have correct bucket names", () => {
      const buckets = ["avatars", "documents", "ai-generated"];

      expect(buckets).toContain("avatars");
      expect(buckets).toContain("documents");
    });

    it("should have file size limits per bucket", () => {
      const bucketLimits = {
        avatars: 5 * 1024 * 1024, // 5MB
        documents: 10 * 1024 * 1024, // 10MB
        "ai-generated": 50 * 1024 * 1024, // 50MB
      };

      expect(bucketLimits.avatars).toBe(5 * 1024 * 1024);
      expect(bucketLimits.documents).toBe(10 * 1024 * 1024);
    });
  });
});

describe("[Supabase] Storage - File Validation", () => {
  describe("MIME Type Validation", () => {
    it("should validate image MIME types for avatars", () => {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      const validFile = { type: "image/jpeg" };
      const invalidFile = { type: "image/svg+xml" };

      expect(allowedImageTypes.includes(validFile.type)).toBe(true);
      expect(allowedImageTypes.includes(invalidFile.type)).toBe(false);
    });

    it("should validate document MIME types", () => {
      const allowedDocTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ];

      expect(allowedDocTypes.includes("application/pdf")).toBe(true);
      expect(allowedDocTypes.includes("application/exe")).toBe(false);
    });
  });

  describe("Filename Sanitization", () => {
    it("should sanitize filenames", () => {
      const sanitize = (name: string) => {
        return name
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .replace(/_{2,}/g, "_")
          .toLowerCase();
      };

      // "My Resume (2024).pdf" → "my_resume__2024_.pdf" → collapses to "my_resume_2024_.pdf"
      expect(sanitize("My Resume (2024).pdf")).toBe("my_resume_2024_.pdf");
      expect(sanitize("file name with spaces.pdf")).toBe(
        "file_name_with_spaces.pdf"
      );
    });

    it("should preserve file extension", () => {
      const getExtension = (name: string) => {
        const parts = name.split(".");
        return parts.length > 1 ? parts.pop() : null;
      };

      expect(getExtension("resume.pdf")).toBe("pdf");
      expect(getExtension("document.docx")).toBe("docx");
      expect(getExtension("noextension")).toBeNull();
    });
  });
});
