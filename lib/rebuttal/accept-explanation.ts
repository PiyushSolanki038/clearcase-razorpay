// Differentiator #3: honest "accept" recommendation with dollar math. The arbitration-fee
// comparison is pure arithmetic (deterministic); only the plain-language explanation is LLM.

import { z } from "zod";
import { extractStructured } from "@/lib/llm";

// Visa/Mastercard arbitration fees typically run $250-$500 USD; RuPay/NPCI pre-arbitration
// fees are lower, roughly ₹2,000-5,000. Using representative INR figures since this project
// is India-first — flagged as illustrative, not a live fee schedule.
const ARBITRATION_FEE_INR = 25_000_00; // paise, i.e. ₹25,000 (representative Visa arbitration fee equivalent)

const acceptExplanationSchema = z.object({
  explanation: z.string(),
});

export interface DollarMath {
  disputedAmount: number; // paise
  arbitrationFee: number; // paise
  netLossIfContestedAndLost: number; // paise
  worthContesting: boolean;
}

export function computeDollarMath(disputedAmount: number): DollarMath {
  const netLossIfContestedAndLost = disputedAmount + ARBITRATION_FEE_INR;
  return {
    disputedAmount,
    arbitrationFee: ARBITRATION_FEE_INR,
    netLossIfContestedAndLost,
    worthContesting: disputedAmount > ARBITRATION_FEE_INR,
  };
}

export interface AcceptExplanationInput {
  reasonForLowConfidence: string;
  missing: string[];
  disputedAmount: number;
  currency: string;
}

export async function generateAcceptExplanation(
  input: AcceptExplanationInput
): Promise<{ explanation: string; math: DollarMath }> {
  const math = computeDollarMath(input.disputedAmount);

  const prompt = `You are honestly advising a merchant to accept a chargeback rather than contest it, because the evidence is too weak to win. Be direct and specific — do not soften this into vague reassurance.

Why the case is weak: ${input.reasonForLowConfidence}
Missing evidence: ${input.missing.join(", ") || "none specifically, but overall evidence score is too low"}
Disputed amount: ${(input.disputedAmount / 100).toFixed(2)} ${input.currency}
Estimated arbitration fee if escalated and lost: ${(math.arbitrationFee / 100).toFixed(2)} ${input.currency}

Respond with JSON only, matching this exact shape:
{
  "explanation": "<2-3 sentences: why accepting now is the better financial + practical decision than contesting>"
}`;

  const result = await extractStructured(prompt, acceptExplanationSchema);
  return { explanation: result.explanation, math };
}
