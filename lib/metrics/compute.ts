// Deterministic aggregation over per-dispute pipeline results. No LLM here.

export interface DisputeResult {
  razorpayDisputeId: string;
  groundTruthLabel: "should_win" | "should_ask_for_doc" | "should_lose";
  band: "HIGH" | "MEDIUM" | "LOW";
  action: "AUTO_REBUT" | "REQUEST_DOC" | "RECOMMEND_ACCEPT";
  decisionLatencyMs: number;
}

export interface Metrics {
  totalDisputes: number;
  autoResolutionRate: number;
  falseConfidenceRate: number;
  missingDocPrecision: number;
  recommendAcceptPrecision: number;
  averageDecisionLatencyMs: number;
  baselineWinRate: number;
  systemWinRate: number;
  baselineDeltaPercentagePoints: number;
}

function safeDiv(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function computeMetrics(results: DisputeResult[]): Metrics {
  const total = results.length;

  const autoResolved = results.filter(
    (r) => r.action === "AUTO_REBUT" || r.action === "RECOMMEND_ACCEPT"
  ).length;

  const highBand = results.filter((r) => r.band === "HIGH");
  const falseConfidence = highBand.filter((r) => r.groundTruthLabel !== "should_win").length;

  const requestDoc = results.filter((r) => r.action === "REQUEST_DOC");
  const correctRequestDoc = requestDoc.filter(
    (r) => r.groundTruthLabel === "should_ask_for_doc"
  ).length;

  const recommendAccept = results.filter((r) => r.action === "RECOMMEND_ACCEPT");
  const correctRecommendAccept = recommendAccept.filter(
    (r) => r.groundTruthLabel === "should_lose"
  ).length;

  const averageDecisionLatencyMs =
    results.reduce((sum, r) => sum + r.decisionLatencyMs, 0) / total;

  // Baseline: a generic template blindly contests every dispute (see lib/rebuttal/baseline.ts).
  // It wins only when the underlying claim was genuinely winnable — i.e. should_win cases —
  // since it never identifies missing evidence or checks exclusions.
  const baselineWinRate = safeDiv(
    results.filter((r) => r.groundTruthLabel === "should_win").length,
    total
  );

  // System "wins" when it correctly auto-rebuts a genuine win, or correctly asks for the
  // one missing document on a should_ask_for_doc case (assumed supplied -> wins).
  const systemWinRate = safeDiv(
    results.filter(
      (r) =>
        (r.action === "AUTO_REBUT" && r.groundTruthLabel === "should_win") ||
        (r.action === "REQUEST_DOC" && r.groundTruthLabel === "should_ask_for_doc")
    ).length,
    total
  );

  return {
    totalDisputes: total,
    autoResolutionRate: safeDiv(autoResolved, total),
    falseConfidenceRate: safeDiv(falseConfidence, highBand.length),
    missingDocPrecision: safeDiv(correctRequestDoc, requestDoc.length),
    recommendAcceptPrecision: safeDiv(correctRecommendAccept, recommendAccept.length),
    averageDecisionLatencyMs,
    baselineWinRate,
    systemWinRate,
    baselineDeltaPercentagePoints: (systemWinRate - baselineWinRate) * 100,
  };
}
