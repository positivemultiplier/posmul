import React from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/shared/lib/security/admin-auth";
import { listFeatureFlagsForAdmin } from "@/shared/lib/feature-flags/feature-flags.server";
import type { FeatureFlagDomain } from "@/shared/lib/feature-flags/feature-flags.domain";
import { ControlCenterClient } from "./ControlCenterClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ domain?: string }>;
}

const VALID_DOMAINS = new Set<FeatureFlagDomain>([
  "prediction",
  "forum",
  "donation",
  "consume",
  "economy",
  "ranking",
  "users",
  "healing_room",
  "system",
]);

export default async function AdminControlCenterPage({ searchParams }: PageProps) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    if (auth.reason === "UNAUTHORIZED") {
      redirect("/auth/login?redirect=/admin/control");
    }
    return null;
  }

  const resolvedParams = await searchParams;
  const initialDomain =
    resolvedParams.domain &&
    VALID_DOMAINS.has(resolvedParams.domain as FeatureFlagDomain)
      ? (resolvedParams.domain as FeatureFlagDomain)
      : "all";

  const { flags, auditLogs } = await listFeatureFlagsForAdmin();

  return (
    <ControlCenterClient
      initialFlags={flags}
      initialAuditLogs={auditLogs}
      initialDomain={initialDomain}
    />
  );
}
