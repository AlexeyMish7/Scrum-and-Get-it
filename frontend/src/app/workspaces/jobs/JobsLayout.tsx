import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import JobsSidebar from "@shared/components/sidebars/JobsSidebar";

export default function JobsLayout() {
  return (
    <AppShell sidebar={<JobsSidebar />}>
      <Outlet />
    </AppShell>
  );
}
