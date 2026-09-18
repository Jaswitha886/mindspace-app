import Link from "next/link";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { WordmarkMark, Wordmark } from "@/components/wordmark";
import { BottomNav, SideNav, type NavItem } from "@/components/app-nav";
import { BackButton } from "@/components/ui/back-button";
import { AppAssistant } from "@/features/assistant/AppAssistant";
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
      {/* Desktop sidebar — unified design for all roles */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <div className="px-2">
          <Wordmark href={home} />
        </div>
        <div className="mt-8 flex-1">
          <SideNav items={items} />
        </div>
        <div className="flex items-center gap-3 border-t border-sidebar-border pt-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sidebar-active text-sm font-bold text-sidebar-active-text">
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
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
          <Link href={home} aria-label="MindSpace home">
            <WordmarkMark size="sm" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-right">
              <span className="block text-sm font-semibold leading-tight text-sidebar-text">
                {session.name}
              </span>
              <span className="block text-xs leading-tight text-sidebar-muted">
                {roleLabel}
              </span>
            </span>
            <LogoutButton iconOnly />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 bg-page px-4 pb-24 pt-5 sm:px-6 lg:pb-8 lg:pt-7">
          <BackButton home={home} />
          {children}
        </main>
      </div>

      <BottomNav items={items} />
      <AppAssistant session={session} />
    </div>
  );
}
