"use client";

import { motion } from "framer-motion";
import { AlertIcon, CalendarIcon, JournalIcon, UsersIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: CalendarIcon,
    title: "Student support",
    body: "Book appointments, see approved sessions, and check in with QR or manual codes when you arrive.",
    accent: "bg-brand-tint text-brand-ink",
    tags: ["Booking", "QR check-in", "Profile"],
  },
  {
    icon: JournalIcon,
    title: "Private reflection",
    body: "Mood logs and journals stay student-owned while still helping students notice patterns over time.",
    accent: "bg-pink-tint text-red-ink",
    tags: ["Journal", "Mood trend", "Affirmations"],
  },
  {
    icon: UsersIcon,
    title: "Counsellor workflow",
    body: "Availability, walk-ins, history, session notes, and calendar sync live in one focused workspace.",
    accent: "bg-teal-tint text-teal",
    tags: ["Availability", "Notes", "Calendar"],
  },
  {
    icon: AlertIcon,
    title: "Admin oversight",
    body: "Escalations and account controls are organized without exposing private journal content.",
    accent: "bg-gold text-gold-ink",
    tags: ["Alerts", "Suspensions", "Analytics"],
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function LandingFeatures() {
  return (
    <section id="support" className="relative bg-page py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-sm font-bold uppercase tracking-normal text-brand-ink">
            One connected care flow
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink-strong sm:text-4xl">
            Built around the people who use it.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
            MindSpace keeps the student experience quiet and private, while giving
            counsellors and admins the operational clarity they need.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative overflow-hidden rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card) transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-card-hover)"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-(--radius-btn) ${f.accent}`}
              >
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink-strong">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                {f.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {f.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-(--radius-pill) border border-line bg-sunken px-2.5 py-1 text-xs font-semibold text-ink-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
