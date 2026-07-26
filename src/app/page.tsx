import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { dashboardPath } from "@/lib/session";
import { Wordmark } from "@/components/wordmark";
import { CalendarIcon, JournalIcon, SparkleIcon } from "@/components/icons";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFeatures } from "@/features/landing/LandingFeatures";
import { LandingStats } from "@/features/landing/LandingStats";
import { LandingCTA } from "@/features/landing/LandingCTA";

export default async function Home() {
  const session = await getActiveSession();
  if (session) redirect(dashboardPath(session.role));

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Wordmark />
        <Link
          href="/login"
          className="rounded-(--radius-pill) bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingFeatures />
        <LandingStats />
        <LandingCTA />
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-6 text-center sm:px-8">
        <p className="text-sm text-white/40">
          Your journal and mood log are private to you — always.
        </p>
      </footer>
    </div>
  );
}
