/**
 * Analytics helpers for Jobs workspace
 * - Provides client-side metrics for success, stage times, response rates, deadlines, etc.
 * - Designed to be imported by `AnalyticsPage` and other dashboard components.
 */

export type JobRecord = {
  id?: number | string;
  job_title?: string;
  company_name?: string;
  industry?: string | null;
  job_type?: string | null;
  created_at?: string | null;
  status_changed_at?: string | null;
  job_status?: string | null;
  application_deadline?: string | null;
};

/** Basic static industry benchmarks (for BenchmarkCard comparison) */
export const industryBenchmarks: Record<
  string,
  { avgResponseDays: number; offerRate: number }
> = {
  Software: { avgResponseDays: 10, offerRate: 0.08 },
  Finance: { avgResponseDays: 12, offerRate: 0.06 },
  Healthcare: { avgResponseDays: 9, offerRate: 0.07 },
  Education: { avgResponseDays: 7, offerRate: 0.05 },
  "(unknown)": { avgResponseDays: 11, offerRate: 0.06 },
};

/** ✅ Success rate grouped by industry or job_type */
export function computeSuccessRates(
  jobs: JobRecord[],
  groupBy: "industry" | "job_type" = "industry"
) {
  const map: Record<string, { offers: number; total: number }> = {};
  for (const j of jobs) {
    const key = (j[groupBy] as string) ?? "(unknown)";
    if (!map[key]) map[key] = { offers: 0, total: 0 };
    map[key].total += 1;
    if ((j.job_status ?? "").toLowerCase() === "offer") map[key].offers += 1;
  }
  const out = Object.keys(map).map((k) => ({
    key: k,
    offers: map[k].offers,
    total: map[k].total,
    rate: map[k].offers / Math.max(1, map[k].total),
  }));
  out.sort((a, b) => b.rate - a.rate);
  return out;
}

/** ✅ Average response time grouped by company or industry */
export function computeAvgResponseDays(
  jobs: JobRecord[],
  groupBy: "company" | "industry" = "company",
  topN = 10
) {
  const map: Record<string, { totalDays: number; count: number }> = {};
  for (const j of jobs) {
    if (!j.created_at || !j.status_changed_at) continue;
    const created = new Date(j.created_at);
    const changed = new Date(j.status_changed_at);
    if (isNaN(created.getTime()) || isNaN(changed.getTime())) continue;
    const days = (changed.getTime() - created.getTime()) / 86400000;
    // Skip negative or zero day differences
    if (days <= 0) continue;
    const key =
      groupBy === "company"
        ? j.company_name ?? "(unknown)"
        : j.industry ?? "(unknown)";
    if (!map[key]) map[key] = { totalDays: 0, count: 0 };
    map[key].totalDays += days;
    map[key].count += 1;
  }
  const out = Object.keys(map).map((k) => {
    const avgDays = map[k].count > 0 ? map[k].totalDays / map[k].count : 0;
    return {
      key: k,
      avgDays: Math.max(0, avgDays), // Ensure non-negative
      count: map[k].count,
    };
  });
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, topN);
}

/** ✅ Compare user’s success rate vs benchmarks */
export function compareToBenchmarks(
  successRates: Array<{
    key: string;
    rate: number;
    offers: number;
    total: number;
  }>,
  benchmarks = industryBenchmarks
) {
  return successRates
    .map((s) => {
      const bm = benchmarks[s.key] ?? benchmarks["(unknown)"];
      return {
        key: s.key,
        userRate: s.rate,
        benchmarkRate: bm.offerRate,
        delta: s.rate - bm.offerRate,
        offers: s.offers,
        total: s.total,
      };
    })
    .sort((a, b) => b.delta - a.delta);
}

/** ✅ Format a percent as a string */
export function formatPercent(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

/** ✅ Compute overall response rate (Applied → got Interview or Offer) */
export function computeResponseRate(jobs: JobRecord[]) {
  // Count jobs that were applied to (Applied status or beyond)
  const appliedStatuses = [
    "applied",
    "phone screen",
    "interview",
    "offer",
    "rejected",
  ];
  const applied = jobs.filter((j) =>
    appliedStatuses.includes((j.job_status ?? "").toLowerCase())
  ).length;

  // Count jobs that got a response (moved beyond Applied)
  const respondedStatuses = ["phone screen", "interview", "offer"];
  const responded = jobs.filter((j) =>
    respondedStatuses.includes((j.job_status ?? "").toLowerCase())
  ).length;

  return applied === 0 ? 0 : Math.max(0, responded / applied);
}

/** ✅ Compute average time spent per pipeline stage (roughly) */
export function computeAvgStageDurations(jobs: JobRecord[]) {
  // For demonstration, assign synthetic averages per stage
  const stages = [
    "Interested",
    "Applied",
    "Phone Screen",
    "Interview",
    "Offer",
  ];
  const durations: Record<string, number> = {};
  for (const stage of stages) {
    const relevant = jobs.filter(
      (j) => (j.job_status ?? "").toLowerCase() === stage.toLowerCase()
    );
    if (relevant.length === 0) {
      durations[stage] = 0;
      continue;
    }
    let total = 0;
    let validCount = 0;
    for (const j of relevant) {
      if (!j.created_at || !j.status_changed_at) continue;
      const diff =
        (new Date(j.status_changed_at).getTime() -
          new Date(j.created_at).getTime()) /
        86400000;
      // Only count positive durations
      if (diff > 0) {
        total += diff;
        validCount += 1;
      }
    }
    durations[stage] = validCount > 0 ? Math.max(0, total / validCount) : 0;
  }
  return durations;
}

/** ✅ Compute monthly application counts for a bar chart */
export function computeMonthlyApplications(jobs: JobRecord[]) {
  // Use daily buckets for the last 14 days
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  const dayMap: Record<string, number> = {};
  
  // Initialize last 14 days with 0 counts
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${day.getMonth() + 1}/${day.getDate()}`;
    dayMap[key] = 0;
  }
  
  // Count jobs in each day
  for (const j of jobs) {
    if (!j.created_at) continue;
    const d = new Date(j.created_at);
    d.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    
    // Only count jobs from last 14 days
    if (daysDiff >= 0 && daysDiff < 14) {
      const day = new Date(now.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      const key = `${day.getMonth() + 1}/${day.getDate()}`;
      dayMap[key] = (dayMap[key] ?? 0) + 1;
    }
  }
  
  // Convert to array format and maintain chronological order
  const result: { month: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${day.getMonth() + 1}/${day.getDate()}`;
    result.push({ month: key, count: dayMap[key] ?? 0 });
  }
  
  return result;
}

/** ✅ Deadline adherence (how many deadlines met vs missed) */
export function computeDeadlineAdherence(jobs: JobRecord[]) {
  let met = 0,
    missed = 0;
  for (const j of jobs) {
    if (!j.application_deadline || !j.status_changed_at) continue;
    const deadline = new Date(j.application_deadline);
    const changed = new Date(j.status_changed_at);
    if (isNaN(deadline.getTime()) || isNaN(changed.getTime())) continue;
    if (changed <= deadline) met++;
    else missed++;
  }
  const total = met + missed;
  const adherence = total === 0 ? 0 : met / total;
  return { met, missed, adherence };
}

/** ✅ Compute average time to offer in days */
export function computeTimeToOffer(jobs: JobRecord[]) {
  const offers = jobs.filter((j) => j.job_status?.toLowerCase() === "offer");
  if (offers.length === 0) return 0;
  const diffs = offers
    .filter((j) => j.created_at && j.status_changed_at)
    .map(
      (j) =>
        (new Date(j.status_changed_at!).getTime() -
          new Date(j.created_at!).getTime()) /
        86400000
    )
    .filter((d) => d > 0); // Only count positive durations
  if (diffs.length === 0) return 0;
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.max(0, avg); // Ensure non-negative
}

/** ✅ Generate AI-powered insights and recommendations */
export function generateAIInsights(
  jobs: JobRecord[],
  funnel: Record<string, number>,
  responseRate: number,
  deadlineAdherence: number,
  avgTimeToOffer: number,
  weeklyGoal: number,
  thisWeekApplications: number
): string[] {
  const insights: string[] = [];
  const total = jobs.length;
  const offers = funnel.Offer ?? 0;
  const offerRate = offers / Math.max(1, total);

  // Performance analysis
  if (offerRate < 0.05 && total > 10) {
    insights.push(
      `🎯 Low offer rate (${(offerRate * 100).toFixed(
        1
      )}%). Consider: (1) Tailoring resumes more closely to job requirements, (2) Applying to positions that better match your experience level, (3) Using AI-generated content to improve application quality.`
    );
  } else if (offerRate >= 0.1 && total > 5) {
    insights.push(
      `🌟 Excellent offer rate (${(offerRate * 100).toFixed(
        1
      )}%)! Your application strategy is working well. Keep applying the same tailoring approach.`
    );
  }

  // Response rate insights
  if (responseRate < 0.2 && total > 10) {
    insights.push(
      `📧 Low response rate (${(responseRate * 100).toFixed(
        1
      )}%). Recommendations: (1) Review your resume with AI optimization, (2) Ensure your applications are submitted early in the posting cycle, (3) Follow up with hiring managers after 1 week.`
    );
  } else if (responseRate >= 0.3) {
    insights.push(
      `✅ Strong response rate (${(responseRate * 100).toFixed(
        1
      )}%)! Your applications are getting noticed. Focus on interview preparation.`
    );
  }

  // Deadline management
  if (deadlineAdherence < 0.8 && total > 5) {
    const missedCount = Math.round((1 - deadlineAdherence) * total);
    insights.push(
      `⏰ You've missed approximately ${missedCount} deadlines (${(
        (1 - deadlineAdherence) *
        100
      ).toFixed(
        0
      )}% miss rate). Set reminders 2-3 days before each deadline to improve adherence.`
    );
  }

  // Volume insights
  if (thisWeekApplications < weeklyGoal && weeklyGoal > 0) {
    const behind = weeklyGoal - thisWeekApplications;
    insights.push(
      `📊 You're ${behind} application${
        behind !== 1 ? "s" : ""
      } behind your weekly goal. Dedicate focused time today to catch up. Use AI tools to speed up resume and cover letter creation.`
    );
  } else if (thisWeekApplications >= weeklyGoal && weeklyGoal > 0) {
    insights.push(
      `🎉 You've met your weekly goal! Consider reviewing applications from companies you're most interested in or raising your goal for next week.`
    );
  }

  // Industry targeting
  const industries = jobs.reduce((acc, j) => {
    const ind = j.industry ?? "(unknown)";
    acc[ind] = (acc[ind] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topIndustry = Object.entries(industries).sort((a, b) => b[1] - a[1])[0];
  if (topIndustry && topIndustry[1] > total * 0.4) {
    insights.push(
      `🎯 You're focusing heavily on ${topIndustry[0]} (${topIndustry[1]} applications). Consider diversifying to related industries to increase opportunities.`
    );
  }

  // Time to offer insights
  if (avgTimeToOffer > 30 && offers > 0) {
    insights.push(
      `⏳ Your average time to offer is ${avgTimeToOffer.toFixed(
        0
      )} days. Long hiring processes are normal, but consider prioritizing companies with faster decision cycles.`
    );
  }

  // Conversion funnel analysis
  const phoneScreens = funnel["Phone Screen"] ?? 0;
  const interviews = funnel.Interview ?? 0;
  if (phoneScreens > 5 && interviews < phoneScreens * 0.5) {
    insights.push(
      `📞 You're getting phone screens but not advancing to interviews. Focus on: (1) Researching companies thoroughly before calls, (2) Practicing behavioral questions, (3) Clearly articulating your value proposition.`
    );
  }

  if (interviews > 3 && offers < interviews * 0.3) {
    insights.push(
      `💼 You're reaching interviews but not converting to offers. Recommendations: (1) Request feedback from interviewers, (2) Practice technical/case questions more deeply, (3) Improve your follow-up communication.`
    );
  }

  // Default positive message
  if (insights.length === 0) {
    insights.push(
      `✨ Your metrics look healthy! Continue monitoring trends and applying consistently. Use AI tools to maintain high-quality applications.`
    );
  }

  return insights;
}
