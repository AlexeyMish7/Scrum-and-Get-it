import supabaseAdmin from "./supabaseAdmin.js";

// In-memory fallback store used for local QA when Supabase isn't configured.
const inMemoryStore: Record<
  string,
  { interviews: any[]; feedbacks: any[]; confidenceLogs: any[] }
> = {};

function hasDbClient() {
  return !!supabaseAdmin;
}

export function seedInMemory(userId: string, payload: any) {
  if (!inMemoryStore[userId]) {
    inMemoryStore[userId] = { interviews: [], feedbacks: [], confidenceLogs: [] };
  }
  if (payload.interview) inMemoryStore[userId].interviews.push(payload.interview);
  if (Array.isArray(payload.feedbacks)) inMemoryStore[userId].feedbacks.push(...payload.feedbacks);
  if (Array.isArray(payload.confidenceLogs)) inMemoryStore[userId].confidenceLogs.push(...payload.confidenceLogs);
}

function ensureClient() {
  if (!supabaseAdmin) throw new Error("Supabase client not initialized");
  return supabaseAdmin;
}

// Compute overview aggregates for a single user.
export async function computeOverview(userId: string) {
  // If Supabase isn't configured, fall back to in-memory seeded data for local QA
  if (!hasDbClient()) {
    const seed = inMemoryStore[userId] || { interviews: [], feedbacks: [], confidenceLogs: [] };
    const interviews = seed.interviews || [];

    const interviewsCount = (interviews ?? []).length;
    const offersCount = (interviews ?? []).filter((r: any) => r.result === true).length;
    const conversionRate = interviewsCount > 0 ? offersCount / interviewsCount : 0;

    const formatMap: Record<string, { interviews: number; offers: number }> = {};
    const typeMap: Record<string, { interviews: number; offers: number }> = {};
    const interviewIds: string[] = [];

    (interviews ?? []).forEach((r: any) => {
      const fmt = r.format ?? "unknown";
      const typ = r.interview_type ?? "unknown";
      interviewIds.push(r.id);

      if (!formatMap[fmt]) formatMap[fmt] = { interviews: 0, offers: 0 };
      formatMap[fmt].interviews += 1;
      if (r.result === true) formatMap[fmt].offers += 1;

      if (!typeMap[typ]) typeMap[typ] = { interviews: 0, offers: 0 };
      typeMap[typ].interviews += 1;
      if (r.result === true) typeMap[typ].offers += 1;
    });

    const formatBreakdown = Object.entries(formatMap).map(([format, v]) => ({
      format,
      interviews: v.interviews,
      conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
    }));

    const typeBreakdown = Object.entries(typeMap).map(([type, v]) => ({
      type,
      interviews: v.interviews,
      conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
    }));

    // feedback themes
    const themeCounts: Record<string, number> = {};
    (seed.feedbacks ?? []).forEach((row: any) => {
      const themes = row.themes ?? [];
      themes.forEach((t: string) => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
    });
    const feedbackThemes = Object.entries(themeCounts).map(([theme, count]) => ({ theme, count }));

    // mock vs real via interview_type or feedback provider
    const mockIds = new Set<string>();
    (seed.feedbacks ?? []).forEach((f: any) => {
      if (String(f.provider).toLowerCase().includes("mock")) mockIds.add(f.interview_id);
    });
    (interviews ?? []).forEach((r: any) => {
      if (String(r.interview_type).toLowerCase() === "mock") mockIds.add(r.id);
    });

    const mockScores: number[] = [];
    const realScores: number[] = [];
    (interviews ?? []).forEach((r: any) => {
      const score = typeof r.score === "number" ? r.score : null;
      if (score !== null) {
        if (mockIds.has(r.id)) mockScores.push(score);
        else realScores.push(score);
      }
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const mockAverage = avg(mockScores);
    const realAverage = avg(realScores);
    const improvement = mockAverage !== null && realAverage !== null ? realAverage - mockAverage : null;

    return {
      conversionRate,
      interviewsCount,
      offersCount,
      formatBreakdown,
      typeBreakdown,
      mockVsReal: { mockAverage, realAverage, improvement },
      feedbackThemes,
    };
  }

  const client = ensureClient();

  // Fetch interviews for the user
  const { data: interviews, error: interviewsErr } = await client
    .from("interviews")
    .select("id, result, format, interview_type, industry, score, interview_date")
    .eq("user_id", userId);
  if (interviewsErr) throw interviewsErr;

  const interviewsCount = (interviews ?? []).length;
  const offersCount = (interviews ?? []).filter((r: any) => r.result === true).length;
  const conversionRate = interviewsCount > 0 ? offersCount / interviewsCount : 0;

  // Build breakdowns
  const formatMap: Record<string, { interviews: number; offers: number }> = {};
  const typeMap: Record<string, { interviews: number; offers: number }> = {};
  const industryMap: Record<string, { interviews: number; offers: number }> = {};
  const interviewIds: string[] = [];

  (interviews ?? []).forEach((r: any) => {
    const fmt = r.format ?? "unknown";
    const typ = r.interview_type ?? "unknown";
    const ind = r.industry ?? "unknown";
    interviewIds.push(r.id);

    if (!formatMap[fmt]) formatMap[fmt] = { interviews: 0, offers: 0 };
    formatMap[fmt].interviews += 1;
    if (r.result === true) formatMap[fmt].offers += 1;

    if (!typeMap[typ]) typeMap[typ] = { interviews: 0, offers: 0 };
    typeMap[typ].interviews += 1;
    if (r.result === true) typeMap[typ].offers += 1;

    if (!industryMap[ind]) industryMap[ind] = { interviews: 0, offers: 0 };
    industryMap[ind].interviews += 1;
    if (r.result === true) industryMap[ind].offers += 1;
  });

  const formatBreakdown = Object.entries(formatMap).map(([format, v]) => ({
    format,
    interviews: v.interviews,
    conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
  }));

  const typeBreakdown = Object.entries(typeMap).map(([type, v]) => ({
    type,
    interviews: v.interviews,
    conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
  }));

  // Fetch feedback themes for interviews belonging to this user
  let feedbackThemes: Array<{ theme: string; count: number }> = [];
  if (interviewIds.length > 0) {
    const { data: fbRows, error: fbErr } = await client
      .from("interview_feedback")
      .select("themes")
      .in("interview_id", interviewIds);
    if (fbErr) throw fbErr;

    const themeCounts: Record<string, number> = {};
    (fbRows ?? []).forEach((row: any) => {
      const themes = row.themes ?? [];
      themes.forEach((t: string) => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
    });
    feedbackThemes = Object.entries(themeCounts).map(([theme, count]) => ({ theme, count }));
  }

  // Attempt mock vs real averages: detect mocks via interview_type === 'mock' or feedback provider 'mock-coach'
  const { data: feedbackRows, error: fbErr2 } = await client
    .from("interview_feedback")
    .select("interview_id, provider, rating")
    .in("interview_id", interviewIds);
  if (fbErr2) throw fbErr2;

  const mockIds = new Set<string>();
  (feedbackRows ?? []).forEach((f: any) => {
    if (String(f.provider).toLowerCase().includes("mock")) mockIds.add(f.interview_id);
  });
  // Also include interviews where interview_type === 'mock'
  (interviews ?? []).forEach((r: any) => {
    if (String(r.interview_type).toLowerCase() === "mock") mockIds.add(r.id);
  });

  const mockScores: number[] = [];
  const realScores: number[] = [];
  (interviews ?? []).forEach((r: any) => {
    const score = typeof r.score === "number" ? r.score : null;
    if (score !== null) {
      if (mockIds.has(r.id)) mockScores.push(score);
      else realScores.push(score);
    }
  });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const mockAverage = avg(mockScores);
  const realAverage = avg(realScores);
  const improvement = mockAverage !== null && realAverage !== null ? realAverage - mockAverage : null;

  return {
    conversionRate,
    interviewsCount,
    offersCount,
    formatBreakdown,
    typeBreakdown,
    mockVsReal: {
      mockAverage,
      realAverage,
      improvement,
    },
    feedbackThemes,
  };
}

// Compute trends (timeseries) and confidence trends
export async function computeTrends(userId: string) {
  // If Supabase isn't configured, use in-memory seeded data
  if (!hasDbClient()) {
    const seed = inMemoryStore[userId] || { interviews: [], feedbacks: [], confidenceLogs: [] };
    const interviews = seed.interviews || [];

    const timeseriesMap: Record<string, { attempts: number; offers: number }> = {};
    (interviews ?? []).forEach((r: any) => {
      const d = new Date(r.interview_date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
      if (!timeseriesMap[key]) timeseriesMap[key] = { attempts: 0, offers: 0 };
      timeseriesMap[key].attempts += 1;
      if (r.result === true) timeseriesMap[key].offers += 1;
    });

    const conversionTimeseries = Object.entries(timeseriesMap)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, v]) => ({ date, conversion: v.attempts > 0 ? v.offers / v.attempts : 0 }));

    // Confidence timeseries from seeded confidenceLogs
    const confMap: Record<string, { sum: number; count: number }> = {};
    (seed.confidenceLogs ?? []).forEach((c: any) => {
      const d = new Date(c.logged_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
      if (!confMap[key]) confMap[key] = { sum: 0, count: 0 };
      const val = typeof c.confidence_level === "number" ? c.confidence_level / 10 : 0;
      confMap[key].sum += val;
      confMap[key].count += 1;
    });

    const confidenceTimeseries = Object.entries(confMap)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, v]) => ({ date, confidence: v.count > 0 ? v.sum / v.count : 0 }));

    const industryMap: Record<string, { interviews: number; offers: number }> = {};
    (interviews ?? []).forEach((r: any) => {
      const ind = r.industry ?? "unknown";
      if (!industryMap[ind]) industryMap[ind] = { interviews: 0, offers: 0 };
      industryMap[ind].interviews += 1;
      if (r.result === true) industryMap[ind].offers += 1;
    });
    const industryComparison = Object.entries(industryMap).map(([industry, v]) => ({
      industry,
      conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
    }));

    return {
      conversionTimeseries,
      confidenceTimeseries,
      industryComparison,
    };
  }

  const client = ensureClient();

  // Fetch interviews with dates and results
  const { data: interviews, error: interviewsErr } = await client
    .from("interviews")
    .select("interview_date, result, industry, company_culture")
    .eq("user_id", userId)
    .order("interview_date", { ascending: true });
  if (interviewsErr) throw interviewsErr;

  // Aggregate monthly conversion
  const timeseriesMap: Record<string, { attempts: number; offers: number }> = {};
  (interviews ?? []).forEach((r: any) => {
    const d = new Date(r.interview_date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
    if (!timeseriesMap[key]) timeseriesMap[key] = { attempts: 0, offers: 0 };
    timeseriesMap[key].attempts += 1;
    if (r.result === true) timeseriesMap[key].offers += 1;
  });

  const conversionTimeseries = Object.entries(timeseriesMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({ date, conversion: v.attempts > 0 ? v.offers / v.attempts : 0 }));

  // Confidence timeseries: average confidence per month
  const { data: confRows, error: confErr } = await client
    .from("confidence_logs")
    .select("logged_at, confidence_level")
    .eq("user_id", userId)
    .order("logged_at", { ascending: true });
  if (confErr) throw confErr;

  const confMap: Record<string, { sum: number; count: number }> = {};
  (confRows ?? []).forEach((c: any) => {
    const d = new Date(c.logged_at);
    if (isNaN(d.getTime())) return;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
    if (!confMap[key]) confMap[key] = { sum: 0, count: 0 };
    const val = typeof c.confidence_level === "number" ? c.confidence_level / 10 : 0;
    confMap[key].sum += val;
    confMap[key].count += 1;
  });

  const confidenceTimeseries = Object.entries(confMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, v]) => ({ date, confidence: v.count > 0 ? v.sum / v.count : 0 }));

  // Industry comparison
  const industryMap: Record<string, { interviews: number; offers: number }> = {};
  (interviews ?? []).forEach((r: any) => {
    const rawIndustry = r.industry ?? "";
    const ind = rawIndustry.trim().toLowerCase() || "unknown";
    if (!industryMap[ind]) industryMap[ind] = { interviews: 0, offers: 0 };
    industryMap[ind].interviews += 1;
    if (r.result === true) industryMap[ind].offers += 1;
  });
  const industryComparison = Object.entries(industryMap)
    .filter(([industry]) => industry !== "unknown")
    .map(([industry, v]) => ({
      industry,
      conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
    }));

  // Company culture comparison
  console.log("[analyticsService/computeTrends] Sample interview data:", interviews?.[0]);
  const cultureMap: Record<string, { interviews: number; offers: number }> = {};
  (interviews ?? []).forEach((r: any) => {
    const rawCulture = r.company_culture ?? "";
    console.log("[analyticsService/computeTrends] Processing culture:", rawCulture, "from interview:", r);
    const culture = rawCulture.trim().toLowerCase() || "unknown";
    if (!cultureMap[culture]) cultureMap[culture] = { interviews: 0, offers: 0 };
    cultureMap[culture].interviews += 1;
    if (r.result === true) cultureMap[culture].offers += 1;
  });
  console.log("[analyticsService/computeTrends] Culture map:", cultureMap);
  const cultureComparison = Object.entries(cultureMap)
    .filter(([culture]) => culture !== "unknown")
    .map(([culture, v]) => ({
      culture,
      conversion: v.interviews > 0 ? v.offers / v.interviews : 0,
    }));
  console.log("[analyticsService/computeTrends] Culture comparison result:", cultureComparison);

  return {
    conversionTimeseries,
    confidenceTimeseries,
    industryComparison,
    cultureComparison,
  };
}

export async function computeBenchmarks() {
  return {
    benchmarks: [
      { pattern: "Strong behavioral answers", matchScore: 0.9 },
      { pattern: "Clear system design process", matchScore: 0.8 },
    ],
  };
}
