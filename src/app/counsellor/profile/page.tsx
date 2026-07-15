import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { CounsellorProfileForm } from "@/features/profile/CounsellorProfileForm";

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
    </div>
  );
}
