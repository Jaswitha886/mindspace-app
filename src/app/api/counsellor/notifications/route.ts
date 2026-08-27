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
    const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const updated = await prisma.notification.updateMany({
      where: { id: parsed.data.id, recipientId: session.userId, type: "SUSPENSION_ALERT" },
      data: { isRead: true },
    });
    if (updated.count === 0) return notFound("Notification not found");
    return ok({ updated: true });
  } catch (error) {
    return apiError(error, "counsellor.notifications.markRead");
  }
}
