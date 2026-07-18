import Link from "next/link";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { WordmarkMark, Wordmark } from "@/components/wordmark";
import { BottomNav, SideNav, type NavItem } from "@/components/app-nav";
import { BackButton } from "@/components/ui/back-button";
import type { SessionPayload } from "@/lib/session";

// One shell for every role — counsellor and admin wear the same chrome as the
// student, only the tabs differ. Mobile gets a slim top bar and a bottom tab
// bar; desktop turns that tab bar into a sidebar rather than stranding it at
// the bottom of a 1440px window.
export function AppShell({
  session,
  roleLabel,
  items,
  home,
  children,
}: {
  session: SessionPayload;
  roleLabel: string;
  items: NavItem[];
  home: string;
  children: React.ReactNode;
}) {
  const initial = session.name.slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <div className="px-2">
          <Wordmark href={home} />
        </div>
        <div className="mt-7 flex-1">
          <SideNav items={items} />
        </div>
        <div className="flex items-center gap-2.5 border-t border-line pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-bold text-brand-ink">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {session.name}
            </span>
            <span className="block truncate text-xs text-ink-muted">{roleLabel}</span>
          </span>
          <LogoutButton iconOnly />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 lg:hidden">
          <Link href={home} aria-label="MindSpace home">
            <WordmarkMark size="sm" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-right">
              <span className="block text-sm font-semibold leading-tight text-ink">
                {session.name}
              </span>
              <span className="block text-xs leading-tight text-ink-muted">
                {roleLabel}
              </span>
            </span>
            <LogoutButton iconOnly />
          </div>
        </header>

        {/* Back lives in the shell, not per-page, so it sits in the same place
            on every screen in every role. It renders nothing on `home` (there's
            nowhere up from the root of a role's area) or when there's no
            history behind it. */}
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8 lg:pt-7">
          <BackButton home={home} />
          {children}
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
