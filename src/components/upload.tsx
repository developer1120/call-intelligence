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
    const timer = setInterval(async () => {
      const res = await fetch(`/api/calls?ids=${pendingIds}`, { cache: "no-store" });
      if (!res.ok) return;
      const { calls } = (await res.json()) as { calls: { id: string; status: Stage; error: string | null }[] };
      let finished = false;
      setItems((list) =>
        list.map((i) => {
          const c = calls.find((x) => x.id === i.id);
          if (!c || c.status === i.stage) return i;
          if (c.status === "complete" || c.status === "failed") finished = true;
          return { ...i, stage: c.status, error: c.error ?? undefined };
        }),
      );
      if (finished) router.refresh();
    }, 2000);
    return () => clearInterval(timer);
  }, [pendingIds, router]);

  const done = items.filter((i) => i.stage === "complete").length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upload call recordings"
        className="w-full max-w-[560px] rounded-[20px] bg-surface shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="text-[17px] font-semibold">Process call recordings</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              Each call is transcribed, classified, scored against your call standards and coached.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-3 hover:bg-sunken" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
