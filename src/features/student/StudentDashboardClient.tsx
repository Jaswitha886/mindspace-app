"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AffirmationList } from "@/features/student/AffirmationCard";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  JournalIcon,
  SmileIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import {
  MOOD_COLOR,
  MOOD_FACE_INK,
  MOOD_LABEL,
} from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";
import { OnboardingSlides } from "@/features/student/OnboardingSlides";
import type { Mood } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type CheckInReady = {
  kind: "ready";
  svg: string;
  code: string;
  appointmentId: string;
  studentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
};

export type CheckInState =
  | { kind: "checkedIn"; checkedInAt: string }
  | CheckInReady
  | { kind: "waiting" }
  | null;

export type UpcomingData = {
  id: string;
  counsellorName: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  checkedInAt: string | null;
};

export type AffirmationData = {
  id: string;
  message: string;
  counsellorName: string;
  dateLabel: string;
};

export type CounsellorData = {
  id: string;
  name: string;
  specialization: string | null;
};

export type StudentDashboardClientProps = {
  firstName: string;
  todayLabel: string;
  isNewUser: boolean;
  todaysMood: Mood | null;
  upcoming: UpcomingData | null;
  checkInState: CheckInState;
  affirmations: AffirmationData[];
  counsellors: CounsellorData[];
};

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Botanical leaf SVG                                                        */
/* -------------------------------------------------------------------------- */

function BotanicalSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M177 178C172 132 158 91 111 36"
        stroke="currentColor"
        className="text-ink-muted/30"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M145 105c-22 0-34-13-38-31 20 1 34 11 38 31Z" fill="currentColor" className="text-brand-light/30" />
      <path d="M129 83c-20-5-29-18-27-35 18 4 28 16 27 35Z" fill="currentColor" className="text-brand-light/50" />
      <path d="M158 132c19-4 29-16 29-32-18 4-27 15-29 32Z" fill="currentColor" className="text-brand-light/25" />
      <path d="M148 111c18 0 31-9 36-24-18-2-31 6-36 24Z" fill="currentColor" className="text-brand-light/45" />
      <path d="M117 59c-14-7-20-18-17-31 14 4 21 14 17 31Z" fill="currentColor" className="text-brand-light/30" />
      <path d="M165 91c14-3 23-12 24-25-14 2-23 10-24 25Z" fill="currentColor" className="text-brand-light/50" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar tints                                                              */
/* -------------------------------------------------------------------------- */

const AVATAR_TINTS = [
  "bg-brand-tint text-brand-ink",
  "bg-gold text-gold-ink",
  "bg-teal-tint text-teal",
];

function initials(name: string): string {
  return name
    .replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* -------------------------------------------------------------------------- */
/*  Lock icon for privacy message                                             */
/* -------------------------------------------------------------------------- */

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="5" y="11" width="14" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function StudentDashboardClient({
  firstName,
  todayLabel,
  isNewUser,
  todaysMood,
  upcoming,
  checkInState,
  affirmations,
  counsellors,
}: StudentDashboardClientProps) {
  return (
    <motion.div
      className="student-dashboard flex flex-col gap-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ── Hero greeting ──────────────────────────────────────────────── */}
      <motion.header
        variants={fadeIn}
        className="student-hero relative min-h-[180px] overflow-hidden rounded-[22px] px-6 py-7 sm:min-h-[196px] sm:px-8 sm:py-8"
      >
        <div className="relative z-10 max-w-[700px]">
          <p className="text-sm text-ink-secondary">{todayLabel}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-ink-strong sm:text-5xl">
            Hello,{" "}
            <span className="text-brand">{firstName}</span>
          </h1>
          <p className="mt-3 max-w-[620px] text-base leading-relaxed text-ink-secondary sm:text-lg">
            A healthier mind leads to a brighter you. Take a moment for yourself today.
          </p>
        </div>
        {/* Quote on right */}
        <div className="absolute right-8 top-8 z-10 hidden max-w-[200px] text-right sm:block">
          <p className="text-sm italic leading-relaxed text-ink-muted">
            &ldquo;Small steps make big changes.&rdquo;
          </p>
        </div>
        <BotanicalSprig className="student-leaf absolute -right-2 top-0 h-[175px] w-[210px] opacity-80 sm:right-6 sm:top-0 sm:h-[220px] sm:w-[270px]" />
      </motion.header>

      {isNewUser && (
        <motion.div variants={fadeUp}>
          <OnboardingSlides role="student" />
        </motion.div>
      )}

      {/* ── Mood card ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="relative z-20">
        <div className="student-mood-card relative overflow-hidden rounded-[18px] p-6 sm:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-light/[0.14]"
          />
          {todaysMood ? (
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full shadow-(--shadow-btn)"
                  style={{
                    backgroundColor: MOOD_COLOR[todaysMood],
                    color: MOOD_FACE_INK,
                  }}
                >
                  <MoodFace mood={todaysMood} className="h-8 w-8" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink-strong">
                    Today&apos;s mood is logged
                  </h2>
                  <p className="mt-0.5 text-[0.9375rem] text-ink-secondary">
                    You noted you felt{" "}
                    <span className="font-semibold text-ink">
                      {MOOD_LABEL[todaysMood]}
                    </span>
                    .
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
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-tint">
                  <SmileIcon className="h-7 w-7 text-brand-ink" />
                </span>
                <div className="max-w-md">
                  <h2 className="text-xl font-bold tracking-[-0.02em] text-ink-strong">
                    How are you feeling today?
                  </h2>
                  <p className="mt-1 text-[0.9375rem] text-ink-secondary">
                    Logging your mood regularly can help track your well-being.
                  </p>
                </div>
              </div>
              <Link
                href="/student/mood"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
              >
                <SmileIcon className="h-[1.15rem] w-[1.15rem]" />
                Log My Mood
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Two-column body ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.08fr_1fr] lg:items-stretch">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Upcoming appointment */}
          <motion.div variants={fadeUp}>
            {upcoming ? (
              <Card className="student-dashboard-card relative min-h-[250px] overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-brand-ink" />
                    <h2 className="t-h3">Upcoming Appointment</h2>
                  </div>
                  <Link
                    href="/student/appointments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
                  >
                    View Details <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {upcoming.counsellorName}
                    </p>
                    <div className="mt-1.5 flex items-center gap-4 text-sm text-ink-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {upcoming.dateLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {upcoming.timeLabel}
                    </div>
                  </div>
                  {/* Status badge */}
                  <span className="shrink-0 rounded-(--radius-pill) bg-brand-tint px-3 py-1 text-xs font-semibold text-brand-ink">
                    {upcoming.status === "APPROVED" ? "Upcoming" : upcoming.status === "PENDING" ? "Pending" : upcoming.status}
                  </span>
                </div>

                {/* Check-in block */}
                {upcoming.status === "APPROVED" &&
                  (checkInState?.kind === "checkedIn" ? (
                    <div className="mt-4 rounded-(--radius-card) bg-sunken p-4">
                      <p className="text-[0.9375rem] font-semibold text-success-ink">
                        Checked in at{" "}
                        {new Date(checkInState.checkedInAt).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "UTC",
                          },
                        )}
                      </p>
                      <p className="t-meta mt-1">
                        Your counsellor scanned your code.
                      </p>
                    </div>
                  ) : checkInState?.kind === "ready" ? (
                    <div className="mt-4 flex flex-col gap-4 rounded-(--radius-card) bg-surface p-4 sm:flex-row sm:items-center">
                      <div
                        className="shrink-0 self-center rounded-[8px] bg-qr-bg p-1 [&>svg]:block [&>svg]:h-[132px] [&>svg]:w-[132px]"
                        dangerouslySetInnerHTML={{ __html: checkInState.svg }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <h3 className="t-h3">Check in to your session</h3>
                        <p className="t-meta mt-1">
                          Show this to your counsellor when you arrive.
                        </p>
                        <p className="mt-3 font-mono text-xl font-semibold tracking-[0.12em] text-ink-strong">
                          {checkInState.code}
                        </p>
                        <p className="t-meta mt-1">
                          Can&apos;t scan? Read this code out instead.
                        </p>
                        <span className="sr-only">
                          Your check-in code is{" "}
                          {checkInState.code.split("").join(" ")}. Show the QR
                          code on screen to your counsellor, or read this code
                          aloud.
                        </span>
                      </div>
                    </div>
                  ) : checkInState?.kind === "waiting" ? (
                    <div className="mt-4 flex items-center gap-2 rounded-(--radius-card) bg-sunken px-4 py-3 text-sm text-ink-secondary">
                      <span className="text-brand-ink">&#9432;</span>
                      Your check-in code appears here 15 minutes before the session starts.
                    </div>
                  ) : null)}
              </Card>
            ) : (
              <Card className="student-dashboard-card min-h-[250px]">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-brand-ink" />
                  <h2 className="t-h3">No upcoming appointment</h2>
                </div>
                <p className="mt-2 text-sm text-ink-secondary">
                  Whenever you&apos;d like to talk to someone, a counsellor is
                  a few clicks away.
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
          </motion.div>

          {/* Quick-action tiles */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            <Link
              href="/student/appointments/new"
              className="student-action-card student-action-card-blue group flex min-h-[190px] flex-col justify-between rounded-[16px] p-6 transition-shadow hover:shadow-(--shadow-card-hover)"
            >
              <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-brand-tint text-brand-ink">
                <UsersIcon className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xl font-bold leading-tight text-ink-strong">
                  Book a session
                </span>
                <span className="mt-1 block text-sm text-ink-secondary">
                  Connect with a counsellor
                </span>
              </div>
              <ArrowRightIcon className="absolute bottom-6 right-6 h-5 w-5 text-brand-ink transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/student/journal"
              className="student-action-card student-action-card-sky group flex min-h-[190px] flex-col justify-between rounded-[16px] p-6 transition-shadow hover:shadow-(--shadow-card-hover)"
            >
              <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-teal-tint text-teal">
                <JournalIcon className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xl font-bold leading-tight text-ink-strong">
                  Journal
                </span>
                <span className="mt-1 block text-sm text-ink-secondary">
                  Write, reflect, and grow
                </span>
              </div>
              <ArrowRightIcon className="absolute bottom-6 right-6 h-5 w-5 text-teal transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Affirmation / note panel */}
          <motion.div variants={fadeUp}>
            <div className="student-dashboard-card relative min-h-[250px] overflow-hidden rounded-[16px] p-5">
              <div className="flex items-center justify-between">
                <h2 className="t-h3 text-ink-strong">A note for you</h2>
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-light" aria-hidden fill="currentColor">
                  <path d="M10 8c-1.1 0-2 .9-2 2v4h4v-4H8c0-1.1.9-2 2-2zm6 0c1.1 0 2 .9 2 2v4h-4v-4h4c0-1.1-.9-2-2-2z" opacity="0.5" />
                  <path d="M4.5 8C3.12 8 2 9.12 2 10.5v3C2 14.88 3.12 16 4.5 16H6v-1.5H4.5c-.28 0-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5H6V9H4.5zM19.5 8C18.12 8 17 9.12 17 10.5v3c0 1.38 1.12 2.5 2.5 2.5H21v-1.5h-1.5c-.28 0-.5-.22-.5-.5v-3c0-.28.22-.5.5-.5H21V9h-1.5z" />
                </svg>
              </div>
              <div className="relative mt-3">
                <AffirmationList items={affirmations} />
              </div>
            </div>
          </motion.div>

          {/* Available counsellors */}
          <motion.div variants={fadeUp}>
            <Card className="student-dashboard-card min-h-[250px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full bg-success breathe"
                  aria-hidden
                />
                <h2 className="t-h2">Available now</h2>
              </div>
              {counsellors.length > 0 ? (
                <ul className="mt-4 flex flex-col">
                  {counsellors.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
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
                        {c.specialization && (
                          <span className="block truncate text-xs text-ink-muted">
                            {c.specialization}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 rounded-(--radius-pill) bg-success-tint px-2.5 py-0.5 text-xs font-semibold text-success-ink">
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
          </motion.div>

          {/* Privacy message */}
          <motion.div variants={fadeIn} className="flex items-start gap-2.5 px-1">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            <p className="text-xs leading-relaxed text-ink-muted">
              Your journal and mood log are private to you. Counsellors only ever
              see what you choose to share in a session.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
