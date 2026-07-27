"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, FileText, X } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

interface EligibleDoc {
  id: string;
  type: string;
}

export default function DocumentBatchReupload({
  token,
  documents,
}: {
  token: string;
  documents: EligibleDoc[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(type: string, f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError(`${type}: only JPG, PNG, or PDF allowed.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`${type}: file must be under 5 MB.`);
      return;
    }
    setFiles((prev) => ({ ...prev, [type]: f }));
  }

  function clearFile(type: string) {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }

  function reset() {
    setFiles({});
    setError(null);
  }

  const selectedCount = Object.keys(files).length;

  async function handleSubmit() {
    if (selectedCount === 0) {
      setError("Please select at least one document to update.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("token", token);
      for (const [type, file] of Object.entries(files)) {
        formData.append(type, file);
      }

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
      reset();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (documents.length === 0) return null;

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title="Update Documents"
      trigger={
        <Button variant="outline" className="cursor-pointer">
          Update Documents
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Select a replacement file for each document you want to update, then
          submit them all together in one review request.
        </p>

        <div className="space-y-3">
          {documents.map((doc) => {
            const file = files[doc.type];
            return (
              <div key={doc.id} className="space-y-2">
                <p className="text-sm font-medium uppercase">{doc.type}</p>
                <label
                  className={`border-border flex items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4 text-center transition-colors ${
                    loading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-primary/50 cursor-pointer"
                  }`}
                >
                  {file ? (
                    <>
                      <FileText className="text-primary h-6 w-6 shrink-0" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile(doc.type);
                        }}
                        className="text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera className="text-muted-foreground h-6 w-6 shrink-0" />
                      <span className="text-muted-foreground text-sm">
                        Click to select JPG, PNG or PDF · max 5 MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    disabled={loading}
                    onChange={(e) => handleFile(doc.type, e.target.files?.[0])}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="border-primary/40 rounded-lg border border-dashed p-4">
          <p className="text-muted-foreground text-sm">
            All selected documents will be submitted together and reviewed by
            our HSE team in one go.
          </p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedCount === 0}
            className="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Uploading..."
              : `Submit All Updates${selectedCount ? ` (${selectedCount})` : ""}`}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}
