// Day 4 Hr 3-4: three-column dispute detail. Left: dispute + rulebook criteria.
// Center: extracted evidence. Right: decision panel (client component).

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findRule } from "@/lib/rules/loader";
import { formatMoney, formatDeadline } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionPanel } from "@/components/clearcase/decision-panel";
import type { AuditEntryView } from "@/components/clearcase/confidence-trace-dialog";

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
    },
  });

  if (!dispute) notFound();

  const rule = findRule(
    dispute.network,
    dispute.reasonCodeCanonical ?? dispute.reasonCodeRaw
  );

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
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/disputes" className="text-sm text-muted-foreground hover:underline">
        &larr; All disputes
      </Link>

      <div className="grid grid-cols-3 gap-6 mt-4">
        {/* Left: dispute summary + rulebook criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dispute.razorpayDisputeId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Amount: </span>
              {formatMoney(dispute.amount, dispute.currency)}
            </div>
            <div>
              <span className="text-muted-foreground">Network: </span>
              <span className="capitalize">{dispute.network}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reason code: </span>
              {dispute.reasonCodeRaw}
            </div>
            <div>
              <span className="text-muted-foreground">Deadline: </span>
              {deadline.label}
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="capitalize">{dispute.status.replace("_", " ")}</span>
            </div>

            {rule && (
              <>
                <hr className="my-3" />
                <div className="font-medium">{rule.name}</div>
                <div className="text-xs text-muted-foreground">{rule.source_reference}</div>
                {rule.ce3_eligible && (
                  <div className="text-xs bg-blue-50 text-blue-800 rounded px-2 py-1">
                    CE3.0-eligible reason code
                  </div>
                )}
                <div className="mt-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Required evidence
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {rule.required_evidence.map((e) => (
                      <li key={e.id} className="text-xs">
                        {e.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Center: extracted evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extracted Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!claims || claims.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Run analysis to extract claims from evidence.
              </p>
            ) : (
              claims.map((c) => (
                <div
                  key={c.claim_type}
                  className={`text-sm border rounded p-2 ${c.present ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{c.claim_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.present ? `${Math.round(c.confidence * 100)}% confidence` : "not found"}
                    </span>
                  </div>
                  {c.source_span && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      &quot;{c.source_span}&quot;
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: decision panel */}
        <Card>
          <CardContent className="pt-6">
            <DecisionPanel
              disputeId={dispute.id}
              ce3Eligible={rule?.ce3_eligible ?? false}
              initialAuditEntries={auditEntries}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
