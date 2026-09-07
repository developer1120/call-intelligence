import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  CircleMinus,
  CircleX,
  Flag,
  Lightbulb,
  MessageSquareQuote,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { GRADE_LABEL } from "@/lib/analysis/rubrics";
import { CALL_TYPE_LABEL } from "@/lib/analysis/taxonomy";
import type { CallAnalysis, ScoredItem } from "@/lib/analysis/types";
import type { TaskRow } from "@/lib/db/schema";
import { cn, formatMoney } from "@/lib/utils";
import { AssignButton } from "../assign";
import { CallTypeBadge, GRADE_STYLE, OutcomeBadge, ScoreRing } from "../call-badges";
import { Badge, Card, CardHeader, SectionTitle } from "../ui";
import { ItemOverride } from "./controls";
import { EvidenceQuote, JumpTo } from "./evidence";

const NOT_SCOREABLE_TEXT: Record<string, string> = {
  voicemail: "This was a voicemail, so there is no conversation to grade.",
  wrong_number: "Wrong number — no customer conversation to grade.",
  spam_or_solicitation: "Spam or solicitation — not a customer call.",
  internal_or_vendor: "Internal or vendor call — not graded against customer scorecards.",
  dropped_or_too_short: "The call ended before the customer's need was discussed.",
  none: "This call isn't graded.",
};

const SENTIMENT = { positive: "😊 Positive", neutral: "😐 Neutral", negative: "😟 Negative" } as const;

export function Hero({ a }: { a: CallAnalysis }) {
  const sc = a.scorecard;
  const money = a.money;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start md:p-6">
        {sc ? (
          <div className="flex shrink-0 items-center gap-4 sm:w-[190px] sm:flex-col sm:items-start sm:gap-3">
            <ScoreRing score={sc.score} max={sc.max} grade={sc.grade} size={92} />
            <div>
              <div className={cn("text-[15px] font-semibold", GRADE_STYLE[sc.grade].text)}>{GRADE_LABEL[sc.grade]}</div>
              <div className="text-[12.5px] text-ink-3">{sc.name.replace(" (All Calls)", "")}</div>
              <div className="mt-1 text-[11.5px] text-ink-4">
                Gold {sc.bands.gold}/{sc.max} · Green {sc.bands.green}+
              </div>
            </div>
          </div>
        ) : (
          <div className="grid size-[92px] shrink-0 place-items-center rounded-full bg-sunken text-center text-[12px] font-medium text-ink-3">
            Not
            <br />
            graded
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OutcomeBadge outcome={a.outcome.result} />
            <CallTypeBadge type={a.callType} />
            {a.customerStatus === "new_prospect" && <Badge tone="neutral">New prospect</Badge>}
            {a.customerStatus === "existing_customer" && <Badge tone="neutral">Existing customer</Badge>}
          </div>
          <h2 className="mt-3 font-display text-[21px] leading-snug font-semibold tracking-[-0.01em] text-ink">{a.outcome.headline}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{a.summary}</p>
          {!sc && <p className="mt-2 text-[13px] text-ink-3">{NOT_SCOREABLE_TEXT[a.notScoreableReason] ?? NOT_SCOREABLE_TEXT.none}</p>}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
            {money.direction && money.annualValue != null && (
              <span className={cn("font-medium", money.direction === "won" || money.direction === "saved" ? "text-green-ink" : "text-red-ink")}>
                {money.direction === "won" ? "Won" : money.direction === "saved" ? "Saved" : money.direction === "lost" ? "Lost" : "At risk"}{" "}
                {formatMoney(money.annualValue)}/yr
                <span className="font-normal text-ink-4"> · {money.basis === "quoted" ? "from prices quoted" : "estimate"}</span>
              </span>
            )}
            <span>
              Sentiment {SENTIMENT[a.sentiment.start]} <ArrowRight className="inline size-3" /> {SENTIMENT[a.sentiment.end]}
            </span>
            {a.outcome.evidence[0] && <JumpTo e={a.outcome.evidence[0]} label="Hear the outcome" />}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TrustBar({ a, typeOverridden }: { a: CallAnalysis; typeOverridden: boolean }) {
  const q = a.quality;
  return (
    <div className="space-y-2">
      {q.needsReview && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-orange/30 bg-orange-soft px-4 py-3 text-[13px] text-orange-ink">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <span className="font-semibold">Worth a quick human check. </span>
            {q.reasons.join(" · ")}. Use <span className="font-medium">Review</span> to correct anything.
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-[12.5px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-green" />
          {q.evidenceVerified} of {q.evidenceChecked} cited quotes verified against the transcript
          <Link href="/scoring" className="ml-1 font-medium text-blue hover:underline">
            How scoring works
          </Link>
        </span>
        <span className="inline-flex items-center gap-1.5" title={a.callTypeReason}>
          <BadgeCheck className="size-3.5 text-blue" />
          {typeOverridden ? "Call type set by a manager" : `${CALL_TYPE_LABEL[a.callType]} · ${a.callTypeConfidence} confidence`}
          <span className="hidden text-ink-4 md:inline">— {a.callTypeReason}</span>
        </span>
      </div>
    </div>
  );
}

export function CoachingCard({ a }: { a: CallAnalysis }) {
  const c = a.coaching;
  if (!c) return null;
  return (
    <Card>
      <CardHeader
        title="Coaching"
        subtitle={a.repName ? `For ${a.repName}, from this call` : "From this call"}
        icon={
          <span className="grid size-7 place-items-center rounded-[9px] bg-violet-soft text-violet">
            <Sparkles className="size-4" />
          </span>
        }
      />
      <div className="px-5 pb-5">
        <div className="rounded-[14px] bg-gradient-to-br from-violet-soft to-blue-soft/60 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <Target className="mt-0.5 size-4 shrink-0 text-violet" />
            <p className="text-[14.5px] leading-snug font-medium text-ink">{c.headline}</p>
          </div>
        </div>

        {c.improvements.length > 0 && (
          <div className="mt-5">
            <SectionTitle>Do this next time</SectionTitle>
            <ol className="mt-2.5 space-y-3">
              {c.improvements.map((imp, i) => (
                <li key={i} className="rounded-[14px] border border-hairline p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sunken text-[12px] font-semibold text-ink-2">
                        {i + 1}
                      </span>
                      <div className="text-[14px] font-semibold text-ink">{imp.title}</div>
                    </div>
                    {imp.evidence && <JumpTo e={imp.evidence} />}
                  </div>
                  <div className="mt-2 space-y-1.5 pl-[34px] text-[13px] leading-relaxed text-ink-2">
                    <p>
                      <span className="text-ink-4">What happened · </span>
                      {imp.whatHappened}
                    </p>
                    <p>
                      <span className="text-ink-4">Why it matters · </span>
                      {imp.impact}
                    </p>
                  </div>
                  <div className="mt-3 ml-[34px] flex items-start gap-2 rounded-[12px] bg-blue-soft/70 px-3 py-2.5">
                    <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-blue" />
                    <div>
                      <div className="text-[11px] font-semibold tracking-wide text-blue-ink uppercase">Try saying</div>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink">“{imp.tryThis}”</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {c.strengths.length > 0 && (
          <div className="mt-5">
            <SectionTitle>What went well</SectionTitle>
            <ul className="mt-2.5 grid gap-2.5 md:grid-cols-2">
              {c.strengths.map((s, i) => (
                <li key={i} className="rounded-[14px] bg-green-soft/60 p-3.5">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-green-ink">
