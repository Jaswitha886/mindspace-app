import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok, validationError } from "@/lib/api";
import { userListQuerySchema } from "@/features/admin/validation";

// User directory for role administration. Admin only.
// Deliberately selects no journal, mood, or note data — this is an account
// list, not a window into anyone's wellbeing.
export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const params = request.nextUrl.searchParams;
    const parsed = userListQuerySchema.safeParse({
      q: params.get("q") ?? undefined,
      role: params.get("role") ?? undefined,
      status: params.get("status") ?? undefined,
      page: params.get("page") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);
    const { q, role, status, page, limit } = parsed.data;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { isActive: status === "active" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, users, activeAdmins] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ role: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          department: { select: { name: true } },
        },
      }),
      prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
    ]);

    return ok({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        department: u.department?.name ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      activeAdmins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return apiError(error, "admin.users.list");
  }
}
