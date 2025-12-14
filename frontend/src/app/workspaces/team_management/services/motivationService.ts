/**
 * MOTIVATION SERVICE (UC-111)
 *
 * Provides motivational content, streak tracking, and team challenges.
 * Helps keep job seekers engaged and motivated during their search.
 *
 * Features:
 * - Daily motivational quotes
 * - Activity streak tracking
 * - Team challenges
 * - Motivation widgets data
 */

import type { Result } from "@shared/services/types";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import {
  fetchCoreJobs,
  fetchProgressMessagesSince,
} from "@shared/cache/coreFetchers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Motivational quote
 */
export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: "persistence" | "growth" | "success" | "resilience" | "action";
}

/**
 * User's activity streak data
 */
export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakStartDate: string;
  totalActiveDays: number;
  thisWeekActiveDays: number;
  thisMonthActiveDays: number;
}

/**
 * Team challenge
 */
export interface TeamChallenge {
  id: string;
  teamId: string;
  title: string;
  description: string;
  challengeType: "applications" | "networking" | "learning" | "interviews";
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  participants: {
    userId: string;
    userName: string;
    progress: number;
    rank: number;
  }[];
  isActive: boolean;
  createdBy: string;
}

/**
 * Motivation widget data
 */
export interface MotivationWidgetData {
  quote: MotivationalQuote;
  streak: StreakData;
  weeklyGoalProgress: number;
  teamRank?: number;
  encouragementsReceived: number;
  upcomingMilestone?: {
    type: string;
    current: number;
    target: number;
  };
}

// ============================================================================
// MOTIVATIONAL QUOTES
// ============================================================================

// Curated quotes for job seekers
const QUOTES: MotivationalQuote[] = [
  {
    id: "1",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "persistence",
  },
  {
    id: "2",
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
    author: "Steve Jobs",
    category: "growth",
  },
  {
    id: "3",
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser",
    category: "action",
  },
  {
    id: "4",
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "action",
  },
  {
    id: "5",
    text: "Every rejection is a redirection to something better.",
    author: "Unknown",
    category: "resilience",
  },
  {
    id: "6",
    text: "Your network is your net worth.",
    author: "Porter Gale",
    category: "success",
  },
  {
    id: "7",
    text: "The job search is not a sprint, it's a marathon. Pace yourself and stay consistent.",
    author: "Career Wisdom",
    category: "persistence",
  },
  {
    id: "8",
    text: "Every application is a step forward, even when it feels like standing still.",
    author: "Career Wisdom",
    category: "persistence",
  },
  {
    id: "9",
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "action",
  },
  {
    id: "10",
    text: "I have not failed. I've just found 10,000 ways that won't work.",
    author: "Thomas Edison",
    category: "resilience",
  },
  {
    id: "11",
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "growth",
  },
  {
    id: "12",
    text: "The only limit to our realization of tomorrow is our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "growth",
  },
  {
    id: "13",
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "persistence",
  },
  {
    id: "14",
    text: "Your career is a garden, not a ladder. Cultivate it with patience and care.",
    author: "Career Wisdom",
    category: "growth",
  },
  {
    id: "15",
    text: "Every expert was once a beginner. Every pro was once an amateur.",
    author: "Robin Sharma",
    category: "growth",
  },
];

/**
 * Get the daily motivational quote (consistent for the day)
 */
export function getDailyQuote(): MotivationalQuote {
  // Use date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}

/**
 * Get a random quote by category
 */
export function getQuoteByCategory(
  category: MotivationalQuote["category"]
): MotivationalQuote {
  const filtered = QUOTES.filter((q) => q.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)] || QUOTES[0];
}

/**
 * Get multiple random quotes
 */
export function getRandomQuotes(count: number = 3): MotivationalQuote[] {
  const shuffled = [...QUOTES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================================================
// STREAK TRACKING
// ============================================================================

/**
 * Get user's activity streak data
 */
export async function getStreakData(
  userId: string
): Promise<Result<StreakData>> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  type StreakJobRow = { created_at: string; updated_at?: string | null };

  // Use cached core jobs list and filter client-side.
  let jobs: StreakJobRow[] = [];
  try {
    const qc = getAppQueryClient();
    const all = await qc.ensureQueryData({
      queryKey: coreKeys.jobs(userId),
      queryFn: () => fetchCoreJobs<StreakJobRow>(userId),
      staleTime: 60 * 60 * 1000,
    });
    const startMs = thirtyDaysAgo.getTime();
    jobs = (Array.isArray(all) ? all : []).filter((job) => {
      const t = new Date(job.created_at).getTime();
      return t >= startMs;
    });
  } catch (e: unknown) {
    return {
      data: null,
      error: {
        message:
          e instanceof Error ? e.message : String(e) || "Failed to load jobs",
        status: null,
      },
      status: null,
    };
  }

  // Get unique activity dates
  const activityDates = new Set<string>();
  (jobs || []).forEach((job) => {
    activityDates.add(new Date(job.created_at).toDateString());
    if (job.updated_at) {
      activityDates.add(new Date(job.updated_at).toDateString());
    }
  });

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);

  // Check if active today or yesterday to start streak
  const todayStr = checkDate.toDateString();
  const yesterdayStr = new Date(
    checkDate.getTime() - 24 * 60 * 60 * 1000
  ).toDateString();

  if (activityDates.has(todayStr) || activityDates.has(yesterdayStr)) {
    // Count backwards
    while (activityDates.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  // Calculate longest streak
  const sortedDates = Array.from(activityDates)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diff =
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
      (24 * 60 * 60 * 1000);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Calculate this week and month activity
  const thisWeekDays = Array.from(activityDates).filter(
    (d) => new Date(d) >= weekStart
  ).length;
  const thisMonthDays = Array.from(activityDates).filter(
    (d) => new Date(d) >= monthStart
  ).length;

  // Find streak start date
  let streakStart = new Date();
  if (currentStreak > 0) {
    streakStart = new Date(
      now.getTime() - (currentStreak - 1) * 24 * 60 * 60 * 1000
    );
  }

  const streakData: StreakData = {
    userId,
    currentStreak,
    longestStreak,
    lastActivityDate:
      sortedDates.length > 0
        ? sortedDates[sortedDates.length - 1].toISOString()
        : now.toISOString(),
    streakStartDate: streakStart.toISOString(),
    totalActiveDays: activityDates.size,
    thisWeekActiveDays: thisWeekDays,
    thisMonthActiveDays: thisMonthDays,
  };

  return {
    data: streakData,
    error: null,
    status: 200,
  };
}

// ============================================================================
// MOTIVATION WIDGET DATA
// ============================================================================

/**
 * Get all data needed for motivation widgets
 */
export async function getMotivationWidgetData(
  userId: string,
  teamId: string
): Promise<Result<MotivationWidgetData>> {
  // Get streak data
  const streakResult = await getStreakData(userId);
  if (streakResult.error) {
    return {
      data: null,
      error: streakResult.error,
      status: streakResult.status,
    };
  }

  // Get this week's applications for goal progress
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  type JobRow = { id: number; created_at: string };

  // Use cached jobs list for weekly/total counts.
  let allJobs: JobRow[] = [];
  try {
    const qc = getAppQueryClient();
    const jobs = await qc.ensureQueryData({
      queryKey: coreKeys.jobs(userId),
      queryFn: () => fetchCoreJobs<JobRow>(userId),
      staleTime: 60 * 60 * 1000,
    });
    allJobs = Array.isArray(jobs) ? jobs : [];
  } catch {
    allJobs = [];
  }

  // Load messages via cache so the widget doesn't trigger extra reads on every render/navigation.
  type ProgressMessageRow = {
    id: string;
    sender_id: string;
    recipient_id: string;
    message_type: string;
    created_at: string;
  };

  let encouragementsReceived = 0;
  try {
    const sinceIso = weekStart.toISOString();
    const qc = getAppQueryClient();
    const messages = await qc.ensureQueryData({
      queryKey: coreKeys.progressMessagesSince(userId, teamId, sinceIso),
      queryFn: () =>
        fetchProgressMessagesSince<ProgressMessageRow>(
          userId,
          teamId,
          sinceIso
        ),
      staleTime: 2 * 60 * 1000,
    });
    encouragementsReceived = (Array.isArray(messages) ? messages : []).filter(
      (m) => m.recipient_id === userId && m.message_type === "encouragement"
    ).length;
  } catch {
    encouragementsReceived = 0;
  }

  const totalApplications = allJobs.length;
  const weekStartMs = weekStart.getTime();
  const weeklyApplications = allJobs.filter((j) => {
    const t = new Date(j.created_at).getTime();
    return t >= weekStartMs;
  }).length;
  const weeklyGoal = 10; // Default weekly goal

  // Determine next milestone
  const milestones = [10, 25, 50, 100, 250, 500];
  const nextMilestone = milestones.find((m) => m > totalApplications);

  const widgetData: MotivationWidgetData = {
    quote: getDailyQuote(),
    streak: streakResult.data!,
    weeklyGoalProgress: Math.min(100, (weeklyApplications / weeklyGoal) * 100),
    encouragementsReceived,
    upcomingMilestone: nextMilestone
      ? {
          type: "applications",
          current: totalApplications,
          target: nextMilestone,
        }
      : undefined,
  };

  return {
    data: widgetData,
    error: null,
    status: 200,
  };
}

// ============================================================================
// TEAM CHALLENGES (Placeholder for future implementation)
// ============================================================================

/**
 * Get active team challenges
 * Note: This requires a team_challenges table - returning mock data for now
 * @param teamId - The team ID (unused in placeholder implementation)
 */
export async function getTeamChallenges(
  teamId: string
): Promise<Result<TeamChallenge[]>> {
  // For now, return an empty array as this requires additional DB schema
  // Future implementation would query team_challenges table
  void teamId; // Mark as used to satisfy linter
  return {
    data: [],
    error: null,
    status: 200,
  };
}
