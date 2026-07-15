import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, ok, validationError } from "@/lib/api";
import { availabilitySchema } from "@/features/availability/validation";
import { overlaps, parseDateOnly } from "@/features/appointments/slots";

const serialize = (a: {
  id: string;
  isRecurring: boolean;
  dayOfWeek: number | null;
  specificDate: Date | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
}) => ({
  id: a.id,
  isRecurring: a.isRecurring,
  dayOfWeek: a.dayOfWeek,
  specificDate: a.specificDate ? a.specificDate.toISOString().slice(0, 10) : null,
  startTime: a.startTime,
  endTime: a.endTime,
  isActive: a.isActive,
});

// The counsellor's own availability windows. Scoped to session.userId — a
// counsellor can never read or write another's schedule.
export async function GET() {
  try {
    const session = await requireRole("COUNSELLOR");
    const rows = await prisma.availability.findMany({
      where: { counsellorId: session.userId },
      orderBy: [{ isRecurring: "desc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return ok({ availability: rows.map(serialize) });
  } catch (error) {
    return apiError(error, "availability.list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("COUNSELLOR");

    const body = await request.json().catch(() => null);
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const specificDate = input.specificDate ? parseDateOnly(input.specificDate) : null;
    if (input.specificDate && !specificDate) {
      return fail("Validation failed", 400, {
        specificDate: ["Date must be in YYYY-MM-DD format"],
      });
    }

    // Two windows on the same day must not overlap, or getSlotsForDate() would
    // offer the same hour twice.
    const siblings = await prisma.availability.findMany({
      where: {
        counsellorId: session.userId,
        isActive: true,
        ...(input.isRecurring
          ? { isRecurring: true, dayOfWeek: input.dayOfWeek! }
          : { isRecurring: false, specificDate }),
      },
      select: { startTime: true, endTime: true },
    });
    if (siblings.some((s) => overlaps(input.startTime, input.endTime, s.startTime, s.endTime))) {
      return fail("This overlaps a slot you already have that day", 409);
    }

    const created = await prisma.availability.create({
      data: {
        counsellorId: session.userId,
        isRecurring: input.isRecurring,
        dayOfWeek: input.isRecurring ? input.dayOfWeek! : null,
        specificDate: input.isRecurring ? null : specificDate,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });

    return ok(
      { availability: serialize(created) },
      { status: 201, message: "Slot added" },
    );
  } catch (error) {
    return apiError(error, "availability.create");
  }
}
