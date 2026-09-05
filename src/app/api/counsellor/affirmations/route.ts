import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok, validationError } from "@/lib/api";

const quoteSchema = z.object({
  message: z.string().trim().min(1, "Quote is required").max(500, "Quote must be 500 characters or fewer"),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole("COUNSELLOR");
    const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const affirmation = await prisma.affirmation.create({
      data: {
        counsellorId: session.userId,
        message: parsed.data.message,
        targetStudentId: null,
      },
      select: { id: true, message: true, createdAt: true },
    });

    return ok(
      { affirmation },
      { status: 201, message: "Quote shared with your students." },
    );
  } catch (error) {
    return apiError(error, "counsellor.affirmations.create");
  }
}
