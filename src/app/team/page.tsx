import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, MessageSquareQuote, Users } from "lucide-react";
import { SparkBars } from "@/components/sparkbars";
import { Avatar, Card, CardHeader, EmptyState, Page, PageHeader, Skeleton } from "@/components/ui";
import { SCORECARDS } from "@/lib/analysis/rubrics";
import { buildTeam, stepRates } from "@/lib/insights";
import { completedCalls } from "@/lib/queries";
import { cn, formatPct, pctTone, plural } from "@/lib/utils";

export const metadata: Metadata = { title: "Coaching" };

const EXAMPLE = new Map(Object.values(SCORECARDS).flatMap((c) => c.items.map((i) => [i.id, i.example] as const)));

export default function TeamPage() {
  return (
    <Page>
      <PageHeader title="Coaching" subtitle="Who's following your call process, and the one thing each person should work on next." />
      <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
        <Team />
      </Suspense>
    </Page>
  );
}

async function Team() {
  await connection();
  const calls = await completedCalls();
  const team = buildTeam(calls);
  if (!team.length) {
    return (
      <Card>
        <EmptyState icon={<Users className="size-5" />} title="No graded calls yet">
          Once calls are processed, each rep&apos;s scores and coaching plan show up here.
        </EmptyState>
      </Card>
    );
  }

  // Team-wide weakest steps, with the best coaching line written for each.
  const gaps = (["service", "sales", "retention"] as const)
    .flatMap((id) => stepRates(calls, id).map((s) => ({ ...s, card: id })))
    .filter((s) => s.of >= 2 && s.met < s.of)
    .sort((a, b) => a.met / a.of - b.met / b.of)
    .slice(0, 3)
    .map((g) => {
      const line = calls
        .flatMap((c) => (c.analysis.coaching?.improvements ?? []).map((i) => ({ ...i, callId: c.call.id, label: c.call.label })))
        .find((i) => i.itemId === g.itemId);
      return { ...g, line };
    });

  return (
    <div className="space-y-5">
      <Card>
        <div className="hidden grid-cols-[minmax(0,1.3fr)_70px_90px_150px_110px_minmax(0,1.2fr)_120px_20px] gap-4 border-b border-hairline px-5 py-2.5 text-[11.5px] font-medium tracking-wide text-ink-4 uppercase lg:grid">
          <span>Rep</span>
          <span>Calls</span>
          <span>Score</span>
          <span>Gold · Green · Below</span>
          <span>Sales / saves</span>
          <span>Work on next</span>
          <span>Recent calls</span>
          <span />
        </div>
        <ul className="divide-y divide-hairline/80">
          {team.map((r, idx) => (
            <li key={r.id}>
              <Link
                href={`/team/${r.id}`}
                className="grid items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-sunken/60 lg:grid-cols-[minmax(0,1.3fr)_70px_90px_150px_110px_minmax(0,1.2fr)_120px_20px]"
              >
