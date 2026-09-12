"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { CALL_TYPES, type CallType } from "@/lib/analysis/taxonomy";
import { getDb, schema } from "@/lib/db";
import { enqueue, newId, rescoreCall } from "@/lib/pipeline";

const { tasks, overrides, calls } = schema;

function refreshAll() {
  revalidatePath("/", "layout");
}

export async function assignTask(input: {
  sourceKey: string;
  kind: string;
  title: string;
  detail: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  callId: string | null;
}) {
  const db = await getDb();
  await db
    .insert(tasks)
    .values({ id: newId(), ...input, assignee: input.assignee.trim() || "Unassigned" })
    .onConflictDoUpdate({ target: tasks.sourceKey, set: { assignee: input.assignee, status: "open", completedAt: null } });
  refreshAll();
}

export async function setTaskStatus(taskId: string, done: boolean) {
  const db = await getDb();
  await db
    .update(tasks)
    .set({ status: done ? "done" : "open", completedAt: done ? new Date() : null })
    .where(eq(tasks.id, taskId));
  refreshAll();
}

export async function deleteTask(taskId: string) {
