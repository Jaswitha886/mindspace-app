import { requirePageRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";

// The reference's student tab bar: Home · Appointments · Affirmation ·
// History · Profile, mapped onto the routes this app actually has.
const NAV_ITEMS: NavItem[] = [
  { href: "/student", label: "Home", icon: "home", exact: true },
  { href: "/student/appointments", label: "Appointments", icon: "calendar" },
  { href: "/student/mood", label: "Mood", icon: "affirmation" },
  { href: "/student/journal", label: "Journal", icon: "journal" },
  { href: "/student/profile", label: "Profile", icon: "user" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageRole("STUDENT");
  return (
    <AppShell session={session} roleLabel="Student" items={NAV_ITEMS} home="/student">
      {children}
    </AppShell>
  );
}
