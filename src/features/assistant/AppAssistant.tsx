"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PulsingBorder } from "@paper-design/shaders-react";
import AIMessage from "@/components/ui/ai-message";
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  JournalIcon,
  SendIcon,
  SmileIcon,
  SparkleIcon,
} from "@/components/icons";
import type { SessionPayload } from "@/lib/session";

type Suggestion = {
  label: string;
  prompt: string;
};

type AssistantResponse = {
  reply: string;
  suggestions?: Suggestion[];
  refreshed?: boolean;
};

type ThreadMessage = {
  id: string;
  from: "user" | "assistant";
  text: string;
};

type Counsellor = { id: string; name: string };
type Slot = { startTime: string; endTime: string; booked: boolean; past: boolean };

const borderColors = [
  "hsl(187,90%,43%)",
  "hsl(239,84%,67%)",
  "hsl(160,84%,39%)",
  "hsl(38,92%,50%)",
  "hsl(0,0%,100%)",
];

const starterSuggestions: Record<SessionPayload["role"], Suggestion[]> = {
  STUDENT: [
    { label: "Log mood", prompt: "__open_mood" },
    { label: "Book a session", prompt: "__open_booking" },
    { label: "Add journal", prompt: "Journal: " },
  ],
  COUNSELLOR: [
    { label: "Add Monday slot", prompt: "Add availability every Monday at 10am" },
    { label: "Approve next", prompt: "Approve my next pending request" },
    { label: "Start walk-in", prompt: "Start walk-in for " },
  ],
  ADMIN: [
    { label: "Unread alerts", prompt: "Show my notifications" },
    { label: "Mark read", prompt: "Mark all notifications read" },
    { label: "Create suspension", prompt: "Suspend " },
  ],
};

function AssistantAvatar() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-tint text-brand-ink shadow-(--shadow-card)">
      <SparkleIcon className="h-4 w-4" />
    </span>
  );
}

function Launcher({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Close MindSpace assistant" : "Open MindSpace assistant"}
      aria-expanded={open}
      onClick={onClick}
      className="relative grid h-16 w-16 place-items-center rounded-full bg-forest text-white shadow-2xl shadow-forest/25 transition-transform hover:scale-105"
    >
      <PulsingBorder
        colors={borderColors}
        colorBack="rgba(0,0,0,0)"
        speed={open ? 1.35 : 0.95}
        roundness={1}
        thickness={0.08}
        softness={0.34}
        intensity={0.45}
        bloom={0.32}
        spots={5}
        spotSize={0.2}
        pulse={0.18}
        smoke={0.38}
        smokeSize={1.35}
        scale={0.78}
        aspectRatio="square"
        style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%" }}
      />
      <motion.span
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        aria-hidden
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <path
              id="assistant-launcher-circle"
              d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
            />
          </defs>
          <text className="fill-white/76 text-[10px] font-semibold uppercase tracking-normal">
            <textPath href="#assistant-launcher-circle" startOffset="0%">
              Ask - act - book - mood - notes - 
            </textPath>
          </text>
        </svg>
      </motion.span>
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-forest">
        {open ? <CheckIcon className="h-5 w-5" /> : <SparkleIcon className="h-5 w-5" />}
      </span>
    </button>
  );
}

export function AppAssistant({ session }: { session: SessionPayload }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState<"booking" | "mood" | null>(null);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [bookingDate, setBookingDate] = useState("");
  const [counsellorId, setCounsellorId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    starterSuggestions[session.role],
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([
    {
      id: "welcome",
      from: "assistant",
      text:
        session.role === "STUDENT"
          ? "Tell me what to do: book a session, log a mood, save a journal entry, or check appointments."
          : session.role === "COUNSELLOR"
            ? "Tell me what to do: manage availability, respond to requests, start walk-ins, end sessions, or write notes."
            : "Tell me what to do: review alerts, mark notifications read, or create a suspension.",
    },
  ]);

  const panelTitle = useMemo(() => {
    if (session.role === "STUDENT") return "Student Assistant";
    if (session.role === "COUNSELLOR") return "Care Workflow Assistant";
    return "Admin Assistant";
  }, [session.role]);

  const minimumDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedCounsellor = counsellors.find((counsellor) => counsellor.id === counsellorId);

  useEffect(() => {
    if (tool !== "booking" || counsellors.length) return;
    fetch("/api/counsellors")
      .then((response) => response.json())
      .then((body) => {
        const rows = body?.data?.counsellors ?? [];
        setCounsellors(rows.map((row: { user: { id: string; name: string } }) => row.user));
      })
      .catch(() => setCounsellors([]));
  }, [tool, counsellors.length]);

  useEffect(() => {
    if (!counsellorId || !bookingDate) {
      setSlots([]);
      return;
    }
    setSelectedTime("");
    fetch(`/api/counsellors/${counsellorId}/slots?date=${bookingDate}`)
      .then((response) => response.json())
      .then((body) => setSlots(body?.data?.slots ?? []))
      .catch(() => setSlots([]));
  }, [bookingDate, counsellorId]);

  async function send(prompt = input) {
    const text = prompt.trim();
    if (!text || busy) return;

    setInput("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), from: "user", text },
    ]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // The API uses the recent thread only to complete a guided task. It
          // never treats assistant text as an instruction to execute.
          history: messages.slice(-10).map(({ from, text: content }) => ({ from, text: content })),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | ({ success?: boolean; message?: string; data?: AssistantResponse } &
            Partial<AssistantResponse>)
        | null;
      const payload = body?.data ?? body;
      const reply =
        payload?.reply ??
        body?.message ??
        "I couldn't complete that. Try a little more detail.";
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), from: "assistant", text: reply },
      ]);
      setSuggestions(
        payload?.suggestions?.length
          ? payload.suggestions
          : starterSuggestions[session.role],
      );
      if (payload?.refreshed) router.refresh();
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          from: "assistant",
          text: "I couldn't reach the assistant service. Check your connection and try again.",
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function closeTool() {
    setTool(null);
    setSelectedTime("");
  }

  function confirmBooking() {
    if (!selectedCounsellor || !bookingDate || !selectedTime) return;
    const slot = slots.find((item) => item.startTime.slice(11, 16) === selectedTime);
    if (!slot) return;
    closeTool();
    void send(`Confirm booking with ${selectedCounsellor.name} on ${bookingDate} at ${selectedTime}`);
  }

  function confirmMood() {
    if (!selectedMood) return;
    const note = moodNote.trim() ? ` note: ${moodNote.trim()}` : "";
    setTool(null);
    setMoodNote("");
    void send(`Confirm: Log mood ${selectedMood}${note}`);
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {open && (
          <motion.section
            key="assistant-panel"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-[min(620px,calc(100svh-7rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-2xl shadow-forest/20"
            aria-label={panelTitle}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-strong">{panelTitle}</p>
                <p className="truncate text-xs text-ink-muted">
                  {session.name} · settings changes are off limits
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-tint text-brand-ink">
                  {session.role === "STUDENT" ? <SmileIcon className="h-4 w-4" /> : session.role === "COUNSELLOR" ? <CalendarIcon className="h-4 w-4" /> : <JournalIcon className="h-4 w-4" />}
                </span>
                <button type="button" onClick={() => { closeTool(); setOpen(false); }} className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink" aria-label="Close assistant">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <AIMessage
                    key={message.id}
                    from={message.from}
                    avatar={message.from === "assistant" ? <AssistantAvatar /> : undefined}
                  >
                    {message.text}
                  </AIMessage>
                ))}
                {busy && (
                  <AIMessage avatar={<AssistantAvatar />}>
                    Working through that now...
                  </AIMessage>
                )}
              </div>
            </div>

            <div className="border-t border-line p-3">
              {tool === "booking" && (
                <div className="mb-3 space-y-3 border-b border-line pb-3">
                  <input type="date" min={minimumDate} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="w-full rounded-(--radius-input) border border-line bg-surface px-3 py-2 text-sm text-ink" aria-label="Appointment date" />
                  <select value={counsellorId} onChange={(event) => setCounsellorId(event.target.value)} className="w-full rounded-(--radius-input) border border-line bg-surface px-3 py-2 text-sm text-ink" aria-label="Counsellor">
                    <option value="">Choose counsellor</option>
                    {counsellors.map((counsellor) => <option key={counsellor.id} value={counsellor.id}>{counsellor.name}</option>)}
                  </select>
                  {bookingDate && counsellorId && <div className="grid grid-cols-3 gap-2">{slots.filter((slot) => !slot.booked && !slot.past).map((slot) => {
                    const time = slot.startTime.slice(11, 16);
                    return <button key={slot.startTime} type="button" onClick={() => setSelectedTime(time)} className={`h-9 rounded-(--radius-input) border text-xs font-semibold ${selectedTime === time ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-secondary hover:bg-sunken"}`}>{time}</button>;
                  })}</div>}
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={closeTool} className="px-3 py-2 text-sm font-semibold text-ink-secondary">Cancel</button>
                    <button type="button" onClick={confirmBooking} disabled={!selectedTime} className="rounded-(--radius-input) bg-brand px-3 py-2 text-sm font-semibold text-white disabled:bg-brand-disabled">Confirm booking</button>
                  </div>
                </div>
              )}
              {tool === "mood" && (
                <div className="mb-3 space-y-3 border-b border-line pb-3">
                  <div className="grid grid-cols-3 gap-2">{["happy", "calm", "neutral", "anxious", "sad", "stressed"].map((mood) => <button key={mood} type="button" onClick={() => setSelectedMood(mood)} className={`h-9 rounded-(--radius-input) border text-xs font-semibold capitalize ${selectedMood === mood ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-secondary hover:bg-sunken"}`}>{mood}</button>)}</div>
                  <textarea value={moodNote} onChange={(event) => setMoodNote(event.target.value)} maxLength={1000} rows={2} placeholder="Add a note (optional)" className="w-full resize-none rounded-(--radius-input) border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted" />
                  <div className="flex items-center justify-end gap-2"><button type="button" onClick={closeTool} className="px-3 py-2 text-sm font-semibold text-ink-secondary">Cancel</button><button type="button" onClick={confirmMood} disabled={!selectedMood} className="rounded-(--radius-input) bg-brand px-3 py-2 text-sm font-semibold text-white disabled:bg-brand-disabled">Confirm mood</button></div>
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.label}-${suggestion.prompt}`}
                      type="button"
                      onClick={() => {
                        if (suggestion.prompt === "__open_booking") { setTool("booking"); return; }
                        if (suggestion.prompt === "__open_mood") { setTool("mood"); return; }
                        if (suggestion.prompt.endsWith(" ")) {
                          setInput(suggestion.prompt);
                          inputRef.current?.focus();
                        } else {
                          void send(suggestion.prompt);
                        }
                      }}
                      className="shrink-0 rounded-(--radius-pill) bg-sunken px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:bg-line hover:text-ink"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send();
                }}
              >
                <label htmlFor="assistant-input" className="sr-only">
                  Ask MindSpace assistant
                </label>
                <input
                  ref={inputRef}
                  id="assistant-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type one task..."
                  className="min-w-0 flex-1 rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover disabled:bg-brand-disabled disabled:text-brand-ink"
                  aria-label="Send"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Launcher
        open={open}
        onClick={() => {
          setOpen((value) => !value);
          window.setTimeout(() => inputRef.current?.focus(), 60);
        }}
      />
    </div>
  );
}
