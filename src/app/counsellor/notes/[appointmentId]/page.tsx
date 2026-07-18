import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SessionNoteForm } from "@/features/notes/SessionNoteForm";
import { formatDateLong, formatTimeRange } from "@/lib/format";

export default async function SessionNotePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const session = await requirePageRole("COUNSELLOR");
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      counsellorId: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      student: { select: { name: true } },
      sessionNote: { select: { id: true, content: true, severity: true } },
    },
  });

  // 404 rather than 403 for someone else's appointment — a counsellor has no
  // business learning that another's appointment id exists.
  if (!appointment || appointment.counsellorId !== session.userId) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">

      <PageTitle
        sub={`${appointment.student.name} · ${formatDateLong(appointment.appointmentDate)} · ${formatTimeRange(appointment.startTime, appointment.endTime)}`}
      >
        Session Notes
      </PageTitle>

      <Card>
        <SessionNoteForm
          appointmentId={appointment.id}
          studentName={appointment.student.name}
          existing={
            appointment.sessionNote
              ? {
                  id: appointment.sessionNote.id,
                  notes: appointment.sessionNote.content,
                  severity: appointment.sessionNote.severity,
                }
              : null
          }
        />
      </Card>
    </div>
  );
}
