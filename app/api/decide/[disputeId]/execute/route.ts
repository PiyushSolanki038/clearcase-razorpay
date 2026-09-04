// Day 3 Hr 10: dispute in -> full decision out. See lib/decide/executeDecision.ts for
// the actual pipeline — shared with scripts/seed-decisions.ts so the pre-computed demo
// data and this live endpoint run identical logic.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { executeDecisionForDispute } from "@/lib/decide/executeDecision";
import { ce3TransactionSchema } from "@/lib/schemas/ce3";

const requestSchema = z.object({
  evidenceDocs: z.array(
    z.object({
      docType: z.string(),
      rawText: z.string().min(1),
    })
  ),
  ce3Transaction: ce3TransactionSchema.optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const { disputeId } = await params;
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  try {
    const result = await executeDecisionForDispute({
      dispute,
      evidenceDocs: parsed.data.evidenceDocs,
      ce3Transaction: parsed.data.ce3Transaction,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 422 }
    );
  }
}
