/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useJobMatch Hook
 *
 * Integrated job matching that combines:
 * 1. AI-powered skills optimization and experience tailoring
 * 2. Local score calculation based on user profile
 * 3. Supabase caching for performance
 *
 * Cache Strategy:
 * 1. Check Supabase ai_artifacts table first
 * 2. If valid cache exists (not expired), return immediately
 * 3. Otherwise, run AI analysis and store in cache
 *
 * Inputs: userId (UUID), jobId (number)
 * Outputs: { data, loading, error, refetch }
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAnalytics,
  setAnalytics,
  invalidateAnalytics,
} from "@job_pipeline/services/analyticsCache";
import aiGeneration from "@shared/services/ai/aiGeneration";
import skillsService from "@workspaces/profile/services/skills";

// In-memory request deduplication cache
// Prevents multiple simultaneous requests for the same job
const pendingRequests = new Map<string, Promise<MatchData>>();

interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  culturalFit: number;
}

interface MatchData {
  matchScore: number; // 0-100
  breakdown: MatchBreakdown;
  skillsGaps: string[]; // Missing or weak skills (max 5)
  strengths: string[]; // Areas exceeding requirements (max 5)
  recommendations: string[]; // Actionable improvement steps (max 5)
  reasoning: string; // AI explanation of the match
  artifact: {
    id: string;
    cached: boolean;
  };
  meta: {
    latency_ms: number;
    cached: boolean;
  };
}

interface UseJobMatchResult {
  data: MatchData | null;
  loading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

/**
 * Normalize skill name for fuzzy matching
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

/**
 * Calculate skills match score with fuzzy matching
 */
function calculateSkillsScore(
  jobSkills: string[],
  userSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (jobSkills.length === 0) return { score: 50, matched: [], missing: [] };

  const reqSet = new Set(jobSkills.map(normalizeSkill));
  const userSet = new Set(userSkills.map(normalizeSkill));

  // Exact matches
  const exactMatches = [...reqSet].filter((s) => userSet.has(s));

  // Partial matches (e.g., "React" matches "React.js")
  const partialMatches = [...reqSet].filter((reqSkill) => {
    if (exactMatches.includes(reqSkill)) return false;
    return [...userSet].some(
      (userSkill) =>
        reqSkill.includes(userSkill) ||
        userSkill.includes(reqSkill) ||
        // Common abbreviations
        (reqSkill === "js" && userSkill === "javascript") ||
        (reqSkill === "javascript" && userSkill === "js") ||
        (reqSkill === "ts" && userSkill === "typescript") ||
        (reqSkill === "typescript" && userSkill === "ts")
    );
  });

  const totalMatches = exactMatches.length + partialMatches.length * 0.7;
  const score = Math.round((totalMatches / reqSet.size) * 100);

  // Map back to original skill names for display
  const matched = jobSkills.filter((skill) => {
    const norm = normalizeSkill(skill);
    return exactMatches.includes(norm) || partialMatches.includes(norm);
  });

  const missing = jobSkills.filter((skill) => !matched.includes(skill));

  return { score, matched, missing };
}

/**
 * Fetch job match analysis using AI services.
 * Caches result in ai_artifacts table (subsequent calls return instantly).
 */
export function useJobMatch(
  userId: string | undefined,
  jobId: number | null
): UseJobMatchResult {
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!userId || !jobId) {
        setData(null);
        setError(null);
        return;
      }

      const cacheKey = `${userId}:${jobId}`;

      setLoading(true);
      setError(null);
      const startTime = Date.now();

      try {
        // Step 0: If force refresh requested, invalidate cache first
        if (forceRefresh) {
          await invalidateAnalytics(userId, jobId, "match_score");
        }

        // Step 1: Always check Supabase cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = await getAnalytics(userId, jobId, "match_score");

          if (cached && cached.data) {
            const cachedData = cached.data as unknown as MatchData;
            setData({
              ...cachedData,
              meta: {
                ...cachedData.meta,
                cached: true,
              },
            });
            setLoading(false);
            return;
          }
        }

        // Check if request is already in flight for this job
        const existingRequest = pendingRequests.get(cacheKey);
        if (existingRequest) {
          const result = await existingRequest;
          setData(result);
          setLoading(false);
          return;
        }

        // Step 2: Run AI analysis in parallel
        const requestPromise = (async (): Promise<MatchData> => {
          const [skillsRes, expRes, userSkillsRes] = await Promise.all([
            aiGeneration.generateSkillsOptimization(userId, jobId),
            aiGeneration.generateExperienceTailoring(userId, jobId),
            skillsService.listSkills(userId),
          ]);

          // Parse AI responses
          const skillsContent =
            (skillsRes && ((skillsRes as any).content || skillsRes)) || null;
          const expContent =
            (expRes && ((expRes as any).content || expRes)) || null;

          // Extract job skills from AI response
          const jobSkills: string[] = [];
          const emphasizedSkills: string[] = [];
          const addSkills: string[] = [];

          if (skillsContent) {
            // Try multiple format parsers
            if (Array.isArray((skillsContent as any).ordered_skills)) {
              jobSkills.push(...(skillsContent as any).ordered_skills);
            }
            if (Array.isArray((skillsContent as any).emphasize)) {
              emphasizedSkills.push(...(skillsContent as any).emphasize);
            }
            if (Array.isArray((skillsContent as any).add)) {
              addSkills.push(...(skillsContent as any).add);
            }
            if (Array.isArray((skillsContent as any).skills)) {
              (skillsContent as any).skills.forEach((s: any) => {
                if (typeof s === "string") jobSkills.push(s);
                else if (s && s.name) jobSkills.push(String(s.name));
              });
            }
            // Parse JSON from text field if present
            if (typeof skillsContent.text === "string") {
              try {
                const jsonStr = skillsContent.text
                  .replace(/```json\n?/g, "")
                  .replace(/```\n?/g, "")
                  .trim();
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed.ordered_skills)) {
                  jobSkills.push(...parsed.ordered_skills);
                }
                if (Array.isArray(parsed.emphasize)) {
                  emphasizedSkills.push(...parsed.emphasize);
                }
                if (Array.isArray(parsed.add)) {
                  addSkills.push(...parsed.add);
                }
              } catch (e) {
                console.warn("Failed to parse skills JSON:", e);
              }
            }
          }

          const allJobSkills = [
            ...new Set([...jobSkills, ...emphasizedSkills, ...addSkills]),
          ];

          // Extract user skills
          const userSkills: string[] = [];
          if (userSkillsRes && userSkillsRes.data) {
            (userSkillsRes.data as any[]).forEach((r) => {
              if (r && r.name) userSkills.push(String(r.name));
              else if (r && r.skill_name) userSkills.push(String(r.skill_name));
            });
          }

          // Calculate skills match
          const skillsMatch = calculateSkillsScore(allJobSkills, userSkills);

          // Extract experience bullets and calculate score
          const expBullets: string[] = [];
          let totalRelevanceScore = 0;
          let roleCount = 0;

          if (expContent) {
            if (Array.isArray(expContent.roles)) {
              expContent.roles.forEach((role: any) => {
                roleCount++;
                const bullets = role.tailored_bullets || role.bullets || [];
                if (Array.isArray(bullets)) {
                  expBullets.push(...bullets);
                }
                if (typeof role.relevance_score === "number") {
                  totalRelevanceScore += role.relevance_score;
                }
              });
            } else if (Array.isArray((expContent as any).tailored)) {
              (expContent as any).tailored.forEach((t: any) => {
                if (typeof t === "string") expBullets.push(t);
                else if (t && t.bullets) expBullets.push(...t.bullets);
              });
            } else if (Array.isArray((expContent as any).bullets)) {
              expBullets.push(...(expContent as any).bullets);
            }
          }

          // Calculate experience score
          let expScore = 0;
          if (roleCount > 0) {
            const avgRelevance = totalRelevanceScore / roleCount || 70;
            const bulletScore = Math.min(100, expBullets.length * 15);
            expScore = Math.round(bulletScore * 0.4 + avgRelevance * 0.6);
          } else if (expBullets.length > 0) {
            expScore = Math.min(100, expBullets.length * 20);
          }

          // Calculate overall score
          let overall: number;
          if (expBullets.length === 0 && skillsMatch.score > 0) {
            overall = Math.round(skillsMatch.score * 0.8 + 40 * 0.2);
          } else if (expBullets.length > 0 && allJobSkills.length === 0) {
            overall = Math.round(50 * 0.6 + expScore * 0.4);
          } else {
            overall = Math.round(skillsMatch.score * 0.6 + expScore * 0.4);
          }

          // Build result
          const result: MatchData = {
            matchScore: overall,
            breakdown: {
              skills: skillsMatch.score,
              experience: expScore,
              education: 0, // TODO: Add education analysis
              culturalFit: Math.max(60, overall - 10), // Estimate based on overall
            },
            skillsGaps: skillsMatch.missing.slice(0, 5),
            strengths: skillsMatch.matched.slice(0, 5),
            recommendations: [
              ...skillsMatch.missing
                .slice(0, 3)
                .map(
                  (skill) => `Consider learning ${skill} to improve your match`
                ),
              "Highlight relevant projects that demonstrate your skills",
              "Tailor your resume to emphasize matched skills",
            ].slice(0, 5),
            reasoning: `Based on analysis of ${allJobSkills.length} job requirements and ${userSkills.length} skills in your profile, you have a ${overall}% match. ${skillsMatch.matched.length} skills align well, while ${skillsMatch.missing.length} are areas for development.`,
            artifact: {
              id: `match-${jobId}-${Date.now()}`,
              cached: false,
            },
            meta: {
              latency_ms: Date.now() - startTime,
              cached: false,
            },
          };

          // Step 3: Store in Supabase cache (7 day TTL)
          await setAnalytics(
            userId,
            jobId,
            "match_score",
            result as unknown as Record<string, unknown>,
            7
          );

          // Step 4: Update jobs.match_score column for consistency
          try {
            const { updateRow } = await import("@shared/services/crud");
            await updateRow(
              "jobs",
              { match_score: overall },
              { eq: { id: jobId } }
            );
          } catch {
            // Non-fatal - continue even if update fails
          }

          return result;
        })();

        // Store promise in pending requests
        pendingRequests.set(cacheKey, requestPromise);

        try {
          const result = await requestPromise;
          setData(result);
        } finally {
          // Clean up pending request after completion
          pendingRequests.delete(cacheKey);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
        console.error("[useJobMatch] Error fetching match:", err);
      } finally {
        setLoading(false);
      }
    },
    [userId, jobId]
  );

  // Auto-fetch on mount and when dependencies change (always check cache first)
  useEffect(() => {
    fetchMatch(false); // false = use cache if available
  }, [fetchMatch]);

  return {
    data,
    loading,
    error,
    refetch: (forceRefresh = true) => fetchMatch(forceRefresh), // true = invalidate cache when user explicitly refetches
  };
}
