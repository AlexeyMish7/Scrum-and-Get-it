import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import AISidebar from "@shared/components/sidebars/AISidebar";

/**
 * AiLayout renders AI workspace pages inside the new AppShell which exposes a
 * dedicated AI sidebar (AISidebar). The previous TopNav is rendered by the
 * AppShell's GlobalTopBar.
 */
export default function AiLayout() {
  return (
    <AppShell sidebar={<AISidebar />}>
      <Outlet />
    </AppShell>
  );
}
