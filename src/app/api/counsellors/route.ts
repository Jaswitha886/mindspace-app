import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAuth();
    const counsellors = await prisma.counsellorProfile.findMany({
      // Deactivated counsellors disappear from booking surfaces — a student
      // must never be able to request a session with someone who can't sign in.
      where: { user: { isActive: true } },
      select: {
        id: true,
        contactNumber: true,
        yearsOfExperience: true,
        specialization: true,
        bio: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
    });
    return ok({ counsellors });
  } catch (error) {
    return apiError(error, "counsellors.list");
  }
}
