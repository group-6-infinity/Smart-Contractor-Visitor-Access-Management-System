"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, FileText, X } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";

export default function DocumentReupload({
  token,
  documentId,
  documentType,
}: {
  token: string;
  documentId: string;
  documentType: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Only JPG, PNG, or PDF allowed.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setFile(f);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("documentId", documentId);
      formData.append("file", file);

      const res = await fetch("/api/track/document/reupload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Upload failed");
        return;
      }
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={setOpen}
      title={`Update ${documentType}`}
      trigger={
        <button className="text-primary cursor-pointer text-sm font-medium hover:underline">
          Update Document
        </button>
      }
    >
      <div className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="border-border hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-10 text-center transition-colors"
        >
          {file ? (
            <>
              <FileText className="text-primary h-10 w-10" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Camera className="text-muted-foreground h-10 w-10" />
              <div>
                <p className="text-lg font-semibold">
                  Drag &amp; drop or click to upload
                </p>
                <p className="text-muted-foreground text-sm">
                  JPG, PNG or PDF · max 5 MB
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className="border-primary/40 rounded-lg border border-dashed p-4">
          <p className="text-muted-foreground text-sm">
            Your document will be reviewed by our HSE team. You&apos;ll be able
            to submit visit requests once verified.
          </p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setFile(null);
              setError(null);
            }}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={loading || !file}
            className="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload & Submit For Review"}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}
