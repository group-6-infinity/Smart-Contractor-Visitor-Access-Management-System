"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CloudUpload,
  FileCheck,
  FileX,
  File,
  Loader2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FileStatus = "uploading" | "success" | "error";

interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  accept?: string; // e.g. ".pdf,.jpg,.png"
  maxSizeMB?: number; // default 10
  multiple?: boolean; // default true
  onUpload?: (file: File) => Promise<void>; // actual upload handler
  onChange?: (files: UploadedFile[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_LABEL = "PDF, JPG, PNG";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FileStatus }) {
  if (status === "uploading") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Uploading
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
        <CheckCircle className="h-3 w-3" />
        Uploaded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      <AlertTriangle className="h-3 w-3" />
      Failed
    </span>
  );
}

function FileRow({
  uploadedFile,
  onRemove,
  onCancel,
}: {
  uploadedFile: UploadedFile;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const { id, file, status, progress, error } = uploadedFile;
  const isError = status === "error";
  const isUploading = status === "uploading";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        isError
          ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : "border-border bg-muted/30",
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        {status === "success" && (
          <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
        )}
        {status === "error" && <FileX className="h-5 w-5 text-red-500" />}
        {status === "uploading" && (
          <File className="text-muted-foreground h-5 w-5" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground truncate text-sm font-medium">
            {file.name}
          </p>
          <StatusBadge status={status} />
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-2 flex items-center gap-2">
            <div className="bg-border h-1 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs">{progress}%</span>
          </div>
        )}

        {/* File size or error */}
        {status === "success" && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {formatBytes(file.size)}
          </p>
        )}
        {isError && error && (
          <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Action button */}
      <button
        type="button"
        aria-label={isUploading ? "Cancel upload" : "Remove file"}
        onClick={() => (isUploading ? onCancel(id) : onRemove(id))}
        className="text-muted-foreground hover:text-foreground mt-0.5 flex-shrink-0 rounded-sm p-0.5 transition-colors"
      >
        {isUploading ? (
          <X className="h-4 w-4" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FileUploader({
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 10,
  multiple = true,
  onUpload,
  onChange,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef<Set<string>>(new Set());

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // ─── Update helper ───────────────────────────────────────────────────────
  const updateFile = useCallback((id: string, patch: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  // ─── Simulate or real upload ─────────────────────────────────────────────
  const startUpload = useCallback(
    async (uploadedFile: UploadedFile) => {
      const { id, file } = uploadedFile;

      if (onUpload) {
        // Real upload via prop
        try {
          await onUpload(file);
          if (!cancelledRef.current.has(id)) {
            updateFile(id, { status: "success", progress: 100 });
          }
        } catch (err) {
          if (!cancelledRef.current.has(id)) {
            updateFile(id, {
              status: "error",
              error: err instanceof Error ? err.message : "Upload failed.",
            });
          }
        }
      } else {
        // Simulate upload for demo
        let progress = 0;
        const interval = setInterval(() => {
          if (cancelledRef.current.has(id)) {
            clearInterval(interval);
            return;
          }
          progress = Math.min(
            progress + Math.floor(Math.random() * 18) + 5,
            100,
          );
          updateFile(id, { progress });
          if (progress >= 100) {
            clearInterval(interval);
            updateFile(id, { status: "success", progress: 100 });
          }
        }, 200);
      }
    },
    [onUpload, updateFile],
  );

  // ─── Process dropped / selected files ────────────────────────────────────
  const processFiles = useCallback(
    (rawFiles: FileList | File[]) => {
      const incoming = Array.from(rawFiles);

      const newEntries: UploadedFile[] = incoming.map((file) => {
        const id = generateId();

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return {
            id,
            file,
            status: "error" as FileStatus,
            progress: 0,
            error: `File type not supported. Use ${ALLOWED_LABEL}.`,
          };
        }

        // Validate size
        if (file.size > maxSizeBytes) {
          return {
            id,
            file,
            status: "error" as FileStatus,
            progress: 0,
            error: `Exceeds ${maxSizeMB} MB limit.`,
          };
        }

        return { id, file, status: "uploading" as FileStatus, progress: 0 };
      });

      setFiles((prev) => {
        const updated = multiple ? [...prev, ...newEntries] : newEntries;
        onChange?.(updated);
        return updated;
      });

      // Start upload for valid files
      newEntries
        .filter((f) => f.status === "uploading")
        .forEach((f) => startUpload(f));
    },
    [maxSizeBytes, maxSizeMB, multiple, onChange, startUpload],
  );

  // ─── Drag handlers ────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  // ─── Input handler ────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ""; // reset so same file can be re-added
    }
  };

  // ─── Remove / cancel ─────────────────────────────────────────────────────
  const handleRemove = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      onChange?.(updated);
      return updated;
    });
  };

  const handleCancel = (id: string) => {
    cancelledRef.current.add(id);
    handleRemove(id);
  };

  // ─── Counts ───────────────────────────────────────────────────────────────
  const successCount = files.filter((f) => f.status === "success").length;
  const totalCount = files.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
          isDragging
            ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
            : "border-border hover:bg-muted/40 hover:border-blue-300",
        )}
      >
        <CloudUpload
          className={cn(
            "h-8 w-8 transition-colors",
            isDragging ? "text-blue-500" : "text-muted-foreground",
          )}
        />
        <div className="text-center">
          <p className="text-foreground text-sm font-medium">
            {isDragging ? (
              "Release to upload"
            ) : (
              <>
                Drop files here or{" "}
                <span className="text-blue-600 dark:text-blue-400">browse</span>
              </>
            )}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {ALLOWED_LABEL} — max {maxSizeMB} MB
          </p>
        </div>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <FileRow
              key={f.id}
              uploadedFile={f}
              onRemove={handleRemove}
              onCancel={handleCancel}
            />
          ))}

          {/* Summary */}
          {totalCount > 1 && (
            <div className="border-border flex items-center justify-between border-t pt-2">
              <p className="text-muted-foreground text-xs">
                {successCount} of {totalCount} files uploaded
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive h-7 text-xs"
                onClick={() => setFiles([])}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
