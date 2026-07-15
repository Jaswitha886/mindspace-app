import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, notFound, ok, validationError } from "@/lib/api";
import { journalEntrySchema } from "@/features/journal/validation";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/student/journal/[id]">,
) {
  try {
    const session = await requireRole("STUDENT");
    const { id } = await ctx.params;

    const body = await request.json().catch(() => null);
    const parsed = journalEntrySchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    // updateMany scoped by owner: someone else's entry id is a plain 404.
    const { count } = await prisma.journalEntry.updateMany({
      where: { id, studentId: session.userId },
      data: { title: parsed.data.title || null, content: parsed.data.content },
    });
    if (count === 0) return notFound("Journal entry not found");

    const entry = await prisma.journalEntry.findUnique({ where: { id } });
    return ok({ entry }, { message: "Entry updated" });
  } catch (error) {
    return apiError(error, "journal.update");
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/student/journal/[id]">,
) {
  try {
    const session = await requireRole("STUDENT");
    const { id } = await ctx.params;

    const { count } = await prisma.journalEntry.deleteMany({
      where: { id, studentId: session.userId },
    });
    if (count === 0) return notFound("Journal entry not found");
    return ok(null, { message: "Entry deleted" });
  } catch (error) {
    return apiError(error, "journal.delete");
  }
}
