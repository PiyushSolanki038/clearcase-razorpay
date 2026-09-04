// Synthetic prior-transaction history for the CE3.0 differentiator. Real Razorpay
// integration would pull this from actual undisputed payment records for the same
// cardholder; here it's a fixed seed dataset keyed by cardholderId.

export interface PriorTransaction {
  cardholderId: string;
  transactionId: string;
  transactionDate: string; // ISO
  accountId: string;
  deviceId: string;
  shippingAddress: string;
  ipAddress: string;
  disputed: boolean;
}

export const priorTransactions: PriorTransaction[] = [
  // cardholder_A: strong CE3.0 case — 3 prior undisputed txns, all in the eligible
  // 120-365 day window, sharing both accountId and deviceId with the disputed txn.
  {
    cardholderId: "cardholder_A",
    transactionId: "txn_A1",
    transactionDate: "2026-03-15T10:00:00.000Z",
    accountId: "acct_rohan_88213",
    deviceId: "device_9F2A",
    shippingAddress: "42 MG Road, Bengaluru 560001",
    ipAddress: "103.21.58.10",
    disputed: false,
  },
  {
    cardholderId: "cardholder_A",
    transactionId: "txn_A2",
    transactionDate: "2026-05-02T14:20:00.000Z",
    accountId: "acct_rohan_88213",
    deviceId: "device_9F2A",
    shippingAddress: "42 MG Road, Bengaluru 560001",
    ipAddress: "103.21.58.44",
    disputed: false,
  },
  {
    cardholderId: "cardholder_A",
    transactionId: "txn_A3",
    transactionDate: "2026-06-10T09:15:00.000Z",
    accountId: "acct_rohan_88213",
    deviceId: "device_other",
    shippingAddress: "42 MG Road, Bengaluru 560001",
    ipAddress: "103.21.58.10",
    disputed: false,
  },

  // cardholder_B: weak case — only 1 prior undisputed txn in window, or too old.
  {
    cardholderId: "cardholder_B",
    transactionId: "txn_B1",
    transactionDate: "2025-06-01T10:00:00.000Z", // >365 days before typical disputed date, out of window
    accountId: "acct_priya_55210",
    deviceId: "device_1122",
    shippingAddress: "9 Park Street, Kolkata 700016",
    ipAddress: "45.112.90.5",
    disputed: false,
  },
  {
    cardholderId: "cardholder_B",
    transactionId: "txn_B2",
    transactionDate: "2026-08-01T10:00:00.000Z", // <120 days before typical disputed date, too recent
    accountId: "acct_priya_55210",
    deviceId: "device_1122",
    shippingAddress: "9 Park Street, Kolkata 700016",
    ipAddress: "45.112.90.5",
    disputed: false,
  },

  // cardholder_C: 2 prior txns in window but only 1 matching element (device only) — not enough.
  {
    cardholderId: "cardholder_C",
    transactionId: "txn_C1",
    transactionDate: "2026-04-01T10:00:00.000Z",
    accountId: "acct_amit_old",
    deviceId: "device_7788",
    shippingAddress: "old address, not matching",
    ipAddress: "1.1.1.1",
    disputed: false,
  },
  {
    cardholderId: "cardholder_C",
    transactionId: "txn_C2",
    transactionDate: "2026-05-15T10:00:00.000Z",
    accountId: "acct_amit_new_different",
    deviceId: "device_7788",
    shippingAddress: "different address entirely",
    ipAddress: "2.2.2.2",
    disputed: false,
  },
];
