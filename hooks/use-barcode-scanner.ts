"use client";

import { useEffect, useRef, useCallback } from "react";

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  /** Minimum length to consider a valid barcode (default: 3) */
  minLength?: number;
  /** Max ms between keystrokes to be considered a scanner (default: 50) */
  scannerThreshold?: number;
  /** Whether the hook is active (default: true) */
  enabled?: boolean;
}

/**
 * Detects input from a physical barcode scanner connected as a keyboard.
 * Scanners type characters very fast (< 50ms between keystrokes) and end with Enter.
 * This hook listens globally for that pattern and fires onScan with the barcode string.
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  scannerThreshold = 50,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = "";
    if (code.length >= minLength) {
      onScan(code);
    }
  }, [onScan, minLength]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on a textarea or contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA") return;

      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        // Clear any pending flush timer
        if (timerRef.current) clearTimeout(timerRef.current);
        flush();
        return;
      }

      // If gap between keystrokes is too large, reset buffer (manual typing)
      if (elapsed > scannerThreshold && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Only accumulate printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Safety: auto-flush after 100ms of inactivity (scanner without Enter)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush, scannerThreshold]);
}
