import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { CounsellorProfileForm } from "@/features/profile/CounsellorProfileForm";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { UserCircleIcon, ClockIcon, QuoteIcon } from "@/components/icons";

export default async function CounsellorProfilePage() {
  const session = await requirePageRole("COUNSELLOR");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      department: { select: { name: true } },
      counsellorProfile: {
        select: {
          contactNumber: true,
          yearsOfExperience: true,
          specialization: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle sub="Students see your name and specialization when booking. Your role is set by an admin.">
        Profile
      </PageTitle>
      <Card tone="plum">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-surface text-xl font-bold text-brand-ink shadow-(--shadow-card)">
            {(user?.name ?? session.name).split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-bold text-ink-strong">{user?.name ?? session.name}</p>
            <p className="mt-0.5 truncate text-sm text-ink-secondary">{user?.email ?? session.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-surface/70 px-3 py-1 text-xs font-semibold text-ink-secondary"><UserCircleIcon className="h-3.5 w-3.5" /> Counsellor</span>
              {user?.counsellorProfile?.specialization && <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-surface/70 px-3 py-1 text-xs font-semibold text-ink-secondary"><QuoteIcon className="h-3.5 w-3.5" /> {user.counsellorProfile.specialization}</span>}
              {user?.counsellorProfile?.yearsOfExperience != null && <span className="inline-flex items-center gap-1.5 rounded-(--radius-pill) bg-surface/70 px-3 py-1 text-xs font-semibold text-ink-secondary"><ClockIcon className="h-3.5 w-3.5" /> {user.counsellorProfile.yearsOfExperience} years</span>}
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CounsellorProfileForm
          defaults={{
            name: user?.name ?? session.name,
            email: user?.email ?? session.email,
            contactNumber: user?.counsellorProfile?.contactNumber ?? undefined,
            yearsOfExperience:
              user?.counsellorProfile?.yearsOfExperience ?? undefined,
          }}
          role={user?.role ?? session.role}
          department={user?.department?.name ?? null}
          specialization={user?.counsellorProfile?.specialization ?? null}
        />
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
