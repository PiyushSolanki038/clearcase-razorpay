// Deterministic network detection from raw reason_code shape.
// Visa codes look like "13.1" (digit.digit); RuPay/NPCI codes are bare 4-digit numbers like "1061".
// This is a heuristic for ingest-time storage only — the real classifier (lib/rules/classifier.ts,
// Day 2) does canonical reason-code mapping against the rulebook.

export type DisputeNetwork = "visa" | "rupay" | "mastercard";

export function detectNetwork(reasonCode: string): DisputeNetwork {
  if (/^\d+\.\d+$/.test(reasonCode)) {
    return "visa";
  }
  if (/^\d{4}$/.test(reasonCode)) {
    return "rupay";
  }
  // Default to visa since it's the primary network in our rulebook; Day 2 classifier
  // will flag anything that doesn't cleanly match as low-confidence.
  return "visa";
}
