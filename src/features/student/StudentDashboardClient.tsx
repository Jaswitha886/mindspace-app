"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
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
/*  3-D tilt tile                                                             */
/* -------------------------------------------------------------------------- */

function TiltTile({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rotateX = useTransform(my, [0, 1], [8, -8]);
  const rotateY = useTransform(mx, [0, 1], [-8, 8]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width);
      my.set((e.clientY - r.top) / r.height);
    },
    [mx, my],
  );

  const onLeave = useCallback(() => {
    mx.set(0.5);
    my.set(0.5);
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={href} className="flex h-full min-h-[9rem] flex-col justify-between p-5">
        {children}
      </Link>
    </motion.div>
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
      className="flex flex-col gap-5"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ---- Hero greeting ---- */}
      <motion.header
        variants={fadeIn}
        className="aurora-bg rounded-(--radius-card) p-6 shadow-(--shadow-card) sm:p-8"
      >
        <p className="t-meta">{todayLabel}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Hello,{" "}
          <span className="gradient-text">{firstName}</span>
        </h1>
      </motion.header>

      {isNewUser && (
        <motion.div variants={fadeUp}>
          <OnboardingSlides role="student" />
        </motion.div>
      )}

      {/* ---- Mood card ---- */}
      <motion.div variants={fadeUp}>
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
      </motion.div>

      {/* ---- Two-column body ---- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Upcoming appointment */}
          <motion.div variants={fadeUp}>
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
                  <p className="font-semibold text-ink">
                    {upcoming.counsellorName}
                  </p>
                </div>
                <p className="mt-2 text-sm text-ink-secondary">
                  {upcoming.dateLabel} at {upcoming.timeLabel}
                </p>
                <Link
                  href="/student/appointments"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
                >
                  View Details
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                {/* Check-in block */}
                {upcoming.status === "APPROVED" &&
                  (checkInState?.kind === "checkedIn" ? (
                    <div className="mt-4 rounded-(--radius-card) bg-surface p-4">
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
                        className="shrink-0 self-center rounded-[8px] bg-white p-1 [&>svg]:block [&>svg]:h-[132px] [&>svg]:w-[132px]"
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
                    <p className="t-meta mt-3">
                      Your check-in code appears here 15 minutes before the
                      session starts.
                    </p>
                  ) : null)}
              </Card>
            ) : (
              <Card tone="gold">
                <div className="flex items-center gap-2 text-gold-ink">
                  <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />
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

          {/* Quick-action tiles — 3D tilt */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 gap-5"
          >
            <TiltTile
              href="/student/appointments/new"
              className="group rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-hover)"
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
            </TiltTile>

            <TiltTile
              href="/student/journal"
              className="group rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-hover)"
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
            </TiltTile>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Affirmation quote panel */}
          <motion.div variants={fadeUp}>
            <div className="relative overflow-hidden rounded-(--radius-card) bg-brand-tint p-5 shadow-(--shadow-card)">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 right-2 font-serif text-[7rem] leading-none text-brand-light/25"
              >
                &rdquo;
              </span>
              <h2 className="t-h3 relative text-brand-ink">A note for you</h2>
              <div className="relative mt-3">
                <AffirmationList items={affirmations} />
              </div>
            </div>
          </motion.div>

          {/* Available counsellors */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full bg-brand-light breathe"
                  aria-hidden
                />
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
                        {c.specialization && (
                          <span className="block truncate text-xs text-ink-muted">
                            {c.specialization}
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
          </motion.div>

          <motion.p variants={fadeIn} className="t-meta px-1">
            Your journal and mood log are private to you. Counsellors only ever
            see what you choose to share in a session.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
