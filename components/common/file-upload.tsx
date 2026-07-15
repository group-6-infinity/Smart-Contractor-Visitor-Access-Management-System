"use client";

import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_MB = 5;

const ALLOWED_MIME: Record<string, string[]> = {
  "image/*": ["image/jpeg", "image/png", "image/webp"],
  "image/*,.pdf": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "image/*": [".jpg", ".jpeg", ".png", ".webp"],
  "image/*,.pdf": [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
};

const MAGIC_BYTES: { bytes: number[]; mime: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" },
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf" },
];

async function validateMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return MAGIC_BYTES.some(({ bytes: magic }) =>
    magic.every((b, i) => bytes[i] === b),
  );
}

function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
}

interface UploadBoxProps {
  id: string;
  title: string;
  description?: string;
  accept: string;
  required?: boolean;
  disabled?: boolean;
  onFileSelect?: (file: File | null) => void;
}

function UploadBox({
  id,
  title,
  description,
  accept,
  required = false,
  disabled = false,
  onFileSelect,
}: UploadBoxProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedMimes = ALLOWED_MIME[accept] ?? ALLOWED_MIME["image/*"];
  const allowedExts = ALLOWED_EXTENSIONS[accept] ?? ALLOWED_EXTENSIONS["image/*"];

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateAndSetFile = useCallback(
    async (selected: File | undefined) => {
      if (!selected || disabled) return;

      const ext = getFileExtension(selected.name);
      if (!allowedExts.includes(ext)) {
        setError(`Invalid file type. Allowed: ${allowedExts.join(", ")}`);
        return;
      }

      if (!allowedMimes.includes(selected.type)) {
        setError(`Invalid file type. Allowed: ${allowedExts.join(", ")}`);
        return;
      }

      const isValidBytes = await validateMagicBytes(selected);
      if (!isValidBytes) {
        setError("File content does not match its extension.");
        return;
      }

      if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Max file size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      setError(null);
      setFile(selected);
      onFileSelect?.(selected);
    },
    [allowedMimes, allowedExts, disabled, onFileSelect],
  );

  function handleRemove() {
    if (disabled) return;
    setFile(null);
    setError(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const hasFile = !!file && !!previewUrl;
  const isImage = file?.type.startsWith("image/");
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </p>
          {hasFile && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle className="h-3 w-3" />
              Uploaded
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="h-3 w-3" />
              Failed
            </span>
          )}
        </div>
        {hasFile && (
          <Button
            type="button"
            onClick={handleRemove}
            variant="ghost"
            disabled={disabled}
            className="p-0! hover:p-0! h-0 cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </Button>
        )}
      </div>

      <label
        htmlFor={id}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => {
          if (disabled) return;
          setIsDragActive(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragActive(false);
          validateAndSetFile(e.dataTransfer.files?.[0]);
        }}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
        className={cn(
          "group focus-within:ring-primary relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors focus-within:ring-2 focus-within:ring-offset-2",
          disabled
            ? "pointer-events-none cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-primary bg-primary/10"
              : error
                ? "border-destructive/60 bg-destructive/5"
                : hasFile
                  ? "border-green-500/40 bg-green-500/5"
                  : "cursor-pointer border-border bg-card hover:border-primary hover:bg-muted/40"
        )}
      >
        {hasFile ? (
          <>
            {isImage && (
              <Image
                src={previewUrl!}
                alt={`${title} preview`}
                fill
                unoptimized
                className="object-cover object-center"
              />
            )}
            {isPdf && (
              <div className="flex flex-col items-center gap-2 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-50 dark:bg-red-950">
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    PDF
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">{file?.name}</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="truncate text-xs text-white/80">{file?.name}</span>
              <span className="shrink-0 text-xs text-white/60">
                {(file!.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {error ? (
              <AlertCircle className="text-destructive h-7 w-7" />
            ) : (
              <Upload className="text-muted-foreground h-7 w-7" />
            )}
            <div>
              <p className="text-foreground text-sm font-medium">
                {isDragActive ? "Release to upload" : "Drop here or browse"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {description ??
                  allowedExts.join(", ").toUpperCase() +
                    ` — max ${MAX_FILE_SIZE_MB}MB`}
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={allowedMimes.join(",")}
          disabled={disabled}
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
          className="hidden"
        />
      </label>

      {error && (
        <p className="text-destructive flex items-center gap-1 text-xs">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

export interface DocumentField {
  key: string;
  label: string;
  accept: string;
  required: boolean;
}

interface FileUploadProps {
  documents?: DocumentField[];
  fileErrors?: Record<string, string>;
  onFilesChange?: (files: Record<string, File | null>) => void;
  disabled?: boolean;
}

export default function FileUpload({
  documents = [],
  fileErrors = {},
  onFilesChange,
  disabled = false,
}: FileUploadProps) {
  const filesRef = useRef<Record<string, File | null>>({});

  function handleFileSelect(key: string, file: File | null) {
    filesRef.current = { ...filesRef.current, [key]: file };
    onFilesChange?.(filesRef.current);
  }

  if (!documents.length) return null;

  return (
    <>
      {documents.map(({ key, label, accept, required }) => (
        <div key={key} className="flex flex-col gap-1">
          <UploadBox
            id={`${key}-file-upload-handle`}
            title={label}
            accept={accept}
            required={required}
            disabled={disabled}
            onFileSelect={(file) => handleFileSelect(key, file)}
          />
          {fileErrors[key] && (
            <p className="text-destructive flex items-center gap-1 text-xs italic">
              <AlertCircle className="h-3.5 w-3.5" />
              {fileErrors[key]}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
