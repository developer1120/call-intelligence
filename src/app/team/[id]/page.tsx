import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, CircleCheck, MessageSquareQuote, Target } from "lucide-react";
import { CallTypeBadge, OutcomeBadge, ScorePill } from "@/components/call-badges";
import { SparkBars } from "@/components/sparkbars";
import { Avatar, Card, CardHeader, Page, SectionTitle, Skeleton } from "@/components/ui";
import { SCORECARDS } from "@/lib/analysis/rubrics";
import { buildTeam } from "@/lib/insights";
import { completedCalls } from "@/lib/queries";
import { cn, formatDuration, formatPct, pctTone, plural } from "@/lib/utils";

export default function RepPage(props: PageProps<"/team/[id]">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
        <Rep params={props.params} />
      </Suspense>
    </Page>
  );
}

const STANDARD = new Map(Object.values(SCORECARDS).flatMap((c) => c.items.map((i) => [i.id, i.standard] as const)));

async function Rep({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const calls = await completedCalls();
  const team = buildTeam(calls);
  const r = team.find((t) => t.id === id);
  if (!r) notFound();
  const mine = calls
    .filter((c) => (c.rep?.id ?? "unidentified") === id)
    .sort((a, b) => a.call.label.localeCompare(b.call.label, undefined, { numeric: true }));
  const rank = team.filter((t) => t.avgPct !== null).findIndex((t) => t.id === id) + 1;

  const plan = r.missed.slice(0, 3).map((m) => ({
    ...m,
    standard: STANDARD.get(m.itemId) ?? "",
    lines: r.coachingLines.filter((l) => l.itemId === m.itemId).slice(0, 2),
  }));

  return (
    <>
      <Link href="/team" className="inline-flex items-center gap-0.5 text-[13px] text-blue hover:underline">
        <ChevronLeft className="size-4" /> Coaching
      </Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={r.name === "Unidentified" ? null : r.name} size={56} />
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">{r.name}</h1>
          <p className="text-[13.5px] text-ink-3 capitalize">
            {r.id === "unidentified" ? "Calls where the rep's name wasn't said" : r.role} · {plural(r.calls, "call")}
            {rank > 0 ? ` · #${rank} on the team` : ""}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-3">Average score</div>
          <div className={cn("mt-1 font-display text-[30px] font-semibold tabular", pctTone(r.avgPct))}>{formatPct(r.avgPct)}</div>
          <div className="mt-1 text-[12px] text-ink-3">{plural(r.graded, "graded call")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-3">Grades</div>
          <div className="mt-2 flex gap-1.5 text-[13px] font-semibold tabular">
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-gold-ink">{r.grades.gold} Gold</span>
            <span className="rounded-full bg-green-soft px-2 py-0.5 text-green-ink">{r.grades.green} Green</span>
            <span className="rounded-full bg-red-soft px-2 py-0.5 text-red-ink">{r.grades.below} Below</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-3">Results</div>
          <div className="mt-1.5 text-[14px] text-ink">
            {r.sales.calls ? <div>{r.sales.booked}/{r.sales.calls} new customers booked</div> : null}
