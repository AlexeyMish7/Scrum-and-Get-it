/**
 * SALARY ANALYTICS ENDPOINT
 * 
 * Calculates comprehensive salary progression and negotiation analytics:
 * - Salary progression over time (offers received)
 * - Negotiation success rates and outcomes
 * - Total compensation evolution
 * - Career advancement impact on earnings
 * - Market positioning vs actual offers
 * - Recommendations for salary advancement
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SalaryAnalyticsRequest {
  timeRange?: string; // '30d', '90d', '1y', 'all'
}

interface OfferData {
  job_title: string;
  company_name: string;
  offered_salary: number | null;
  negotiated_salary: number | null;
  offer_received_date: string | null;
  negotiation_outcome: string | null;
  total_compensation_breakdown: any;
  job_status: string | null;
  industry: string | null;
  experience_level: string | null;
  city_name: string | null;
  state_code: string | null;
}

/**
 * POST /api/analytics/salary
 * 
 * Calculate salary progression and negotiation analytics
 * 
 * Request body:
 * - timeRange: '30d', '90d', '1y', 'all' (default: 'all')
 * 
 * Response:
 * - salaryProgression: { timeline: [], avgIncrease: number, totalOffers: number }
 * - negotiationSuccess: { successRate: number, avgNegotiationGain: number, outcomes: {} }
 * - compensationEvolution: { totalCompTimeline: [], avgTotalComp: number }
 * - careerImpact: { offersByLevel: {}, salaryByIndustry: {} }
 * - marketPositioning: { offersVsMarket: [], recommendations: [] }
 * - insights: string[]
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
  try {
    const body = (await readJson(req)) as SalaryAnalyticsRequest;
    const { timeRange = "all" } = body;

    // Calculate date threshold
    const now = new Date();
    let dateThreshold: Date | null = null;
    if (timeRange === "30d") {
      dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "90d") {
      dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "1y") {
      dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Fetch job notes with salary data joined with jobs table
    const query = supabase
      .from("job_notes")
      .select(`
        job_id,
        offered_salary,
        negotiated_salary,
        offer_received_date,
        negotiation_outcome,
        total_compensation_breakdown,
        jobs!inner(
          job_title,
          company_name,
          job_status,
          industry,
          experience_level,
          city_name,
          state_code
        )
      `)
      .eq("user_id", userId)
      .not("offered_salary", "is", null)
      .order("offer_received_date", { ascending: true });

    if (dateThreshold) {
      query.gte("offer_received_date", dateThreshold.toISOString().split("T")[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Salary analytics query error:", error);
      const errorBody = JSON.stringify({ error: "Failed to fetch salary data" });
      res.writeHead(500, {
        "Content-Type": "application/json",
        ...getCorsHeaders(),
      });
      res.end(errorBody);
      return;
    }

    const offers = (data || []).map((row: any) => ({
      job_title: row.jobs.job_title,
      company_name: row.jobs.company_name,
      offered_salary: row.offered_salary,
      negotiated_salary: row.negotiated_salary,
      offer_received_date: row.offer_received_date,
      negotiation_outcome: row.negotiation_outcome,
      total_compensation_breakdown: row.total_compensation_breakdown || {},
      job_status: row.jobs.job_status,
      industry: row.jobs.industry,
      experience_level: row.jobs.experience_level,
      city_name: row.jobs.city_name,
      state_code: row.jobs.state_code,
    })) as OfferData[];

    // 1. SALARY PROGRESSION
    const salaryTimeline = offers.map((offer) => ({
      date: offer.offer_received_date,
      offered: offer.offered_salary,
      negotiated: offer.negotiated_salary || offer.offered_salary,
      company: offer.company_name,
      title: offer.job_title,
    }));

    const validOffers = offers.filter((o) => o.offered_salary);
    const avgOfferedSalary = validOffers.length
      ? validOffers.reduce((sum, o) => sum + (o.offered_salary || 0), 0) / validOffers.length
      : 0;

    const salaryIncrease = validOffers.length >= 2
      ? ((validOffers[validOffers.length - 1].offered_salary || 0) - (validOffers[0].offered_salary || 0))
      : 0;

    // 2. NEGOTIATION SUCCESS
    const negotiatedOffers = offers.filter((o) => o.negotiation_outcome);
    const successfulNegotiations = offers.filter(
      (o) => o.negotiation_outcome === "accepted" && o.negotiated_salary && o.offered_salary && o.negotiated_salary > o.offered_salary
    );

    const successRate = negotiatedOffers.length
      ? successfulNegotiations.length / negotiatedOffers.length
      : 0;

    const avgNegotiationGain = successfulNegotiations.length
      ? successfulNegotiations.reduce((sum, o) => sum + ((o.negotiated_salary || 0) - (o.offered_salary || 0)), 0) / successfulNegotiations.length
      : 0;

    const outcomesCount = offers.reduce((acc, o) => {
      if (o.negotiation_outcome) {
        acc[o.negotiation_outcome] = (acc[o.negotiation_outcome] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 3. TOTAL COMPENSATION EVOLUTION
    const totalCompTimeline = offers
      .filter((o) => o.total_compensation_breakdown?.total)
      .map((o) => ({
        date: o.offer_received_date,
        totalComp: o.total_compensation_breakdown.total,
        breakdown: o.total_compensation_breakdown,
        company: o.company_name,
      }));

    const avgTotalComp = totalCompTimeline.length
      ? totalCompTimeline.reduce((sum, t) => sum + t.totalComp, 0) / totalCompTimeline.length
      : 0;

    // 4. CAREER PROGRESSION IMPACT
    const offersByLevel = offers.reduce((acc, o) => {
      const level = o.experience_level || "unknown";
      if (!acc[level]) acc[level] = { count: 0, avgSalary: 0, total: 0 };
      acc[level].count++;
      acc[level].total += o.offered_salary || 0;
      return acc;
    }, {} as Record<string, { count: number; avgSalary: number; total: number }>);

    Object.keys(offersByLevel).forEach((level) => {
      offersByLevel[level].avgSalary = offersByLevel[level].total / offersByLevel[level].count;
    });

    // Salary by location
    const salaryByLocation = offers.reduce((acc, o) => {
      const location = o.city_name && o.state_code 
        ? `${o.city_name}, ${o.state_code}`
        : o.city_name || o.state_code || "unknown";
      if (!acc[location]) {
        acc[location] = { count: 0, total: 0, avgSalary: 0 };
      }
      acc[location].count++;
      acc[location].total += o.offered_salary || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number; avgSalary: number }>);
    Object.keys(salaryByLocation).forEach((location) => {
      salaryByLocation[location].avgSalary = salaryByLocation[location].total / salaryByLocation[location].count;
    });

    const salaryByIndustry = offers.reduce((acc, o) => {
      const industry = o.industry || "unknown";
      if (!acc[industry]) acc[industry] = { count: 0, avgSalary: 0, total: 0 };
      acc[industry].count++;
      acc[industry].total += o.offered_salary || 0;
      return acc;
    }, {} as Record<string, { count: number; avgSalary: number; total: number }>);

    Object.keys(salaryByIndustry).forEach((industry) => {
      salaryByIndustry[industry].avgSalary = salaryByIndustry[industry].total / salaryByIndustry[industry].count;
    });

    // 5. INSIGHTS & RECOMMENDATIONS
    const insights: string[] = [];

    if (validOffers.length === 0) {
      insights.push("No salary offers recorded yet. Start adding offer details in the Notes tab to track your compensation growth.");
    } else {
      if (salaryIncrease > 0) {
        insights.push(`Your salary offers have increased by $${salaryIncrease.toLocaleString()} over time.`);
      }
      
      if (successRate > 0.5) {
        insights.push(`Strong negotiation performance! You've successfully negotiated ${(successRate * 100).toFixed(0)}% of your offers.`);
      } else if (negotiatedOffers.length > 0 && successRate < 0.3) {
        insights.push(`Consider improving negotiation skills. Only ${(successRate * 100).toFixed(0)}% of negotiations resulted in higher salary.`);
      }

      if (avgNegotiationGain > 5000) {
        insights.push(`Your negotiations average $${Math.round(avgNegotiationGain).toLocaleString()} increase per offer.`);
      }

      if (Object.keys(offersByLevel).length > 1) {
        const levels = Object.entries(offersByLevel).sort((a, b) => b[1].avgSalary - a[1].avgSalary);
        insights.push(`Highest offers come from ${levels[0][0]} level positions (avg: $${Math.round(levels[0][1].avgSalary).toLocaleString()}).`);
      }

      if (Object.keys(salaryByIndustry).length > 1) {
        const industries = Object.entries(salaryByIndustry).sort((a, b) => b[1].avgSalary - a[1].avgSalary);
        insights.push(`${industries[0][0]} industry offers the highest average salary ($${Math.round(industries[0][1].avgSalary).toLocaleString()}).`);
      }

      if (validOffers.length >= 3) {
        const recentOffers = validOffers.slice(-3);
        const recentAvg = recentOffers.reduce((sum, o) => sum + (o.offered_salary || 0), 0) / recentOffers.length;
        const overallAvg = avgOfferedSalary;
        if (recentAvg > overallAvg * 1.1) {
          insights.push("Your recent offers show strong upward momentum. Keep targeting similar opportunities.");
        }
      }
    }

    const recommendations: string[] = [];
    if (validOffers.length > 0) {
      if (successRate < 0.5 && negotiatedOffers.length > 2) {
        recommendations.push("Consider researching market rates before negotiations and practicing negotiation techniques.");
      }
      if (avgNegotiationGain < 3000 && successfulNegotiations.length > 0) {
        recommendations.push("Aim for larger negotiation gains by researching industry standards and your unique value proposition.");
      }
      if (validOffers.length < 5) {
        recommendations.push("Apply to more positions to gather more data points and improve your negotiating position.");
      }
      if (Object.keys(offersByLevel).length === 1) {
        recommendations.push("Consider applying to higher-level positions to understand your potential earning ceiling.");
      }
    }

    const analytics = {
      salaryProgression: {
        timeline: salaryTimeline,
        avgOfferedSalary: Math.round(avgOfferedSalary),
        totalOffers: validOffers.length,
        salaryIncrease: Math.round(salaryIncrease),
      },
      negotiationSuccess: {
        successRate: Math.round(successRate * 100),
        avgNegotiationGain: Math.round(avgNegotiationGain),
        totalNegotiated: successfulNegotiations.length,
        outcomes: outcomesCount,
      },
      compensationEvolution: {
        timeline: totalCompTimeline,
        avgTotalComp: Math.round(avgTotalComp),
      },
      careerImpact: {
        offersByLevel: Object.entries(offersByLevel)
          .filter(([level]) => level !== "unknown")
          .map(([level, data]) => ({
            level,
            count: data.count,
            avgSalary: Math.round(data.avgSalary),
          })),
        salaryByIndustry: Object.entries(salaryByIndustry)
          .filter(([industry]) => industry !== "unknown")
          .map(([industry, data]) => ({
            industry,
            count: data.count,
            avgSalary: Math.round(data.avgSalary),
          })),
        salaryByLocation: Object.entries(salaryByLocation)
          .filter(([location]) => location !== "unknown")
          .map(([location, data]) => ({
            location,
            count: data.count,
            avgSalary: Math.round(data.avgSalary),
          })),
      },
      insights,
      recommendations,
    };

    const responseBody = JSON.stringify(analytics);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(responseBody),
      ...getCorsHeaders(),
    });
    res.end(responseBody);
  } catch (error: any) {
    console.error("Salary analytics error:", error);
    const errorBody = JSON.stringify({ error: error.message || "Internal server error" });
    res.writeHead(500, {
      "Content-Type": "application/json",
      ...getCorsHeaders(),
    });
    res.end(errorBody);
  }
}
