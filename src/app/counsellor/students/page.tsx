import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { UsersIcon } from "@/components/icons";

export default async function CounsellorStudentsPage() {
  const session = await requirePageRole("COUNSELLOR");

  const students = await prisma.appointment.findMany({
    where: { counsellorId: session.userId },
    distinct: ["studentId"],
    select: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: { select: { registerNumber: true } },
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Students who have sessions booked with you.">
        Students
      </PageTitle>

      {students.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-12 w-12" />}
          title="No students yet"
          body="Students who book sessions with you will appear here."
        />
      ) : (
        <Card>
          <ul className="flex flex-col">
            {students.map((s) => (
              <li
                key={s.student.id}
                className="flex items-center gap-4 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-bold text-brand-ink">
                  {s.student.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-semibold text-ink">
                    {s.student.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {s.student.studentProfile?.registerNumber ?? s.student.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
