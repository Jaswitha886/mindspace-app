import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/validation";
import { fail, ok, serverError, validationError } from "@/lib/api";
import { DEACTIVATED_MESSAGE, createSessionCookie } from "@/lib/auth";
import { dashboardPath } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        isActive: true,
      },
    });
    // Same message for unknown email and wrong password — don't leak which.
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return fail("Invalid email or password", 401);
    }
    // Checked only after the password verifies, so this can't be used to probe
    // which accounts exist.
    if (!user.isActive) return fail(DEACTIVATED_MESSAGE, 403);

    const token = await createSessionCookie({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return ok(
      {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
        redirectPath: dashboardPath(user.role),
      },
      { message: "Login successful" },
    );
  } catch (error) {
    console.error("login:", error);
    return serverError();
  }
}
