"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Check, CircleAlert, CloudUpload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

type Stage = "uploading" | "queued" | "transcribing" | "analyzing" | "complete" | "failed";
type Item = { key: string; name: string; size: number; id?: string; stage: Stage; error?: string };

const STAGE_LABEL: Record<Stage, string> = {
  uploading: "Uploading",
  queued: "Waiting",
  transcribing: "Transcribing",
  analyzing: "Scoring & coaching",
  complete: "Done",
  failed: "Failed",
};
const STAGE_PROGRESS: Record<Stage, number> = {
  uploading: 0.1,
  queued: 0.2,
  transcribing: 0.4,
  analyzing: 0.75,
  complete: 1,
  failed: 1,
};

const ACCEPT = ".mp3,.wav,.m4a,.mp4,.ogg,.webm,.flac,audio/*";

export function UploadButton({ directUpload, label = "Upload calls" }: { directUpload: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <CloudUpload className="size-4" />
        {label}
      </Button>
      {open && <UploadDialog directUpload={directUpload} onClose={() => setOpen(false)} />}
    </>
  );
}

function UploadDialog({ directUpload, onClose }: { directUpload: boolean; onClose: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const update = (key: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const start = useCallback(
    async (files: File[]) => {
      const fresh = files.map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, name: f.name, size: f.size, stage: "uploading" as Stage }));
      setItems((list) => [...fresh, ...list]);
      // One request per file so each shows its own progress and one bad file can't sink the batch.
      await Promise.all(
        files.map(async (file, n) => {
          const key = fresh[n].key;
          try {
            let res: Response;
            if (directUpload) {
              const { uploadPresigned } = await import("@vercel/blob/client");
              const blob = await uploadPresigned(`calls/${file.name}`, file, {
                access: "private",
                handleUploadUrl: "/api/blob-upload",
                contentType: file.type || undefined,
              });
              res = await fetch("/api/calls", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ uploads: [{ url: blob.url, filename: file.name, size: file.size }] }),
              });
            } else {
              const form = new FormData();
              form.append("files", file);
              res = await fetch("/api/calls", { method: "POST", body: form });
            }
            const json = (await res.json()) as { ids: string[]; errors: string[] };
            if (!res.ok || !json.ids[0]) throw new Error(json.errors?.[0] ?? "Upload failed");
            update(key, { id: json.ids[0], stage: "queued" });
          } catch (err) {
            update(key, { stage: "failed", error: err instanceof Error ? err.message : "Upload failed" });
          }
        }),
      );
    },
    [directUpload],
  );

  // Poll processing status for uploaded calls.
  const pending = items.filter((i) => i.id && i.stage !== "complete" && i.stage !== "failed");
  const pendingIds = pending.map((i) => i.id).join(",");
  useEffect(() => {
    if (!pendingIds) return;
