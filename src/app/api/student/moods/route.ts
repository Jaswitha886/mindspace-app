import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok, validationError } from "@/lib/api";
import { createMoodSchema } from "@/features/moods/validation";

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Log today's mood. One entry per day — logging again replaces today's entry
// (kinder than a 409 for a "how are you feeling" widget).
export async function POST(request: Request) {
  try {
    const session = await requireRole("STUDENT");
    const body = await request.json().catch(() => null);
    const parsed = createMoodSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const logDate = todayUTC();
    const mood = await prisma.moodLog.upsert({
      where: { studentId_logDate: { studentId: session.userId, logDate } },
      create: {
        studentId: session.userId,
        mood: parsed.data.mood,
        note: parsed.data.note ?? null,
        logDate,
      },
      update: { mood: parsed.data.mood, note: parsed.data.note ?? null },
    });

    return ok({ mood }, { status: 201, message: "Mood logged" });
  } catch (error) {
    return apiError(error, "moods.create");
  }
}

// Mood history, newest first (default: last 30 days for the trend chart).
export async function GET(request: Request) {
  try {
    const session = await requireRole("STUDENT");
    const daysParam = new URL(request.url).searchParams.get("days");
    const days = Math.min(Math.max(Number(daysParam) || 30, 1), 365);

    const since = todayUTC();
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const moods = await prisma.moodLog.findMany({
      where: { studentId: session.userId, logDate: { gte: since } },
      orderBy: { logDate: "desc" },
    });
    return ok({ moods });
  } catch (error) {
    return apiError(error, "moods.list");
  }
}
