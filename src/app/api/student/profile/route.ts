import { prisma } from "@/lib/prisma";
import { createSessionCookie, requireRole } from "@/lib/auth";
import { apiError, notFound, ok, validationError } from "@/lib/api";
import { studentProfileSchema } from "@/features/profile/validation";

const profileSelect = {
  id: true,
  name: true,
  email: true, // read-only: tied to auth, PATCH ignores it
  department: { select: { name: true } },
  studentProfile: {
    select: { registerNumber: true, semester: true, phoneNumber: true },
  },
} as const;

export async function GET() {
  try {
    const session = await requireRole("STUDENT");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: profileSelect,
    });
    if (!user) return notFound("Profile not found");
    return ok({ profile: user });
  } catch (error) {
    return apiError(error, "profile.get");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole("STUDENT");
    const body = await request.json().catch(() => null);
    const parsed = studentProfileSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const profile = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: parsed.data.name,
        studentProfile: {
          update: {
            phoneNumber: parsed.data.phoneNumber ?? null,
            semester: parsed.data.semester ?? null,
          },
        },
      },
      select: profileSelect,
    });
    // The session token carries the name — refresh it so headers show the new one.
    if (profile.name !== session.name) {
      await createSessionCookie({ ...session, name: profile.name });
    }
    return ok({ profile }, { message: "Profile updated" });
  } catch (error) {
    return apiError(error, "profile.update");
  }
}
