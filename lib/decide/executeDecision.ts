// Shared by POST /api/decide/[disputeId]/execute and scripts/seed-decisions.ts, so the
// demo-data pre-computation and the live "Run analysis" button run identical logic.
// Runs the full pipeline, routes by confidence, generates the rebuttal/missing-doc/accept
// output, writes Decision + AuditEntry for every step.

import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/rules/pipeline";
import { routeDecision } from "@/lib/rules/router";
import { generateRebuttal } from "@/lib/rebuttal/generate";
import { generateAcceptExplanation } from "@/lib/rebuttal/accept-explanation";
import { appendAuditEntry } from "@/lib/audit/chain";
import type { CurrentTransactionAttrs } from "@/lib/ce3/assemble";
import type { Dispute } from "@prisma/client";

export interface ExecuteDecisionInput {
  dispute: Dispute;
  evidenceDocs: { docType: string; rawText: string }[];
  ce3Transaction?: CurrentTransactionAttrs;
}

export async function executeDecisionForDispute(input: ExecuteDecisionInput) {
  const { dispute } = input;

  const pipeline = await runPipeline({
    network: dispute.network,
    reasonCodeRaw: dispute.reasonCodeRaw,
    evidenceDocs: input.evidenceDocs,
    ce3Transaction: input.ce3Transaction,
  });

  let lastHash = (await appendAuditEntry(dispute.id, "classify", pipeline.classification))
    .currentHash;
  if (pipeline.ce3) {
    lastHash = (await appendAuditEntry(dispute.id, "ce3_assemble", pipeline.ce3, lastHash))
      .currentHash;
  }
  lastHash = (
    await appendAuditEntry(dispute.id, "extract", { claims: pipeline.claims }, lastHash)
  ).currentHash;
  lastHash = (await appendAuditEntry(dispute.id, "exclude", pipeline.exclusion, lastHash))
    .currentHash;
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
    lastHash = (await appendAuditEntry(dispute.id, "generate_rebuttal", rebuttal, lastHash))
      .currentHash;
  } else if (route.action === "REQUEST_DOC") {
    missingItems = pipeline.score.missing;
    lastHash = (
      await appendAuditEntry(dispute.id, "request_doc", { missingItems }, lastHash)
    ).currentHash;
  } else {
    const accept = await generateAcceptExplanation({
      reasonForLowConfidence: route.reasoning,
      missing: pipeline.score.missing,
      disputedAmount: dispute.amount,
      currency: dispute.currency,
    });
    rebuttalText = accept.explanation;
    lastHash = (await appendAuditEntry(dispute.id, "recommend_accept", accept, lastHash))
      .currentHash;
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

  return { decision, route };
}
