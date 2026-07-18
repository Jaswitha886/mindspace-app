import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { getStudentDashboardData } from "@/features/student/dashboard-data";
import { Card, ActionTile } from "@/components/ui/card";
import { AffirmationList } from "@/features/student/AffirmationCard";
import {
  ArrowRightIcon,
  CalendarIcon,
  JournalIcon,
  SmileIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { MOOD_COLOR, MOOD_EMOJI, MOOD_LABEL } from "@/features/moods/mood-meta";
import { CheckInCode, CheckedInNotice } from "@/features/checkin/CheckInCode";
import { isWithinCheckInWindow } from "@/features/checkin/checkin";
import { formatDate, formatDateLong, formatTimeRange } from "@/lib/format";

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

      {/* The focal card. Everything else on this page is a supporting act — the
          one thing we want a student to do daily gets full width and the only
          filled button above the fold. */}
      <Card tone="plum" className="sm:p-7">
        {todaysMood ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl shadow-(--shadow-btn)"
                style={{ backgroundColor: MOOD_COLOR[todaysMood] }}
              >
                <span aria-hidden>{MOOD_EMOJI[todaysMood]}</span>
              </span>
              <div>
                <h2 className="t-h2">Today&apos;s mood is logged</h2>
                <p className="t-body mt-0.5">
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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h2 className="t-h1">How are you feeling today?</h2>
              <p className="t-body mt-1.5">
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
      </Card>

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

          <div className="grid grid-cols-2 gap-5">
            <Link href="/student/appointments/new" className="lift rounded-(--radius-card)">
              <ActionTile
                icon={<UsersIcon className="h-6 w-6" />}
                label="Book Session"
                className="h-full"
              />
            </Link>
            <Link href="/student/journal" className="lift rounded-(--radius-card)">
              <ActionTile
                icon={<JournalIcon className="h-6 w-6" />}
                label="Journaling"
                className="h-full"
              />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="t-h2 text-brand-ink">Affirmation</h2>
            <div className="mt-3">
              <AffirmationList
                items={affirmations.map((a) => ({
                  id: a.id,
                  message: a.message,
                  counsellorName: a.counsellor.name,
                  dateLabel: formatDate(a.createdAt),
                }))}
              />
            </div>
          </Card>

          <Card>
            <h2 className="t-h2">Counsellors Available Now</h2>
            {counsellors.length > 0 ? (
              <ul className="mt-3 flex flex-col">
                {counsellors.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2.5 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                      <UserIcon className="h-[1.15rem] w-[1.15rem]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-semibold text-ink">
                        {c.name}
                      </span>
                      {c.counsellorProfile?.specialization && (
                        <span className="block truncate text-xs text-ink-muted">
                          {c.counsellorProfile.specialization}
                        </span>
                      )}
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
              View All Counsellors
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
