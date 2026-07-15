"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { AlertIcon, CheckCircleIcon } from "@/components/icons";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  department: string | null;
};

const ROLES: UserRole[] = ["STUDENT", "COUNSELLOR", "ADMIN"];

export function UserTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function patch(id: string, body: Record<string, unknown>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(id);
    setError(null);
    setNotice(null);
    setWarnings([]);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok || !json?.success) {
      setError(json?.message ?? "Couldn't update this user — try again.");
      return;
    }
    setNotice(json.message ?? "Updated.");
    setWarnings(json.data?.warnings ?? []);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink"
        >
          <CheckCircleIcon className="h-[1.15rem] w-[1.15rem]" />
          {notice}
        </p>
      )}
      {warnings.map((w) => (
        <p
          key={w}
          role="alert"
          className="flex items-start gap-2 rounded-(--radius-input) bg-gold px-3.5 py-2.5 text-sm font-semibold text-gold-ink"
        >
          <AlertIcon className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0" />
          {w}
        </p>
      ))}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {["User", "Department", "Role", "Status", ""].map((h) => (
                <th key={h} scope="col" className="py-2 text-xs font-semibold text-ink-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <span className="block text-[0.9375rem] font-semibold text-ink">
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-semibold text-ink-muted">
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-ink-muted">{u.email}</span>
                  </th>
                  <td className="py-3 pr-3 text-sm text-ink-secondary">
                    {u.department ?? "—"}
                  </td>
                  <td className="py-3 pr-3">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Role for {u.name}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      disabled={isSelf || busy === u.id}
                      onChange={(e) =>
                        patch(
                          u.id,
                          { role: e.target.value },
                          `Change ${u.name}'s role to ${e.target.value}? This takes effect immediately, including on their current session.`,
                        )
                      }
                      className="rounded-(--radius-input) border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink disabled:bg-sunken disabled:text-ink-muted focus:border-brand-light focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex items-center rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold text-white ${
                        u.isActive ? "bg-success" : "bg-red"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      disabled={isSelf || busy === u.id}
                      onClick={() =>
                        patch(
                          u.id,
                          { isActive: !u.isActive },
                          u.isActive
                            ? `Deactivate ${u.name}? They'll be signed out of MindSpace immediately and can't sign back in.`
                            : `Reactivate ${u.name}?`,
                        )
                      }
                      className={`text-sm font-semibold hover:underline disabled:text-ink-muted disabled:no-underline ${
                        u.isActive ? "text-red-ink" : "text-brand-ink"
                      }`}
                    >
                      {busy === u.id
                        ? "Saving…"
                        : u.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
