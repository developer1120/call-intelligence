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
