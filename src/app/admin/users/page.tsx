import Link from "next/link";
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SearchIcon } from "@/components/icons";
import { UserTable } from "@/features/admin/UserTable";

const PAGE_SIZE = 20;
const ROLE_TABS: Array<{ label: string; value?: UserRole }> = [
  { label: "All" },
  { label: "Students", value: "STUDENT" },
  { label: "Counsellors", value: "COUNSELLOR" },
  { label: "Admins", value: "ADMIN" },
];

// Roles are admin-assigned; users can never self-select one (register hardcodes
// STUDENT). This page is the only surface that changes a role.
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const session = await requirePageRole("ADMIN");
  const sp = await searchParams;

  const q = sp.q?.trim() || undefined;
  const role = ROLE_TABS.find((t) => t.value === sp.role)?.value;
  const status = sp.status === "inactive" ? false : sp.status === "active" ? true : undefined;
  const page = Math.max(Number(sp.page) || 1, 1);

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status !== undefined ? { isActive: status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users, activeAdmins] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        department: { select: { name: true } },
      },
    }),
    prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, role: sp.role, status: sp.status, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/users${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Assign roles and enable or disable accounts. Every change here is written to the audit log.">
        User Management
      </PageTitle>

      {activeAdmins === 1 && (
        <p className="rounded-(--radius-input) bg-gold px-3.5 py-2.5 text-sm font-semibold text-gold-ink">
          There is only one active admin. Promote a second before changing this
          account — roles can only be assigned by an admin, so a platform with
          none cannot repair itself here.
        </p>
      )}

      <Card tone="sunken">
        <form method="GET" role="search" className="flex flex-col gap-3">
          <div className="relative">
            <label htmlFor="q" className="sr-only">
              Search users by name or email
            </label>
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted">
              <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
            </span>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Search by name or email…"
              className="w-full rounded-(--radius-input) border border-line bg-surface py-2.5 pr-3.5 pl-11 text-[0.9375rem] text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
            />
          </div>
          {sp.role && <input type="hidden" name="role" value={sp.role} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {ROLE_TABS.map((t) => (
            <Link
              key={t.label}
              href={href({ role: t.value, page: undefined })}
              aria-current={t.value === role ? "true" : undefined}
              className={`rounded-(--radius-pill) px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                t.value === role
                  ? "bg-brand text-white"
                  : "bg-surface text-ink-secondary hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <span aria-hidden className="mx-1 w-px bg-line" />
          {[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ].map((s) => (
            <Link
              key={s.value}
              href={href({
                status: sp.status === s.value ? undefined : s.value,
                page: undefined,
              })}
              aria-current={sp.status === s.value ? "true" : undefined}
              className={`rounded-(--radius-pill) px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                sp.status === s.value
                  ? "bg-brand text-white"
                  : "bg-surface text-ink-secondary hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        {users.length === 0 ? (
          <p className="t-body py-6 text-center">No users match that search.</p>
        ) : (
          <UserTable
            currentUserId={session.userId}
            users={users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              isActive: u.isActive,
              department: u.department?.name ?? null,
            }))}
          />
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={href({ page: String(page - 1) })}
              className="font-semibold text-brand-ink hover:underline"
            >
              Previous
            </Link>
          )}
          <span className="t-meta">
            Page {page} of {totalPages} · {total} users
          </span>
          {page < totalPages && (
            <Link
              href={href({ page: String(page + 1) })}
              className="font-semibold text-brand-ink hover:underline"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
