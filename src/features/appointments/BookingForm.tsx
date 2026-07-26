"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/features/appointments/Calendar";
import { AvailabilityChip } from "@/components/ui/status-chip";
import { UserIcon } from "@/components/icons";
import { formatTimeRange } from "@/lib/format";

export type CounsellorOption = {
  id: string;
  name: string;
  specialization: string | null;
  yearsOfExperience: number | null;
};

type Slot = { startTime: string; endTime: string; booked: boolean; past: boolean };

const hhmm = (iso: string) => iso.slice(11, 16);

const prettyDate = (ymdStr: string) => {
  if (!ymdStr) return "";
  const [y, m, d] = ymdStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function BookingForm({ counsellors }: { counsellors: CounsellorOption[] }) {
  const router = useRouter();
  const [counsellorId, setCounsellorId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    if (!counsellorId || !date) return;
    setSlotsLoading(true);
    setSelected(null);
    setError(null);
    const res = await fetch(`/api/counsellors/${counsellorId}/slots?date=${date}`);
    const body = await res.json().catch(() => null);
    setSlots(body?.success ? body.data.slots : []);
    if (!res.ok) setError(body?.message ?? "Couldn't load slots.");
    setSlotsLoading(false);
  }, [counsellorId, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!counsellorId || !date || !selected) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counsellorId,
        date,
        startTime: hhmm(selected.startTime),
        endTime: hhmm(selected.endTime),
        reason: reason.trim() || undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't book this slot. Pick another time.");
      setSubmitting(false);
      if (res.status === 409) void loadSlots();
      return;
    }
    router.push("/student/appointments");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Counsellor list */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="t-h2">Choose a Counsellor</h2>
        <p className="t-body mt-1">Pick who you&apos;d like to talk to.</p>
        <div role="radiogroup" className="mt-3 flex flex-col gap-2.5">
          {counsellors.map((c, i) => {
            const active = counsellorId === c.id;
            return (
              <motion.button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setCounsellorId(c.id);
                  setSelected(null);
                }}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`flex items-center gap-3 rounded-(--radius-card) border bg-surface p-4 text-left shadow-(--shadow-card) transition-all duration-200 ${
                  active
                    ? "border-[#a29bfe] shadow-lg shadow-[#6c5ce715]"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                  <UserIcon className="h-[1.3rem] w-[1.3rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  {c.specialization && (
                    <span className="block truncate text-sm text-ink-muted">
                      {c.specialization}
                    </span>
                  )}
                  {c.yearsOfExperience != null && (
                    <span className="block text-xs text-ink-muted">
                      {c.yearsOfExperience} yrs experience
                    </span>
                  )}
                </span>
                <AvailabilityChip available />
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Date — Calendar */}
      <AnimatePresence>
        {counsellorId && (
          <motion.section
            key="calendar"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, height: 0 }}
          >
            <h2 className="t-h2">Select a Date</h2>
            <p className="t-body mt-1">
              Choose your preferred session date from the calendar.
            </p>
            <div className="mt-3">
              <Calendar value={date} onSelect={setDate} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Slots */}
      <AnimatePresence>
        {counsellorId && date && (
          <motion.section
            key="slots"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, height: 0 }}
          >
            <h2 className="t-h2">Available Time Slots</h2>
            <p className="t-body mt-1">Slots for {prettyDate(date)}</p>
            <div className="mt-3 rounded-(--radius-card) border border-line bg-surface p-4 shadow-(--shadow-card)">
              {slotsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-11" />
                  ))}
                  <span className="sr-only">Checking availability…</span>
                </div>
              ) : slots && slots.length > 0 ? (
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                >
                  {slots.map((slot) => {
                    const unavailable = slot.booked || slot.past;
                    const active = selected?.startTime === slot.startTime;
                    return (
                      <motion.button
                        key={slot.startTime}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={unavailable}
                        onClick={() => setSelected(slot)}
                        variants={{
                          hidden: { opacity: 0, scale: 0.9 },
                          visible: { opacity: 1, scale: 1 },
                        }}
                        whileHover={!unavailable ? { scale: 1.03 } : {}}
                        whileTap={!unavailable ? { scale: 0.97 } : {}}
                        className={`rounded-(--radius-btn) px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-[#6c5ce7] to-[#4ecdc4] text-white shadow-lg shadow-[#6c5ce720]"
                            : unavailable
                              ? "cursor-not-allowed bg-sunken-2 text-line-strong"
                              : "bg-sunken text-ink hover:bg-line"
                        }`}
                      >
                        {formatTimeRange(hhmm(slot.startTime), hhmm(slot.endTime))}
                        {unavailable && (
                          <span className="sr-only">
                            {slot.past ? " (past)" : " (already booked)"}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <p className="t-body">
                  No open times that day — another day might suit better.
                </p>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Reason + confirm */}
      <AnimatePresence>
        {counsellorId && date && selected && (
          <motion.section
            key="confirm"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <label htmlFor="reason" className="text-sm font-semibold text-ink">
              Anything you&apos;d like them to know beforehand? (optional)
            </label>
            <textarea
              id="reason"
              rows={3}
              maxLength={500}
              className="w-full resize-y rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {error && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={!counsellorId || !date || !selected || submitting}
      >
        {submitting ? "Sending request…" : "Confirm Booking"}
      </Button>
    </form>
  );
}
