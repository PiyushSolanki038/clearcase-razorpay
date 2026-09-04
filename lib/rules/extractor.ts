// Extracts typed claims from an evidence document's raw text, matched against the
// evidence items a rulebook entry requires. Rule per CLAUDE.md: null over guess —
// if a claim isn't actually present in the source text, the extractor must not invent it.

import { z } from "zod";
import { extractStructured } from "@/lib/llm";
import type { RulebookEntry } from "@/lib/rules/loader";

const extractedClaimSchema = z.object({
  claim_type: z.string(),
  present: z.boolean(),
  claim_data: z.record(z.string(), z.unknown()).nullable(),
  confidence: z.number().min(0).max(1),
  source_span: z.string().nullable(),
});

const extractionResultSchema = z.object({
  claims: z.array(extractedClaimSchema),
});

export type ExtractedClaim = z.infer<typeof extractedClaimSchema>;

export interface ExtractInput {
  docText: string;
  docType: string;
  rule: RulebookEntry;
}

export async function extractClaims(input: ExtractInput): Promise<ExtractedClaim[]> {
  const evidenceIds = [
    ...input.rule.required_evidence.map((e) => `${e.id}: ${e.description}`),
    ...input.rule.any_one_of.map((e) => `${e.id}: ${e.description}`),
  ];
  const uniqueEvidenceIds = Array.from(new Set(evidenceIds));

  const prompt = `You are extracting evidence claims from a merchant's uploaded document for a payment dispute rebuttal. Only report a claim as present if it is ACTUALLY stated in the document text below. If the document does not contain evidence for a claim type, mark it present:false and claim_data:null — never invent or guess.

Document type: ${input.docType}
Document text:
"""
${input.docText}
"""

Evidence types to check for (id: description):
${uniqueEvidenceIds.map((e) => `- ${e}`).join("\n")}

Respond with JSON only, matching this exact shape:
{
  "claims": [
    {
      "claim_type": "<evidence id from the list above>",
      "present": <boolean>,
      "claim_data": <object with the specific extracted facts, or null if not present>,
      "confidence": <number between 0 and 1>,
      "source_span": "<the exact quote from the document supporting this claim, or null if not present>"
    }
  ]
}

Include one entry per evidence type listed above, even if not present.`;

  const result = await extractStructured(prompt, extractionResultSchema);
  return result.claims;
}
