import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import ProfileSidebar from "@shared/components/sidebars/ProfileSidebar";

interface ProfileLayoutProps {
  children?: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <AppShell sidebar={<ProfileSidebar />}>{children ?? <Outlet />}</AppShell>
  );
}
