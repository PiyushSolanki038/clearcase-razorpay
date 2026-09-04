// Deterministic exclusion check. Given the rule's exclusion conditions and the set of
// claim_types the extractor found present, decides whether the dispute should be
// reclassified to a different reason code. No LLM — the LLM only reads documents,
// the rule engine applies rules (see CLAUDE.md conventions).

import type { RulebookEntry } from "@/lib/rules/loader";
import type { ExtractedClaim } from "@/lib/rules/extractor";

export interface ExclusionResult {
  excluded: boolean;
  reclassifyTo?: string;
  matchedCondition?: string;
}

// Maps an exclusion's plain-English condition string to the claim_type(s) that,
// if present, satisfy it. Kept as an explicit lookup rather than fuzzy matching —
// rulebook lookups must be deterministic.
//
// Deliberately empty for now: every previous entry here reused an unrelated
// required_evidence claim_type as a false proxy for a condition it doesn't actually
// measure (e.g. "authenticity_certificate present" was standing in for "cardholder's
// return was accepted by the merchant" — completely unrelated facts). That produced a
// live bug: a MEDIUM case got silently misrouted to a false LOW/RECOMMEND_ACCEPT.
// None of these conditions have a dedicated extractor claim_type yet, so until they do,
// this map stays empty and checkExclusions() never fires — conservative by default,
// same "skip, don't guess" rule the code below already follows for unknown conditions.
const CONDITION_TO_CLAIM_TYPES: Record<string, string[]> = {};

export function checkExclusions(
  rule: RulebookEntry,
  claims: ExtractedClaim[]
): ExclusionResult {
  const presentClaimTypes = new Set(
    claims.filter((c) => c.present).map((c) => c.claim_type)
  );

  for (const exclusion of rule.exclusions) {
    const requiredClaimTypes = CONDITION_TO_CLAIM_TYPES[exclusion.condition];
    if (!requiredClaimTypes) continue; // unknown condition — skip, don't guess

    const satisfied = requiredClaimTypes.some((ct) => presentClaimTypes.has(ct));
    if (satisfied) {
      return {
        excluded: true,
        reclassifyTo: exclusion.reclassify_to,
        matchedCondition: exclusion.condition,
      };
    }
  }

  return { excluded: false };
}
