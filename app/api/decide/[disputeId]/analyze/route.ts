// Day 2 Hr 9-10: paste a dispute + evidence text, get back full analysis.
// Runs classify -> extract -> exclude -> score. No persistence — that's /execute's job.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/rules/pipeline";
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

  let pipeline;
  try {
    pipeline = await runPipeline({
      network: dispute.network,
      reasonCodeRaw: dispute.reasonCodeRaw,
      evidenceDocs: parsed.data.evidenceDocs,
      ce3Transaction: parsed.data.ce3Transaction,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 422 }
    );
  }

  return NextResponse.json({
    dispute: { id: dispute.id, network: dispute.network, reasonCodeRaw: dispute.reasonCodeRaw },
    classification: pipeline.classification,
    rule: {
      reason_code: pipeline.rule.reason_code,
      name: pipeline.rule.name,
      ce3_eligible: pipeline.rule.ce3_eligible,
    },
    claims: pipeline.claims,
    exclusion: pipeline.exclusion,
    score: pipeline.score,
    ce3: pipeline.ce3,
  });
}
