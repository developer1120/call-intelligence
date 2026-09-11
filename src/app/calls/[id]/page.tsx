import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AudioLines, ChevronLeft, CircleAlert, Clock, Loader2 } from "lucide-react";
import { AutoRefresh, CallActions, RetryCall } from "@/components/call/controls";
import { PlayerProvider } from "@/components/call/player-context";
import { CoachingCard, DetailsCard, Hero, NextSteps, ScorecardCard, TrustBar } from "@/components/call/sections";
import { TranscriptPanel, type Marker } from "@/components/call/transcript-panel";
import { Avatar, Card, Page, Skeleton } from "@/components/ui";
import type { CallAnalysis } from "@/lib/analysis/types";
import { getCall, listReps } from "@/lib/queries";
import { formatDuration } from "@/lib/utils";

export default function CallPage(props: PageProps<"/calls/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <CallDetail params={props.params} />
    </Suspense>
  );
}

async function CallDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [d, reps] = await Promise.all([getCall(id), listReps()]);
  if (!d) notFound();
  const { call, analysis: a, transcript } = d;
  const working = (call.status === "queued" || call.status === "transcribing" || call.status === "analyzing") && !d.stalled;
  const typeOverridden = !!a && a.callType !== a.raw.triage.callType;
  const people = reps.map((r) => r.name);

  const header = (
    <div className="mb-5">
      <Link href="/calls" className="inline-flex items-center gap-0.5 text-[13px] text-blue hover:underline">
        <ChevronLeft className="size-4" /> Calls
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
