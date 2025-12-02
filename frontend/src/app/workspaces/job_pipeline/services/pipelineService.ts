/**
 * PIPELINE SERVICE LAYER
 * Specialized service for kanban board pipeline operations.
 *
 * PURPOSE:
 * - Handle job status transitions (stage movement)
 * - Group jobs by pipeline stage for kanban display
 * - Bulk status update operations
 * - Track status change timestamps for analytics
 *
 * PATTERNS:
 * - Optimistic updates: return immediately, rollback on error
 * - Status change tracking: auto-update status_changed_at
 * - Stage grouping: organize jobs into kanban columns
 *
 * USAGE:
 * ```ts
 * import pipelineService from "@job_pipeline/services/pipelineService";
 * const result = await pipelineService.moveJob(user.id, jobId, "Interview");
 * ```
 */

import * as crud from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type { JobRow } from "@shared/types/database";
import type { PipelineStage } from "@job_pipeline/types";
import { supabase } from "@shared/services/supabaseClient";
import { checkAndCreateAchievement } from "../../team_management/services/progressSharingService";

/**
 * MOVE JOB: Update job status to move between pipeline stages.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobId: Job ID (bigint as number)
 * - newStage: Target pipeline stage
 *
 * Outputs:
 * - Result<JobRow> with updated job data
 *
 * Error modes:
 * - Job not found
 * - Job belongs to different user (RLS blocks)
 * - Database update errors
 *
 * Side effects:
 * - Updates job_status column
 * - Updates status_changed_at to current timestamp
 */
const moveJob = async (
  userId: string,
  jobId: number,
  newStage: PipelineStage
): Promise<Result<JobRow>> => {
  const userCrud = crud.withUser(userId);

  const payload = {
    job_status: newStage,
    status_changed_at: new Date().toISOString(),
  };

  const result = await userCrud.updateRow(
    "jobs",
    payload,
    { eq: { id: jobId } },
    "*"
  );

  // Trigger achievement check for milestone events
  if (result.data && !result.error) {
    try {
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (teamMember?.team_id) {
        // Map pipeline stage to achievement event type
        let eventType: string | null = null;
        if (newStage === "Interview" || newStage === "Phone Screen") {
          eventType = "interview_scheduled";
        } else if (newStage === "Offer") {
          eventType = "offer_received";
        } else if (newStage === "Accepted") {
          eventType = "offer_accepted";
        }

        if (eventType) {
          checkAndCreateAchievement(
            userId,
            teamMember.team_id,
            eventType
          ).catch((err) => {
            console.error("Failed to check achievement:", err);
          });
        }
      }
    } catch {
      // Silently fail - achievement is optional
    }
  }

  return result;
};

/**
 * GET JOBS BY STAGE: Retrieve all jobs grouped by pipeline stage.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 *
 * Outputs:
 * - Result<Record<PipelineStage, JobRow[]>>
 * - Jobs organized by stage for kanban rendering
 *
 * Error modes:
 * - Database connection errors
 *
 * Note: Returns all stages (even empty) for consistent UI rendering.
 */
const getJobsByStage = async (
  userId: string
): Promise<Result<Record<string, JobRow[]>>> => {
  const userCrud = crud.withUser(userId);

  // Fetch all jobs for user
  const result = await userCrud.listRows("jobs", "*", {
    order: { column: "status_changed_at", ascending: false },
  });

  if (result.error) {
    return {
      data: null,
      error: result.error,
      status: result.status,
    } as Result<Record<string, JobRow[]>>;
  }

  // Group jobs by stage
  const jobs = Array.isArray(result.data) ? result.data : [];
  const stages = [
    "Interested",
    "Applied",
    "Phone Screen",
    "Interview",
    "Offer",
    "Rejected",
  ];

  const jobsByStage: Record<string, JobRow[]> = {};

  // Initialize all stages (even empty ones)
  for (const stage of stages) {
    jobsByStage[stage] = [];
  }

  // Group jobs by their current status
  for (const job of jobs) {
    const status = (job as JobRow).job_status ?? "Interested";
    if (!jobsByStage[status]) {
      jobsByStage[status] = [];
    }
    jobsByStage[status].push(job as JobRow);
  }

  return {
    data: jobsByStage,
    error: null,
    status: result.status,
  };
};

/**
 * BULK UPDATE STATUS: Update multiple jobs to the same status.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobIds: Array of job IDs to update
 * - newStage: Target pipeline stage
 *
 * Outputs:
 * - Result<JobRow[]> with all updated jobs
 *
 * Error modes:
 * - Any job not found (partial failure possible)
 * - Jobs belong to different user (RLS blocks)
 *
 * Note: Executes updates sequentially. Future: optimize with batch RPC.
 */
const bulkUpdateStatus = async (
  userId: string,
  jobIds: number[],
  newStage: PipelineStage
): Promise<Result<JobRow[]>> => {
  const results: JobRow[] = [];
  const errors: string[] = [];

  for (const jobId of jobIds) {
    const result = await moveJob(userId, jobId, newStage);

    if (result.error) {
      errors.push(`Job ${jobId}: ${result.error.message}`);
    } else if (result.data) {
      results.push(result.data as JobRow);
    }
  }

  if (errors.length > 0) {
    return {
      data: null,
      error: {
        message: `Failed to update ${errors.length} jobs: ${errors.join(", ")}`,
        status: null,
      },
      status: null,
    } as Result<JobRow[]>;
  }

  return {
    data: results,
    error: null,
    status: null,
  };
};

/**
 * GET STAGE COUNTS: Count jobs in each pipeline stage.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 *
 * Outputs:
 * - Result<Record<PipelineStage, number>>
 * - Count of jobs per stage
 *
 * Error modes:
 * - Database connection errors
 */
const getStageCounts = async (
  userId: string
): Promise<Result<Record<string, number>>> => {
  const result = await getJobsByStage(userId);

  if (result.error) {
    return {
      data: null,
      error: result.error,
      status: result.status,
    } as Result<Record<string, number>>;
  }

  const counts: Record<string, number> = {};
  const jobsByStage = result.data as Record<string, JobRow[]>;

  for (const [stage, jobs] of Object.entries(jobsByStage)) {
    counts[stage] = jobs.length;
  }

  return {
    data: counts,
    error: null,
    status: result.status,
  };
};

/**
 * CALCULATE DAYS IN STAGE: Compute how long a job has been in current stage.
 *
 * Inputs:
 * - job: JobRow with status_changed_at timestamp
 *
 * Outputs:
 * - number of days (rounded down)
 *
 * Note: Client-side calculation (no database call).
 */
const calculateDaysInStage = (job: JobRow): number => {
  if (!job.status_changed_at) return 0;

  const changedAt = new Date(job.status_changed_at);
  const now = new Date();
  const diffMs = now.getTime() - changedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
};

/**
 * OPTIMISTIC MOVE: Client-side optimistic update helper.
 * Returns updated jobs array immediately for UI responsiveness.
 * Caller should revert on server error.
 *
 * Inputs:
 * - jobs: Current jobs array
 * - jobId: Job to move
 * - newStage: Target stage
 *
 * Outputs:
 * - Updated jobs array (does NOT mutate input)
 *
 * Note: Pure function, no side effects.
 */
const optimisticMove = (
  jobs: JobRow[],
  jobId: number,
  newStage: PipelineStage
): JobRow[] => {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          job_status: newStage,
          status_changed_at: new Date().toISOString(),
        }
      : job
  );
};

export default {
  moveJob,
  getJobsByStage,
  bulkUpdateStatus,
  getStageCounts,
  calculateDaysInStage,
  optimisticMove,
};
