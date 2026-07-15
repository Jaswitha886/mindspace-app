import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { BookingForm } from "@/features/appointments/BookingForm";

export default async function BookAppointmentPage() {
  await requirePageRole("STUDENT");

  const counsellors = (
    await prisma.user.findMany({
      where: { role: "COUNSELLOR", isActive: true },
      select: {
        id: true,
        name: true,
        counsellorProfile: {
          select: { specialization: true, yearsOfExperience: true },
        },
      },
      orderBy: { name: "asc" },
    })
  ).map((c) => ({
    id: c.id,
    name: c.name,
    specialization: c.counsellorProfile?.specialization ?? null,
    yearsOfExperience: c.counsellorProfile?.yearsOfExperience ?? null,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageTitle sub="Three small choices — your request goes to the counsellor to confirm.">
        Book Session
      </PageTitle>
      <BookingForm counsellors={counsellors} />
    </div>
  );
}
