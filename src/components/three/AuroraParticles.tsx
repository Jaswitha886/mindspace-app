"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

export default function AuroraParticles({
  count = 24,
  className = "",
  colors = ["#6c5ce7", "#4ecdc4", "#e8a0bf", "#a29bfe"],
}: {
  count?: number;
  className?: string;
  colors?: string[];
}) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: ((i * 47 + count * 13) % 97) + 1,
      y: ((i * 71 + count * 7) % 97) + 1,
      size: ((i * 19 + count) % 4) + 2,
      delay: ((i * 29 + count) % 5),
      duration: ((i * 37 + count) % 8) + 6,
      color: colors[(i * 3 + count) % colors.length],
    }));
  }, [count, colors]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, -10, 0],
            opacity: [0, 0.6, 0.4, 0.6, 0],
            scale: [0.8, 1.2, 0.9, 1.1, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
