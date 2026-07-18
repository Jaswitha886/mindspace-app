import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, fail, ok, validationError } from "@/lib/api";
import { startWalkIn } from "@/features/checkin/walk-in";

// Start a live walk-in session (counsellor-only). The counsellor picked a
// student who arrived without a booking; this opens the session immediately.
// All the interesting logic — the one-session-at-a-time guard, the timestamps —
// lives in startWalkIn so it commits atomically.
const bodySchema = z.object({ studentId: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const session = await requireRole("COUNSELLOR");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const result = await startWalkIn(session.userId, parsed.data.studentId);
    if (!result.ok) return fail(result.message, result.status);

    return ok(
      { appointmentId: result.appointmentId, studentName: result.studentName },
      { status: 201, message: `Walk-in started with ${result.studentName}.` },
    );
  } catch (error) {
    return apiError(error, "appointments.walk-in");
  }
}
