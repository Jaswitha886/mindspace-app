import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { dashboardPath } from "@/lib/session";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFeatures } from "@/features/landing/LandingFeatures";
import { LandingStats } from "@/features/landing/LandingStats";
import { LandingCTA } from "@/features/landing/LandingCTA";

export default async function Home() {
  const session = await getActiveSession();
  if (session) redirect(dashboardPath(session.role));

  return (
    <div className="landing-page flex min-h-screen flex-col overflow-hidden bg-page">
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingFeatures />
        <LandingStats />
        <LandingCTA />
      </main>

      <footer className="relative z-10 border-t border-on-dark-faint px-5 py-6 text-center sm:px-8">
        <p className="text-sm text-on-dark-subtle">
          Your journal and mood log are private to you - always.
        </p>
      </footer>
    </div>
  );
}
