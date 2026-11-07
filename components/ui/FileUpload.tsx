"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ApiError, uploadApi } from "@/lib/api";
import type {
  StoreDocumentType,
  UploadPurpose,
  UploadedFile,
} from "@/types/api";
import { cn } from "@/lib/cn";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface FileUploadProps {
  id: string;
  label: string;
  description?: string;
  purpose: UploadPurpose;
  documentType?: StoreDocumentType;
  accept?: string;
  value?: string;
  onUploaded: (file: UploadedFile) => void;
  className?: string;
}

export default function FileUpload({
  id,
  label,
  description = "JPEG, PNG, WebP or PDF · up to 10MB",
  purpose,
  documentType,
  accept = ".jpg,.jpeg,.png,.webp,.pdf",
  value,
  onUploaded,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Use a JPEG, PNG, WebP image or a PDF.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("That file is larger than 10MB.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadApi.file(file, purpose, documentType);
      onUploaded(uploaded);
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed px-4 py-3 transition",
        value ? "border-success/30 bg-success/5" : "border-line bg-soft/70",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg bg-white",
            value ? "text-success" : "text-pri",
          )}
        >
          <Icon name={value ? "check-circle" : "upload"} className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-ink">{label}</p>
          {value ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[11px] font-medium text-pri underline decoration-pri/30 underline-offset-2"
            >
              Uploaded · view file
            </a>
          ) : (
            <p className="text-[11px] leading-snug text-muted">{description}</p>
          )}
          {error ? (
            <p className="mt-1 text-[11px] leading-snug text-danger">{error}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-pri transition hover:border-pri/30 hover:bg-well disabled:opacity-60"
        >
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
