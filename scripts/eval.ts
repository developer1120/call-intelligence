/**
 * Accuracy + consistency report for the analysis engine.
 *   npm run analyze -- --run=r1 && npm run analyze -- --run=r2 && npm run analyze -- --run=r3
 *   npm run eval -- r1 r2 r3
 *
 * Accuracy: call type, outcome and rep name vs. hand labels (data/eval/labels.json).
 * Consistency: across runs, how often type/outcome/each scorecard step agree, and score spread.
 * Writes data/eval/report.md.
 */
import fs from "node:fs";
import path from "node:path";
import type { CallAnalysis } from "../src/lib/analysis/types";
import { CACHE, ROOT, readJson } from "./lib";

type Label = { type: string[]; outcome: string[]; rep: string };
const labels = readJson<{ calls: Record<string, Label> }>(path.join(ROOT, "data", "eval", "labels.json"))!.calls;
const runs = process.argv.slice(2).length ? process.argv.slice(2) : ["r1"];

const byRun = runs.map((r) => {
  const dir = path.join(CACHE, "analyses", r);
  const out: Record<string, CallAnalysis> = {};
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) out[f.replace(".json", "")] = readJson<CallAnalysis>(path.join(dir, f))!;
  return out;
});
const ids = Object.keys(labels).filter((id) => byRun.every((r) => r[id]));

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
let typeOk = 0, outcomeOk = 0, repOk = 0, total = 0, quotes = 0, verified = 0;
const rows: string[] = [];
const misses: string[] = [];

for (const id of ids) {
  const l = labels[id];
  for (const [ri, run] of byRun.entries()) {
