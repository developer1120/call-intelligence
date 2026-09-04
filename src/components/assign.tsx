"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, UserPlus } from "lucide-react";
import { assignTask, setTaskStatus } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

export interface AssignPayload {
  sourceKey: string;
  kind: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  callId: string | null;
  suggested: string;
}

const ROLES = ["Owner", "Manager", "Office Manager"];

/** PestLaunch-style blue "Assign" button that turns an insight into a task. */
export function AssignButton({
  payload,
  people,
  task,
  size = "md",
}: {
  payload: AssignPayload;
  people: string[];
  task: { id: string; assignee: string; status: string } | null;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const assign = (assignee: string) => {
    setOpen(false);
    start(() => assignTask({ ...payload, assignee }));
  };

  if (task) {
    const done = task.status === "done";
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn("inline-flex items-center gap-1.5 text-[12.5px]", done ? "text-green-ink" : "text-ink-2")}>
          {done ? <Check className="size-3.5" /> : <Avatar name={task.assignee} size={20} />}
          {done ? "Done" : task.assignee}
        </span>
        <button
          onClick={() => start(() => setTaskStatus(task.id, !done))}
          disabled={pending}
          className="h-7 rounded-[8px] px-2 text-[12px] font-medium text-blue hover:bg-blue-soft disabled:opacity-50"
        >
          {done ? "Reopen" : "Mark done"}
        </button>
      </div>
    );
  }

  const options = [...new Set([payload.suggested, ...people, ...ROLES].filter(Boolean))];
  return (
    <div ref={ref} className="relative shrink-0">
      <div className="flex">
        <button
          onClick={() => assign(payload.suggested)}
          disabled={pending}
          title={`Assign to ${payload.suggested}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-l-[9px] bg-blue font-medium text-white hover:bg-blue-ink disabled:opacity-60",
            size === "sm" ? "h-7 pl-2.5 pr-2 text-[12px]" : "h-8 pl-3 pr-2.5 text-[13px]",
          )}
        >
          <UserPlus className="size-3.5" />
          {pending ? "Assigning…" : "Assign"}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
