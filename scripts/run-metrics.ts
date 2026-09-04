// Day 5 Hr 1-3: runs the full pipeline across all seed disputes, compares to ground
// truth, computes the metrics CLAUDE.md requires, writes metrics/latest.json.
// Run with: npx tsx scripts/run-metrics.ts

import { writeFile } from "fs/promises";
import path from "path";
import { seedDisputes } from "../seed/disputes";
import { buildEvidenceDocs } from "../seed/evidenceTemplates";
import { runPipeline } from "../lib/rules/pipeline";
import { routeDecision } from "../lib/rules/router";
import { checkExclusions } from "../lib/rules/exclusions";
import { scoreEvidence } from "../lib/rules/scorer";
import { computeMetrics, type DisputeResult } from "../lib/metrics/compute";
import { generateBaselineRebuttal } from "../lib/rebuttal/baseline";

const BASELINE_SAMPLE_SIZE = 3;

async function main() {
  console.log(`Running metrics across ${seedDisputes.length} seed disputes...`);

  const results: DisputeResult[] = [];
  const perDisputeDetail: Record<string, unknown>[] = [];

  for (const dispute of seedDisputes) {
    const evidenceDocs = buildEvidenceDocs(dispute);

    let pipeline;
    try {
      pipeline = await runPipeline({
        network: dispute.network,
        reasonCodeRaw: dispute.reasonCodeRaw,
        evidenceDocs,
        ce3Transaction: dispute.ce3Transaction,
      });
    } catch (err) {
      console.error(`Pipeline failed for ${dispute.razorpayDisputeId}:`, err);
      continue;
    }

    // Re-run just the deterministic steps to measure decision latency excluding
    // the LLM calls already made inside runPipeline (classify/extract/generate).
    const t0 = performance.now();
    const exclusion = checkExclusions(pipeline.rule, pipeline.claims);
    const score = scoreEvidence(pipeline.rule, pipeline.claims);
    const route = routeDecision({
      score,
      exclusion,
      deadlineAt: new Date(dispute.deadlineAt),
    });
    const decisionLatencyMs = performance.now() - t0;

    results.push({
      razorpayDisputeId: dispute.razorpayDisputeId,
      groundTruthLabel: dispute.groundTruthLabel,
      band: route.band,
      action: route.action,
      decisionLatencyMs,
    });

    perDisputeDetail.push({
      razorpayDisputeId: dispute.razorpayDisputeId,
      network: dispute.network,
      reasonCodeRaw: dispute.reasonCodeRaw,
      groundTruthLabel: dispute.groundTruthLabel,
      groundTruthNotes: dispute.groundTruthNotes,
      systemBand: route.band,
      systemAction: route.action,
      systemReasoning: route.reasoning,
      correct: matchesGroundTruth(dispute.groundTruthLabel, route.action),
    });

    console.log(
      `${dispute.razorpayDisputeId}: ground_truth=${dispute.groundTruthLabel} -> system=${route.band}/${route.action}`
    );
  }

  const metrics = computeMetrics(results);

  console.log("\nGenerating baseline sample rebuttals (no rulebook grounding)...");
  const baselineSamples = [];
  for (const dispute of seedDisputes.slice(0, BASELINE_SAMPLE_SIZE)) {
    const body = await generateBaselineRebuttal({
      network: dispute.network,
      reasonCode: dispute.reasonCodeRaw,
      amount: dispute.amount,
      currency: dispute.currency,
    });
    baselineSamples.push({ razorpayDisputeId: dispute.razorpayDisputeId, body });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    metrics,
    targets: {
      autoResolutionRate: "55-70%",
      falseConfidenceRate: "<5%",
      missingDocPrecision: ">90%",
      recommendAcceptPrecision: ">90%",
      averageDecisionLatencyMs: "<3000ms (excluding LLM calls)",
      baselineDeltaPercentagePoints: ">=15pp",
    },
    baselineMethodology:
      "Baseline = a generic templated rebuttal with no rulebook grounding, that blindly " +
      "contests every dispute. Its win rate is the fraction of disputes that were genuinely " +
      "winnable (should_win) since it never identifies missing evidence or checks exclusions. " +
      "3 sample baseline rebuttal texts are included below for qualitative comparison; the " +
      "win-rate delta itself is computed structurally from ground truth for all disputes.",
    baselineSamples,
    perDisputeDetail,
  };

  const outPath = path.join(process.cwd(), "metrics", "latest.json");
  await writeFile(outPath, JSON.stringify(output, null, 2));

  console.log("\n=== METRICS SUMMARY ===");
  console.log(`Total disputes: ${metrics.totalDisputes}`);
  console.log(`Auto-resolution rate: ${(metrics.autoResolutionRate * 100).toFixed(1)}% (target 55-70%)`);
  console.log(`False-confidence rate: ${(metrics.falseConfidenceRate * 100).toFixed(1)}% (target <5%)`);
  console.log(`Missing-doc precision: ${(metrics.missingDocPrecision * 100).toFixed(1)}% (target >90%)`);
  console.log(`Recommend-accept precision: ${(metrics.recommendAcceptPrecision * 100).toFixed(1)}% (target >90%)`);
  console.log(`Avg decision latency: ${metrics.averageDecisionLatencyMs.toFixed(2)}ms (target <3000ms)`);
  console.log(`Baseline win rate: ${(metrics.baselineWinRate * 100).toFixed(1)}%`);
  console.log(`System win rate: ${(metrics.systemWinRate * 100).toFixed(1)}%`);
  console.log(`Delta vs baseline: ${metrics.baselineDeltaPercentagePoints.toFixed(1)}pp (target >=15pp)`);
  console.log(`\nWritten to ${outPath}`);
}

function matchesGroundTruth(
  label: "should_win" | "should_ask_for_doc" | "should_lose",
  action: "AUTO_REBUT" | "REQUEST_DOC" | "RECOMMEND_ACCEPT"
): boolean {
  return (
    (label === "should_win" && action === "AUTO_REBUT") ||
    (label === "should_ask_for_doc" && action === "REQUEST_DOC") ||
    (label === "should_lose" && action === "RECOMMEND_ACCEPT")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
