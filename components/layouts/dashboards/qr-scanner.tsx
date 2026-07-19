"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

export default function QrScanner({
  onScan,
  disabled,
}: {
  onScan: (token: string) => void;
  disabled?: boolean;
}) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockedRef = useRef(false);
  const containerId = "qr-reader";

  async function startScan() {
    setError(null);
    lockedRef.current = false;
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 1.0,   // samain dengan qr-test, HAPUS qrbox
        },
        (decodedText) => {
          if (lockedRef.current) return;
          lockedRef.current = true;
          console.log("✅ QR DECODED:", decodedText);
          onScan(decodedText.trim());
          stopScan();
        },
        () => {
          // per-frame not found — abaikan
        },
      );
      setScanning(true);
    } catch {
      setError("Cannot access camera. Check permissions or use manual entry.");
      setScanning(false);
      scannerRef.current = null;
    }
  }

  async function stopScan() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // ignore
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-foreground/90 relative aspect-video w-full overflow-hidden rounded-xl">
        {!scanning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="border-primary/60 flex h-40 w-40 items-center justify-center rounded-lg border-2">
              <Camera className="text-primary/60 h-10 w-10" />
            </div>
          </div>
        )}
        <div id={containerId} className="h-full w-full" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!scanning ? (
        <Button onClick={startScan} disabled={disabled} className="cursor-pointer">
          <Camera className="mr-1 h-4 w-4" />
          Start Camera
        </Button>
      ) : (
        <Button variant="outline" onClick={stopScan} className="cursor-pointer">
          <CameraOff className="mr-1 h-4 w-4" />
          Stop Camera
        </Button>
      )}
    </div>
  );
}
