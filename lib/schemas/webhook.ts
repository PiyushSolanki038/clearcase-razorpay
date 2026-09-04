// Zod schema for the Razorpay dispute.created webhook payload.
// Field shape verified against https://razorpay.com/docs/api/disputes/ (Day 0 research).

import { z } from "zod";

export const disputeEntitySchema = z.object({
  id: z.string().startsWith("disp_"),
  entity: z.literal("dispute"),
  payment_id: z.string().startsWith("pay_"),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  amount_deducted: z.number().int().nonnegative(),
  reason_code: z.string().min(1),
  reason_description: z.string().nullable().optional(),
  respond_by: z.number().int().positive(), // unix timestamp
  status: z.enum(["open", "under_review", "won", "lost", "closed"]),
  phase: z.enum(["fraud", "retrieval", "chargeback", "pre_arbitration", "arbitration"]),
  created_at: z.number().int().positive(),
  evidence: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const disputeWebhookSchema = z.object({
  entity: z.literal("event"),
  event: z.literal("dispute.created"),
  payload: z.object({
    dispute: z.object({
      entity: disputeEntitySchema,
    }),
  }),
});

export type DisputeEntity = z.infer<typeof disputeEntitySchema>;
export type DisputeWebhook = z.infer<typeof disputeWebhookSchema>;
