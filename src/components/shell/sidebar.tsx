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
