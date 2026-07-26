import { WordmarkMark } from "@/components/wordmark";
import AuroraParticles from "@/components/three/AuroraParticles";

export function AuthShell({
  headline,
  sub,
  children,
  footer,
}: {
  headline: string;
  sub: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0a1e] px-5 py-12">
      {/* Aurora background */}
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-[#6c5ce7] opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[#4ecdc4] opacity-[0.05] blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8a0bf] opacity-[0.03] blur-[80px]" />
      </div>

      <div className="absolute inset-0 z-0">
        <AuroraParticles count={16} />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <WordmarkMark />
          <div>
            <h1 className="text-xl font-bold tracking-[-0.02em] text-white">
              {headline}
            </h1>
            <p className="mt-1.5 text-sm text-white/50">{sub}</p>
          </div>
        </div>
        <div className="mt-7 rounded-(--radius-card) border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          {children}
          {footer && (
            <div className="mt-6 border-t border-white/10 pt-5 text-center">{footer}</div>
          )}
        </div>
      </div>
    </main>
  );
}
