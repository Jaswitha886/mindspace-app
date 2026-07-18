import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

// Admins had no profile page, which meant no route to the theme toggle — the
// other two roles reached it from theirs. Read-only: an admin's own name and
// role are changed in the Users table like anyone else's, and giving this page
// an edit form would be a second way to do the same thing.
export default async function AdminProfilePage() {
  const session = await requirePageRole("ADMIN");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, department: { select: { name: true } } },
  });

  const rows: Array<[string, string]> = [
    ["Name", user?.name ?? session.name],
    ["Email", user?.email ?? session.email],
    ["Role", "Admin"],
    ["Department", user?.department?.name ?? "—"],
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle sub="Your account and how MindSpace looks on this device.">
        Profile
      </PageTitle>

      <Card>
        <h2 className="t-h2">Account</h2>
        <dl className="mt-3 flex flex-col">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <dt className="t-meta shrink-0">{label}</dt>
              <dd className="min-w-0 truncate text-[0.9375rem] font-semibold text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h2 className="t-h2">Appearance</h2>
        <p className="t-body mt-1 mb-3">
          Applies to this browser only, not your account.
        </p>
        <ThemeToggle />
      </Card>
    </div>
  );
}
