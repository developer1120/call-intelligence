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
