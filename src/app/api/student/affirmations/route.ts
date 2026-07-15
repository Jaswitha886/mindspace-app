import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok } from "@/lib/api";

// Affirmations visible to a student, most recent first:
//   1. targeted directly at them, or
//   2. broadcast (targetStudentId null) by a counsellor they share an
//      APPROVED/COMPLETED appointment with — "assignment" is derived from
//      the booking flow; there is no persistent counsellor link.
export async function GET() {
  try {
    const session = await requireRole("STUDENT");

    const myCounsellors = await prisma.appointment.findMany({
      where: {
        studentId: session.userId,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      select: { counsellorId: true },
      distinct: ["counsellorId"],
    });

    const affirmations = await prisma.affirmation.findMany({
      where: {
        isActive: true,
        OR: [
          { targetStudentId: session.userId },
          {
            targetStudentId: null,
            counsellorId: { in: myCounsellors.map((a) => a.counsellorId) },
          },
        ],
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        counsellor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ affirmations });
  } catch (error) {
    return apiError(error, "affirmations.list");
  }
}
