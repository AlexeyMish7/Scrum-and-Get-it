/**
 * Career Goals Analytics Endpoint
 * Sprint 3 - UC-101: Goal Setting and Achievement Tracking
 * 
 * Features:
 * - Get all goals with progress calculations
 * - Create new SMART goals
 * - Update goal progress and milestones
 * - Delete/archive goals
 * - Generate insights and recommendations
 * - Track achievement patterns
 * - Calculate goal impact on job search success
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ====================================================================
// TYPE DEFINITIONS
// ====================================================================

interface CareerGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  timeframe: GoalTimeframe;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: GoalStatus;
  completion_date: string | null;
  milestones: Milestone[];
  notes: string | null;
  is_shared: boolean;
  shared_with: string[];
  reminder_frequency: string;
  last_reminder_sent: string | null;
  linked_job_ids: number[];
  success_metrics: SuccessMetrics;
  motivation_notes: string | null;
  obstacles: string | null;
  support_needed: string | null;
  achievements: Achievement[];
  celebration_message: string | null;
  created_at: string;
  updated_at: string;
}

type GoalCategory =
  | "application_volume"
  | "interview_success"
  | "skill_development"
  | "networking"
  | "salary_target"
  | "career_advancement"
  | "work_life_balance"
  | "custom";

type GoalTimeframe = "short_term" | "medium_term" | "long_term";

type GoalStatus = "active" | "completed" | "paused" | "cancelled" | "archived";

interface Milestone {
  id: string;
  title: string;
  target_value: number;
  completed: boolean;
  completed_at: string | null;
}

interface SuccessMetrics {
  applications_sent?: number;
  interviews_scheduled?: number;
  offers_received?: number;
}

interface Achievement {
  milestone: string;
  achieved_at: string;
  message: string;
  progress_at_achievement: number;
}

interface GoalWithProgress extends CareerGoal {
  progress_percentage: number;
  days_remaining: number;
  days_elapsed: number;
  is_on_track: boolean;
  next_milestone: Milestone | null;
}

// ====================================================================
// MAIN HANDLER
// ====================================================================

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  userId: string
): Promise<void> {
  console.log("\n🎯 [goals] POST endpoint called");
  console.log("[goals] User ID:", userId);
  try {
    // Parse request body
    const data = (await readJson(req)) as any;
    console.log("[goals] Request data:", JSON.stringify(data));
    const { action } = data;
    console.log("[goals] Action:", action);

    // Route to appropriate handler
    switch (action) {
      case "get":
        console.log("[goals] Routing to handleGetGoals");
        await handleGetGoals(userId, data, res);
        break;
      case "create":
        await handleCreateGoal(userId, data, res);
        break;
      case "update":
        await handleUpdateGoal(userId, data, res);
        break;
      case "delete":
        await handleDeleteGoal(userId, data, res);
        break;
      case "analytics":
        await handleGetAnalytics(userId, data, res);
        break;
      default:
        res.writeHead(400, { "Content-Type": "application/json", ...getCorsHeaders() });
        res.end(
          JSON.stringify({ error: "Invalid action. Use: get, create, update, delete, analytics" })
        );
    }
  } catch (error: any) {
    console.error("[goals] Error:", error);
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message || "Internal server error" }));
  }
}

// ====================================================================
// HANDLER FUNCTIONS
// ====================================================================

async function handleGetGoals(
  userId: string,
  data: any,
  res: ServerResponse
): Promise<void> {
  console.log("=== [goals] handleGetGoals START ===");
  console.log("[goals] User ID:", userId);
  console.log("[goals] Filters:", JSON.stringify(data));
  const { status, category } = data;

  // Build query
  let query = supabase
    .from("career_goals")
    .select("*")
    .eq("user_id", userId)
    .order("target_date", { ascending: true });

  if (status) {
    console.log("[goals] Filtering by status:", status);
    query = query.eq("status", status);
  }

  if (category) {
    console.log("[goals] Filtering by category:", category);
    query = query.eq("category", category);
  }

  console.log("[goals] Executing Supabase query...");
  const { data: goals, error } = await query;

  if (error) {
    console.error("[goals] ❌ Supabase error:", error);
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  console.log("[goals] ✅ Found", goals?.length || 0, "goals");
  
  // Enhance goals with progress calculations
  const goalsWithProgress = (goals || []).map((goal) =>
    calculateGoalProgress(goal)
  );

  console.log("[goals] Sending response with", goalsWithProgress.length, "goals");
  res.writeHead(200, { "Content-Type": "application/json", ...getCorsHeaders() });
  res.end(JSON.stringify({ goals: goalsWithProgress }));
  console.log("=== [goals] handleGetGoals END ===");
}

async function handleCreateGoal(
  userId: string,
  data: any,
  res: ServerResponse
): Promise<void> {
  console.error("[goals] handleCreateGoal called with data:", JSON.stringify(data, null, 2));
  
  const {
    title,
    description,
    category,
    timeframe,
    target_value,
    current_value,
    unit,
    start_date,
    target_date,
    milestones,
    notes,
    motivation_notes,
    obstacles,
    support_needed,
    is_shared,
    shared_with,
    reminder_frequency,
  } = data;

  // Validation
  if (!title || !category || !target_value || !target_date) {
    console.error("[goals] Validation failed - missing required fields");
    res.writeHead(400, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(
      JSON.stringify({ error: "Missing required fields: title, category, target_value, target_date" })
    );
    return;
  }

  // Create goal
  console.error("[goals] Creating goal in database...");
  const { data: newGoal, error } = await supabase
    .from("career_goals")
    .insert({
      user_id: userId,
      title,
      description: description || null,
      category,
      timeframe: timeframe || "short_term",
      target_value,
      current_value: current_value || 0,
      unit: unit || "count",
      start_date: start_date || new Date().toISOString().split("T")[0],
      target_date,
      milestones: milestones || [],
      notes: notes || null,
      motivation_notes: motivation_notes || null,
      obstacles: obstacles || null,
      support_needed: support_needed || null,
      is_shared: is_shared || false,
      shared_with: shared_with || [],
      reminder_frequency: reminder_frequency || "weekly",
    })
    .select()
    .single();

  if (error) {
    console.error("[goals] Supabase error:", error);
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  console.error("[goals] Goal created successfully:", newGoal);
  const goalWithProgress = calculateGoalProgress(newGoal);

  res.writeHead(200, { "Content-Type": "application/json", ...getCorsHeaders() });
  res.end(JSON.stringify({ goal: goalWithProgress }));
}

async function handleUpdateGoal(
  userId: string,
  data: any,
  res: ServerResponse
): Promise<void> {
  // Explicitly destructure to exclude 'action' and 'goal_id' from updates
  const { goal_id, action, ...updates } = data;

  if (!goal_id) {
    res.writeHead(400, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: "Missing goal_id" }));
    return;
  }

  // Check if goal completion and progress-based adjustments
  if (updates.current_value !== undefined) {
    const { data: goal } = await supabase
      .from("career_goals")
      .select("target_value, milestones, achievements, start_date, target_date, current_value, title, unit")
      .eq("id", goal_id)
      .eq("user_id", userId)
      .single();

    if (goal) {
      const progressPercentage = (updates.current_value / goal.target_value) * 100;
      const today = new Date();
      const startDate = new Date(goal.start_date);
      const targetDate = new Date(goal.target_date);
      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = (daysElapsed / totalDays) * 100;
      
      // Auto-complete if reached target
      if (updates.current_value >= goal.target_value) {
        updates.status = "completed";
        updates.completion_date = new Date().toISOString().split("T")[0];
        const daysAhead = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAhead > 0) {
          updates.celebration_message = `🎉 Amazing! You completed "${goal.title}" ${daysAhead} days early! Your dedication is inspiring!`;
        } else {
          updates.celebration_message = `🎉 Congratulations! You've achieved your goal: "${goal.title}"! Time to celebrate and set new challenges!`;
        }
      } 
      // Progress-based adjustment recommendations
      else if (progressPercentage < expectedProgress - 30) {
        // Significantly behind - suggest adjustment
        updates.motivation_notes = `💡 Adjustment Tip: You're ${Math.round(expectedProgress - progressPercentage)}% behind schedule. Consider: 1) Breaking this into smaller milestones, 2) Extending your deadline by ${Math.ceil((expectedProgress - progressPercentage) / 100 * totalDays)} days, or 3) Reducing target to ${Math.round(goal.target_value * 0.7)} to maintain momentum.`;
      } else if (progressPercentage < expectedProgress - 15) {
        // Moderately behind - motivation needed
        updates.motivation_notes = `⚡ Keep Pushing: You're a bit behind pace but can catch up! Try increasing daily effort by ${Math.ceil(((expectedProgress - progressPercentage) / 100 * goal.target_value) / 7)} ${goal.unit || 'units'} per day this week.`;
      } else if (progressPercentage > expectedProgress + 20) {
        // Ahead of schedule - celebrate and encourage
        updates.motivation_notes = `🌟 Excellent Progress! You're ahead of schedule by ${Math.round(progressPercentage - expectedProgress)}%! Your consistency is paying off. Consider setting a stretch goal once you complete this one!`;
      }

      // Check milestone completions with enhanced celebrations
      const milestones = goal.milestones || [];
      const achievements = goal.achievements || [];
      const motivationalMessages = [
        "Keep up the fantastic work!",
        "You're crushing it!",
        "Your persistence is inspiring!",
        "One step closer to success!",
        "Momentum is building!",
        "You're making great progress!"
      ];
      
      milestones.forEach((m: Milestone) => {
        if (!m.completed && updates.current_value >= m.target_value) {
          m.completed = true;
          m.completed_at = new Date().toISOString();
          
          const motivationMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
          // Add achievement with enhanced celebration
          achievements.push({
            milestone: m.title,
            achieved_at: m.completed_at,
            message: `🎯 Milestone Unlocked: ${m.title}! 🎊 ${motivationMsg}`,
            progress_at_achievement: progressPercentage,
          });
          
          // Set celebration message for most recent milestone
          if (!updates.celebration_message) {
            updates.celebration_message = `🎊 Milestone Complete: ${m.title}! ${progressPercentage.toFixed(0)}% of your goal achieved! ${motivationMsg}`;
          }
        }
      });

      updates.milestones = milestones;
      updates.achievements = achievements;
    }
  }

  // Update goal
  const { data: updatedGoal, error } = await supabase
    .from("career_goals")
    .update(updates)
    .eq("id", goal_id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  if (!updatedGoal) {
    res.writeHead(404, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: "Goal not found" }));
    return;
  }

  const goalWithProgress = calculateGoalProgress(updatedGoal);

  res.writeHead(200, { "Content-Type": "application/json", ...getCorsHeaders() });
  res.end(JSON.stringify({ goal: goalWithProgress }));
}

async function handleDeleteGoal(
  userId: string,
  data: any,
  res: ServerResponse
): Promise<void> {
  const { goal_id } = data;

  if (!goal_id) {
    res.writeHead(400, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: "Missing goal_id" }));
    return;
  }

  const { error } = await supabase
    .from("career_goals")
    .delete()
    .eq("id", goal_id)
    .eq("user_id", userId);

  if (error) {
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json", ...getCorsHeaders() });
  res.end(JSON.stringify({ success: true }));
}

async function handleGetAnalytics(
  userId: string,
  data: any,
  res: ServerResponse
): Promise<void> {
  // Get all goals
  const { data: goals, error } = await supabase
    .from("career_goals")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    res.writeHead(500, { "Content-Type": "application/json", ...getCorsHeaders() });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  const goalsWithProgress = (goals || []).map((g) => calculateGoalProgress(g));

  // Calculate summary statistics
  const summary = {
    total_goals: goals?.length || 0,
    active_goals: goalsWithProgress.filter((g) => g.status === "active").length,
    completed_goals: goalsWithProgress.filter((g) => g.status === "completed").length,
    on_track: goalsWithProgress.filter((g) => g.is_on_track && g.status === "active").length,
    behind_schedule: goalsWithProgress.filter((g) => !g.is_on_track && g.status === "active").length,
    avg_progress: calculateAvgProgress(goalsWithProgress.filter((g) => g.status === "active")),
    completed_this_month: goalsWithProgress.filter(
      (g) =>
        g.status === "completed" &&
        g.completion_date &&
        new Date(g.completion_date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ).length,
  };

  // Generate insights
  const insights = generateInsights(goalsWithProgress, summary);

  // Generate recommendations
  const recommendations = generateRecommendations(goalsWithProgress, summary);

  // Calculate goal impact (link to job applications)
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, job_status, created_at")
    .eq("user_id", userId);

  const impact = calculateGoalImpact(goalsWithProgress, jobsData || []);

  res.writeHead(200, { "Content-Type": "application/json", ...getCorsHeaders() });
  res.end(
    JSON.stringify({
      summary,
      insights,
      recommendations,
      impact,
      goals: goalsWithProgress,
    })
  );
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

function calculateGoalProgress(goal: CareerGoal): GoalWithProgress {
  const progress_percentage =
    goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;

  const start = new Date(goal.start_date);
  const target = new Date(goal.target_date);
  const now = new Date();

  const days_elapsed = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const days_remaining = Math.max(
    0,
    Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const total_days = Math.floor(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const expected_progress = total_days > 0 ? (days_elapsed / total_days) * 100 : 0;

  const is_on_track = progress_percentage >= expected_progress || goal.status === "completed";

  // Find next incomplete milestone
  const next_milestone =
    goal.milestones.find((m: Milestone) => !m.completed) || null;

  return {
    ...goal,
    progress_percentage: Math.min(100, Math.round(progress_percentage * 100) / 100),
    days_remaining,
    days_elapsed,
    is_on_track,
    next_milestone,
  };
}

function calculateAvgProgress(goals: GoalWithProgress[]): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce((acc, g) => acc + g.progress_percentage, 0);
  return Math.round((sum / goals.length) * 100) / 100;
}

function generateInsights(goals: GoalWithProgress[], summary: any): string[] {
  const insights: string[] = [];

  if (summary.active_goals === 0) {
    insights.push("No active goals set. Start by creating your first career goal!");
  } else {
    if (summary.on_track > 0) {
      insights.push(
        `You're on track with ${summary.on_track} of ${summary.active_goals} active goals. Keep up the momentum!`
      );
    }

    if (summary.behind_schedule > 0) {
      insights.push(
        `${summary.behind_schedule} goal(s) are behind schedule. Consider adjusting targets or increasing effort.`
      );
    }

    if (summary.completed_this_month > 0) {
      insights.push(
        `You've completed ${summary.completed_this_month} goal(s) this month. Great job! 🎉`
      );
    }

    if (summary.avg_progress > 75) {
      insights.push(
        `Strong progress with ${summary.avg_progress}% average completion across active goals.`
      );
    } else if (summary.avg_progress < 25) {
      insights.push(
        `Average progress is ${summary.avg_progress}%. Break goals into smaller milestones for momentum.`
      );
    }
  }

  // Check for upcoming deadlines
  const upcomingDeadlines = goals.filter(
    (g) => g.status === "active" && g.days_remaining <= 7
  );
  if (upcomingDeadlines.length > 0) {
    insights.push(
      `${upcomingDeadlines.length} goal(s) have deadlines within a week. Time to focus!`
    );
  }

  // Check for stalled goals (low progress, halfway through timeline)
  const stalledGoals = goals.filter(
    (g) =>
      g.status === "active" &&
      g.progress_percentage < 25 &&
      g.days_elapsed > (g.days_elapsed + g.days_remaining) / 2
  );
  if (stalledGoals.length > 0) {
    insights.push(
      `${stalledGoals.length} goal(s) show minimal progress. Review and adjust if needed.`
    );
  }

  return insights;
}

function generateRecommendations(goals: GoalWithProgress[], summary: any): string[] {
  const recommendations: string[] = [];

  if (summary.active_goals === 0) {
    recommendations.push("Set your first SMART goal to track career progress effectively");
    recommendations.push("Start with a short-term goal (1-3 months) to build momentum");
    recommendations.push("Consider goals for application volume, networking, or skill development");
  } else {
    if (summary.active_goals > 5) {
      recommendations.push(
        "You have many active goals. Focus on 3-5 key priorities for better results"
      );
    }

    // Goal adjustment recommendations based on progress patterns
    const behindSchedule = goals.filter(g => !g.is_on_track && g.status === "active");
    if (behindSchedule.length > 0) {
      behindSchedule.forEach(goal => {
        const percentBehind = Math.round(((goal.days_elapsed / (goal.days_elapsed + goal.days_remaining)) * 100) - goal.progress_percentage);
        if (percentBehind > 30) {
          recommendations.push(
            `Consider adjusting "${goal.title}" - target may be too ambitious. Break into smaller milestones or extend deadline.`
          );
        } else if (percentBehind > 15) {
          recommendations.push(
            `"${goal.title}" needs attention - increase daily effort or adjust target value.`
          );
        }
      });
    }

    // Recommend milestone addition for goals without them
    const goalsWithoutMilestones = goals.filter(g => g.status === "active" && (!g.milestones || g.milestones.length === 0));
    if (goalsWithoutMilestones.length > 0) {
      recommendations.push(
        `Add milestones to ${goalsWithoutMilestones.length} goal(s) for better tracking and motivation`
      );
    }

    // Recommend celebrating achievements
    const completedGoals = goals.filter(g => g.status === "completed" && g.achievements && g.achievements.length > 0);
    if (completedGoals.length > 0) {
      recommendations.push(
        `You've achieved ${completedGoals.reduce((sum, g) => sum + g.achievements.length, 0)} milestones! Share your success or set new stretch goals.`
      );
    }

    if (summary.behind_schedule > summary.on_track) {
      recommendations.push(
        "Review goals that are behind schedule - adjust targets or timelines as needed"
      );
    }

    // Category-based recommendations
    const hasApplicationGoal = goals.some(
      (g) => g.category === "application_volume" && g.status === "active"
    );
    const hasInterviewGoal = goals.some(
      (g) => g.category === "interview_success" && g.status === "active"
    );

    if (!hasApplicationGoal && summary.active_goals < 5) {
      recommendations.push(
        "Set an application volume goal to maintain consistent job search activity"
      );
    }

    if (!hasInterviewGoal && summary.active_goals < 5) {
      recommendations.push("Track interview success rate as a goal to measure quality improvement");
    }

    // Optimal goal-setting strategies based on patterns
    if (summary.completed_this_month >= 2) {
      recommendations.push(
        "You're completing goals consistently! Consider setting more ambitious targets or adding skill development goals."
      );
    }

    // Recommend sharing for accountability
    const unsharedGoals = goals.filter(g => g.status === "active" && !g.is_shared);
    if (unsharedGoals.length >= 2) {
      recommendations.push(
        `Share ${unsharedGoals.length} goals with an accountability partner to increase commitment and success rate.`
      );
    }

    // Time-based insights
    const longTermGoals = goals.filter(g => g.timeframe === "long_term" && g.status === "active");
    const shortTermGoals = goals.filter(g => g.timeframe === "short_term" && g.status === "active");
    if (longTermGoals.length > 0 && shortTermGoals.length === 0) {
      recommendations.push(
        "Add short-term goals (1-3 months) to create immediate wins and build momentum toward long-term objectives."
      );
    }
  }

  return recommendations;
}

function calculateGoalImpact(goals: GoalWithProgress[], jobs: any[]): any {
  const applicationGoals = goals.filter((g) => g.category === "application_volume");
  const interviewGoals = goals.filter((g) => g.category === "interview_success");

  const totalApplications = jobs.length;
  const interviewStageJobs = jobs.filter((j) =>
    ["Phone Screen", "Interview", "Offer", "Accepted"].includes(j.job_status)
  ).length;

  return {
    total_applications: totalApplications,
    interview_stage_count: interviewStageJobs,
    application_goals_active: applicationGoals.filter((g) => g.status === "active").length,
    interview_goals_active: interviewGoals.filter((g) => g.status === "active").length,
    goals_driving_action:
      applicationGoals.filter((g) => g.status === "active").length > 0 ||
      interviewGoals.filter((g) => g.status === "active").length > 0,
  };
}
