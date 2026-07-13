"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Eye } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";
import Image from "next/image";

interface DocRow {
  id: string;
  type: string;
  isVerified: boolean;
  expiryDate: string | null;
}

export default function DocumentVerifyRow({ doc }: { doc: DocRow }) {
  const router = useRouter();
  const [expiry, setExpiry] = useState(
    doc.expiryDate ? doc.expiryDate.slice(0, 10) : "",
  );
  const [loading, setLoading] = useState(false);

  const viewUrl = `/api/staff/documents/${doc.id}/view`;

  async function save(verify: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: verify,
          expiryDate: expiry || null,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-border flex flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {doc.isVerified ? (
          <CheckCircle2 className="text-success h-4 w-4" />
        ) : (
          <Circle className="text-muted-foreground h-4 w-4" />
        )}
        <span className="text-sm font-medium">{doc.type}</span>

        <CustomDialog
          title={doc.type}
          trigger={
            <button className="text-primary ml-2 inline-flex cursor-pointer items-center gap-1 text-xs hover:underline">
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
          }
        >
          <DocumentPreview url={viewUrl} type={doc.type} />
        </CustomDialog>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          disabled={loading}
          className="border-border h-9 w-40 rounded-md border text-sm [&::-webkit-calendar-picker-indicator]:invert"
        />
        <Button
          size="sm"
          variant={doc.isVerified ? "outline" : "default"}
          disabled={loading}
          onClick={() => save(!doc.isVerified)}
          className="cursor-pointer"
        >
          {doc.isVerified ? "Unverify" : "Verify"}
        </Button>
      </div>
    </div>
  );
}

function DocumentPreview({ url, type }: { url: string; type: string }) {
  const [isPdf, setIsPdf] = useState(false);

  return (
    <div className="flex w-full items-center justify-center">
      {isPdf ? (
        <iframe src={url} className="h-[70vh] w-full rounded-md" title={type} />
      ) : (
         <img
          src={url}
          alt={type}
          className="max-h-[70vh] w-auto rounded-md object-contain"
          onError={() => setIsPdf(true)}
        />
      )}
    </div>
  );
}
