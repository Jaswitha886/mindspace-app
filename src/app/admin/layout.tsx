import { requirePageRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";

// Phase 4 landed these routes, so the tab bar can name them honestly.
const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Analytics", icon: "chart", exact: true },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/notifications", label: "Alerts", icon: "affirmation" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageRole("ADMIN");
  return (
    <AppShell session={session} roleLabel="Admin" items={NAV_ITEMS} home="/admin">
      {children}
    </AppShell>
  );
}
