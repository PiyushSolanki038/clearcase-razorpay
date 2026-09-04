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

  // Only the first call needs to look up the last stored hash — every subsequent call
  // in this request chains off the previous call's return value, cutting the audit log
  // from ~16-18 sequential DB round trips down to ~8 (see lib/audit/chain.ts).
  let lastHash = (await appendAuditEntry(dispute.id, "classify", pipeline.classification)).currentHash;
  if (pipeline.ce3) {
    lastHash = (await appendAuditEntry(dispute.id, "ce3_assemble", pipeline.ce3, lastHash)).currentHash;
  }
  lastHash = (await appendAuditEntry(dispute.id, "extract", { claims: pipeline.claims }, lastHash)).currentHash;
  lastHash = (await appendAuditEntry(dispute.id, "exclude", pipeline.exclusion, lastHash)).currentHash;
  lastHash = (await appendAuditEntry(dispute.id, "score", pipeline.score, lastHash)).currentHash;

  const route = routeDecision({
    score: pipeline.score,
    exclusion: pipeline.exclusion,
    deadlineAt: dispute.deadlineAt,
  });

  lastHash = (await appendAuditEntry(dispute.id, "route", route, lastHash)).currentHash;

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
    lastHash = (await appendAuditEntry(dispute.id, "generate_rebuttal", rebuttal, lastHash)).currentHash;
  } else if (route.action === "REQUEST_DOC") {
    missingItems = pipeline.score.missing;
    lastHash = (await appendAuditEntry(dispute.id, "request_doc", { missingItems }, lastHash)).currentHash;
  } else {
    const accept = await generateAcceptExplanation({
      reasonForLowConfidence: route.reasoning,
      missing: pipeline.score.missing,
      disputedAmount: dispute.amount,
      currency: dispute.currency,
    });
    rebuttalText = accept.explanation;
    lastHash = (await appendAuditEntry(dispute.id, "recommend_accept", accept, lastHash)).currentHash;
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
          ce3: pipeline.ce3,
          exclusion: pipeline.exclusion,
          score: pipeline.score,
          route,
        })
      ),
    },
  });

  await appendAuditEntry(dispute.id, "decision_created", { decisionId: decision.id }, lastHash);

  return NextResponse.json({ decision, route });
}
