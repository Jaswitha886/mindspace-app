"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  JournalIcon,
  SmileIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  SparkleIcon,
  ClipboardIcon,
  ChartIcon,
} from "@/components/icons";
import AuroraParticles from "@/components/three/AuroraParticles";

const DISMISS_KEY = "mindspace-onboarding-done";

const STUDENT_SLIDES = [
  {
    icon: SparkleIcon,
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
    title: "Welcome to MindSpace",
    body: "A calm corner of the internet, just for you. Let us show you around.",
    href: null,
    cta: "Continue",
  },
  {
    icon: SmileIcon,
    gradient: "from-[#4ecdc4] to-[#6ee0d8]",
    title: "Track your mood",
    body: "Log how you're feeling in five seconds. No streaks, no pressure — just a quiet record of your days.",
    href: "/student/mood",
    cta: "Try mood tracking",
  },
  {
    icon: JournalIcon,
    gradient: "from-[#e8a0bf] to-[#f0c4d8]",
    title: "Write freely",
    body: "A private journal that belongs to you alone. Nobody else can read it — not your counsellor, not anyone.",
    href: "/student/journal",
    cta: "Start writing",
  },
  {
    icon: UsersIcon,
    gradient: "from-[#6c5ce7] to-[#4ecdc4]",
    title: "Talk to someone",
    body: "Book a session with a counsellor in a few small steps. Choose who, pick a time, and you're set.",
    href: "/student/appointments/new",
    cta: "Book a session",
  },
  {
    icon: CheckCircleIcon,
    gradient: "from-[#4ecdc4] to-[#a29bfe]",
    title: "You're all set",
    body: "That's the whole app. Come back whenever you need it — we'll be here.",
    href: null,
    cta: "Get started",
  },
];

const COUNSELLOR_SLIDES = [
  {
    icon: SparkleIcon,
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
    title: "Welcome to MindSpace",
    body: "Your dedicated space for managing sessions, tracking student wellbeing, and making a difference.",
    href: null,
    cta: "Continue",
  },
  {
    icon: CalendarIcon,
    gradient: "from-[#4ecdc4] to-[#6ee0d8]",
    title: "Your schedule",
    body: "See your confirmed sessions at a glance. Check students in with a QR scan or a quick search.",
    href: "/counsellor/schedule",
    cta: "View schedule",
  },
  {
    icon: ClipboardIcon,
    gradient: "from-[#e8a0bf] to-[#f0c4d8]",
    title: "Session notes",
    body: "Record observations and severity after each session. Critical cases are automatically escalated.",
    href: "/counsellor",
    cta: "Go to dashboard",
  },
  {
    icon: CheckCircleIcon,
    gradient: "from-[#4ecdc4] to-[#a29bfe]",
    title: "You're ready",
    body: "You're all set to start helping. We're glad you're here.",
    href: null,
    cta: "Get started",
  },
];

const ADMIN_SLIDES = [
  {
    icon: SparkleIcon,
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
    title: "Welcome to MindSpace Analytics",
    body: "Your command centre for campus-wide mental health insights and escalation management.",
    href: null,
    cta: "Continue",
  },
  {
    icon: ChartIcon,
    gradient: "from-[#4ecdc4] to-[#6ee0d8]",
    title: "Analytics dashboard",
    body: "Track session volume, severity trends, and counsellor load across departments with powerful filters.",
    href: "/admin",
    cta: "View analytics",
  },
  {
    icon: UsersIcon,
    gradient: "from-[#e8a0bf] to-[#f0c4d8]",
    title: "Escalation alerts",
    body: "Critical severity sessions are flagged immediately. Review and act on escalations in real time.",
    href: "/admin/notifications",
    cta: "See alerts",
  },
  {
    icon: CheckCircleIcon,
    gradient: "from-[#4ecdc4] to-[#a29bfe]",
    title: "You're in control",
    body: "Everything is ready. The wellbeing of your campus starts here.",
    href: null,
    cta: "Get started",
  },
];

const ROLE_CONFIG = {
  student: { slides: STUDENT_SLIDES, dismissKey: DISMISS_KEY, label: "Welcome to MindSpace" },
  counsellor: { slides: COUNSELLOR_SLIDES, dismissKey: "mindspace-onboarding-counsellor-done", label: "Welcome, Counsellor" },
  admin: { slides: ADMIN_SLIDES, dismissKey: "mindspace-onboarding-admin-done", label: "Welcome, Admin" },
} as const;

type Role = keyof typeof ROLE_CONFIG;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
    transition: {
      x: { type: "spring" as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

const iconBounce = {
  initial: { scale: 0, rotate: -20 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 15, delay: 0.15 },
  },
};

export function OnboardingSlides({ role = "student" }: { role?: Role }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const config = ROLE_CONFIG[role];

  useEffect(() => {
    try {
      if (!localStorage.getItem(config.dismissKey)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [config.dismissKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(config.dismissKey, "1");
    } catch {}
    setShow(false);
  }, [config.dismissKey]);

  const next = useCallback(() => {
    if (step < config.slides.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  }, [step, config.slides.length]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }, [step]);

  if (!show) return null;

  const slide = config.slides[step];
  const isFirst = step === 0;
  const isLast = step === config.slides.length - 1;
  const Icon = slide.icon;
  const progress = ((step + 1) / config.slides.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={config.label}
    >
      {/* Animated aurora background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(135deg, 
            ${step === 0 ? "#6c5ce720" : step === 1 ? "#4ecdc420" : step === 2 ? "#e8a0bf20" : step === 3 ? "#6c5ce720" : "#4ecdc420"} 0%, 
            ${step === 0 ? "#0f0a1e" : step === 1 ? "#0f0a1e" : step === 2 ? "#0f0a1e" : step === 3 ? "#0f0a1e" : "#0f0a1e"} 50%, 
            ${step === 0 ? "#4ecdc410" : step === 1 ? "#6c5ce710" : step === 2 ? "#a29bfe10" : step === 3 ? "#e8a0bf10" : "#6c5ce710"} 100%)`,
        }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-0 bg-[#0f0a1e]/90 backdrop-blur-sm" />

      {/* Floating particles */}
      <AuroraParticles count={20} />

      {/* Content */}
      <div className="relative z-10 mx-4 w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #6c5ce7, #4ecdc4)",
              }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-xs font-medium text-white/40">
              {step + 1} of {config.slides.length}
            </span>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-medium text-white/40 transition-colors hover:text-white/70"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            {/* Animated icon */}
            <motion.div
              variants={iconBounce}
              initial="initial"
              animate="animate"
              className={`grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br ${slide.gradient} shadow-lg`}
            >
              <Icon className="h-12 w-12 text-white" />
            </motion.div>

            {/* Title with stagger */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-8 text-2xl font-bold tracking-[-0.03em] text-white"
            >
              {slide.title}
            </motion.h2>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-3 max-w-sm text-base leading-relaxed text-white/60"
            >
              {slide.body}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col gap-3"
        >
          {slide.href ? (
            <Link
              href={slide.href}
              onClick={dismiss}
              className="btn-aurora inline-flex items-center justify-center gap-2 rounded-(--radius-btn) px-6 py-3.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:shadow-[#6c5ce720]"
            >
              {slide.cta}
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          ) : isLast ? (
            <button
              type="button"
              onClick={dismiss}
              className="btn-aurora inline-flex items-center justify-center gap-2 rounded-(--radius-btn) px-6 py-3.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:shadow-[#6c5ce720]"
            >
              {slide.cta}
              <CheckCircleIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="btn-aurora inline-flex items-center justify-center gap-2 rounded-(--radius-btn) px-6 py-3.5 text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:shadow-[#6c5ce720]"
            >
              {slide.cta}
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          )}

          {/* Back button */}
          {!isFirst && (
            <button
              type="button"
              onClick={prev}
              className="inline-flex items-center justify-center gap-1.5 rounded-(--radius-btn) px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
