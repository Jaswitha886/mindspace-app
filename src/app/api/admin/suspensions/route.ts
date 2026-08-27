import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, ok, validationError } from "@/lib/api";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const suspensionSchema = z
  .object({
    studentId: z.string().min(1),
    reason: z.string().trim().min(1).max(2000),
    startDate: date,
    endDate: date,
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });

function asDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function serialize(row: {
  id: string;
  studentId: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  student: {
    name: string;
    email: string;
    studentProfile: { registerNumber: string } | null;
  };
  _count?: { notifications: number };
}) {
  return {
    id: row.id,
    studentId: row.studentId,
    student: {
      name: row.student.name,
      email: row.student.email,
      registerNumber: row.student.studentProfile?.registerNumber ?? null,
    },
    reason: row.reason,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    notifiedCounsellors: row._count?.notifications ?? 0,
  };
}

const include = {
  student: {
    select: {
      name: true,
      email: true,
      studentProfile: { select: { registerNumber: true } },
    },
  },
};

export async function GET() {
  try {
    await requireRole("ADMIN");
    const rows = await prisma.suspension.findMany({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      include: {
        ...include,
        _count: { select: { notifications: true } },
      },
    });
    return ok({ suspensions: rows.map(serialize) });
  } catch (error) {
    return apiError(error, "admin.suspensions.list");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    const parsed = suspensionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.user.findFirst({
        where: { id: input.studentId, role: "STUDENT" },
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: { select: { registerNumber: true } },
        },
      });
      if (!student) return null;

      const counsellors = await tx.user.findMany({
        where: { role: "COUNSELLOR", isActive: true },
        select: { id: true },
      });
      if (counsellors.length === 0) {
        throw new Error("Cannot create a suspension: no active counsellors exist to notify.");
      }

      const suspension = await tx.suspension.create({
        data: {
          studentId: student.id,
          createdById: session.userId,
          reason: input.reason,
          startDate: asDate(input.startDate),
          endDate: asDate(input.endDate),
          notes: input.notes || null,
        },
        include,
      });

      await tx.notification.createMany({
        data: counsellors.map((counsellor) => ({
          recipientId: counsellor.id,
          type: "SUSPENSION_ALERT" as const,
          suspensionId: suspension.id,
          payload: {
            suspensionId: suspension.id,
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            registerNumber: student.studentProfile?.registerNumber ?? null,
            reason: input.reason,
            startDate: input.startDate,
            endDate: input.endDate,
            notes: input.notes || null,
          },
        })),
      });

      return suspension;
    });

    if (!result) return fail("Student not found", 404);
    return ok({ suspension: serialize(result) }, { status: 201, message: "Suspension created and counsellors notified." });
  } catch (error) {
    return apiError(error, "admin.suspensions.create");
  }
}
