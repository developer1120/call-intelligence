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
