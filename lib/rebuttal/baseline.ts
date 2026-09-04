// Day 5 Hr 3: baseline comparison. A generic templated rebuttal with NO rulebook
// grounding — it doesn't check what evidence exists, doesn't check exclusions, doesn't
// know what's actually required. It just contests every dispute the same way. This is
// what a merchant using a copy-paste template (no ClearCase) effectively does.

import { z } from "zod";
import { extractStructured } from "@/lib/llm";

const baselineSchema = z.object({ body: z.string() });

export interface BaselineInput {
  network: string;
  reasonCode: string;
  reasonDescription?: string;
  amount: number;
  currency: string;
}

export async function generateBaselineRebuttal(input: BaselineInput): Promise<string> {
  const prompt = `Write a generic chargeback rebuttal letter for a merchant. You have no specific evidence about this case — just write a standard, generic contest letter that could apply to any dispute.

Network: ${input.network}, reason code: ${input.reasonCode} (${input.reasonDescription ?? "no description"})
Amount: ${(input.amount / 100).toFixed(2)} ${input.currency}

Respond with JSON only: { "body": "<generic rebuttal letter text>" }`;

  const result = await extractStructured(prompt, baselineSchema);
  return result.body;
}
