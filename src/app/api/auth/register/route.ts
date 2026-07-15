import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/features/auth/validation";
import { fail, ok, serverError, validationError } from "@/lib/api";

const HASH_ROUNDS = 12;

// Public registration creates STUDENT accounts only (docs/API.md).
// Counsellor/admin accounts come from the seed script.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const email = input.email.toLowerCase();
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        password: await bcrypt.hash(input.password, HASH_ROUNDS),
        role: "STUDENT",
        department: {
          connectOrCreate: {
            where: { name: input.department },
            create: { name: input.department },
          },
        },
        studentProfile: {
          create: {
            registerNumber: input.registerNumber,
            semester: input.semester ?? null,
            phoneNumber: input.phoneNumber ?? null,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(
      { user },
      { status: 201, message: "Account created successfully. Please sign in." },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // With the Neon driver adapter the violated fields sit deep in
      // meta.driverAdapterError, so search the whole meta blob.
      const target = JSON.stringify(error.meta ?? {});
      if (target.includes("registerNumber")) {
        return fail("An account with this register number already exists", 400);
      }
      return fail("An account with this email already exists", 400);
    }
    console.error("register:", error);
    return serverError();
  }
}
