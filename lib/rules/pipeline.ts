// Shared classify -> extract -> exclude -> score pipeline, used by both the Day 2
// debug endpoint (/analyze) and the Day 3 full-decision endpoint (/execute).

import { classifyDispute } from "@/lib/rules/classifier";
import { extractClaims, type ExtractedClaim } from "@/lib/rules/extractor";
import { checkExclusions, type ExclusionResult } from "@/lib/rules/exclusions";
import { scoreEvidence, type ScoreResult } from "@/lib/rules/scorer";
import { findRule, type RulebookEntry } from "@/lib/rules/loader";
import type { Classification } from "@/lib/rules/classifier";

export interface PipelineInput {
  network: "visa" | "rupay" | "mastercard";
  reasonCodeRaw: string;
  evidenceDocs: { docType: string; rawText: string }[];
}

export interface PipelineResult {
  classification: Classification;
  rule: RulebookEntry;
  claims: ExtractedClaim[];
  exclusion: ExclusionResult;
  score: ScoreResult;
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const classification = await classifyDispute({
    network: input.network,
    reasonCodeRaw: input.reasonCodeRaw,
  });

  const rule = findRule(input.network, classification.reason_code_canonical);
  if (!rule) {
    throw new Error(
      `No rulebook entry found for ${input.network}/${classification.reason_code_canonical}`
    );
  }

  const claimsPerDoc = await Promise.all(
    input.evidenceDocs.map((doc) =>
      extractClaims({ docText: doc.rawText, docType: doc.docType, rule })
    )
  );
  const allClaims = claimsPerDoc.flat();

  const mergedClaims = Array.from(
    allClaims.reduce((map, claim) => {
      const existing = map.get(claim.claim_type);
      if (!existing || (claim.present && !existing.present)) {
        map.set(claim.claim_type, claim);
      }
      return map;
    }, new Map<string, ExtractedClaim>())
  ).map(([, claim]) => claim);

  const exclusion = checkExclusions(rule, mergedClaims);
  const score = scoreEvidence(rule, mergedClaims);

  return { classification, rule, claims: mergedClaims, exclusion, score };
}
