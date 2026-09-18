import { WordmarkMark } from "@/components/wordmark";
import { Card } from "@/components/ui/card";
import { AuthBackdrop } from "@/components/auth-backdrop";

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
    <main className="auth-page relative flex min-h-svh items-center justify-center overflow-hidden px-5 py-12">
      <AuthBackdrop />
      <div className="relative z-10 w-full max-w-[460px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <WordmarkMark />
          <div>
            <h1 className="text-xl font-bold text-ink-strong">
              {headline}
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">{sub}</p>
          </div>
        </div>
        <Card
          padding="none"
          className="auth-form-card mt-7 p-6 sm:p-7"
        >
          {children}
          {footer && (
            <div className="mt-6 border-t border-line pt-5 text-center">{footer}</div>
          )}
        </Card>
      </div>
    </main>
  );
}
