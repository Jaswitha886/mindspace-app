import { requirePageRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";

// Phase 3 landed these routes, so the tab bar can name them honestly.
const NAV_ITEMS: NavItem[] = [
  { href: "/counsellor", label: "Home", icon: "home", exact: true },
  { href: "/counsellor/schedule", label: "Schedule", icon: "calendar" },
  { href: "/counsellor/availability", label: "Availability", icon: "clock" },
  { href: "/counsellor/profile", label: "Profile", icon: "user" },
];

export default async function CounsellorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageRole("COUNSELLOR");
  return (
    <AppShell
      session={session}
      roleLabel="Counsellor"
      items={NAV_ITEMS}
      home="/counsellor"
    >
      {children}
    </AppShell>
  );
}
