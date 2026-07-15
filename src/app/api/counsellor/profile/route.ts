import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, requireRole } from "@/lib/auth";
import { apiError, fail, notFound, ok, validationError } from "@/lib/api";
import { counsellorProfileSchema } from "@/features/profile/validation";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true, // view-only: admin-controlled, PATCH never writes it
  department: { select: { name: true } },
  counsellorProfile: {
    select: {
      contactNumber: true,
      yearsOfExperience: true,
      specialization: true,
      bio: true,
    },
  },
} as const;

export async function GET() {
  try {
    const session = await requireRole("COUNSELLOR");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: profileSelect,
    });
    if (!user) return notFound("Profile not found");
    return ok({ profile: user });
  } catch (error) {
    return apiError(error, "counsellorProfile.get");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole("COUNSELLOR");
    const body = await request.json().catch(() => null);
    const parsed = counsellorProfileSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const email = input.email.toLowerCase();

    let profile;
    try {
      profile = await prisma.user.update({
        where: { id: session.userId },
        data: {
          name: input.name,
          email,
          // Role is intentionally absent — see counsellorProfileSchema.
          counsellorProfile: {
            update: {
              contactNumber: input.contactNumber ?? null,
              yearsOfExperience: input.yearsOfExperience ?? null,
            },
          },
        },
        select: profileSelect,
      });
    } catch (error) {
      // P2002 on User.email — someone already signed up with it.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return fail("Validation failed", 409, {
          email: ["That email is already in use"],
        });
      }
      throw error;
    }

    // The session token carries name and email; email is also the login
    // identity. Re-sign the cookie so the counsellor isn't left holding a
    // token that names an address they no longer own.
    if (profile.name !== session.name || profile.email !== session.email) {
      await createSessionCookie({
        ...session,
        name: profile.name,
        email: profile.email,
      });
    }

    return ok({ profile }, { message: "Profile updated" });
  } catch (error) {
    return apiError(error, "counsellorProfile.update");
  }
}
