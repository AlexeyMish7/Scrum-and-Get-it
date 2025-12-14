/**
 * CENTRALIZED JOBS PIPELINE STATE MANAGEMENT
 *
 * Purpose: Single source of truth for all jobs state, ensuring consistency
 * across statistics, filters, and UI updates.
 *
 * Key Fixes:
 * 1. Statistics bug: Jobs moved from "Applied" to later stages (Phone Screen, Interview, etc.)
 *    are STILL counted as "applied" because they went through that stage.
 * 2. Sync issues: All state updates happen through this hook, ensuring UI consistency.
 * 3. Optimistic updates: UI updates immediately, reverts on error.
 *
 * Contract:
 * - Inputs: User ID from auth context
 * - Outputs: Jobs data, stage grouping, operations (move, delete, refresh)
 * - Side effects: Auto-refreshes on mount, syncs statistics after every change
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";
import { pipelineService } from "@job_pipeline/services";
import type { JobRow } from "@shared/types/database";
import type { PipelineStage } from "@job_pipeline/types";

const STAGES = [
  "Interested",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
] as const;

type Stage = (typeof STAGES)[number];

/**
 * CUMULATIVE STAGE TRACKING
 * Jobs that reach later stages are counted in all previous stages for statistics.
 * Example: A job in "Interview" stage counts as:
 * - Interested (started there)
 * - Applied (must have applied to get interview)
 * - Phone Screen (must have passed phone screen)
 * - Interview (current stage)
 */
const STAGE_PROGRESSION: Record<Stage, Stage[]> = {
  Interested: ["Interested"],
  Applied: ["Interested", "Applied"],
  "Phone Screen": ["Interested", "Applied", "Phone Screen"],
  Interview: ["Interested", "Applied", "Phone Screen", "Interview"],
  Offer: ["Interested", "Applied", "Phone Screen", "Interview", "Offer"],
  Rejected: ["Rejected"], // Rejected doesn't count toward progression stats
};

interface UseJobsPipelineReturn {
  // Data
  allJobs: JobRow[];
  jobsByStage: Record<Stage, JobRow[]>;
  loading: boolean;
  user: { id: string } | null; // Expose user for components that need userId

  // Statistics (cumulative counts)
  stats: {
    total: number;
    interested: number; // All jobs that started as interested
    applied: number; // Jobs that reached "Applied" or beyond
    phoneScreen: number; // Jobs that reached "Phone Screen" or beyond
    interview: number; // Jobs that reached "Interview" or beyond
    offer: number; // Jobs in "Offer" stage
    rejected: number; // Jobs in "Rejected" stage
    currentByStage: Record<Stage, number>; // Current count in each stage (for kanban display)
  };

  // Operations
  refreshJobs: () => Promise<void>;
  moveJob: (jobId: number, newStage: PipelineStage) => Promise<void>;
  bulkMoveJobs: (jobIds: number[], newStage: PipelineStage) => Promise<void>;
  deleteJobs: (jobIds: number[]) => Promise<void>;
  groupJobsByStage: (jobs: JobRow[]) => Record<Stage, JobRow[]>;
}

export function useJobsPipeline(): UseJobsPipelineReturn {
  const { user } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [jobsByStage, setJobsByStage] = useState<Record<Stage, JobRow[]>>(
    () => {
      const empty: Record<string, JobRow[]> = {};
      STAGES.forEach((s) => (empty[s] = []));
      return empty as Record<Stage, JobRow[]>;
    }
  );
  const [loading, setLoading] = useState(true);

  // Ref for optimistic update rollback
  const preDragRef = useRef<Record<Stage, JobRow[]> | undefined>(undefined);

  const filterOutArchived = useCallback((jobs: JobRow[]): JobRow[] => {
    return jobs.filter(
      (j) => String(j.job_status ?? "").toLowerCase() !== "archive"
    );
  }, []);

  /**
   * GROUP JOBS BY CURRENT STAGE
   * Groups jobs into kanban columns based on their current status.
   */
  const groupJobsByStage = useCallback(
    (jobs: JobRow[]): Record<Stage, JobRow[]> => {
      const grouped: Record<string, JobRow[]> = {};

      STAGES.forEach((s) => (grouped[s] = []));

      jobs.forEach((job) => {
        const status = (job.job_status as Stage) ?? "Interested";
        if (STAGES.includes(status as Stage)) {
          grouped[status].push(job);
        } else {
          grouped["Interested"].push(job);
        }
      });

      return grouped as Record<Stage, JobRow[]>;
    },
    []
  );

  /**
   * CALCULATE CUMULATIVE STATISTICS
   * Jobs that progress to later stages count toward all previous stages.
   * This fixes the bug where moving from "Applied" to "Phone Screen" decremented applied count.
   */
  const stats = useMemo(() => {
    const total = allJobs.length;

    // Current stage counts (for kanban display)
    const currentByStage: Record<string, number> = {};
    STAGES.forEach((stage) => {
      currentByStage[stage] = jobsByStage[stage]?.length ?? 0;
    });

    // Cumulative counts (for statistics)
    let interested = 0;
    let applied = 0;
    let phoneScreen = 0;
    let interview = 0;
    let offer = 0;
    const rejected = currentByStage["Rejected"] ?? 0;

    allJobs.forEach((job) => {
      const stage = (job.job_status as Stage) ?? "Interested";
      const stagesReached = STAGE_PROGRESSION[stage] ?? ["Interested"];

      // Count this job toward all stages it has reached
      if (stagesReached.includes("Interested")) interested++;
      if (stagesReached.includes("Applied")) applied++;
      if (stagesReached.includes("Phone Screen")) phoneScreen++;
      if (stagesReached.includes("Interview")) interview++;
      if (stagesReached.includes("Offer")) offer++;
    });

    return {
      total,
      interested,
      applied,
      phoneScreen,
      interview,
      offer,
      rejected,
      currentByStage: currentByStage as Record<Stage, number>,
    };
  }, [allJobs, jobsByStage]);

  /**
   * REFRESH JOBS FROM DATABASE
   * Fetches latest jobs and regroups by stage.
   */
  const refreshJobs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const qc = getAppQueryClient();
      const cachedRows = await qc.ensureQueryData({
        queryKey: coreKeys.jobs(user.id),
        queryFn: () => fetchCoreJobs<JobRow>(user.id),
        staleTime: 60 * 60 * 1000,
      });

      const jobs = Array.isArray(cachedRows)
        ? (cachedRows as JobRow[])
        : ([] as JobRow[]);

      // Keep existing UX: newest jobs first.
      jobs.sort((a, b) => {
        const at = a.created_at ? new Date(String(a.created_at)).getTime() : 0;
        const bt = b.created_at ? new Date(String(b.created_at)).getTime() : 0;
        return bt - at;
      });

      const activeJobs = filterOutArchived(jobs);
      setAllJobs(activeJobs);
      setJobsByStage(groupJobsByStage(activeJobs));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user, handleError, groupJobsByStage, filterOutArchived]);

  useEffect(() => {
    if (!user) return;

    const qc = getAppQueryClient();
    const queryKey = coreKeys.jobs(user.id);

    const updateFromCache = () => {
      const cached = qc.getQueryData(queryKey);
      if (!Array.isArray(cached)) return;
      const active = filterOutArchived(cached as JobRow[]);
      setAllJobs(active);
      setJobsByStage(groupJobsByStage(active));
    };

    // Seed local state from cache if available.
    updateFromCache();

    const unsubscribe = qc.getQueryCache().subscribe((event) => {
      const eventQueryKey = event?.query?.queryKey;
      if (!eventQueryKey || eventQueryKey.length !== queryKey.length) return;

      for (let i = 0; i < queryKey.length; i++) {
        if (eventQueryKey[i] !== queryKey[i]) return;
      }

      updateFromCache();
    });

    return unsubscribe;
  }, [user, groupJobsByStage, filterOutArchived]);

  /**
   * MOVE JOB TO NEW STAGE
   * Optimistic update: UI changes immediately, reverts on error.
   */
  const moveJob = useCallback(
    async (jobId: number, newStage: PipelineStage) => {
      if (!user) return;

      // Find the job's current stage
      let currentStage: Stage | undefined;
      for (const stage of STAGES) {
        if (jobsByStage[stage].some((j) => j.id === jobId)) {
          currentStage = stage;
          break;
        }
      }

      if (!currentStage) return;

      // Optimistic update
      const sourceJobs = [...jobsByStage[currentStage]];
      const movedJobIndex = sourceJobs.findIndex((j) => j.id === jobId);
      if (movedJobIndex === -1) return;

      const [movedJob] = sourceJobs.splice(movedJobIndex, 1);
      const destJobs =
        currentStage === newStage
          ? sourceJobs
          : [...jobsByStage[newStage as Stage]];

      if (currentStage !== newStage) {
        destJobs.unshift(movedJob); // Add to top of destination column
      }

      const optimisticUpdate = {
        ...jobsByStage,
        [currentStage]: sourceJobs,
        [newStage]: destJobs,
      };

      // Save for rollback
      preDragRef.current = jobsByStage;
      setJobsByStage(optimisticUpdate);

      // Update allJobs immediately for statistics sync
      setAllJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                job_status: newStage,
                status_changed_at: new Date().toISOString(),
              }
            : j
        )
      );

      try {
        const res = await pipelineService.moveJob(user.id, jobId, newStage);
        if (res.error) throw res.error;

        showSuccess(`Moved to ${newStage}`);
        preDragRef.current = undefined;
      } catch (err) {
        handleError(err);

        // Rollback on error
        if (preDragRef.current) {
          setJobsByStage(preDragRef.current);
          setAllJobs((prev) =>
            prev.map((j) =>
              j.id === jobId ? { ...j, job_status: currentStage } : j
            )
          );
        }
        preDragRef.current = undefined;
      }
    },
    [user, jobsByStage, handleError, showSuccess]
  );

  /**
   * BULK MOVE JOBS
   * Moves multiple jobs to the same stage.
   */
  const bulkMoveJobs = useCallback(
    async (jobIds: number[], newStage: PipelineStage) => {
      if (!user || jobIds.length === 0) return;

      try {
        await Promise.all(
          jobIds.map((id) => pipelineService.moveJob(user.id, id, newStage))
        );

        showSuccess(`Moved ${jobIds.length} job(s) to ${newStage}`);

        // Update allJobs immediately
        const updatedJobs = allJobs.map((j) =>
          jobIds.includes(Number(j.id))
            ? {
                ...j,
                job_status: newStage,
                status_changed_at: new Date().toISOString(),
              }
            : j
        );

        setAllJobs(updatedJobs);

        // Update jobsByStage immediately for instant UI feedback
        setJobsByStage(groupJobsByStage(updatedJobs));
      } catch (err) {
        handleError(err);
        // Refresh on error to revert optimistic update
        await refreshJobs();
      }
    },
    [user, handleError, showSuccess, allJobs, groupJobsByStage, refreshJobs]
  );

  /**
   * DELETE JOBS
   * Removes jobs from database and local state.
   */
  const deleteJobs = useCallback(
    async (jobIds: number[]) => {
      if (!user || jobIds.length === 0) return;

      try {
        await Promise.all(
          jobIds.map((id) => jobsService.deleteJob(user.id, id))
        );

        showSuccess(`Deleted ${jobIds.length} job(s)`);

        // Update state
        setAllJobs((prev) =>
          prev.filter((j) => !jobIds.includes(Number(j.id)))
        );

        setJobsByStage((prev) => {
          const updated = { ...prev };
          STAGES.forEach((stage) => {
            updated[stage] = updated[stage].filter(
              (j) => !jobIds.includes(Number(j.id))
            );
          });
          return updated;
        });
      } catch (err) {
        handleError(err);
      }
    },
    [user, handleError, showSuccess]
  );

  // Load jobs on mount
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  return {
    allJobs,
    jobsByStage,
    loading,
    user,
    stats,
    refreshJobs,
    moveJob,
    bulkMoveJobs,
    deleteJobs,
    groupJobsByStage,
  };
}
