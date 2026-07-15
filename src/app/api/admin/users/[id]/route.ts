import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, notFound, ok, validationError } from "@/lib/api";
import { updateUserSchema } from "@/features/admin/validation";
import { SLOT_BLOCKING_STATUSES } from "@/features/appointments/slots";

// Assign/change a role, or activate/deactivate an account. Admin only.
// Every change writes an AuditLog row — role and account status are exactly the
// kind of thing that must be answerable later with "who did that, and when".
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">,
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await ctx.params;

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!target) return notFound("User not found");

    // An admin editing their own role or status can lock themselves out of the
    // only surface that could undo it. Make them use another admin account.
    if (target.id === session.userId) {
      return fail(
        "You can't change your own role or status. Ask another admin to do it.",
        409,
      );
    }

    // Never leave the platform with no way in. Roles are admin-assigned, so a
    // zero-admin system cannot repair itself through the UI.
    const losingAdmin =
      target.role === "ADMIN" &&
      ((input.role !== undefined && input.role !== "ADMIN") || input.isActive === false);
    if (losingAdmin) {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: "ADMIN", isActive: true, id: { not: target.id } },
      });
      if (otherActiveAdmins === 0) {
        return fail(
          "This is the last active admin. Promote another admin first, or nobody can assign roles again.",
          409,
        );
      }
    }

    // Deactivating a counsellor doesn't cancel anything — students agreed to
    // those sessions. Surface the conflicts and let a human decide.
    const warnings: string[] = [];
    if (input.isActive === false && target.role === "COUNSELLOR") {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const upcoming = await prisma.appointment.count({
        where: {
          counsellorId: target.id,
          status: { in: [...SLOT_BLOCKING_STATUSES] },
          appointmentDate: { gte: today },
        },
      });
      if (upcoming > 0) {
        warnings.push(
          `${target.name} has ${upcoming} upcoming appointment${upcoming === 1 ? "" : "s"}. They stay booked but ${target.name} can no longer sign in — reassign or cancel them.`,
        );
      }
    }

    const roleChanged = input.role !== undefined && input.role !== target.role;
    const statusChanged = input.isActive !== undefined && input.isActive !== target.isActive;

    if (!roleChanged && !statusChanged) {
      return ok({ user: target, warnings }, { message: "No changes" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(roleChanged ? { role: input.role } : {}),
          ...(statusChanged ? { isActive: input.isActive } : {}),
        },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });

      if (roleChanged) {
        // STUDENT is the signup default, so moving off it is the first real
        // assignment; anything else is a change to an existing role.
        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            action: target.role === "STUDENT" ? "ROLE_ASSIGNED" : "ROLE_CHANGED",
            targetId: target.id,
            metadata: { from: target.role, to: input.role },
          },
        });
      }
      if (statusChanged) {
        await tx.auditLog.create({
          data: {
            actorId: session.userId,
            action: input.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            targetId: target.id,
            metadata: { role: user.role },
          },
        });
      }
      return user;
    });

    const parts: string[] = [];
    if (roleChanged) parts.push(`role set to ${updated.role}`);
    if (statusChanged) parts.push(updated.isActive ? "account activated" : "account deactivated");

    return ok(
      { user: updated, warnings },
      { message: `${updated.name}: ${parts.join(", ")}.` },
    );
  } catch (error) {
    return apiError(error, "admin.users.update");
  }
}
