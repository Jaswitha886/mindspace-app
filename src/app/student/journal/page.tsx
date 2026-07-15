import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { SearchIcon } from "@/components/icons";
import { JournalClient } from "@/features/journal/JournalClient";

// Journal is private to the student: this page and its API only ever query by
// the session's own userId. No counsellor/admin surface renders journal data.
export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePageRole("STUDENT");
  const { q } = await searchParams;
  const query = q?.trim();

  const entries = await prisma.journalEntry.findMany({
    where: {
      studentId: session.userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle sub="Private to you — nobody else can read these.">Journal</PageTitle>

      {/* Full-width search field, magnifier inside. */}
      <form method="GET" role="search">
        <label htmlFor="q" className="sr-only">
          Search journal entries
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted">
            <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
          </span>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query ?? ""}
            placeholder="Search journal entries..."
            className="w-full rounded-(--radius-input) border border-line bg-surface py-2.5 pr-3.5 pl-11 text-[0.9375rem] text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
          />
        </div>
      </form>

      {query && (
        <p className="t-body">
          {entries.length === 0
            ? `No entries match “${query}”.`
            : `${entries.length} ${entries.length === 1 ? "entry matches" : "entries match"} “${query}”.`}
        </p>
      )}

      <JournalClient
        entries={entries.map((e) => ({
          id: e.id,
          title: e.title,
          content: e.content,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
