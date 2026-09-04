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

export async function generateRebuttal(input: GenerateRebuttalInput): Promise<Rebuttal> {
  const claimsText = input.presentClaims
    .filter((c) => c.present)
    .map((c) => `- ${c.claim_type}: "${c.source_span}" (confidence ${c.confidence})`)
    .join("\n");

  const prompt = `You are drafting a chargeback rebuttal letter for a merchant disputing a chargeback with their acquiring bank (Razorpay). Only cite facts from the evidence claims below — never state a fact that isn't backed by one of these claims.

Dispute: ${input.rule.network} reason code ${input.rule.reason_code} (${input.rule.name})
Amount: ${(input.disputeAmount / 100).toFixed(2)} ${input.currency}

Evidence claims found (each with the exact source quote):
${claimsText}

Write a professional rebuttal. Respond with JSON only, matching this exact shape:
{
  "summary": "<one-sentence summary of the rebuttal position>",
  "body": "<the full rebuttal letter text, citing evidence inline like [proof_of_delivery]>",
  "cited_claims": ["<claim_type ids actually referenced in the body>"]
}`;

  return extractStructured(prompt, rebuttalSchema);
}
