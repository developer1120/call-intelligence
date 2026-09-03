"use client";

import { Play, TriangleAlert } from "lucide-react";
import type { Evidence } from "@/lib/analysis/types";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayer } from "./player-context";

/** A cited moment from the call. Click to hear it. */
export function EvidenceQuote({ e, className, tone = "neutral" }: { e: Evidence; className?: string; tone?: "neutral" | "good" | "bad" }) {
  const { seek } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => seek(e.start, e.u)}
      title={e.verified ? "Play this moment" : "This quote could not be matched to the transcript"}
      className={cn(
        "group flex w-full items-start gap-2 rounded-[10px] px-2.5 py-1.5 text-left text-[12.5px] leading-snug transition-colors",
        e.verified ? "bg-sunken hover:bg-blue-soft" : "bg-orange-soft/70 hover:bg-orange-soft",
        className,
      )}
    >
      <span
        className={cn(
          "mt-[1px] inline-flex h-[18px] shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[11px] font-semibold tabular",
          tone === "good" ? "bg-green-soft text-green-ink" : tone === "bad" ? "bg-red-soft text-red-ink" : "bg-surface text-ink-2",
          "group-hover:bg-blue group-hover:text-white",
        )}
      >
