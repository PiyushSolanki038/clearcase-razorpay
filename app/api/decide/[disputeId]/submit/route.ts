// Day 4 Hr 7-8: "Approve & Submit" — logs to console (no real Razorpay integration per
// Hard NOs), marks the latest Decision as submitted, writes an audit entry.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/chain";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const { disputeId } = await params;

  const decision = await prisma.decision.findFirst({
    where: { disputeId },
    orderBy: { createdAt: "desc" },
  });

  if (!decision) {
    return NextResponse.json({ error: "No decision found for this dispute" }, { status: 404 });
  }

  const updated = await prisma.decision.update({
    where: { id: decision.id },
    data: { submitted: true },
  });

  console.log(`[ClearCase] Rebuttal submitted for dispute ${disputeId}, decision ${decision.id}`);
  await appendAuditEntry(disputeId, "submitted", { decisionId: decision.id });

  return NextResponse.json({ decision: updated });
}
