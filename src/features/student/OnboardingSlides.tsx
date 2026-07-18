"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarIcon,
  JournalIcon,
  SmileIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@/components/icons";

const DISMISS_KEY = "mindspace-onboarding-done";

const SLIDES = [
  {
    icon: UsersIcon,
    iconBg: "bg-brand-tint text-brand-ink",
    title: "Talk to a counsellor",
    body: "Book a session in a few small steps. Choose a counsellor, pick a time, and you're set.",
    href: "/student/appointments/new",
    cta: "Book your first session",
  },
  {
    icon: SmileIcon,
    iconBg: "bg-gold text-gold-ink",
    title: "Check in with yourself",
    body: "Log how you're feeling in five seconds. No streaks, no pressure — just a quiet record.",
    href: "/student/mood",
    cta: "Log your first mood",
  },
  {
    icon: JournalIcon,
    iconBg: "bg-teal text-ink-strong",
    title: "Write freely",
    body: "A private journal that belongs to you alone. Nobody else can read it — not your counsellor, not anyone.",
    href: "/student/journal",
    cta: "Start writing",
  },
  {
    icon: CalendarIcon,
    iconBg: "bg-brand-tint text-brand-ink",
    title: "You're all set",
    body: "That's the whole app. Come back whenever you need it — we'll be here.",
    href: null,
    cta: "Get started",
  },
];

export function OnboardingSlides() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setShow(false);
  }, []);

  if (!show) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-page/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to MindSpace"
    >
      <div className="mx-4 w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-(--radius-card) border border-line bg-surface p-8 shadow-(--shadow-pop)">
          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === step
                    ? "w-6 bg-brand"
                    : i < step
                      ? "w-2 bg-brand-light"
                      : "w-2 bg-sunken"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            <span
              className={`grid h-16 w-16 place-items-center rounded-full ${slide.iconBg}`}
            >
              <Icon className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-[-0.02em] text-ink-strong">
              {slide.title}
            </h2>
            <p className="mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-ink-secondary">
              {slide.body}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-3">
            {slide.href ? (
              <Link
                href={slide.href}
                onClick={dismiss}
                className="inline-flex items-center justify-center gap-2 rounded-(--radius-btn) bg-brand px-5 py-3 text-sm font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
              >
                {slide.cta}
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center justify-center gap-2 rounded-(--radius-btn) bg-brand px-5 py-3 text-sm font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
              >
                {slide.cta}
              </button>
            )}

            {!isLast ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-(--radius-pill) px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-(--radius-pill) px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
