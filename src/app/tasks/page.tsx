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
    return (
      <Card>
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title="No tasks yet"
          action={
            <ButtonLink href="/" variant="soft">
              Go to Needs attention
            </ButtonLink>
          }
        >
          Use Assign on anything in Needs attention, or on a promised follow-up in a call, and it shows up here.
        </EmptyState>
      </Card>
    );
  }
  const open = rows
    .filter((r) => r.task.status === "open")
    .sort((a, b) => PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority]);
  const done = rows.filter((r) => r.task.status === "done");
  const byAssignee = new Map<string, typeof open>();
  for (const r of open) byAssignee.set(r.task.assignee, [...(byAssignee.get(r.task.assignee) ?? []), r]);

  return (
    <div className="space-y-6">
      {[...byAssignee.entries()].map(([assignee, list]) => (
        <section key={assignee}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <Avatar name={assignee} size={22} />
            <SectionTitle>{assignee}</SectionTitle>
            <span className="text-[12px] text-ink-4">{list.length}</span>
          </div>
          <Card>
            <ul className="divide-y divide-hairline/80">
              {list.map((r) => (
                <TaskRow key={r.task.id} r={r} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
      {open.length === 0 && (
        <Card>
          <EmptyState icon={<ListChecks className="size-5" />} title="Everything's done">
            Nice work. New items show up on the Overview as calls come in.
          </EmptyState>
        </Card>
      )}
      {done.length > 0 && (
        <section>
          <SectionTitle className="mb-2 px-1">Done · {done.length}</SectionTitle>
          <Card>
            <ul className="divide-y divide-hairline/80">
              {done.map((r) => (
                <TaskRow key={r.task.id} r={r} />
              ))}
            </ul>
          </Card>
        </section>
      )}
