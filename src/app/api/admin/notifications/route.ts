import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, notFound, ok, validationError } from "@/lib/api";

// The admin's own notification inbox. Scoped to recipientId = session.userId,
// so one admin can never mark another's notifications read.
export async function GET() {
  try {
    const session = await requireRole("ADMIN");
    const rows = await prisma.notification.findMany({
      where: { recipientId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok({
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        payload: n.payload,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unread: rows.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    return apiError(error, "admin.notifications.list");
  }
}

const markReadSchema = z.object({
  id: z.string().min(1).optional(), // omit to mark every unread one read
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole("ADMIN");
    const body = await request.json().catch(() => ({}));
    const parsed = markReadSchema.safeParse(body ?? {});
    if (!parsed.success) return validationError(parsed.error);

    if (parsed.data.id) {
      // updateMany, not update: the recipientId filter is the authorization.
      const { count } = await prisma.notification.updateMany({
        where: { id: parsed.data.id, recipientId: session.userId },
        data: { isRead: true },
      });
      if (count === 0) return notFound("Notification not found");
      return ok({ updated: count }, { message: "Marked as read" });
    }

    const { count } = await prisma.notification.updateMany({
      where: { recipientId: session.userId, isRead: false },
      data: { isRead: true },
    });
    return ok({ updated: count }, { message: "All caught up" });
  } catch (error) {
    return apiError(error, "admin.notifications.markRead");
  }
}
