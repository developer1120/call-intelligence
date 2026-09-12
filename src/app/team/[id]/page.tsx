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
