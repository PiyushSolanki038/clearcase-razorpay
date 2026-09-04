// Differentiator #2: Visa CE3.0 evidence auto-assembly (dispute condition 10.4 only —
// see rulebook/visa/10.4.json for why this doesn't apply to other reason codes).
// Deterministic — no LLM. Implements the 2-of-4 rule: 2+ prior undisputed transactions,
// 120-365 days before the disputed transaction, sharing 2+ of: account ID, device ID,
// shipping address, IP address.

import { priorTransactions, type PriorTransaction } from "@/seed/priorTransactions";

const MIN_DAYS_BEFORE = 120;
const MAX_DAYS_BEFORE = 365;
const DAY_MS = 86_400_000;

export interface CurrentTransactionAttrs {
  cardholderId: string;
  transactionDate: string; // ISO
  accountId: string;
  deviceId: string;
  shippingAddress: string;
  ipAddress: string;
}

export interface QualifyingTransaction {
  transactionId: string;
  transactionDate: string;
  matchedElements: string[];
}

export interface CE3Result {
  eligible: boolean;
  qualifyingTransactions: QualifyingTransaction[];
  matchedElementTypes: string[];
  reasoning: string;
}

function matchedElements(current: CurrentTransactionAttrs, prior: PriorTransaction): string[] {
  const matches: string[] = [];
  if (prior.accountId === current.accountId) matches.push("account_id");
  if (prior.deviceId === current.deviceId) matches.push("device_id");
  if (prior.shippingAddress === current.shippingAddress) matches.push("shipping_address");
  if (prior.ipAddress === current.ipAddress) matches.push("ip_address");
  return matches;
}

export function assembleCE3Evidence(current: CurrentTransactionAttrs): CE3Result {
  const currentDate = new Date(current.transactionDate).getTime();

  const inWindow = priorTransactions.filter((t) => {
    if (t.cardholderId !== current.cardholderId || t.disputed) return false;
    const daysBefore = (currentDate - new Date(t.transactionDate).getTime()) / DAY_MS;
    return daysBefore >= MIN_DAYS_BEFORE && daysBefore <= MAX_DAYS_BEFORE;
  });

  const qualifying: QualifyingTransaction[] = inWindow
    .map((t) => ({
      transactionId: t.transactionId,
      transactionDate: t.transactionDate,
      matchedElements: matchedElements(current, t),
    }))
    .filter((t) => t.matchedElements.length > 0);

  const matchedElementTypes = Array.from(
    new Set(qualifying.flatMap((t) => t.matchedElements))
  );

  // The 2-of-4 rule: need 2+ qualifying prior transactions AND 2+ distinct matching
  // element types across them.
  const eligible = qualifying.length >= 2 && matchedElementTypes.length >= 2;

  const reasoning = eligible
    ? `CE3.0-eligible: ${qualifying.length} prior undisputed transactions in the 120-365 day window match on ${matchedElementTypes.length} data elements (${matchedElementTypes.join(", ")}).`
    : `Not CE3.0-eligible: found ${qualifying.length} qualifying prior transaction(s) with ${matchedElementTypes.length} matching element type(s) — need at least 2 transactions and 2 element types.`;

  return { eligible, qualifyingTransactions: qualifying, matchedElementTypes, reasoning };
}
