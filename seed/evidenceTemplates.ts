// Day 5: generates synthetic evidence text for each seed dispute, matching its
// ground-truth label. Deterministic (no LLM, no randomness) so metrics runs are
// reproducible. This is what "seed/evidence/" would otherwise hold as files.

import type { SeedDispute } from "./disputes";

export interface EvidenceDocInput {
  docType: string;
  rawText: string;
}

// Fixed, generic text per claim type — deliberately NOT unique per dispute. The
// extraction prompt only depends on doc text + doc type + the rule's evidence-id list
// (see lib/rules/extractor.ts), so identical text here means identical prompts across
// every dispute that shares a claim type, which lib/llm.ts's filesystem cache collapses
// into a single real API call. Gemini's free tier caps at 20 requests/day on this
// project — with 50 non-CE3 seed disputes, per-dispute-unique text would blow the
// quota; this keeps the whole metrics run to roughly 8-10 real calls. See TODO.md.
function claimEvidence(claimType: string): EvidenceDocInput | null {
  switch (claimType) {
    case "proof_of_delivery":
      return {
        docType: "courier_pod",
        rawText: `Delivery Confirmation - BlueDart Courier. Order delivered to the customer's registered address. Recipient signature captured. OTP verified at doorstep delivery.`,
      };
    case "authenticity_certificate":
      return {
        docType: "brand_certificate",
        rawText: `Authenticity Certificate: item verified genuine by manufacturer distributor certification, serial number matches invoice records.`,
      };
    case "product_description_match":
      return {
        docType: "listing_screenshot",
        rawText: `Product listing matches the item shipped — same model, color, and specifications as described at checkout.`,
      };
    case "duplicate_txn_proof":
      return {
        docType: "transaction_ledger_extract",
        rawText: `Transaction ledger: only one settlement record exists at the agreed order value; no duplicate charge was processed.`,
      };
    default:
      return null;
  }
}

const IRRELEVANT_EVIDENCE: EvidenceDocInput = {
  docType: "chat_log",
  rawText: "Customer messaged asking when their order would arrive. No delivery, authenticity, or transaction details were discussed.",
};

/**
 * Builds the evidenceDocs array to feed the pipeline for one seed dispute, based on
 * its ground-truth label. Returns [] for disputes handled entirely via CE3.0
 * (ce3Transaction is set instead — see lib/ce3/assemble.ts).
 */
export function buildEvidenceDocs(dispute: SeedDispute): EvidenceDocInput[] {
  if (dispute.ce3Transaction) return [];

  if (dispute.groundTruthLabel === "should_lose") {
    return [IRRELEVANT_EVIDENCE];
  }

  // all_required-style codes (not_as_described / 1062) need multiple claim types;
  // any_one_of-style codes (not_received, duplicate_processing) need just one.
  const claimTypesByCanonical: Record<string, string[]> = {
    not_received: ["proof_of_delivery"],
    not_as_described: ["authenticity_certificate", "product_description_match"],
    duplicate_processing: ["duplicate_txn_proof"],
  };

  const allClaimTypes = claimTypesByCanonical[dispute.reasonCodeCanonical] ?? [];

  const claimTypesToInclude =
    dispute.groundTruthLabel === "should_ask_for_doc" && dispute.groundTruthMissingDoc
      ? allClaimTypes.filter((ct) => ct !== dispute.groundTruthMissingDoc)
      : allClaimTypes;

  return claimTypesToInclude
    .map((ct) => claimEvidence(ct))
    .filter((d): d is EvidenceDocInput => d !== null);
}
