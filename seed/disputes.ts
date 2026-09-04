// Day 1 — 50 synthetic disputes. Generated deterministically (no Math.random) so
// re-running seed-db.ts always produces the same dataset.
// Distribution per ROADMAP.md: 40% should_win, 30% should_ask_for_doc, 20% should_lose, 10% edge cases.

export type GroundTruthLabel = "should_win" | "should_ask_for_doc" | "should_lose";

export interface CE3TransactionRef {
  cardholderId: string;
  transactionDate: string;
  accountId: string;
  deviceId: string;
  shippingAddress: string;
  ipAddress: string;
}

export interface SeedDispute {
  razorpayDisputeId: string;
  paymentId: string;
  amount: number; // paise
  currency: "INR";
  network: "visa" | "rupay";
  reasonCodeRaw: string;
  reasonCodeCanonical: string;
  createdAt: string; // ISO
  deadlineAt: string; // ISO
  groundTruthLabel: GroundTruthLabel;
  groundTruthMissingDoc?: string;
  groundTruthNotes: string;
  // Only set for the 3 dedicated CE3.0 demo disputes (10.4) — not a DB column,
  // used directly by the analyze/execute endpoints' ce3Transaction input.
  ce3Transaction?: CE3TransactionRef;
}

interface CodeGroup {
  canonical: string;
  visaCode: string;
  rupayCode: string;
  missingDocId: string;
}

// 3 canonical reason-code families, each mapped to a Visa code and a RuPay equivalent.
const CODE_GROUPS: CodeGroup[] = [
  { canonical: "not_received", visaCode: "13.1", rupayCode: "1061", missingDocId: "proof_of_delivery" },
  { canonical: "not_as_described", visaCode: "13.4", rupayCode: "1062", missingDocId: "authenticity_certificate" },
  { canonical: "duplicate_processing", visaCode: "12.6", rupayCode: "1002", missingDocId: "duplicate_txn_proof" },
];

// Per group, per network: [HIGH count, MEDIUM count, LOW count, EDGE count]
const QUOTAS: [number, number, number, number][] = [
  [4, 3, 2, 1], // group0 visa
  [3, 2, 2, 1], // group0 rupay
  [3, 3, 2, 1], // group1 visa
  [4, 2, 1, 1], // group1 rupay
  [3, 3, 1, 1], // group2 visa
  [3, 2, 2, 0], // group2 rupay
];

const BASE_DATE = new Date("2026-08-20T00:00:00Z").getTime();
const DAY_MS = 86_400_000;

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function buildDispute(
  index: number,
  group: CodeGroup,
  network: "visa" | "rupay",
  bucket: GroundTruthLabel | "edge",
  seq: number
): SeedDispute {
  const reasonCodeRaw = network === "visa" ? group.visaCode : group.rupayCode;
  const amount = 50_000 + ((index * 37_919) % 950_000); // deterministic spread, 500-9999 INR
  const createdAt = new Date(BASE_DATE + index * 6 * 3_600_000); // stagger by 6h
  const responseWindowDays = 30;
  const isEdge = bucket === "edge";

  // Edge cases: half expired windows, half wrong-network mismatches (still valid JSON, flagged in notes)
  const deadlineAt = isEdge && seq % 2 === 0
    ? new Date(createdAt.getTime() - 2 * DAY_MS) // already expired
    : new Date(createdAt.getTime() + responseWindowDays * DAY_MS);

  const label: GroundTruthLabel = isEdge ? "should_lose" : (bucket as GroundTruthLabel);

  let notes: string;
  let missingDoc: string | undefined;

  if (isEdge) {
    notes = seq % 2 === 0
      ? "Edge case: response window already expired before merchant could respond. Recommend accept regardless of evidence quality."
      : "Edge case: reason code raw value doesn't cleanly map to a canonical rulebook entry; requires manual classification review.";
  } else if (label === "should_win") {
    notes = `Merchant has all required evidence for ${group.canonical} (${reasonCodeRaw}). Clear win.`;
  } else if (label === "should_ask_for_doc") {
    missingDoc = group.missingDocId;
    notes = `Merchant is missing "${group.missingDocId}" — otherwise strong case for ${group.canonical}.`;
  } else {
    notes = `No credible evidence exists for ${group.canonical} (${reasonCodeRaw}) — merchant's underlying claim doesn't hold up. Recommend accept.`;
  }

  return {
    razorpayDisputeId: `disp_seed${pad(index, 3)}`,
    paymentId: `pay_seed${pad(index, 3)}`,
    amount,
    currency: "INR",
    network,
    reasonCodeRaw,
    reasonCodeCanonical: group.canonical,
    createdAt: createdAt.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    groundTruthLabel: label,
    groundTruthMissingDoc: missingDoc,
    groundTruthNotes: notes,
  };
}

function generate(): SeedDispute[] {
  const disputes: SeedDispute[] = [];
  let index = 0;

  CODE_GROUPS.forEach((group, groupIdx) => {
    (["visa", "rupay"] as const).forEach((network, netIdx) => {
      const quotaIdx = groupIdx * 2 + netIdx;
      const [high, medium, low, edge] = QUOTAS[quotaIdx];
      const buckets: (GroundTruthLabel | "edge")[] = [
        ...Array(high).fill("should_win"),
        ...Array(medium).fill("should_ask_for_doc"),
        ...Array(low).fill("should_lose"),
        ...Array(edge).fill("edge"),
      ];
      buckets.forEach((bucket, seq) => {
        disputes.push(buildDispute(index, group, network, bucket, seq));
        index += 1;
      });
    });
  });

  return disputes;
}

// 3 dedicated CE3.0 (Visa 10.4) demo disputes, appended on top of the 50 — see
// seed/priorTransactions.ts for the matching prior-transaction history. Added on
// Day 3 once 10.4 was confirmed as a 4th canonical code (see TODO.md).
const CE3_DEMO_DISPUTES: SeedDispute[] = [
  {
    razorpayDisputeId: "disp_ce3_high",
    paymentId: "pay_ce3_high",
    amount: 499_900,
    currency: "INR",
    network: "visa",
    reasonCodeRaw: "10.4",
    reasonCodeCanonical: "other_fraud_card_absent",
    createdAt: "2026-10-15T00:00:00.000Z",
    deadlineAt: "2026-11-14T00:00:00.000Z",
    groundTruthLabel: "should_win",
    groundTruthNotes:
      "CE3.0-eligible: 3 prior undisputed transactions (cardholder_A) in the 120-365 day window match on account_id, device_id, shipping_address, and ip_address.",
    ce3Transaction: {
      cardholderId: "cardholder_A",
      transactionDate: "2026-10-15T00:00:00.000Z",
      accountId: "acct_rohan_88213",
      deviceId: "device_9F2A",
      shippingAddress: "42 MG Road, Bengaluru 560001",
      ipAddress: "103.21.58.10",
    },
  },
  {
    razorpayDisputeId: "disp_ce3_low_window",
    paymentId: "pay_ce3_low_window",
    amount: 299_900,
    currency: "INR",
    network: "visa",
    reasonCodeRaw: "10.4",
    reasonCodeCanonical: "other_fraud_card_absent",
    createdAt: "2026-10-15T00:00:00.000Z",
    deadlineAt: "2026-11-14T00:00:00.000Z",
    groundTruthLabel: "should_lose",
    groundTruthNotes:
      "Not CE3.0-eligible: cardholder_B's only prior transactions fall outside the 120-365 day window (one too old, one too recent).",
    ce3Transaction: {
      cardholderId: "cardholder_B",
      transactionDate: "2026-10-15T00:00:00.000Z",
      accountId: "acct_priya_55210",
      deviceId: "device_1122",
      shippingAddress: "9 Park Street, Kolkata 700016",
      ipAddress: "45.112.90.5",
    },
  },
  {
    razorpayDisputeId: "disp_ce3_low_elements",
    paymentId: "pay_ce3_low_elements",
    amount: 349_900,
    currency: "INR",
    network: "visa",
    reasonCodeRaw: "10.4",
    reasonCodeCanonical: "other_fraud_card_absent",
    createdAt: "2026-10-15T00:00:00.000Z",
    deadlineAt: "2026-11-14T00:00:00.000Z",
    groundTruthLabel: "should_lose",
    groundTruthNotes:
      "Not CE3.0-eligible: cardholder_C has 2 qualifying prior transactions in-window, but they only share 1 matching data element (device_id) — the 2-of-4 rule needs 2 element types.",
    ce3Transaction: {
      cardholderId: "cardholder_C",
      transactionDate: "2026-10-15T00:00:00.000Z",
      accountId: "acct_current_different",
      deviceId: "device_7788",
      shippingAddress: "current checkout address, not matching any prior",
      ipAddress: "9.9.9.9",
    },
  },
];

export const seedDisputes: SeedDispute[] = [...generate(), ...CE3_DEMO_DISPUTES];
