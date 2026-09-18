import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, notFound, ok, validationError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireRole("COUNSELLOR");
    const rows = await prisma.notification.findMany({
      where: { recipientId: session.userId, type: "SUSPENSION_ALERT" },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
    return ok({
      notifications: rows.map((row) => ({
        id: row.id,
        payload: row.payload,
        isRead: row.isRead,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error, "counsellor.notifications.list");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole("COUNSELLOR");
    const parsed = z.object({ id: z.string().min(1).optional() }).safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success) return validationError(parsed.error);
    if (!parsed.data.id) {
      const updated = await prisma.notification.updateMany({
        where: { recipientId: session.userId, type: "SUSPENSION_ALERT", isRead: false },
        data: { isRead: true },
      });
      return ok({ updated: updated.count }, { message: "All caught up" });
    }
    const updated = await prisma.notification.updateMany({
      where: { id: parsed.data.id, recipientId: session.userId, type: "SUSPENSION_ALERT" },
      data: { isRead: true },
    });
    if (updated.count === 0) return notFound("Notification not found");
    return ok({ updated: updated.count }, { message: "Marked as read" });
  } catch (error) {
    return apiError(error, "counsellor.notifications.markRead");
  }
}
