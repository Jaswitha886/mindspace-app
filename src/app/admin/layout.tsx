import { requirePageRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";

// The admin is for management to read aggregate patterns and act on a spike in
// critical flags — not a control system over student accounts. No Users tab:
// that page and its APIs were removed, and no admin manages accounts here.
const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Analytics", icon: "chart", exact: true },
  { href: "/admin#suspensions", label: "Suspensions", icon: "clipboard" },
  { href: "/admin/notifications", label: "Alerts", icon: "affirmation" },
  { href: "/admin/profile", label: "Profile", icon: "user" },
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
