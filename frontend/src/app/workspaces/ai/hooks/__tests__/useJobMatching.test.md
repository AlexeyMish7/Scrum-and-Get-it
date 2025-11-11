# useJobMatching Test Plan

## Setup Required

Install test dependencies:

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

Create `vitest.config.ts` in frontend root:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@shared": path.resolve(__dirname, "./src/app/shared"),
      "@workspaces": path.resolve(__dirname, "./src/app/workspaces"),
      // ... other aliases from tsconfig
    },
  },
});
```

## Test Cases for useJobMatching

### Test 1: Initial State

- Hook should initialize with null/empty values
- isLoading should be false
- error should be null
- matchScore should be null

### Test 2: runMatch Success

- Mock aiGeneration.generateSkillsOptimization to return skills data
- Mock aiGeneration.generateExperienceTailoring to return experience data
- Mock skillsService.listSkills to return user skills
- Call runMatch(jobId)
- Verify:
  - isLoading becomes true then false
  - matchScore is computed correctly
  - breakdown contains skills/experience scores
  - skillsSuggestions and experienceSuggestions are populated
  - error remains null

### Test 3: runMatch Error Handling

- Mock AI service to throw error
- Call runMatch(jobId)
- Verify:
  - error state is set with error message
  - isLoading becomes false
  - matchScore remains null

### Test 4: runMatch Without User

- Set user context to null
- Call runMatch(jobId)
- Verify error is set to "User not authenticated"

### Test 5: saveArtifact Success

- Mock aiArtifacts.insertAiArtifact to return success
- Set matchScore and suggestions (simulate successful runMatch)
- Call saveArtifact with options
- Verify:
  - insertAiArtifact is called with correct parameters
  - Returns success response

### Test 6: saveArtifact Error

- Mock aiArtifacts.insertAiArtifact to throw error
- Call saveArtifact
- Verify error is returned in response

### Test 7: Skills Score Calculation

- Mock responses with specific skills data
- Verify skills score calculation logic:
  - 100% match when all required skills present
  - 0% when no skills match
  - Partial scores for partial matches

### Test 8: Experience Score Calculation

- Mock responses with varying numbers of experience bullets
- Verify experience score scales appropriately
- Caps at 100%

## Example Test Implementation

```typescript
// frontend/src/app/workspaces/ai/hooks/__tests__/useJobMatching.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useJobMatching } from "../useJobMatching";
import * as AuthContext from "@shared/context/AuthContext";
import aiGeneration from "@workspaces/ai/services/aiGeneration";
import skillsService from "@workspaces/profile/services/skills";
import aiArtifacts from "@shared/services/aiArtifacts";

// Mock modules
vi.mock("@shared/context/AuthContext");
vi.mock("@workspaces/ai/services/aiGeneration");
vi.mock("@workspaces/profile/services/skills");
vi.mock("@shared/services/aiArtifacts");

describe("useJobMatching", () => {
  const mockUser = { id: "user-123" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUpNewUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useJobMatching());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.matchScore).toBeNull();
    expect(result.current.breakdown).toBeNull();
    expect(result.current.skillsSuggestions).toEqual([]);
    expect(result.current.experienceSuggestions).toEqual([]);
  });

  it("should run match analysis successfully", async () => {
    const mockSkillsResponse = {
      content: {
        skills: [{ name: "React" }, { name: "TypeScript" }],
      },
    };

    const mockExpResponse = {
      content: {
        tailored: [
          { bullets: ["Developed React apps", "Built TypeScript features"] },
        ],
      },
    };

    const mockUserSkills = {
      data: [{ name: "React" }, { name: "JavaScript" }],
    };

    vi.mocked(aiGeneration.generateSkillsOptimization).mockResolvedValue(
      mockSkillsResponse
    );
    vi.mocked(aiGeneration.generateExperienceTailoring).mockResolvedValue(
      mockExpResponse
    );
    vi.mocked(skillsService.listSkills).mockResolvedValue(mockUserSkills);

    const { result } = renderHook(() => useJobMatching());

    await result.current.runMatch(123);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matchScore).toBeGreaterThan(0);
    expect(result.current.breakdown).toBeDefined();
    expect(result.current.skillsSuggestions).toContain("React");
    expect(result.current.experienceSuggestions.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  // Add more tests...
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test useJobMatching
```
