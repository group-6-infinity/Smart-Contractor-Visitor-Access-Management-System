"use client";

import { useEffect, useRef, useState } from "react";
import {
  PULSE_CHANNELS,
  PULSE_INTERVAL_MS,
  type PulseChannel,
  type PulseResponse,
} from "@/lib/pulse";

type Listener = () => void;

const listeners = new Map<PulseChannel, Set<Listener>>();
const statusListeners = new Set<Listener>();
const versions = new Map<PulseChannel, string>();

let timer: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;
let inFlight = false;
let lastSyncAt: number | null = null;
let lastFailed = false;

export interface PulseStatus {
  lastSyncAt: number | null;
  failed: boolean;
}

async function tick() {
  if (inFlight) return;
  inFlight = true;

  try {
    const res = await fetch("/api/staff/pulse", { cache: "no-store" });
    if (!res.ok) throw new Error(`pulse ${res.status}`);
    const data: PulseResponse = await res.json();

    for (const channel of PULSE_CHANNELS) {
      const next = data.versions?.[channel];
      if (next === undefined) continue;

      const prev = versions.get(channel);
      versions.set(channel, next);

      if (prev !== undefined && prev !== next) {
        listeners.get(channel)?.forEach((fn) => fn());
      }
    }

    lastSyncAt = Date.now();
    lastFailed = false;
  } catch {
    lastFailed = true;
  } finally {
    inFlight = false;
    statusListeners.forEach((fn) => fn());
  }
}

function onWake() {
  if (!document.hidden) tick();
}

function acquire() {
  subscriberCount += 1;
  if (timer) return;

  timer = setInterval(() => {
    if (!document.hidden) tick();
  }, PULSE_INTERVAL_MS);

  document.addEventListener("visibilitychange", onWake);
  window.addEventListener("focus", onWake);

  tick();
}

function release() {
  subscriberCount -= 1;
  if (subscriberCount > 0 || !timer) return;

  clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onWake);
  window.removeEventListener("focus", onWake);

  versions.clear();
  lastSyncAt = null;
  lastFailed = false;
}

export function usePulse(
  channel: PulseChannel,
  onChange: () => void,
  opts: { maxStaleMs?: number; initial?: boolean } = {},
) {
  const { maxStaleMs, initial = false } = opts;
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const listener = () => callbackRef.current();
    const set = listeners.get(channel) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(channel, set);
    acquire();
    if (initial) listener();

    return () => {
      set.delete(listener);
      if (set.size === 0) listeners.delete(channel);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    if (!maxStaleMs) return;
    const id = setInterval(() => {
      if (!document.hidden) callbackRef.current();
    }, maxStaleMs);
    return () => clearInterval(id);
  }, [maxStaleMs]);
}

export function usePulseStatus(): PulseStatus {
  const [status, setStatus] = useState<PulseStatus>({
    lastSyncAt,
    failed: lastFailed,
  });

  useEffect(() => {
    const listener = () => setStatus({ lastSyncAt, failed: lastFailed });
    statusListeners.add(listener);
    acquire();
    listener();

    return () => {
      statusListeners.delete(listener);
      release();
    };
  }, []);

  return status;
}
