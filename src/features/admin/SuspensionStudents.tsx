"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldWrapper, inputClasses } from "@/components/ui/field";
import { formatDate } from "@/lib/format";

type Student = { id: string; name: string; email: string; registerNumber: string | null };
export type SuspensionItem = {
  id: string;
  studentId: string;
  student: Student;
  reason: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notifiedCounsellors: number;
};

function emptyForm() {
  return { studentId: "", reason: "", startDate: "", endDate: "", notes: "" };
}

export function SuspensionStudents({
  students,
  suspensions,
}: {
  students: Student[];
  suspensions: SuspensionItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<SuspensionItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch(
      editing ? `/api/admin/suspensions/${editing.id}` : "/api/admin/suspensions",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...form, status: editing.status } : form),
      },
    );
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(body?.message ?? "Could not save the suspension.");
      return;
    }
    setForm(emptyForm());
    setEditing(null);
    setMessage(editing ? "Suspension updated." : "Suspension created and counsellors notified.");
    router.refresh();
  }

  function edit(item: SuspensionItem) {
    setEditing(item);
    setForm({
      studentId: item.studentId,
      reason: item.reason,
      startDate: item.startDate,
      endDate: item.endDate,
      notes: item.notes ?? "",
    });
    setError("");
    setMessage("");
  }

  async function setStatus(item: SuspensionItem, status: "COMPLETED" | "CANCELLED") {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/suspensions/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: item.reason,
        startDate: item.startDate,
        endDate: item.endDate,
        notes: item.notes ?? "",
        status,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Could not update the suspension.");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="t-h2">Suspension Students</h2>
          <p className="t-body mt-1">Report and track student suspensions. Active counsellors are notified automatically.</p>
        </div>
        <span className="t-meta">{suspensions.filter((s) => s.status === "ACTIVE").length} active</span>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4 rounded-(--radius-input) border border-line bg-sunken p-4 sm:grid-cols-2">
        <FieldWrapper label="Student" htmlFor="suspension-student">
          <select id="suspension-student" required value={form.studentId} disabled={!!editing} className={inputClasses(false)} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">Select an existing student</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.registerNumber ?? student.email}</option>)}
          </select>
        </FieldWrapper>
        <FieldWrapper label="Reason" htmlFor="suspension-reason">
          <input id="suspension-reason" required value={form.reason} className={inputClasses(false)} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="Start date" htmlFor="suspension-start">
          <input id="suspension-start" type="date" required value={form.startDate} className={inputClasses(false)} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </FieldWrapper>
        <FieldWrapper label="End date" htmlFor="suspension-end">
          <input id="suspension-end" type="date" required value={form.endDate} className={inputClasses(false)} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </FieldWrapper>
        <div className="sm:col-span-2">
          <FieldWrapper label="Additional notes (optional)" htmlFor="suspension-notes">
            <textarea id="suspension-notes" rows={3} value={form.notes} className={`${inputClasses(false)} resize-y`} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FieldWrapper>
        </div>
        {error && <p role="alert" className="sm:col-span-2 text-sm font-semibold text-red-ink">{error}</p>}
        {message && <p role="status" className="sm:col-span-2 text-sm font-semibold text-success">{message}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : editing ? "Update suspension" : "Add suspension"}</Button>
          {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Cancel edit</Button>}
        </div>
      </form>

      <div className="mt-5 overflow-x-auto">
        {suspensions.length === 0 ? <p className="t-body">No suspension records yet.</p> : (
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <thead><tr className="border-b border-line text-xs text-ink-muted"><th className="py-2">Student</th><th className="py-2">Period</th><th className="py-2">Reason</th><th className="py-2">Status</th><th className="py-2">Notifications</th><th className="py-2" /></tr></thead>
            <tbody>
              {suspensions.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="py-3"><p className="font-semibold text-ink">{item.student.name}</p><p className="t-meta">{item.student.registerNumber ?? item.student.email}</p></td>
                  <td className="py-3 text-sm text-ink-secondary">{formatDate(item.startDate)} – {formatDate(item.endDate)}</td>
                  <td className="max-w-[14rem] py-3 text-sm text-ink-secondary">{item.reason}</td>
                  <td className="py-3 text-sm font-semibold">{item.status}</td>
                  <td className="py-3 text-sm text-ink-secondary">{item.notifiedCounsellors} counsellor{item.notifiedCounsellors === 1 ? "" : "s"} notified</td>
                  <td className="py-3 text-right"><div className="flex justify-end gap-2"><Button type="button" variant="link" size="sm" onClick={() => edit(item)}>Edit</Button>{item.status === "ACTIVE" && <><Button type="button" variant="link" size="sm" onClick={() => setStatus(item, "COMPLETED")} disabled={busy}>Resolve</Button><Button type="button" variant="link" size="sm" onClick={() => setStatus(item, "CANCELLED")} disabled={busy}>Cancel</Button></>}</div>{item.notes && <p className="t-meta mt-1 text-right">Notes: {item.notes}</p>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
