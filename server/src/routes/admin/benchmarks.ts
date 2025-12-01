/**
 * Peer Benchmark Computation Endpoint
 * 
 * Purpose: Trigger computation of anonymized peer benchmarks from real user data
 * 
 * Endpoints:
 * - POST /api/admin/compute-benchmarks - Compute all peer benchmarks (admin only)
 * - GET /api/admin/benchmark-status - Check peer benchmark coverage
 * 
 * Privacy: Only creates benchmarks when segment has 5+ users
 */

import type { IncomingMessage, ServerResponse } from "http";
import { sendJson } from "../../utils/http.js";
import { requireAuth } from "../middleware/auth.js";
import { getCorsHeaders } from "../middleware/cors.js";
import supabaseAdmin from "../services/supabaseAdmin.js";

/**
 * POST /api/admin/compute-benchmarks
 * 
 * Trigger computation of all peer benchmarks
 * Aggregates anonymized metrics from all users
 */
export async function handleComputeBenchmarks(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    // Authentication (in production, add admin role check)
    const userId = await requireAuth(req);

    console.log("[computeBenchmarks] Starting peer benchmark computation...");

    // Call database function to compute all benchmarks
    const { data, error } = await supabaseAdmin.rpc("compute_all_peer_benchmarks");

    if (error) {
      console.error("[computeBenchmarks] Error:", error);
      return sendJson(res, 500, {
        success: false,
        error: "Failed to compute peer benchmarks",
        details: error.message,
      }, getCorsHeaders());
    }

    // Get updated benchmark count
    const { data: benchmarks, error: countError } = await supabaseAdmin
      .from("peer_benchmarks")
      .select("industry, experience_level, sample_size, last_computed_at");

    if (countError) {
      console.warn("[computeBenchmarks] Could not fetch benchmark count:", countError);
    }

    return sendJson(res, 200, {
      success: true,
      message: "Peer benchmarks computed successfully",
      benchmarks: benchmarks || [],
      totalSegments: benchmarks?.length || 0,
    }, getCorsHeaders());
  } catch (error: unknown) {
    console.error("[handleComputeBenchmarks] Error:", error);
    return sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "Failed to compute benchmarks",
    }, getCorsHeaders());
  }
}

/**
 * GET /api/admin/benchmark-status
 * 
 * Get status of peer benchmarks (coverage, sample sizes, freshness)
 */
export async function handleBenchmarkStatus(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    // Authentication
    const userId = await requireAuth(req);

    // Get all peer benchmarks
    const { data: benchmarks, error } = await supabaseAdmin
      .from("peer_benchmarks")
      .select("*")
      .order("sample_size", { ascending: false });

    if (error) {
      return sendJson(res, 500, {
        success: false,
        error: "Failed to fetch benchmark status",
      }, getCorsHeaders());
    }

    // Get total users with jobs
    const { count: totalUsers, error: userCountError } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .not("id", "in", 
        `(SELECT DISTINCT user_id FROM jobs WHERE user_id IS NOT NULL)`
      );

    // Get segments without benchmarks
    const { data: segments, error: segmentError } = await supabaseAdmin
      .from("profiles")
      .select("industry, experience_level")
      .not("industry", "is", null)
      .not("experience_level", "is", null);

    const uniqueSegments = new Set(
      segments?.map(s => `${s.industry}-${s.experience_level}`) || []
    );

    const coveredSegments = new Set(
      benchmarks?.map(b => `${b.industry}-${b.experience_level}`) || []
    );

    const uncoveredSegments = Array.from(uniqueSegments)
      .filter(s => !coveredSegments.has(s))
      .map(s => {
        const [industry, level] = s.split("-");
        return { industry, experience_level: level };
      });

    // Calculate statistics
    const totalSampleSize = benchmarks?.reduce((sum, b) => sum + (b.sample_size || 0), 0) || 0;
    const avgSampleSize = benchmarks?.length ? totalSampleSize / benchmarks.length : 0;
    const highQualityCount = benchmarks?.filter(b => b.data_quality_score >= 0.8).length || 0;

    return sendJson(res, 200, {
      success: true,
      status: {
        totalBenchmarks: benchmarks?.length || 0,
        totalSegments: uniqueSegments.size,
        coveragePercentage: uniqueSegments.size > 0 
          ? (coveredSegments.size / uniqueSegments.size) * 100 
          : 0,
        totalSampleSize,
        avgSampleSize: Math.round(avgSampleSize),
        highQualityBenchmarks: highQualityCount,
        uncoveredSegments,
      },
      benchmarks: benchmarks?.map(b => ({
        industry: b.industry,
        experienceLevel: b.experience_level,
        sampleSize: b.sample_size,
        dataQuality: b.data_quality_score,
        lastComputed: b.last_computed_at,
        metrics: {
          applicationsPerMonth: b.avg_applications_per_month,
          responseRate: b.avg_response_rate,
          interviewRate: b.avg_interview_rate,
          offerRate: b.avg_offer_rate,
        },
      })) || [],
    }, getCorsHeaders());
  } catch (error: unknown) {
    console.error("[handleBenchmarkStatus] Error:", error);
    return sendJson(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get benchmark status",
    }, getCorsHeaders());
  }
}
