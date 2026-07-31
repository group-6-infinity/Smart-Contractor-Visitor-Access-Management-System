export const PULSE_INTERVAL_MS = 5000;

export const PULSE_CHANNELS = [
  "notifications",
  "inside",
  "visits",
  "registrations",
] as const;

export type PulseChannel = (typeof PULSE_CHANNELS)[number];

export interface PulseResponse {
  versions: Record<PulseChannel, string>;
}
