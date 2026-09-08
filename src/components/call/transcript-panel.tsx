"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Search, X } from "lucide-react";
import type { SpeakerRole } from "@/lib/analysis/types";
import type { Utterance } from "@/lib/transcription/types";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayer } from "./player-context";

export interface Marker {
  u: number;
  start: number;
  kind: "met" | "missed" | "risk" | "moment";
  label: string;
}

const MARK_COLOR: Record<Marker["kind"], string> = {
  met: "bg-green",
  missed: "bg-red",
  risk: "bg-orange",
  moment: "bg-blue",
};

export function TranscriptPanel({
  utterances,
  speakers,
  markers,
}: {
  utterances: Utterance[];
  speakers: { speaker: number; role: SpeakerRole; name: string | null }[];
  markers: Marker[];
}) {
  const { time, playing, duration, toggle, seek, focusU, focusNonce, rate, setRate } = usePlayer();
  // A search belongs to the jump it was typed after; jumping to a cited moment clears it.
  const [search, setSearch] = useState({ text: "", nonce: 0 });
  const query = search.nonce === focusNonce ? search.text : "";
  const setQuery = (text: string) => setSearch({ text, nonce: focusNonce });
  const [follow, setFollow] = useState(true);
  const list = useRef<HTMLDivElement>(null);
  // The jumped-to line glows until its timer marks that jump as seen.
  const [seenNonce, setSeenNonce] = useState(0);
  const flash = focusNonce !== seenNonce ? focusU : null;

  const who = useMemo(() => {
    const m = new Map<number, { role: SpeakerRole; label: string }>();
    for (const s of speakers) {
      const base = s.role === "rep" ? "Rep" : s.role === "customer" ? "Customer" : "Other";
      m.set(s.speaker, { role: s.role, label: s.name ? `${s.name}` : base });
    }
    return m;
  }, [speakers]);

  const marksByU = useMemo(() => {
    const m = new Map<number, Marker[]>();
    for (const mk of markers) m.set(mk.u, [...(m.get(mk.u) ?? []), mk]);
    return m;
  }, [markers]);

  const active = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < utterances.length; i++) {
      if (utterances[i].start <= time + 0.05) idx = i;
      else break;
    }
    return idx;
  }, [time, utterances]);

  // Follow playback.
  useEffect(() => {
    if (!follow || !playing || active < 0 || query) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-u="${active}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, follow, playing, query]);

  // Jump from an evidence link.
  useEffect(() => {
    if (focusU === null) return;
    requestAnimationFrame(() => {
      list.current?.querySelector<HTMLElement>(`[data-u="${focusU}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    const t = setTimeout(() => setSeenNonce(focusNonce), 2200);
    return () => clearTimeout(t);
  }, [focusU, focusNonce]);

  const q = query.trim().toLowerCase();
  const shown = q ? utterances.filter((u) => u.text.toLowerCase().includes(q)) : utterances;
  const total = duration || utterances.at(-1)?.end || 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Player */}
      <div className="border-b border-hairline px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-blue text-white shadow-sm transition hover:bg-blue-ink"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
          </button>
          <div className="min-w-0 flex-1">
            <Scrubber time={time} total={total} markers={markers} onSeek={(t) => seek(t, undefined, playing)} />
            <div className="mt-1 flex justify-between text-[11px] text-ink-3 tabular">
              <span>{formatDuration(time)}</span>
