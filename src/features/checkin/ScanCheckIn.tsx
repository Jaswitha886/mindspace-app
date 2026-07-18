"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { QrIcon } from "@/components/icons";

// The counsellor's half of check-in.
//
// Camera scanning uses the native BarcodeDetector — no dependency, but it only
// exists in Chrome/Edge/Android. The typed code is therefore not a fallback so
// much as an equal path: it is the answer for Firefox and Safari, for a machine
// with no camera, for a denied permission, and for bad lighting. Both routes hit
// the same endpoint and the same server guards.

type Detector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

function detectorCtor(): DetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: DetectorCtor };
  return w.BarcodeDetector ?? null;
}

export function ScanCheckIn() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setCameraSupported(!!detectorCtor() && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  // A live camera must never outlive the component — otherwise the indicator
  // light stays on after the counsellor navigates away.
  useEffect(() => stopCamera, [stopCamera]);

  const submit = useCallback(
    async (body: { token?: string; code?: string }) => {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/appointments/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok || !json.success) {
        setError(json.message ?? "Check-in failed.");
        return false;
      }
      setResult(json.message ?? "Checked in.");
      setCode("");
      router.refresh();
      return true;
    },
    [router],
  );

  const startCamera = useCallback(async () => {
    const Ctor = detectorCtor();
    if (!Ctor) return;
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const detector = new Ctor({ formats: ["qr_code"] });
      let settled = false;

      const tick = async () => {
        if (settled || !videoRef.current) return;
        try {
          const hits = await detector.detect(videoRef.current);
          if (hits.length > 0) {
            settled = true;
            stopCamera();
            await submit({ token: hits[0].rawValue });
            return;
          }
        } catch {
          // A frame can fail to decode mid-stream; keep looking rather than
          // tearing the camera down on a single bad read.
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError(
        "Couldn't open the camera. Type the student's code below instead.",
      );
      stopCamera();
    }
  }, [stopCamera, submit]);

  return (
    <div className="flex flex-col gap-3">
      {scanning ? (
        <div className="flex flex-col gap-2">
          <video
            ref={videoRef}
            muted
            playsInline
            // Not bg-ink-strong: that token inverts to near-white in dark mode,
            // so the camera placeholder would glare. The well is dark in both.
            className="aspect-video w-full max-w-sm rounded-(--radius-card) bg-sunken object-cover"
          />
          <div>
            <Button variant="secondary" size="sm" onClick={stopCamera}>
              Stop camera
            </Button>
          </div>
        </div>
      ) : (
        cameraSupported && (
          <div>
            <Button size="sm" onClick={startCamera} disabled={busy}>
              <QrIcon className="h-4 w-4" />
              Scan check-in
            </Button>
          </div>
        )
      )}

      {!scanning && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (code.trim()) await submit({ code });
          }}
          className="flex items-end gap-2"
        >
          <div className="w-44">
            <InputField
              label="Or enter their code"
              id="checkin-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="7K2 M9Q"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="md"
            disabled={busy || !code.trim()}
          >
            {busy ? "Checking in…" : "Check in"}
          </Button>
        </form>
      )}

      {cameraSupported === false && (
        <p className="t-meta">
          This browser can&apos;t scan QR codes. Ask the student to read their
          code out instead.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-ink">
          {error}
        </p>
      )}
      {result && (
        <p role="status" className="text-sm font-semibold text-success-ink">
          {result}
        </p>
      )}
    </div>
  );
}

/** Closes a session the counsellor ran. The only path that writes COMPLETED. */
export function EndSessionButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/appointments/${appointmentId}/complete`, {
            method: "PATCH",
          });
          const json = await res.json();
          setBusy(false);
          if (!res.ok || !json.success) {
            setError(json.message ?? "Couldn't end the session.");
            return;
          }
          router.refresh();
        }}
      >
        {busy ? "Ending…" : "End session"}
      </Button>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-ink">
          {error}
        </p>
      )}
    </div>
  );
}
