// Classifies a dispute's raw reason code + description against the rulebook.
// The LLM only picks the best-matching canonical code from the loaded rulebook —
// it never invents a code or decides what a rule requires (see CLAUDE.md conventions).

import { z } from "zod";
import { extractStructured } from "@/lib/llm";
import { loadRulebook } from "@/lib/rules/loader";

const classificationSchema = z.object({
  reason_code_canonical: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type Classification = z.infer<typeof classificationSchema>;

export interface ClassifyInput {
  network: "visa" | "rupay" | "mastercard";
  reasonCodeRaw: string;
  reasonDescription?: string | null;
}

export async function classifyDispute(input: ClassifyInput): Promise<Classification> {
  const candidates = loadRulebook().filter((r) => r.network === input.network);

  // Deterministic fast path: raw code matches a rulebook entry exactly.
  const exact = candidates.find((r) => r.reason_code === input.reasonCodeRaw);
  if (exact) {
    return {
      reason_code_canonical: exact.reason_code,
      confidence: 1,
      reasoning: "Exact match against rulebook reason_code — no LLM call needed.",
    };
  }

  const candidateList = candidates
    .map((r) => `- ${r.reason_code}: ${r.name}`)
    .join("\n");

  const prompt = `You are classifying a payment dispute against a fixed rulebook. Pick the single best-matching canonical reason code from the list below. Do not invent a code that isn't listed.

Network: ${input.network}
Raw reason code from payment processor: ${input.reasonCodeRaw}
Reason description: ${input.reasonDescription ?? "(none provided)"}

Candidate canonical reason codes:
${candidateList}

Respond with JSON only, matching this exact shape:
{
  "reason_code_canonical": "<one of the candidate codes above>",
  "confidence": <number between 0 and 1>,
  "reasoning": "<one sentence explaining the match>"
}`;

  return extractStructured(prompt, classificationSchema);
}
