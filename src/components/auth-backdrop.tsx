"use client";

import { MeshGradient } from "@paper-design/shaders-react";

const colors = [
  "hsl(222, 47%, 11%)",
  "hsl(239, 84%, 67%)",
  "hsl(187, 90%, 43%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
];

export function AuthBackdrop() {
  return (
    <div className="auth-backdrop" aria-hidden>
      <MeshGradient
        className="h-full w-full"
        colors={colors}
        distortion={0.55}
        swirl={0.28}
        speed={0.12}
        grainOverlay={0.06}
      />
    </div>
  );
}
