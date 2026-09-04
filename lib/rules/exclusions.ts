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
const CONDITION_TO_CLAIM_TYPES: Record<string, string[]> = {
  cardholder_signed_receipt_present: ["proof_of_delivery"],
  cardholder_return_accepted_by_merchant: ["authenticity_certificate"],
  refund_already_issued_for_duplicate: ["duplicate_txn_proof"],
  refund_already_processed_before_dispute: ["proof_of_delivery"],
};

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
