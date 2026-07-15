import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError, fail, notFound, ok } from "@/lib/api";
import { getSlotsForDate, parseDateOnly } from "@/features/appointments/slots";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/counsellors/[id]/slots">,
) {
  try {
    await requireAuth();
    const { id } = await ctx.params;

    const dateParam = request.nextUrl.searchParams.get("date");
    if (!dateParam) {
      return fail("Validation failed", 400, { date: ["Date is required"] });
    }
    const date = parseDateOnly(dateParam);
    if (!date) {
      return fail("Validation failed", 400, {
        date: ["Date must be in YYYY-MM-DD format"],
      });
    }

    // `id` is the counsellor's User id (ownership FKs hang off User.id).
    // Deactivated counsellors offer no slots.
    const counsellor = await prisma.user.findFirst({
      where: { id, role: "COUNSELLOR", isActive: true },
      select: { id: true },
    });
    if (!counsellor) return notFound("Counsellor not found");

    const slots = await getSlotsForDate(counsellor.id, date);
    return ok({ slots });
  } catch (error) {
    return apiError(error, "counsellors.slots");
  }
}
