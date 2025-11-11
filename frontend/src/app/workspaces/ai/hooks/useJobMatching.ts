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
        aiGeneration.generateSkillsOptimization(userId, jobId),
        aiGeneration.generateExperienceTailoring(userId, jobId),
        skillsService.listSkills(userId),
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

      // Parse skills from various formats
      if (skillsContent) {
        // Format 1: Has a text field with JSON (possibly wrapped in markdown)
        if (typeof skillsContent.text === "string") {
          try {
            // Remove markdown code blocks if present
            const jsonStr = skillsContent.text
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            const parsed = JSON.parse(jsonStr);

            // Extract from various possible fields
            if (Array.isArray(parsed.emphasize)) {
              requiredSkills.push(...parsed.emphasize);
            }
            if (Array.isArray(parsed.add)) {
              requiredSkills.push(...parsed.add);
            }
            if (Array.isArray(parsed.required)) {
              requiredSkills.push(...parsed.required);
            }
            if (Array.isArray(parsed.skills)) {
              requiredSkills.push(...parsed.skills);
            }
          } catch (e) {
            console.warn("Failed to parse skills JSON:", e);
            // Fallback: split by comma/newline
            const toks = skillsContent.text
              .split(/,|\n/)
              .map((t: string) => t.trim())
              .filter(Boolean);
            requiredSkills.push(...toks);
          }
        }
        // Format 2: Direct skills array
        else if (Array.isArray((skillsContent as any).skills)) {
          (skillsContent as any).skills.forEach((s: any) => {
            if (typeof s === "string") requiredSkills.push(s);
            else if (s && s.name) requiredSkills.push(String(s.name));
          });
        }
        // Format 3: Direct emphasize array
        else if (Array.isArray((skillsContent as any).emphasize)) {
          requiredSkills.push(...(skillsContent as any).emphasize);
        }
      }

      // user's skills
      const userSkills: string[] = [];
      if (userSkillsRes && userSkillsRes.data) {
        (userSkillsRes.data as any[]).forEach((r) => {
          if (r && r.name) userSkills.push(String(r.name));
          else if (r && r.skill_name) userSkills.push(String(r.skill_name));
        });
      }

      console.log("📊 Extracted Data:");
      console.log("Required Skills:", requiredSkills);
      console.log("User Skills:", userSkills);

      // compute skills match (intersection / required)
      const reqSet = new Set(requiredSkills.map((s) => s.toLowerCase()));
      const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
      const matched = [...reqSet].filter((s) => userSet.has(s));
      const skillsScore =
        reqSet.size > 0 ? Math.round((matched.length / reqSet.size) * 100) : 0;

      console.log("🎯 Skills Matching:");
      console.log("Required skills (unique):", reqSet.size, Array.from(reqSet));
      console.log("User skills (unique):", userSet.size, Array.from(userSet));
      console.log("Matched skills:", matched.length, matched);
      console.log("Skills Score:", skillsScore);

      // experience score: heuristic based on number of tailored bullets
      let expScore = 0;
      const expBullets: string[] = [];

      if (expContent) {
        // Format 1: Has roles array (resume format)
        if (Array.isArray(expContent.roles)) {
          expContent.roles.forEach((role: any) => {
            if (Array.isArray(role.bullets)) {
              expBullets.push(...role.bullets);
            }
          });
        }
        // Format 2: Has tailored array
        else if (Array.isArray((expContent as any).tailored)) {
          (expContent as any).tailored.forEach((t: any) => {
            if (typeof t === "string") expBullets.push(t);
            else if (t && t.bullets) expBullets.push(...t.bullets);
          });
        }
        // Format 3: Direct bullets array
        else if (Array.isArray((expContent as any).bullets)) {
          expBullets.push(...(expContent as any).bullets);
        }
        // Format 4: Has text field
        else if (typeof (expContent as any).text === "string") {
          // naive split
          expBullets.push(
            ...String((expContent as any).text)
              .split(/\n|\r/)
              .map((l: any) => l.trim())
              .filter(Boolean)
          );
        }
      }

      expScore = Math.min(100, expBullets.length * 20); // up to 100

      console.log("💼 Experience Analysis:");
      console.log("Experience bullets:", expBullets.length, expBullets);
      console.log("Experience Score:", expScore);

      // Combine into overall match score (weights: skills 0.6, experience 0.4)
      const overall = Math.round(skillsScore * 0.6 + expScore * 0.4);

      console.log("✨ Final Scores:");
      console.log("Overall Match:", overall);
      console.log("Breakdown - Skills:", skillsScore, "Experience:", expScore);

      setMatchScore(overall);
      setBreakdown({ skills: skillsScore, experience: expScore, education: 0 });
      setSkillsSuggestions(requiredSkills);
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
