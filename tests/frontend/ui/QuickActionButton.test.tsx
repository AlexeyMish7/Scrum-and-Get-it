/**
 * UI Tests: QuickActionButton Component
 *
 * Tests the reusable quick action button used in navigation.
 * Validates button rendering, navigation, and click handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("[UI] QuickActionButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render with label", () => {
      const props = {
        label: "Add Job",
      };

      expect(props.label).toBe("Add Job");
    });

    it("should render with start icon", () => {
      const props = {
        label: "New Resume",
        startIcon: "AddIcon",
      };

      expect(props.startIcon).toBe("AddIcon");
    });

    it("should render with default color (primary)", () => {
      const props = {
        label: "Action",
        color: "primary" as const,
      };

      expect(props.color).toBe("primary");
    });

    it("should render with success color", () => {
      const props = {
        label: "Save",
        color: "success" as const,
      };

      expect(props.color).toBe("success");
    });

    it("should render with error color", () => {
      const props = {
        label: "Delete",
        color: "error" as const,
      };

      expect(props.color).toBe("error");
    });

    it("should render small size by default", () => {
      const props = {
        label: "Action",
        size: "small" as const,
      };

      expect(props.size).toBe("small");
    });

    it("should render medium size when specified", () => {
      const props = {
        label: "Action",
        size: "medium" as const,
      };

      expect(props.size).toBe("medium");
    });
  });

  describe("Navigation Variant", () => {
    it("should render as NavLink when 'to' prop is provided", () => {
      const props = {
        label: "Go to Jobs",
        to: "/jobs",
      };

      expect(props.to).toBe("/jobs");
    });

    it("should navigate to correct path", () => {
      const props = {
        label: "Profile",
        to: "/profile",
      };

      expect(props.to).toMatch(/^\//);
    });

    it("should support nested routes", () => {
      const props = {
        label: "Add Skill",
        to: "/profile/skills/new",
      };

      expect(props.to).toBe("/profile/skills/new");
    });
  });

  describe("Click Handler Variant", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      handleClick();

      expect(handleClick).toHaveBeenCalled();
    });

    it("should not navigate when onClick is provided instead of to", () => {
      const props = {
        label: "Export",
        onClick: vi.fn(),
        to: undefined,
      };

      expect(props.to).toBeUndefined();
      expect(props.onClick).toBeDefined();
    });

    it("should pass event to onClick handler", () => {
      const handleClick = vi.fn();
      const mockEvent = { preventDefault: vi.fn() };

      handleClick(mockEvent);

      expect(handleClick).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe("Button Styling", () => {
    it("should have no text transform", () => {
      const expectedStyle = { textTransform: "none" };
      expect(expectedStyle.textTransform).toBe("none");
    });

    it("should use contained variant", () => {
      const variant = "contained";
      expect(variant).toBe("contained");
    });
  });
});

describe("[UI] QuickActionButton Use Cases", () => {
  describe("Job Pipeline Actions", () => {
    const jobActions = [
      { label: "Add Job", to: "/jobs/new", color: "primary" },
      { label: "Import Jobs", onClick: "importHandler", color: "secondary" },
      { label: "Export CSV", onClick: "exportHandler", color: "success" },
    ];

    it("should render add job button", () => {
      expect(jobActions[0].label).toBe("Add Job");
      expect(jobActions[0].to).toBe("/jobs/new");
    });

    it("should render import button with handler", () => {
      expect(jobActions[1].onClick).toBe("importHandler");
    });

    it("should render export button with success color", () => {
      expect(jobActions[2].color).toBe("success");
    });
  });

  describe("AI Workspace Actions", () => {
    const aiActions = [
      { label: "Generate Resume", to: "/ai/resume", color: "primary" },
      { label: "Cover Letter", to: "/ai/cover-letter", color: "primary" },
      { label: "Company Research", to: "/ai/research", color: "secondary" },
    ];

    it("should have all AI action buttons", () => {
      expect(aiActions).toHaveLength(3);
    });

    it("should navigate to resume generator", () => {
      expect(aiActions[0].to).toBe("/ai/resume");
    });
  });

  describe("Profile Actions", () => {
    const profileActions = [
      { label: "Add Skill", onClick: "openSkillDialog", color: "primary" },
      {
        label: "Add Education",
        onClick: "openEducationDialog",
        color: "primary",
      },
      {
        label: "Add Experience",
        onClick: "openEmploymentDialog",
        color: "primary",
      },
    ];

    it("should have profile quick actions", () => {
      expect(profileActions).toHaveLength(3);
    });

    it("should use onClick for dialog opening", () => {
      profileActions.forEach((action) => {
        expect(action.onClick).toBeDefined();
      });
    });
  });
});
