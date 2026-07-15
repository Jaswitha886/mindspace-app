import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { dashboardPath } from "@/lib/session";
import { Wordmark } from "@/components/wordmark";
import { CalendarIcon, JournalIcon, SparkleIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: CalendarIcon,
    title: "Talk to a counsellor",
    body: "Book a session in a few small steps, at a time that suits you.",
  },
  {
    icon: JournalIcon,
    title: "A private journal",
    body: "Write freely. Your entries are yours alone — never shared.",
  },
  {
    icon: SparkleIcon,
    title: "Gentle check-ins",
    body: "Note how a day felt in five seconds. No streaks, no pressure.",
  },
];

export default async function Home() {
  // Authoritative, not the token's copy: an admin may have changed this
  // person's role since their cookie was signed.
  const session = await getActiveSession();
  if (session) redirect(dashboardPath(session.role));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-5 py-3.5 sm:px-8">
        <Wordmark />
        <Link
          href="/login"
          className="text-sm font-semibold text-brand-ink hover:underline"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="bg-brand-tint px-5 py-16 text-center sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl">
            <h1 className="t-display">
              A quieter way to look after yourself at college.
            </h1>
            <p className="t-body mx-auto mt-4 max-w-lg text-base">
              Talk to a counsellor when you want to, keep a private journal, and check
              in with yourself — at your own pace.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-(--radius-btn) bg-brand px-6 py-3 font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-(--radius-btn) border border-line-strong bg-surface px-6 py-3 font-semibold text-ink transition-colors hover:bg-sunken-2"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-5 py-14 sm:grid-cols-3 sm:px-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card)"
            >
              <span className="grid h-11 w-11 place-items-center rounded-(--radius-btn) bg-brand-tint text-brand-ink">
                <f.icon className="h-5 w-5" />
              </span>
              <h2 className="t-h3 mt-4">{f.title}</h2>
              <p className="t-body mt-1.5">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line px-5 py-5 text-center sm:px-8">
        <p className="t-meta">Your journal and mood log are private to you — always.</p>
      </footer>
    </div>
  );
}
