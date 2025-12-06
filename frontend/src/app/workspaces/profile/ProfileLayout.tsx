import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import ProfileSidebar from "@shared/components/sidebars/ProfileSidebar";
import { ProfileQueryProvider } from "./cache";

interface ProfileLayoutProps {
  children?: React.ReactNode;
}

/**
 * Profile Layout
 *
 * Wraps all profile routes with:
 * - AppShell for consistent layout
 * - ProfileSidebar for navigation
 * - ProfileQueryProvider for scoped data caching (react-query)
 */
export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <ProfileQueryProvider>
      <AppShell sidebar={<ProfileSidebar />}>{children ?? <Outlet />}</AppShell>
    </ProfileQueryProvider>
  );
}
