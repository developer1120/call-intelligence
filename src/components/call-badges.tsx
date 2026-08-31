import { GRADE_LABEL, type Grade } from "@/lib/analysis/rubrics";
import {
  CALL_TYPE_LABEL,
  OUTCOME_LABEL,
  OUTCOME_TONE,
  type CallType,
  type Outcome,
} from "@/lib/analysis/taxonomy";
import type { ScorecardResult } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

const TYPE_TONE: Record<CallType, Parameters<typeof Badge>[0]["tone"]> = {
  new_customer: "violet",
  scheduling: "blue",
  billing: "neutral",
  reservice: "orange",
  retention: "red",
  other: "neutral",
  not_scoreable: "muted",
};

export function CallTypeBadge({ type, className }: { type: CallType; className?: string }) {
  return (
    <Badge tone={TYPE_TONE[type]} className={className}>
      {CALL_TYPE_LABEL[type]}
    </Badge>
  );
}

