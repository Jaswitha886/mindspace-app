import type { Prisma } from "@prisma/client";
import { slotDateTime } from "@/features/appointments/slots";

// Shared include + response shaping for appointment payloads (docs/API.md).
// Department lives on User; API.md presents it inside the student profile.

export const appointmentInclude = {
  student: {
    select: {
      name: true,
      email: true,
      department: { select: { name: true } },
      studentProfile: {
        select: { registerNumber: true, semester: true, phoneNumber: true },
      },
    },
  },
  counsellor: {
    select: {
      name: true,
      email: true,
      counsellorProfile: {
        select: {
          specialization: true,
          contactNumber: true,
          yearsOfExperience: true,
        },
      },
    },
  },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export function serializeAppointment(row: AppointmentRow) {
  return {
    id: row.id,
    studentId: row.studentId,
    counsellorId: row.counsellorId,
    appointmentDate: row.appointmentDate.toISOString(),
    startTime: slotDateTime(row.appointmentDate, row.startTime).toISOString(),
    endTime: slotDateTime(row.appointmentDate, row.endTime).toISOString(),
    status: row.status,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    student: {
      user: { name: row.student.name, email: row.student.email },
      registerNumber: row.student.studentProfile?.registerNumber ?? null,
      department: row.student.department?.name ?? null,
      semester: row.student.studentProfile?.semester ?? null,
      phoneNumber: row.student.studentProfile?.phoneNumber ?? null,
    },
    counsellor: {
      user: { name: row.counsellor.name, email: row.counsellor.email },
      specialization: row.counsellor.counsellorProfile?.specialization ?? null,
      contactNumber: row.counsellor.counsellorProfile?.contactNumber ?? null,
      yearsOfExperience: row.counsellor.counsellorProfile?.yearsOfExperience ?? null,
    },
  };
}
