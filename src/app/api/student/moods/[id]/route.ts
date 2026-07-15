import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, notFound, ok } from "@/lib/api";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/student/moods/[id]">,
) {
  try {
    const session = await requireRole("STUDENT");
    const { id } = await ctx.params;

    // Scope the delete by owner — a foreign id just comes back not-found.
    const { count } = await prisma.moodLog.deleteMany({
      where: { id, studentId: session.userId },
    });
    if (count === 0) return notFound("Mood entry not found");
    return ok(null, { message: "Mood entry deleted" });
  } catch (error) {
    return apiError(error, "moods.delete");
  }
}
