"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";

export function LandingCTA() {
  return (
    <section id="privacy" className="relative overflow-hidden bg-page px-5 py-20 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-(--radius-card) bg-forest px-6 py-8 text-left shadow-2xl shadow-brand/10 sm:px-8 lg:flex-row lg:items-center"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-teal">
            Privacy-first by default
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-white sm:text-4xl">
            Start with a quiet, protected space.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/66">
            Students can write, check in, and ask for support without turning
            every personal detail into an admin report.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-(--radius-btn) bg-white px-6 py-3.5 text-sm font-bold text-forest transition hover:bg-white/90"
          >
            Create account
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-(--radius-btn) border border-white/12 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
