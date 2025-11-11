/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useAuth } from "@shared/context/AuthContext";
import aiGeneration from "@workspaces/ai/services/aiGeneration";
import skillsService from "@workspaces/profile/services/skills";
import aiArtifacts from "@shared/services/aiArtifacts";

/**
 * Lightweight Job Matching hook.
 * - Runs skills optimization + experience tailoring via AI endpoints
 * - Computes simple match scores based on user's skills vs job requirements
 * - Exposes saveArtifact to persist the analysis
 */
export function useJobMatching() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{
    skills?: number;
    experience?: number;
    education?: number;
  } | null>(null);
  const [skillsSuggestions, setSkillsSuggestions] = useState<string[]>([]);
  const [experienceSuggestions, setExperienceSuggestions] = useState<string[]>(
    []
  );
  const [rawResponses, setRawResponses] = useState<any>(null);

  const runMatch = async (jobId: number) => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    // Verify user session before making AI calls
    if (!user?.id) {
      setError("Please log in to use AI job matching");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchScore(null);
    setBreakdown(null);
    setSkillsSuggestions([]);
    setExperienceSuggestions([]);
    setRawResponses(null);

    try {
      // Parallel requests
      const [skillsRes, expRes, userSkillsRes] = await Promise.all([
        aiGeneration.generateSkillsOptimization(user.id, jobId),
        aiGeneration.generateExperienceTailoring(user.id, jobId),
        skillsService.listSkills(user.id),
      ]);

      // Debug logging
      console.log("🔍 Job Match Debug - Raw Responses:");
      console.log("Skills Response:", skillsRes);
      console.log("Experience Response:", expRes);
      console.log("User Skills Response:", userSkillsRes);

      const skillsContent =
        (skillsRes && ((skillsRes as any).content || skillsRes)) || null;
      const expContent =
        (expRes && ((expRes as any).content || expRes)) || null;

      console.log("Parsed skillsContent:", skillsContent);
      console.log("Parsed expContent:", expContent);

      // Try to extract skill tokens from AI response heuristically
      const requiredSkills: string[] = [];
      const emphasizedSkills: string[] = [];
      const addSkills: string[] = [];

      // Parse skills from various formats
      if (skillsContent) {
        // Format 1: Standard resume artifact format with ordered_skills
        if (Array.isArray((skillsContent as any).ordered_skills)) {
          requiredSkills.push(...(skillsContent as any).ordered_skills);
        }
        // Format 2: Has emphasize array
        if (Array.isArray((skillsContent as any).emphasize)) {
          emphasizedSkills.push(...(skillsContent as any).emphasize);
        }
        if (Array.isArray((skillsContent as any).emphasize_skills)) {
          emphasizedSkills.push(...(skillsContent as any).emphasize_skills);
        }
        // Format 3: Has add array (skills to consider adding)
        if (Array.isArray((skillsContent as any).add)) {
          addSkills.push(...(skillsContent as any).add);
        }
        if (Array.isArray((skillsContent as any).add_skills)) {
          addSkills.push(...(skillsContent as any).add_skills);
        }
        // Format 4: Has a text field with JSON (possibly wrapped in markdown)
        if (typeof skillsContent.text === "string") {
          try {
            // Remove markdown code blocks if present
            const jsonStr = skillsContent.text
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            const parsed = JSON.parse(jsonStr);

            // Extract from various possible fields
            if (Array.isArray(parsed.ordered_skills)) {
              requiredSkills.push(...parsed.ordered_skills);
            }
            if (Array.isArray(parsed.emphasize)) {
              emphasizedSkills.push(...parsed.emphasize);
            }
            if (Array.isArray(parsed.add)) {
              addSkills.push(...parsed.add);
            }
            if (Array.isArray(parsed.required)) {
              requiredSkills.push(...parsed.required);
            }
            if (Array.isArray(parsed.skills)) {
              requiredSkills.push(...parsed.skills);
            }
          } catch (e) {
            console.warn("Failed to parse skills JSON:", e);
          }
        }
        // Format 5: Direct skills array
        else if (Array.isArray((skillsContent as any).skills)) {
          (skillsContent as any).skills.forEach((s: any) => {
            if (typeof s === "string") requiredSkills.push(s);
            else if (s && s.name) requiredSkills.push(String(s.name));
          });
        }
      }

      // Combine all skill sources (deduplicate)
      const allJobSkills = [
        ...new Set([...requiredSkills, ...emphasizedSkills, ...addSkills]),
      ];

      // user's skills
      const userSkills: string[] = [];
      if (userSkillsRes && userSkillsRes.data) {
        (userSkillsRes.data as any[]).forEach((r) => {
          if (r && r.name) userSkills.push(String(r.name));
          else if (r && r.skill_name) userSkills.push(String(r.skill_name));
        });
      }

      console.log("📊 Extracted Data:");
      console.log("Job Skills (all):", allJobSkills);
      console.log("Required Skills:", requiredSkills);
      console.log("Emphasized Skills:", emphasizedSkills);
      console.log("Skills to Add:", addSkills);
      console.log("User Skills:", userSkills);

      // Improved skills matching with fuzzy matching
      const normalizeSkill = (skill: string) =>
        skill.toLowerCase().replace(/[^a-z0-9+#]/g, "");

      const reqSet = new Set(allJobSkills.map(normalizeSkill));
      const userSet = new Set(userSkills.map(normalizeSkill));

      // Exact matches
      const exactMatches = [...reqSet].filter((s) => userSet.has(s));

      // Partial matches (e.g., "React" matches "React.js", "JavaScript" matches "JS")
      const partialMatches = [...reqSet].filter((reqSkill) => {
        if (exactMatches.includes(reqSkill)) return false; // Skip already matched
        return [...userSet].some(
          (userSkill) =>
            reqSkill.includes(userSkill) ||
            userSkill.includes(reqSkill) ||
            // Handle common abbreviations
            (reqSkill === "js" && userSkill === "javascript") ||
            (reqSkill === "javascript" && userSkill === "js") ||
            (reqSkill === "ts" && userSkill === "typescript") ||
            (reqSkill === "typescript" && userSkill === "ts")
        );
      });

      const totalMatches = exactMatches.length + partialMatches.length * 0.7; // Partial matches count as 70%
      const skillsScore =
        reqSet.size > 0 ? Math.round((totalMatches / reqSet.size) * 100) : 50; // Default 50% if no requirements

      console.log("🎯 Skills Matching:");
      console.log("Job skills (unique):", reqSet.size, Array.from(reqSet));
      console.log("User skills (unique):", userSet.size, Array.from(userSet));
      console.log("Exact matches:", exactMatches.length, exactMatches);
      console.log("Partial matches:", partialMatches.length, partialMatches);
      console.log("Skills Score:", skillsScore);

      // Improved experience score based on relevance and content quality
      let expScore = 0;
      const expBullets: string[] = [];
      let totalRelevanceScore = 0;
      let roleCount = 0;

      if (expContent) {
        // Format 1: Has roles array (resume format) - PREFERRED
        if (Array.isArray(expContent.roles)) {
          expContent.roles.forEach((role: any) => {
            roleCount++;
            if (
              Array.isArray(role.bullets) ||
              Array.isArray(role.tailored_bullets)
            ) {
              const bullets = role.tailored_bullets || role.bullets || [];
              expBullets.push(...bullets);
            }
            // Use relevance_score if available
            if (typeof role.relevance_score === "number") {
              totalRelevanceScore += role.relevance_score;
            }
          });

          // Calculate score based on both bullet count and relevance
          if (roleCount > 0) {
            const avgRelevance = totalRelevanceScore / roleCount;
            const bulletScore = Math.min(100, expBullets.length * 15); // Each bullet worth 15 points, max 100
            const relevanceScore = avgRelevance || 70; // Default to 70 if no relevance scores
            expScore = Math.round(bulletScore * 0.4 + relevanceScore * 0.6); // Weight relevance more
          }
        }
        // Format 2: Has tailored array
        else if (Array.isArray((expContent as any).tailored)) {
          (expContent as any).tailored.forEach((t: any) => {
            if (typeof t === "string") expBullets.push(t);
            else if (t && t.bullets) expBullets.push(...t.bullets);
          });
          expScore = Math.min(100, expBullets.length * 20);
        }
        // Format 3: Direct bullets array
        else if (Array.isArray((expContent as any).bullets)) {
          expBullets.push(...(expContent as any).bullets);
          expScore = Math.min(100, expBullets.length * 20);
        }
        // Format 4: Has text field
        else if (typeof (expContent as any).text === "string") {
          // Parse JSON if wrapped
          try {
            const text = (expContent as any).text;
            const jsonStr = text
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            const parsed = JSON.parse(jsonStr);

            if (Array.isArray(parsed.roles)) {
              parsed.roles.forEach((role: any) => {
                roleCount++;
                if (Array.isArray(role.tailored_bullets)) {
                  expBullets.push(...role.tailored_bullets);
                }
                if (typeof role.relevance_score === "number") {
                  totalRelevanceScore += role.relevance_score;
                }
              });

              if (roleCount > 0) {
                const avgRelevance = totalRelevanceScore / roleCount;
                const bulletScore = Math.min(100, expBullets.length * 15);
                const relevanceScore = avgRelevance || 70;
                expScore = Math.round(bulletScore * 0.4 + relevanceScore * 0.6);
              }
            }
          } catch {
            // Fallback: naive split
            expBullets.push(
              ...String((expContent as any).text)
                .split(/\n|\r/)
                .map((l: any) => l.trim())
                .filter(Boolean)
                .filter((l: string) => l.length > 10) // Filter out short lines
            );
            expScore = Math.min(100, expBullets.length * 20);
          }
        }

        // Ensure minimum score if we have any experience data
        if (expBullets.length > 0 && expScore === 0) {
          expScore = Math.min(100, expBullets.length * 20);
        }
      }

      console.log("💼 Experience Analysis:");
      console.log("Roles analyzed:", roleCount);
      console.log(
        "Experience bullets:",
        expBullets.length,
        expBullets.slice(0, 3)
      ); // Show first 3
      console.log(
        "Average relevance:",
        roleCount > 0 ? totalRelevanceScore / roleCount : "N/A"
      );
      console.log("Experience Score:", expScore);

      // Improved overall score calculation
      // If we have good skills but no experience bullets, don't penalize too heavily
      let overall: number;
      if (expBullets.length === 0 && skillsScore > 0) {
        // No experience data but has skills - weight skills more heavily
        overall = Math.round(skillsScore * 0.8 + 40 * 0.2); // Assume base 40% for experience
      } else if (expBullets.length > 0 && reqSet.size === 0) {
        // Has experience but no specific skills requirements
        overall = Math.round(50 * 0.6 + expScore * 0.4); // Assume base 50% for skills
      } else {
        // Normal case: weight both (skills 60%, experience 40%)
        overall = Math.round(skillsScore * 0.6 + expScore * 0.4);
      }

      console.log("✨ Final Scores:");
      console.log("Overall Match:", overall);
      console.log("Breakdown - Skills:", skillsScore, "Experience:", expScore);

      setMatchScore(overall);
      setBreakdown({ skills: skillsScore, experience: expScore, education: 0 });

      // Update suggestions to include all discovered skills
      setSkillsSuggestions(allJobSkills);
      setExperienceSuggestions(expBullets);
      setRawResponses({ skillsRes, expRes, userSkillsRes });
    } catch (e: any) {
      console.error("Job match failed", e);
      setError(e?.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const saveArtifact = async (opts: {
    kind: string;
    title?: string;
    jobId?: number;
    content?: any;
    metadata?: any;
  }) => {
    if (!userId) return { error: { message: "Not authenticated" } };
    try {
      const res = await aiArtifacts.insertAiArtifact(userId, {
        kind: opts.kind as any,
        title: opts.title ?? "Job Match Analysis",
        job_id: opts.jobId,
        prompt: undefined,
        model: undefined,
        content: opts.content ?? {
          matchScore,
          breakdown,
          skillsSuggestions,
          experienceSuggestions,
          raw: rawResponses,
        },
        metadata: opts.metadata ?? {},
      });
      return res;
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  };

  return {
    isLoading,
    error,
    matchScore,
    breakdown,
    skillsSuggestions,
    experienceSuggestions,
    rawResponses,
    runMatch,
    saveArtifact,
  };
}

export default useJobMatching;
