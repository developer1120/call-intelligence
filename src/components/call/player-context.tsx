"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface PlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  time: number;
  playing: boolean;
  duration: number;
  /** Utterance the user jumped to; the transcript scrolls to and flashes it. */
  focusU: number | null;
  focusNonce: number;
  seek: (sec: number, u?: number, play?: boolean) => void;
  toggle: () => void;
  setRate: (r: number) => void;
  rate: number;
}

const Ctx = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
