import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, ListChecks } from "lucide-react";
import { TaskCheck, TaskDelete } from "@/components/task-check";
import { Avatar, Badge, ButtonLink, Card, EmptyState, Page, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { listTasks } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <Page className="max-w-[900px]">
      <PageHeader title="Tasks" subtitle="Follow-ups, win-backs and coaching assigned from your calls." />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Tasks />
      </Suspense>
    </Page>
  );
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

async function Tasks() {
  await connection();
  const rows = await listTasks();
  if (!rows.length) {
