import { WordmarkMark } from "@/components/wordmark";

// Logo, welcome, subline, then the form — one centred column. The form sits on
// a white panel lifted off the dusk page rather than floating on the background
// directly: on a tinted page an unbounded form reads as unfinished, and the lit
// panel is the whole metaphor. No split brand panel.
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
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <WordmarkMark />
          <div>
            <h1 className="t-h1">{headline}</h1>
            <p className="t-body mt-1.5">{sub}</p>
          </div>
        </div>
        <div className="mt-7 rounded-(--radius-card) border border-line bg-surface p-6 shadow-(--shadow-card) sm:p-7">
          {children}
          {footer && (
            <div className="mt-6 border-t border-line pt-5 text-center">{footer}</div>
          )}
        </div>
      </div>
    </main>
  );
}
