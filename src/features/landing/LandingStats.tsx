"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function AnimatedNumber({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 500, suffix: "+", label: "Students supported" },
  { value: 50, suffix: "+", label: "Counsellors" },
  { value: 1200, suffix: "+", label: "Sessions completed" },
  { value: 98, suffix: "%", label: "Privacy guaranteed" },
];

export function LandingStats() {
  return (
    <section className="relative bg-[#0f0a1e] py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="gradient-text text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
