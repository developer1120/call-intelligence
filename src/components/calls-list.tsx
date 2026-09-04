"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CircleAlert, ClipboardCheck, Flag, Loader2, PhoneOff, RotateCw, Search, ShieldAlert } from "lucide-react";
import { reprocessCall } from "@/app/actions";
import type { CallRowView } from "@/lib/rows";
import { cn, formatDuration, formatMoney } from "@/lib/utils";
import { CallTypeBadge, OutcomeBadge, ScorePill } from "./call-badges";
import { Avatar, Badge, Card, EmptyState } from "./ui";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "sales", label: "Sales" },
  { id: "service", label: "Service" },
  { id: "retention", label: "Retention" },
  { id: "ungraded", label: "Not graded" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  lowest: "Lowest score",
  value: "Most $ at stake",
} as const;
type Sort = keyof typeof SORTS;

const IN_PROGRESS = new Set(["queued", "transcribing", "analyzing"]);

export function needsAttention(r: CallRowView) {
  return (
    r.money.direction === "lost" ||
    r.money.direction === "at_risk" ||
    r.highRisk ||
    r.followUps > 0 ||
    r.needsReview ||
    r.status === "failed"
  );
}

function matchesView(r: CallRowView, view: View) {
  switch (view) {
    case "all":
      return true;
    case "attention":
      return needsAttention(r);
    case "sales":
      return r.scorecardId === "sales";
    case "service":
      return r.scorecardId === "service";
    case "retention":
      return r.scorecardId === "retention";
    case "ungraded":
      return r.status === "complete" && !r.score;
  }
}

export function CallsList({ rows }: { rows: CallRowView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = (VIEWS.find((v) => v.id === params.get("view"))?.id ?? "all") as View;
  const rep = params.get("rep") ?? "";
  const sort = (params.get("sort") as Sort) in SORTS ? (params.get("sort") as Sort) : "oldest";
  const [query, setQuery] = useState("");

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };

  // Keep the list live while calls are processing.
  const processing = rows.some((r) => IN_PROGRESS.has(r.status) && !r.stalled);
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [processing, router]);

  const reps = useMemo(() => [...new Set(rows.map((r) => r.repName).filter(Boolean))].sort() as string[], [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        matchesView(r, view) &&
        (!rep || r.repName === rep) &&
        (!q ||
          [r.label, r.customerName, r.repName, r.headline, r.summary].some((s) => s?.toLowerCase().includes(q))),
    );
    const byLabel = (a: CallRowView, b: CallRowView) => a.label.localeCompare(b.label, undefined, { numeric: true });
    return list.sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt) || -byLabel(a, b);
      if (sort === "lowest") return (a.score ? a.score.score / a.score.max : 2) - (b.score ? b.score.score / b.score.max : 2);
      if (sort === "value") {
        const v = (r: CallRowView) => (r.money.direction === "lost" || r.money.direction === "at_risk" ? (r.money.value ?? 0) : 0);
        return v(b) - v(a);
      }
      return a.createdAt.localeCompare(b.createdAt) || byLabel(a, b);
    });
  }, [rows, view, rep, query, sort]);

  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, rows.filter((r) => matchesView(r, v.id)).length])), [rows]);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-[11px] bg-sunken p-[3px]">
