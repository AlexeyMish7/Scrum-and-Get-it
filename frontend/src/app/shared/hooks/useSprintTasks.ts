import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getTasksForPage, type PageTaskKey } from "@shared/utils/pageTaskMap";
import type { SprintTaskItem } from "@shared/components/common/SprintTaskSnackbar";

// Map pathname patterns to page keys. Lightweight and easily extendable.
const routeToKey: Array<{ test: (path: string) => boolean; key: PageTaskKey }> =
  [
    { test: (p) => p === "/ai" || p === "/ai/", key: "ai:dashboard" },
    {
      test: (p) => p.startsWith("/ai/cover-letter") || p === "/ai/cover-letter",
      key: "ai:cover-letter",
    },
    {
      test: (p) => p.startsWith("/ai/resume") || p === "/ai/resume",
      key: "ai:resume",
    },
    {
      test: (p) => p.startsWith("/ai/job-match") || p === "/ai/job-match",
      key: "ai:job-match",
    },
    {
      test: (p) =>
        p.startsWith("/ai/company-research") || p === "/ai/company-research",
      key: "ai:company-research",
    },
    {
      test: (p) => p.startsWith("/ai/templates") || p === "/ai/templates",
      key: "ai:templates",
    },
    {
      test: (p) =>
        p.startsWith("/jobs/pipeline") ||
        p === "/jobs" ||
        p === "/jobs/pipeline",
      key: "jobs:pipeline",
    },
    { test: (p) => p.startsWith("/jobs/new"), key: "jobs:new" },
    {
      test: (p) => p.startsWith("/jobs/documents"),
      key: "jobs:documents" as PageTaskKey,
    },
    {
      test: (p) => p.startsWith("/jobs/saved-searches"),
      key: "jobs:saved-searches" as PageTaskKey,
    },
    {
      test: (p) => p.startsWith("/jobs/analytics"),
      key: "jobs:analytics" as PageTaskKey,
    },
    {
      test: (p) => p.startsWith("/jobs/automations"),
      key: "jobs:automations" as PageTaskKey,
    },
  ];

function inferPageKey(pathname: string): PageTaskKey | undefined {
  const found = routeToKey.find((r) => r.test(pathname));
  return found?.key;
}

export interface UseSprintTasksResult {
  key?: PageTaskKey;
  tasks: SprintTaskItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

/**
 * useSprintTasks
 * Returns the Sprint2 PRD tasks for the current route or a manually provided page key.
 */
export function useSprintTasks(
  explicitKey?: PageTaskKey
): UseSprintTasksResult {
  const location = useLocation();
  const inferredKey = useMemo(
    () => explicitKey || inferPageKey(location.pathname),
    [explicitKey, location.pathname]
  );

  const tasks = useMemo(
    () => (inferredKey ? getTasksForPage(inferredKey) : []),
    [inferredKey]
  );

  // Visible by default only if tasks exist.
  const [open, setOpen] = useState<boolean>(tasks.length > 0);

  // When navigating, re-open if the new page has tasks.
  useEffect(() => {
    if (tasks.length > 0) setOpen(true);
  }, [tasks]);

  return {
    key: inferredKey,
    tasks,
    open,
    setOpen,
    toggle: () => setOpen((o) => !o),
  };
}

export default useSprintTasks;
