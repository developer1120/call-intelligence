"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, UserPlus } from "lucide-react";
import { assignTask, setTaskStatus } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui";

export interface AssignPayload {
  sourceKey: string;
  kind: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  callId: string | null;
  suggested: string;
}

const ROLES = ["Owner", "Manager", "Office Manager"];

/** PestLaunch-style blue "Assign" button that turns an insight into a task. */
export function AssignButton({
  payload,
  people,
  task,
  size = "md",
}: {
  payload: AssignPayload;
