import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { getStudentDashboardData } from "@/features/student/dashboard-data";
import { Card } from "@/components/ui/card";
import { AffirmationList } from "@/features/student/AffirmationCard";
import {
  ArrowRightIcon,
  CalendarIcon,
  JournalIcon,
  SmileIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { MOOD_COLOR, MOOD_FACE_INK, MOOD_LABEL } from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";
import { CheckInCode, CheckedInNotice } from "@/features/checkin/CheckInCode";
import { isWithinCheckInWindow } from "@/features/checkin/checkin";
import { formatDate, formatDateLong, formatTimeRange } from "@/lib/format";

// Rotating avatar tints so the counsellor list reads as a row of people, not a
// column of identical grey discs. Decorative — never the only signal.
const AVATAR_TINTS = [
  "bg-brand-tint text-brand-ink",
  "bg-gold text-gold-ink",
  "bg-teal text-ink-strong",
];

function initials(name: string): string {
  return name
    .replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function StudentDashboard() {
  const session = await requirePageRole("STUDENT");
  const { upcoming, recentMoods, affirmations, counsellors } =
    await getStudentDashboardData(session.userId);

  const firstName = session.name.split(" ")[0];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todaysMood =
    recentMoods[0]?.logDate.getTime() === today.getTime() ? recentMoods[0].mood : null;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="t-display">Hello, {firstName}</h1>
        <p className="t-meta mt-1">{formatDateLong(today)}</p>
      </header>

      {/* The focal card — a soft mint panel, dark type, with the one bold pop on
          the page: the emerald CTA. Calm surface, not a heavy block. A single
          faint blob gives it a little depth. */}
      <div className="relative overflow-hidden rounded-(--radius-card) bg-brand-tint p-6 shadow-(--shadow-card) sm:p-7">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-light/[0.14]"
        />
        {todaysMood ? (
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full shadow-(--shadow-btn)"
                style={{ backgroundColor: MOOD_COLOR[todaysMood], color: MOOD_FACE_INK }}
              >
                <MoodFace mood={todaysMood} className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-ink-strong">
                  Today&apos;s mood is logged
                </h2>
                <p className="mt-0.5 text-[0.9375rem] text-ink-secondary">
                  You noted you felt{" "}
                  <span className="font-semibold text-ink">{MOOD_LABEL[todaysMood]}</span>.
                </p>
              </div>
            </div>
            <Link
              href="/student/mood"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-(--radius-btn) border border-brand/25 px-5 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5"
            >
              See your trend
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-ink-strong">
                How are you feeling today?
              </h2>
              <p className="mt-1.5 text-[0.9375rem] text-ink-secondary">
                Logging your mood regularly can help track your well-being.
              </p>
            </div>
            <Link
              href="/student/mood"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-(--radius-btn) bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
            >
              <SmileIcon className="h-[1.15rem] w-[1.15rem]" />
              Log My Mood
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          {upcoming ? (
            <Card tone="gold">
              <div className="flex items-center gap-2 text-gold-ink">
                <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />
                <h2 className="t-h3">Upcoming Appointment</h2>
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface/70 text-ink-secondary">
                  <UserIcon className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <p className="font-semibold text-ink">{upcoming.counsellor.name}</p>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">
                {formatDateLong(upcoming.appointmentDate)} at{" "}
                {formatTimeRange(upcoming.startTime, upcoming.endTime)}
              </p>
              <Link
                href="/student/appointments"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
              >
                View Details
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              {/* The code only exists while it can be used: from 15 min before
                  the slot until 30 min after. A QR that lives from the moment
                  you book is a long-lived credential for a one-off door. */}
              {upcoming.status === "APPROVED" &&
                (upcoming.checkedInAt ? (
                  <CheckedInNotice checkedInAt={upcoming.checkedInAt} />
                ) : isWithinCheckInWindow(upcoming) ? (
                  <CheckInCode
                    appointmentId={upcoming.id}
                    studentId={session.userId}
                    appointmentDate={upcoming.appointmentDate}
                    startTime={upcoming.startTime}
                    endTime={upcoming.endTime}
                  />
                ) : (
                  <p className="t-meta mt-3">
                    Your check-in code appears here 15 minutes before the session
                    starts.
                  </p>
                ))}
            </Card>
          ) : (
            <Card tone="gold">
              <div className="flex items-center gap-2 text-gold-ink">
                <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />
                <h2 className="t-h3">No upcoming appointment</h2>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">
                Whenever you&apos;d like to talk to someone, a counsellor is a few
                clicks away.
              </p>
              <Link
                href="/student/appointments/new"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
              >
                Book a session
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Card>
          )}

          {/* Two bold colour blocks, not two grey tiles — the icon sits in a
              rounded well, the arrow rides the top corner like the reference
              stat cards. One emerald, one honey, so the row carries colour. */}
          {/* White cards, colour in the icon well and the arrow — not the whole
              fill. Keeps the tile character without two saturated blocks. */}
          <div className="grid grid-cols-2 gap-5">
            <Link
              href="/student/appointments/new"
              className="lift group flex min-h-[9rem] flex-col justify-between rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card)"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-tint text-brand-ink">
                <UsersIcon className="h-6 w-6" />
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="text-lg font-bold leading-tight text-ink-strong">
                  Book a session
                </span>
                <ArrowRightIcon className="h-5 w-5 text-brand-ink transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href="/student/journal"
              className="lift group flex min-h-[9rem] flex-col justify-between rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card)"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-gold text-gold-ink">
                <JournalIcon className="h-6 w-6" />
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="text-lg font-bold leading-tight text-ink-strong">
                  Journal
                </span>
                <ArrowRightIcon className="h-5 w-5 text-brand-ink transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Affirmation as a quote, not a list in a box — a mint panel with an
              oversized quotation mark doing the decorating. */}
          <div className="relative overflow-hidden rounded-(--radius-card) bg-brand-tint p-5 shadow-(--shadow-card)">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-6 right-2 font-serif text-[7rem] leading-none text-brand-light/25"
            >
              &rdquo;
            </span>
            <h2 className="t-h3 relative text-brand-ink">A note for you</h2>
            <div className="relative mt-3">
              <AffirmationList
                items={affirmations.map((a) => ({
                  id: a.id,
                  message: a.message,
                  counsellorName: a.counsellor.name,
                  dateLabel: formatDate(a.createdAt),
                }))}
              />
            </div>
          </div>

          <Card>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-light" aria-hidden />
              <h2 className="t-h2">Available now</h2>
            </div>
            {counsellors.length > 0 ? (
              <ul className="mt-3 flex flex-col">
                {counsellors.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2.5 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}
                    >
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-semibold text-ink">
                        {c.name}
                      </span>
                      {c.counsellorProfile?.specialization && (
                        <span className="block truncate text-xs text-ink-muted">
                          {c.counsellorProfile.specialization}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-(--radius-pill) bg-success-tint px-2 py-0.5 text-xs font-semibold text-success-ink">
                      Open
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-body mt-2">
                No counsellors have open slots right now. Check back soon.
              </p>
            )}
            <Link
              href="/student/appointments/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
            >
              View all counsellors
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Card>

          <p className="t-meta px-1">
            Your journal and mood log are private to you. Counsellors only ever see
            what you choose to share in a session.
          </p>
        </div>
      </div>
    </div>
  );
}
