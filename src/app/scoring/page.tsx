import type { Metadata } from "next";
import {
  AudioLines,
  CircleCheck,
  CircleMinus,
  FileSearch,
  ListChecks,
  LockKeyhole,
  Quote,
  ScanSearch,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { Card, CardHeader, Page, PageHeader, SectionTitle } from "@/components/ui";
import { SCORECARDS } from "@/lib/analysis/rubrics";
import { cn } from "@/lib/utils";
import summary from "../../../data/eval/summary.json";

export const metadata: Metadata = { title: "How scoring works" };

const STEPS = [
  {
    icon: AudioLines,
    title: "Transcribe",
    body: "Deepgram Nova-3 separates the rep from the customer and timestamps every word. Card numbers are removed, including when a rep reads them back.",
  },
  {
    icon: LockKeyhole,
    title: "Protect customers",
    body: "Names, phone numbers, emails and street addresses are masked before anything is stored or sent to an AI model. Your team's names are kept.",
  },
  {
    icon: ScanSearch,
    title: "Understand the call",
    body: "The AI decides what kind of call it was, how it ended, and pulls out pests, prices, objections, promised follow-ups and risks.",
  },
  {
