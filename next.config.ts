import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Next's dev server only accepts requests from "localhost" by default
  // (anti DNS-rebinding). Without this, opening the app through an ngrok
  // tunnel loads the initial HTML fine but React never finishes hydrating —
  // client JS, HMR, and Server Actions all get rejected as cross-origin, so
  // every button renders but its onClick never attaches. Dev-only; ignored
  // by `next build`/`next start`.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
