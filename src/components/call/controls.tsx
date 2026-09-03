"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Ellipsis, Loader2, RotateCw, Trash2, X } from "lucide-react";
import { deleteCall, overrideCallType, overrideItem, reprocessCall } from "@/app/actions";
import { CALL_TYPE_LABEL, CALL_TYPES, type CallType } from "@/lib/analysis/taxonomy";
import { cn } from "@/lib/utils";

function useClickAway(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, close]);
  return ref;
}

/** Manager override for one scorecard step. */
export function ItemOverride({
  callId,
  itemId,
  credited,
  overridden,
}: {
  callId: string;
  itemId: string;
  credited: boolean;
  overridden: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useClickAway(open, () => setOpen(false));
