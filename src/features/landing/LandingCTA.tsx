"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";

export function LandingCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0f0a1e] py-24">
      {/* Aurora glow background */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6c5ce7] opacity-[0.08] blur-[150px]" />
        <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-[#4ecdc4] opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 h-[300px] w-[300px] rounded-full bg-[#e8a0bf] opacity-[0.04] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-2xl px-5 text-center sm:px-8"
      >
        <h2 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
          Your wellbeing matters.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/50">
          Start your journey with MindSpace today. It&apos;s private, free, and designed
          for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="btn-aurora inline-flex items-center gap-2 rounded-(--radius-btn) px-8 py-4 text-sm font-semibold shadow-lg shadow-[#6c5ce730] transition-all hover:shadow-xl hover:shadow-[#6c5ce740]"
          >
            Create your account
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
