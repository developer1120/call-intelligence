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
