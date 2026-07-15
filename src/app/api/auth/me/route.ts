import { prisma } from "@/lib/prisma";
import { ok, serverError, unauthorized } from "@/lib/api";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        department: { select: { name: true } },
        studentProfile: {
          select: {
            id: true,
            registerNumber: true,
            semester: true,
            phoneNumber: true,
          },
        },
        counsellorProfile: {
          select: {
            id: true,
            contactNumber: true,
            yearsOfExperience: true,
            specialization: true,
            bio: true,
          },
        },
      },
    });
    if (!user) return unauthorized(); // session refers to a deleted user

    const { department, studentProfile, ...rest } = user;
    return ok({
      user: {
        ...rest,
        // API.md shows department inside studentProfile; it lives on User in the schema.
        studentProfile: studentProfile
          ? { ...studentProfile, department: department?.name ?? null }
          : null,
      },
    });
  } catch (error) {
    console.error("me:", error);
    return serverError();
  }
}
