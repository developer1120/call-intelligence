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

