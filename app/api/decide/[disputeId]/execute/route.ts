// Day 3 Hr 10: dispute in -> full decision out. Runs the pipeline, routes by confidence,
// generates the rebuttal/missing-doc-request/accept-explanation, writes Decision +
// AuditEntry for every step. This is the backend loop's final endpoint.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/rules/pipeline";
import { routeDecision } from "@/lib/rules/router";
import { generateRebuttal } from "@/lib/rebuttal/generate";
import { generateAcceptExplanation } from "@/lib/rebuttal/accept-explanation";
import { appendAuditEntry } from "@/lib/audit/chain";

const requestSchema = z.object({
  evidenceDocs: z.array(
    z.object({
      docType: z.string(),
      rawText: z.string().min(1),
    })
  ),
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
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 422 }
    );
  }

  await appendAuditEntry(dispute.id, "classify", pipeline.classification);
  await appendAuditEntry(dispute.id, "extract", { claims: pipeline.claims });
  await appendAuditEntry(dispute.id, "exclude", pipeline.exclusion);
  await appendAuditEntry(dispute.id, "score", pipeline.score);

  const route = routeDecision({
    score: pipeline.score,
    exclusion: pipeline.exclusion,
    deadlineAt: dispute.deadlineAt,
  });

  await appendAuditEntry(dispute.id, "route", route);

  let rebuttalText: string | null = null;
  let missingItems: string[] | null = null;

  if (route.action === "AUTO_REBUT") {
    const rebuttal = await generateRebuttal({
      rule: pipeline.rule,
      presentClaims: pipeline.claims,
      disputeAmount: dispute.amount,
      currency: dispute.currency,
    });
    rebuttalText = rebuttal.body;
    await appendAuditEntry(dispute.id, "generate_rebuttal", rebuttal);
  } else if (route.action === "REQUEST_DOC") {
    missingItems = pipeline.score.missing;
    await appendAuditEntry(dispute.id, "request_doc", { missingItems });
  } else {
    const accept = await generateAcceptExplanation({
      reasonForLowConfidence: route.reasoning,
      missing: pipeline.score.missing,
      disputedAmount: dispute.amount,
      currency: dispute.currency,
    });
    rebuttalText = accept.explanation;
    await appendAuditEntry(dispute.id, "recommend_accept", accept);
  }

  const decision = await prisma.decision.create({
    data: {
      disputeId: dispute.id,
      confidenceBand: route.band,
      action: route.action,
      rebuttalText,
      missingItems: missingItems ?? undefined,
      reasoningTrace: JSON.parse(
        JSON.stringify({
          classification: pipeline.classification,
          exclusion: pipeline.exclusion,
          score: pipeline.score,
          route,
        })
      ),
    },
  });

  await appendAuditEntry(dispute.id, "decision_created", { decisionId: decision.id });

  return NextResponse.json({ decision, route });
}
