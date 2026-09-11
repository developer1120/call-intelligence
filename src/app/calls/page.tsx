import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CallsList } from "@/components/calls-list";
import { Card, Page, PageHeader, Skeleton } from "@/components/ui";
import { UploadButton } from "@/components/upload";
import { listCalls } from "@/lib/queries";
import { toRowView } from "@/lib/rows";
import { blobEnabled } from "@/lib/storage";

export const metadata: Metadata = { title: "Calls" };

export default function CallsPage() {
  return (
    <Page>
      <PageHeader
        title="Calls"
        subtitle="Every recorded call, classified, graded on your scorecards and summarized."
        actions={<UploadButton directUpload={blobEnabled()} />}
      />
      <Suspense fallback={<ListSkeleton />}>
