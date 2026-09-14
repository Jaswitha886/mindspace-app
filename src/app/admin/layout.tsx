import { requirePageRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Home", icon: "home", exact: true },
  { href: "/admin/notifications", label: "Alerts", icon: "bell" },
  { href: "/admin/profile", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageRole("ADMIN");
  return (
    <AppShell
      session={session}
      roleLabel="Management"
      items={NAV_ITEMS}
      home="/admin"
    >
      {children}
    </AppShell>
  );
}
