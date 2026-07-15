import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok, validationError } from "@/lib/api";
import { updateAvailabilitySchema } from "@/features/availability/validation";
import { SLOT_BLOCKING_STATUSES } from "@/features/appointments/slots";

/** The window, if it belongs to this counsellor. */
async function ownedOr(id: string, counsellorId: string) {
  const row = await prisma.availability.findUnique({
    where: { id },
    select: { id: true, counsellorId: true },
  });
  if (!row) return { error: notFound("Slot not found") } as const;
  if (row.counsellorId !== counsellorId) {
    return { error: forbidden("You can only edit your own availability") } as const;
  }
  return { row } as const;
}

/** Upcoming requests/bookings that still depend on this window. */
async function liveAppointments(availabilityId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return prisma.appointment.count({
    where: {
      availabilityId,
      status: { in: [...SLOT_BLOCKING_STATUSES] },
      appointmentDate: { gte: today },
    },
  });
}

// Enable/disable a window. Disabling hides it from booking but leaves already
// booked appointments alone — those are a commitment, not a slot.
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/counsellor/availability/[id]">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const owned = await ownedOr(id, session.userId);
    if ("error" in owned) return owned.error;

    const body = await request.json().catch(() => null);
    const parsed = updateAvailabilitySchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const updated = await prisma.availability.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    });

    return ok(
      { availability: updated },
      { message: parsed.data.isActive ? "Slot enabled" : "Slot disabled" },
    );
  } catch (error) {
    return apiError(error, "availability.update");
  }
}

// Remove a window outright. Refused while students still hold appointments in
// it: Appointment.availabilityId is a nullable FK, so deleting would silently
// orphan a live booking rather than stop it. Disable it instead.
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/counsellor/availability/[id]">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const owned = await ownedOr(id, session.userId);
    if ("error" in owned) return owned.error;

    const booked = await liveAppointments(id);
    if (booked > 0) {
      return fail(
        `${booked} upcoming appointment${booked === 1 ? "" : "s"} still use this slot. Disable it instead — that stops new bookings without dropping the ones you've agreed to.`,
        409,
      );
    }

    await prisma.availability.delete({ where: { id } });
    return ok({ id }, { message: "Slot removed" });
  } catch (error) {
    return apiError(error, "availability.delete");
  }
}
