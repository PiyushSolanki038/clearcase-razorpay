import { z } from "zod";

export const ce3TransactionSchema = z.object({
  cardholderId: z.string(),
  transactionDate: z.string(),
  accountId: z.string(),
  deviceId: z.string(),
  shippingAddress: z.string(),
  ipAddress: z.string(),
});
