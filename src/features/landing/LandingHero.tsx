"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";

const AuroraScene = dynamic(
  () => import("@/components/three/AuroraScene"),
  { ssr: false }
);

export function LandingHero() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-[#0f0a1e]">
      {/* Gradient overlays */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#6c5ce710] via-transparent to-[#0f0a1e]" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#6c5ce7] opacity-[0.07] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#4ecdc4] opacity-[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8a0bf] opacity-[0.04] blur-[100px]" />
      </div>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <AuroraScene className="h-full w-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-(--radius-pill) border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/60 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ecdc4]" />
            Campus counselling &amp; wellbeing
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl"
        >
          A quieter way to{" "}
          <span className="gradient-text">look after yourself</span>{" "}
          at college.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/50"
        >
          Talk to a counsellor when you want to, keep a private journal, and check
          in with yourself — at your own pace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/register"
            className="btn-aurora inline-flex items-center gap-2 rounded-(--radius-btn) px-7 py-3.5 text-sm font-semibold shadow-lg shadow-[#6c5ce730] transition-all hover:shadow-xl hover:shadow-[#6c5ce740]"
          >
            Get started
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-(--radius-btn) border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
          >
            Sign in
          </Link>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0a1e] to-transparent" />
    </section>
  );
}
