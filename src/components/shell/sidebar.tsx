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
    <>
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-hairline bg-sidebar px-3 pt-4 pb-3 md:flex">
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <div className="grid size-8 place-items-center rounded-[9px] bg-blue text-white shadow-sm">
            <Bug className="size-[18px]" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-ink">{company} OS</div>
            <div className="text-[11px] text-ink-3">Powered by PestLaunch</div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-[9px] border border-hairline bg-surface px-2.5 py-1.5 text-[13px] text-ink-3">
          <Search className="size-3.5" />
          <span className="flex-1">Search</span>
          <kbd className="rounded border border-hairline px-1 text-[10px] text-ink-4">⌘K</kbd>
        </div>

        <SectionLabel>Call Intelligence</SectionLabel>
        <nav className="space-y-0.5">
          {MODULE.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] transition-colors",
                  active ? "bg-blue-soft font-medium text-blue-ink" : "text-ink-2 hover:bg-black/[0.04]",
                )}
