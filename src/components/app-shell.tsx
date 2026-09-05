import Link from "next/link";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { WordmarkMark, Wordmark } from "@/components/wordmark";
import { BottomNav, SideNav, type NavItem } from "@/components/app-nav";
import { BackButton } from "@/components/ui/back-button";
import type { SessionPayload } from "@/lib/session";

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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-sidebar px-4 py-5 lg:flex">
        <div className="px-2">
          <Wordmark href={home} />
        </div>
        <div className="mt-8 flex-1">
          <SideNav items={items} />
        </div>
        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-text">
              {session.name}
            </span>
            <span className="block truncate text-xs text-sidebar-muted">{roleLabel}</span>
          </span>
          <LogoutButton iconOnly />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={home} aria-label="MindSpace home" className="lg:hidden">
              <WordmarkMark size="sm" />
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">Workspace</p>
              <p className="text-sm font-semibold text-ink">{roleLabel} dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink">{session.name}</span>
              <span className="block text-xs leading-tight text-ink-muted">{roleLabel}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-tint text-sm font-bold text-brand-ink lg:hidden">
              {initial}
            </span>
            <LogoutButton iconOnly />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <BackButton home={home} />
          {children}
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
