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
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setParam("view", v.id === "all" ? null : v.id)}
              className={cn(
                "flex h-7 shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-medium transition",
                view === v.id ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {v.label}
              <span className="tabular text-ink-4">{counts[v.id]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-[9px] border border-hairline bg-surface px-2.5 text-[13px] focus-within:border-blue">
            <Search className="size-3.5 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, rep, outcome…"
              className="w-44 bg-transparent outline-none placeholder:text-ink-4"
            />
          </label>
          <select
            value={rep}
            onChange={(e) => setParam("rep", e.target.value || null)}
            className="h-8 rounded-[9px] border border-hairline bg-surface px-2 text-[13px] text-ink-2"
            aria-label="Filter by rep"
          >
            <option value="">All reps</option>
            {reps.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="h-8 rounded-[9px] border border-hairline bg-surface px-2 text-[13px] text-ink-2"
            aria-label="Sort"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<PhoneOff className="size-5" />} title={rows.length ? "No calls match" : "No calls yet"}>
          {rows.length ? "Try a different filter or search." : "Upload call recordings to get transcripts, scores and coaching."}
        </EmptyState>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_118px_150px_96px_150px_60px] gap-4 px-5 pt-3 pb-2 text-[11.5px] font-medium tracking-wide text-ink-4 uppercase lg:grid">
