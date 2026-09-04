// Deterministic scoring: compares extracted claims against a rule's required_evidence
// and any_one_of. No LLM — pure logic.

import type { RulebookEntry } from "@/lib/rules/loader";
import type { ExtractedClaim } from "@/lib/rules/extractor";

export interface ScoreResult {
  score: number; // 0-1
  present: string[]; // claim_type ids satisfied
  missing: string[]; // claim_type ids still needed
}

export function scoreEvidence(rule: RulebookEntry, claims: ExtractedClaim[]): ScoreResult {
  const presentClaimTypes = new Set(
    claims.filter((c) => c.present).map((c) => c.claim_type)
  );

  // all_required and any_one_of are the actual gates; required_evidence is just an
  // informational catalog of evidence types and must never be used as a fallback gate
  // (doing so double-counts against any_one_of when both reference the same ids).
  const allRequiredIds = rule.all_required;
  const anyOneOfIds = rule.any_one_of.map((e) => e.id);

  const present: string[] = [];
  const missing: string[] = [];

  for (const id of allRequiredIds) {
    if (presentClaimTypes.has(id)) {
      present.push(id);
    } else {
      missing.push(id);
    }
  }

  let anyOneOfSatisfied = anyOneOfIds.length === 0; // no any_one_of requirement -> trivially satisfied
  if (anyOneOfIds.length > 0) {
    const matched = anyOneOfIds.find((id) => presentClaimTypes.has(id));
    if (matched) {
      present.push(matched);
      anyOneOfSatisfied = true;
    } else {
      missing.push(`any_one_of(${anyOneOfIds.join("|")})`);
    }
  }

  const totalRequirements = allRequiredIds.length + (anyOneOfIds.length > 0 ? 1 : 0);
  const satisfiedRequirements =
    allRequiredIds.length - (missing.filter((m) => allRequiredIds.includes(m)).length) +
    (anyOneOfSatisfied && anyOneOfIds.length > 0 ? 1 : 0);

  const score = totalRequirements === 0 ? 1 : satisfiedRequirements / totalRequirements;

  return { score, present, missing };
}
