import { WordmarkMark } from "@/components/wordmark";

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
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-12">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <WordmarkMark />
          <div>
            <h1 className="text-xl font-bold text-ink-strong">
              {headline}
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">{sub}</p>
          </div>
        </div>
        <div className="mt-7 rounded-(--radius-card) border border-line bg-surface p-6 shadow-(--shadow-pop) sm:p-8">
          {children}
          {footer && (
            <div className="mt-6 border-t border-line pt-5 text-center">{footer}</div>
          )}
        </div>
      </div>
    </main>
  );
}
