// Day 4 Hr 3-4: three-column dispute detail. Left: dispute + rulebook criteria.
// Center: extracted evidence. Right: decision panel (client component).

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { findRule } from "@/lib/rules/loader";
import { formatMoney, formatDeadline } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DecisionPanel } from "@/components/clearcase/decision-panel";
import { ExtractedEvidencePanel } from "@/components/clearcase/extracted-evidence-panel";
import { AnalysisProvider } from "@/components/clearcase/analysis-context";
import type { AuditEntryView } from "@/components/clearcase/confidence-trace-dialog";

const URGENCY_STYLES: Record<string, string> = {
  expired: "bg-red-50 text-red-700",
  urgent: "bg-red-50 text-red-700",
  soon: "bg-amber-50 text-amber-700",
  ok: "bg-secondary text-muted-foreground",
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      auditEntries: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!dispute) notFound();

  const latestDecision = dispute.decisions[0];
  const initialResult = latestDecision
    ? {
        decision: {
          id: latestDecision.id,
          confidenceBand: latestDecision.confidenceBand,
          action: latestDecision.action,
          rebuttalText: latestDecision.rebuttalText,
          missingItems: latestDecision.missingItems as string[] | null,
          submitted: latestDecision.submitted,
        },
        route: {
          band: latestDecision.confidenceBand,
          action: latestDecision.action,
          reasoning:
            (latestDecision.reasoningTrace as { route?: { reasoning?: string } } | null)?.route
              ?.reasoning ?? "",
        },
      }
    : null;

  // dispute.reasonCodeCanonical stores the seed data's canonical *family* name
  // (e.g. "not_received"), not a rulebook code — reasonCodeRaw is always a real
  // rulebook code (e.g. "13.1") and is what findRule matches on.
  const rule = findRule(dispute.network, dispute.reasonCodeRaw);

  const deadline = formatDeadline(dispute.deadlineAt);

  const auditEntries: AuditEntryView[] = dispute.auditEntries.map((e) => ({
    id: e.id,
    step: e.step,
    payload: e.payload,
    currentHash: e.currentHash,
    createdAt: e.createdAt.toISOString(),
  }));

  const latestExtractEntry = [...dispute.auditEntries]
    .reverse()
    .find((e) => e.step === "extract");
  const claims = (latestExtractEntry?.payload as { claims?: unknown[] } | undefined)
    ?.claims as
    | { claim_type: string; present: boolean; confidence: number; source_span: string | null }[]
    | undefined;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <Link
        href="/disputes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All disputes
      </Link>

      <div className="flex items-center gap-3 mt-3 mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {dispute.razorpayDisputeId}
        </h1>
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${URGENCY_STYLES[deadline.urgency]}`}
        >
          {deadline.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: dispute summary + rulebook criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Dispute Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Amount">{formatMoney(dispute.amount, dispute.currency)}</InfoRow>
            <InfoRow label="Network">
              <span className="capitalize">{dispute.network}</span>
            </InfoRow>
            <InfoRow label="Reason code">{dispute.reasonCodeRaw}</InfoRow>
            <InfoRow label="Status">
              <span className="capitalize">{dispute.status.replace("_", " ")}</span>
            </InfoRow>

            {rule && (
              <>
                <Separator className="my-4" />
                <div className="font-medium text-sm text-foreground">{rule.name}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {rule.source_reference}
                </p>
                {rule.ce3_eligible && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <BadgeCheck className="size-3.5" />
                    CE3.0-eligible reason code
                  </div>
                )}
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Required evidence
                  </div>
                  <ul className="space-y-2">
                    {rule.required_evidence.map((e) => (
                      <li key={e.id} className="flex gap-2 text-sm text-foreground">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        {e.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <AnalysisProvider>
          {/* Center: extracted evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Extracted Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExtractedEvidencePanel claims={claims} />
            </CardContent>
          </Card>

          {/* Right: decision panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                Decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionPanel
                disputeId={dispute.id}
                ce3Eligible={rule?.ce3_eligible ?? false}
                initialAuditEntries={auditEntries}
                initialResult={initialResult}
              />
            </CardContent>
          </Card>
        </AnalysisProvider>
      </div>
    </div>
  );
}
