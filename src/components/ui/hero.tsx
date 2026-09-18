"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { motion } from "framer-motion";
import { ArrowRightIcon, CalendarIcon, JournalIcon, SmileIcon } from "@/components/icons";
import { BrandLockup } from "@/components/brand-lockup";

const meshColors = [
  "hsl(222,47%,11%)",
  "hsl(239,84%,67%)",
  "hsl(187,90%,43%)",
  "hsl(160,84%,39%)",
  "hsl(38,92%,50%)",
];

const accentColors = [
  "hsl(222,47%,11%)",
  "hsl(199,89%,48%)",
  "hsl(348,83%,67%)",
  "hsl(38,92%,50%)",
];

const borderColors = [
  "hsl(187,90%,43%)",
  "hsl(239,84%,67%)",
  "hsl(160,84%,39%)",
  "hsl(38,92%,50%)",
  "hsl(0,0%,100%)",
];

const sparkles = [
  { left: "10%", top: "18%", delay: 0 },
  { left: "24%", top: "72%", delay: 0.18 },
  { left: "43%", top: "28%", delay: 0.36 },
  { left: "63%", top: "78%", delay: 0.54 },
  { left: "76%", top: "22%", delay: 0.72 },
  { left: "88%", top: "58%", delay: 0.9 },
];

const previewRows = [
  {
    icon: CalendarIcon,
    label: "Next session",
    value: "2:30 PM",
    detail: "Counsellor matched",
  },
  {
    icon: SmileIcon,
    label: "Mood check-in",
    value: "Calm",
    detail: "Private to you",
  },
  {
    icon: JournalIcon,
    label: "Journal",
    value: "Locked",
    detail: "Never shared",
  },
];

export default function ShaderShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="group relative min-h-[88svh] overflow-hidden bg-forest text-white"
    >
      <svg className="absolute inset-0 h-0 w-0" aria-hidden>
        <defs>
          <filter id="mindspace-glass" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.006" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.35" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.92 0"
              result="tint"
            />
          </filter>
          <filter id="mindspace-gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
          <filter id="mindspace-text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={meshColors}
        distortion={isActive ? 0.95 : 0.72}
        swirl={isActive ? 0.56 : 0.34}
        speed={isActive ? 0.32 : 0.18}
        grainOverlay={0.08}
        style={{ background: "var(--forest)" }}
      />
      <MeshGradient
        className="absolute inset-0 h-full w-full opacity-45 mix-blend-screen"
        colors={accentColors}
        distortion={0.58}
        swirl={0.2}
        speed={0.12}
        grainOverlay={0.04}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-forest/95 via-forest/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-forest/45" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-page to-transparent" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <BrandLockup onDark />

        <nav className="hidden items-center gap-1 rounded-(--radius-pill) border border-white/10 bg-white/5 p-1 text-sm text-white/72 backdrop-blur-md md:flex">
          <a href="#support" className="rounded-(--radius-pill) px-4 py-2 transition hover:bg-white/10 hover:text-white">
            Support
          </a>
          <a href="#flow" className="rounded-(--radius-pill) px-4 py-2 transition hover:bg-white/10 hover:text-white">
            Flow
          </a>
          <a href="#privacy" className="rounded-(--radius-pill) px-4 py-2 transition hover:bg-white/10 hover:text-white">
            Privacy
          </a>
        </nav>

        <div className="group relative flex items-center" style={{ filter: "url(#mindspace-gooey)" }}>
          <Link
            href="/login"
            aria-hidden
            tabIndex={-1}
            className="absolute right-0 z-0 grid h-9 w-9 -translate-x-9 place-items-center rounded-full bg-white text-forest transition-transform duration-300 group-hover:-translate-x-16"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="relative z-10 inline-flex h-9 items-center rounded-(--radius-pill) bg-white px-5 text-sm font-semibold text-forest transition hover:bg-white/90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 pb-14 pt-8 sm:px-8 md:pb-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pt-12">
        <div className="max-w-3xl">
          <motion.div
            className="inline-flex items-center gap-2 rounded-(--radius-pill) border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-medium text-white/82 backdrop-blur-md"
            style={{ filter: "url(#mindspace-glass)" }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Campus wellbeing, booking, and care notes
          </motion.div>

          <motion.h1
            className="mt-6 text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-8xl"
            style={{ filter: "url(#mindspace-text-glow)" }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
          >
            MindSpace
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/76 sm:text-xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
          >
            A calmer front door for student support: private journals, gentle mood
            check-ins, appointment booking, and counsellor workflows in one place.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-(--radius-btn) bg-white px-6 py-3.5 text-sm font-bold text-forest shadow-lg shadow-forest/25 transition hover:-translate-y-0.5 hover:bg-white/[0.92]"
            >
              Create account
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-(--radius-btn) border border-white/18 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/[0.13]"
            >
              Continue to portal
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-md lg:max-w-lg"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.35 }}
        >
          <div className="relative overflow-hidden rounded-(--radius-card) border border-white/12 bg-forest/44 p-5 shadow-2xl shadow-forest/30 backdrop-blur-xl">
            <PulsingBorder
              className="pointer-events-none absolute inset-0 h-full w-full"
              colors={borderColors}
              colorBack="rgba(0,0,0,0)"
              speed={isActive ? 1.35 : 0.85}
              roundness={0.08}
              thickness={0.045}
              softness={0.42}
              intensity={0.32}
              bloom={0.32}
              spots={5}
              spotSize={0.36}
              pulse={0.25}
              smoke={0.28}
              smokeSize={0.7}
              scale={1}
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-medium text-white/62">Today in MindSpace</p>
                  <p className="mt-2 text-2xl font-bold tracking-normal text-white">
                    Support that stays organized.
                  </p>
                </div>
                <span className="rounded-(--radius-pill) bg-teal/18 px-3 py-1 text-xs font-semibold text-teal">
                  Live
                </span>
              </div>

              <div className="divide-y divide-white/10">
                {previewRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-4 py-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-(--radius-btn) bg-white/10 text-white">
                      <row.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{row.label}</p>
                      <p className="mt-0.5 text-xs text-white/54">{row.detail}</p>
                    </div>
                    <p className="text-sm font-bold text-white/88">{row.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center">
                <div>
                  <p className="text-xl font-bold text-white">3</p>
                  <p className="text-[11px] font-medium text-white/50">Roles</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">1</p>
                  <p className="text-[11px] font-medium text-white/50">Private space</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">15m</p>
                  <p className="text-[11px] font-medium text-white/50">Check-in window</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        {sparkles.map((sparkle) => (
          <motion.span
            key={sparkle.left}
            className="absolute h-1 w-1 rounded-full bg-white/70"
            style={{ left: sparkle.left, top: sparkle.top }}
            animate={{ y: [-8, -18, -8], opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{
              duration: 2.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: sparkle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="absolute bottom-6 right-6 z-20 hidden md:block">
        <div className="relative grid h-20 w-20 place-items-center">
          <PulsingBorder
            colors={borderColors}
            colorBack="rgba(0,0,0,0)"
            speed={1.15}
            roundness={1}
            thickness={0.08}
            softness={0.3}
            intensity={0.5}
            bloom={0.35}
            spots={5}
            spotSize={0.16}
            pulse={0.18}
            smoke={0.38}
            smokeSize={1.4}
            scale={0.68}
            aspectRatio="square"
            style={{ width: 64, height: 64, borderRadius: "50%" }}
          />
          <motion.svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <defs>
              <path id="mindspace-circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text className="fill-white/76 text-[10px] font-semibold uppercase tracking-normal">
              <textPath href="#mindspace-circle" startOffset="0%">
                Private care - booking - journal - mood - 
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>
    </section>
  );
}
