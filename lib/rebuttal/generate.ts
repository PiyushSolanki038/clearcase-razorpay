// Drafts a structured rebuttal document from the rule + present claims. Every factual
// statement must cite the source claim's source_span — the LLM writes prose, it never
// introduces facts the extractor didn't already find.

import { z } from "zod";
import { extractStructured } from "@/lib/llm";
import type { RulebookEntry } from "@/lib/rules/loader";
import type { ExtractedClaim } from "@/lib/rules/extractor";

const rebuttalSchema = z.object({
  summary: z.string(),
  body: z.string(),
  cited_claims: z.array(z.string()), // claim_type ids referenced in the body
});

export type Rebuttal = z.infer<typeof rebuttalSchema>;

export interface GenerateRebuttalInput {
  rule: RulebookEntry;
  presentClaims: ExtractedClaim[];
  disputeAmount: number;
  currency: string;
}

function describeClaim(c: ExtractedClaim): string {
  // Document-sourced claims have a source_span quote; the CE3.0-injected claim
  // (see lib/rules/pipeline.ts) has no source_span but carries its facts in
  // claim_data — without this fallback the LLM sees "null" and hallucinates
  // instead of citing the real prior-transaction match.
  if (c.source_span) {
    return `- ${c.claim_type}: "${c.source_span}" (confidence ${c.confidence})`;
  }
  return `- ${c.claim_type}: ${JSON.stringify(c.claim_data)} (confidence ${c.confidence})`;
}

export async function generateRebuttal(input: GenerateRebuttalInput): Promise<Rebuttal> {
  const claimsText = input.presentClaims
    .filter((c) => c.present)
    .map(describeClaim)
    .join("\n");

  const prompt = `You are drafting a chargeback rebuttal letter for a merchant disputing a chargeback with their acquiring bank (Razorpay). Only cite facts from the evidence claims below — never state a fact that isn't backed by one of these claims.

Dispute: ${input.rule.network} reason code ${input.rule.reason_code} (${input.rule.name})
Amount: ${(input.disputeAmount / 100).toFixed(2)} ${input.currency}

Evidence claims found (either an exact source document quote, or structured data for evidence not sourced from a document, e.g. prior-transaction match data):
${claimsText}

Write a professional rebuttal. Respond with JSON only, matching this exact shape:
{
  "summary": "<one-sentence summary of the rebuttal position>",
  "body": "<the full rebuttal letter text, citing evidence inline like [proof_of_delivery]>",
  "cited_claims": ["<claim_type ids actually referenced in the body>"]
}`;

  return extractStructured(prompt, rebuttalSchema);
}
