import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { ProfileForm } from "@/features/profile/ProfileForm";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

export default async function StudentProfilePage() {
  const session = await requirePageRole("STUDENT");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      department: { select: { name: true } },
      studentProfile: {
        select: { registerNumber: true, semester: true, phoneNumber: true },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle sub="Your name is how counsellors see you. Your email stays fixed.">
        Profile
      </PageTitle>
      <Card>
        <ProfileForm
          defaults={{
            name: user?.name ?? session.name,
            phoneNumber: user?.studentProfile?.phoneNumber ?? undefined,
            semester: user?.studentProfile?.semester ?? undefined,
          }}
          email={user?.email ?? session.email}
          registerNumber={user?.studentProfile?.registerNumber ?? null}
          department={user?.department?.name ?? null}
        />
      </Card>

      <Card>
        <h2 className="t-h2">Appearance</h2>
        <p className="t-body mt-1 mb-3">
          Dark mode is easier on the eyes late at night — which is when a journal
          tends to get written.
        </p>
        <ThemeToggle />
      </Card>
    </div>
  );
}
