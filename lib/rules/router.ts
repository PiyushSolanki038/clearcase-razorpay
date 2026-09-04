// Deterministic confidence router. No LLM — pure logic over the scorer's output plus
// exclusion/deadline checks. Per CLAUDE.md: HIGH -> auto-rebut, MEDIUM -> ask for one doc,
// LOW -> honestly recommend accept.

import type { ScoreResult } from "@/lib/rules/scorer";
import type { ExclusionResult } from "@/lib/rules/exclusions";

export type ConfidenceBand = "HIGH" | "MEDIUM" | "LOW";
export type DecisionAction = "AUTO_REBUT" | "REQUEST_DOC" | "RECOMMEND_ACCEPT";

export interface RouteInput {
  score: ScoreResult;
  exclusion: ExclusionResult;
  deadlineAt: Date;
  now?: Date;
}

export interface RouteResult {
  band: ConfidenceBand;
  action: DecisionAction;
  reasoning: string;
}

// A rule fires HIGH only at a perfect score; MEDIUM covers "missing exactly one item, but
// otherwise strong"; anything else — including a clean 0 or many gaps — is LOW.
const MEDIUM_MIN_SCORE = 0.5;

export function routeDecision(input: RouteInput): RouteResult {
  const now = input.now ?? new Date();

  if (now > input.deadlineAt) {
    return {
      band: "LOW",
      action: "RECOMMEND_ACCEPT",
      reasoning: "Response window has already expired — no evidence quality can change the outcome.",
    };
  }

  if (input.exclusion.excluded) {
    return {
      band: "LOW",
      action: "RECOMMEND_ACCEPT",
      reasoning: `Dispute excluded by rulebook condition "${input.exclusion.matchedCondition}" — reclassified to ${input.exclusion.reclassifyTo}. Re-run analysis under the new code before deciding.`,
    };
  }

  if (input.score.score === 1) {
    return {
      band: "HIGH",
      action: "AUTO_REBUT",
      reasoning: "All required evidence present. Rebuttal package can be generated automatically.",
    };
  }

  if (input.score.score >= MEDIUM_MIN_SCORE && input.score.missing.length === 1) {
    return {
      band: "MEDIUM",
      action: "REQUEST_DOC",
      reasoning: `One evidence item missing: ${input.score.missing[0]}. Otherwise a strong case.`,
    };
  }

  return {
    band: "LOW",
    action: "RECOMMEND_ACCEPT",
    reasoning: `Evidence score too low (${input.score.score.toFixed(2)}) to justify contesting — missing: ${input.score.missing.join(", ") || "none, but score below threshold"}.`,
  };
}
