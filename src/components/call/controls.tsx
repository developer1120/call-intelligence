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
  const run = (v: boolean | null) => {
    setOpen(false);
    start(() => overrideItem(callId, itemId, v));
  };
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid size-7 place-items-center rounded-[8px] text-ink-4 opacity-0 transition group-hover:opacity-100 hover:bg-sunken hover:text-ink-2 focus:opacity-100 data-[open=true]:opacity-100"
        data-open={open || pending}
        aria-label="Adjust this step"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Ellipsis className="size-4" />}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-[12px] border border-hairline bg-surface p-1 text-[13px] shadow-[var(--shadow-pop)]">
          <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-ink-4 uppercase">Manager review</div>
          {!credited && (
            <MenuItem onClick={() => run(true)} icon={<Check className="size-3.5 text-green-ink" />}>
              Award this point
            </MenuItem>
          )}
          {credited && (
            <MenuItem onClick={() => run(false)} icon={<X className="size-3.5 text-red-ink" />}>
              Remove this point
            </MenuItem>
          )}
          {overridden && (
            <MenuItem onClick={() => run(null)} icon={<RotateCw className="size-3.5" />}>
              Reset to AI result
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
