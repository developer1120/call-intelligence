"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  CircleDollarSign,
  CircleHelp,
  HeartPulse,
  House,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  PhoneCall,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; short?: string; icon: typeof House; match?: (p: string) => boolean };

/** The Call Intelligence module, shown inside the PestLaunch OS navigation. */
const MODULE: NavItem[] = [
  { href: "/", label: "Overview", icon: House, match: (p) => p === "/" },
  { href: "/calls", label: "Calls", icon: PhoneCall, match: (p) => p.startsWith("/calls") },
  { href: "/team", label: "Coaching", icon: Users, match: (p) => p.startsWith("/team") },
  { href: "/tasks", label: "Tasks", icon: ListChecks, match: (p) => p.startsWith("/tasks") },
  { href: "/scoring", label: "How scoring works", short: "Scoring", icon: ShieldCheck, match: (p) => p.startsWith("/scoring") },
];

/** Other PestLaunch OS modules, for context. Not part of this build. */
const OS: { label: string; icon: typeof House }[] = [
  { label: "Assistant", icon: Sparkles },
  { label: "Financials", icon: TrendingUp },
  { label: "Collections", icon: Wallet },
  { label: "Sales", icon: CircleDollarSign },
  { label: "Customer Health", icon: HeartPulse },
  { label: "Updates", icon: Zap },
];

const FOOTER: { label: string; icon: typeof House }[] = [
  { label: "All clients", icon: LayoutGrid },
  { label: "Connections", icon: Plug },
  { label: "Feedback", icon: MessageSquare },
  { label: "Support", icon: CircleHelp },
  { label: "Account", icon: User },
];

/** Reads the current path for the active item; rendered inside <Suspense> in the root layout. */
export function Sidebar({ company }: { company: string }) {
  return <SidebarView company={company} pathname={usePathname()} />;
}

/** Static render used as the Suspense fallback (no active item yet). */
export function SidebarView({ company, pathname }: { company: string; pathname: string }) {
  return (
