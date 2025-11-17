/**
 * ANALYTICS TYPES
 * Job statistics, metrics, and analytics data structures.
 */

import type { PipelineStage } from "./pipeline.types";

/**
 * Job statistics and analytics data
 */
export interface JobStats {
  total: number;
  byStage: Record<PipelineStage, number>;
  responseRate: number; // Percentage of applications that got responses
  avgDaysInStage: Record<PipelineStage, number>;
}

/**
 * Analytics cache metadata
 */
export interface AnalyticsCacheEntry {
  userId: string;
  jobId: number;
  analyticsType: string;
  data: unknown;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Match analysis result
 */
export interface MatchData {
  overallScore: number;
  skillsMatch: {
    score: number;
    matched: string[];
    missing: string[];
    total: number;
  };
  experienceMatch: {
    score: number;
    relevantBullets: string[];
    totalBullets: number;
  };
  strengthsAndGaps: {
    strengths: string[];
    gaps: string[];
  };
}
