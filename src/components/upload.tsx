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
