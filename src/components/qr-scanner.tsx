"use client";

import { useEffect, useRef, useState } from "react";

type ScanResult = {
  ok: boolean;
  message: string;
  studentName?: string;
};

export function QrScanner({ courseId }: { courseId: string }) {
  const containerId = "qr-reader";
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (busyRef.current) return;
            // Avoid re-submitting the same code repeatedly while it's still
            // in view of the camera.
            if (cooldownRef.current.has(decodedText)) return;
            cooldownRef.current.add(decodedText);
            setTimeout(() => cooldownRef.current.delete(decodedText), 4000);

            await handleScan(decodedText);
          },
          () => {
            // per-frame decode failures are normal while aiming the camera; ignore
          }
        );
      } catch (err) {
        if (!cancelled) setError("Could not access the camera. Check browser permissions.");
      }
    }

    const busyRef = { current: false };
    start();

    return () => {
      cancelled = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function handleScan(qrToken: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: qrToken, course_id: courseId }),
      });
      const data = await res.json();
      setLastResult({ ok: res.ok, message: data.message, studentName: data.studentName });
    } catch {
      setLastResult({ ok: false, message: "Network error while recording attendance." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div id={containerId} className="mx-auto max-w-sm overflow-hidden rounded-xl border border-slate-200" />
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      {lastResult && (
        <div
          className={`mx-auto max-w-sm rounded-lg px-4 py-3 text-center text-sm ${
            lastResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {lastResult.studentName && <p className="font-semibold">{lastResult.studentName}</p>}
          <p>{lastResult.message}</p>
        </div>
      )}
      {busy && <p className="text-center text-xs text-slate-400">Recording…</p>}
    </div>
  );
}
