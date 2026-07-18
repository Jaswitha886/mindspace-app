import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MoodEntryForm } from "@/features/moods/MoodEntryForm";
import { MoodTrendChart } from "@/features/moods/MoodTrendChart";
import { DeleteMoodButton } from "@/features/moods/DeleteMoodButton";
import { MOOD_COLOR, MOOD_FACE_INK, MOOD_LABEL } from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";
import { formatDate } from "@/lib/format";

export default async function MoodPage() {
  const session = await requirePageRole("STUDENT");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const since = new Date(today);
  since.setUTCDate(since.getUTCDate() - 29);

  const moods = await prisma.moodLog.findMany({
    where: { studentId: session.userId, logDate: { gte: since } },
    orderBy: { logDate: "desc" },
  });
  const todaysMood = moods.find((m) => m.logDate.getTime() === today.getTime());

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="A private record, just for you — there's no streak to keep.">
        Log Mood
      </PageTitle>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <MoodEntryForm todaysMood={todaysMood?.mood ?? null} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="t-h2 mb-4">Last 30 Days Mood Trend</h2>
            <MoodTrendChart
              moods={moods.map((m) => ({
                logDate: m.logDate.toISOString(),
                mood: m.mood,
              }))}
            />
          </Card>

          <Card>
            <h2 className="t-h2 mb-1">History</h2>
            {moods.length === 0 ? (
              <p className="t-body mt-2">No entries in the last 30 days.</p>
            ) : (
              <ul className="flex flex-col">
                {moods.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-3 border-b border-line py-3.5 last:border-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: MOOD_COLOR[m.mood], color: MOOD_FACE_INK }}
                      >
                        <MoodFace mood={m.mood} className="h-[1.3rem] w-[1.3rem]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.9375rem]">
                          <span className="font-semibold text-ink">{MOOD_LABEL[m.mood]}</span>
                          <span className="ml-2 text-xs text-ink-muted">
                            {formatDate(m.logDate)}
                          </span>
                        </p>
                        {m.note && (
                          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                            {m.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <DeleteMoodButton moodId={m.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
