"use client";

import { motion } from "framer-motion";
import { CalendarIcon, JournalIcon, SparkleIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: CalendarIcon,
    title: "Talk to a counsellor",
    body: "Book a session in a few small steps, at a time that suits you. Choose who you'd like to talk to.",
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
  },
  {
    icon: JournalIcon,
    title: "A private journal",
    body: "Write freely. Your entries are yours alone — never shared with anyone.",
    gradient: "from-[#e8a0bf] to-[#f0c4d8]",
  },
  {
    icon: SparkleIcon,
    title: "Gentle check-ins",
    body: "Note how a day felt in five seconds. No streaks, no pressure — just a quiet record.",
    gradient: "from-[#4ecdc4] to-[#6ee0d8]",
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
    <section className="relative bg-[#0f0a1e] py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
            Built for your wellbeing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/50">
            Three simple tools, designed to feel safe and private.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative overflow-hidden rounded-(--radius-card) border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
            >
              {/* Gradient glow on hover */}
              <div
                className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.gradient} opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-20`}
              />
              <span
                className={`relative grid h-12 w-12 place-items-center rounded-(--radius-btn) bg-gradient-to-br ${f.gradient}`}
              >
                <f.icon className="h-6 w-6 text-white" />
              </span>
              <h3 className="relative mt-4 text-lg font-bold text-white">
                {f.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/50">
                {f.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
