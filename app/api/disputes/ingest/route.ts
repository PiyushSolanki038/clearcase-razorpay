import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disputeWebhookSchema } from "@/lib/schemas/webhook";
import { detectNetwork } from "@/lib/network";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = disputeWebhookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entity = parsed.data.payload.dispute.entity;
  const network = detectNetwork(entity.reason_code);

  const dispute = await prisma.dispute.upsert({
    where: { razorpayDisputeId: entity.id },
    update: {
      status: entity.status,
    },
    create: {
      razorpayDisputeId: entity.id,
      paymentId: entity.payment_id,
      amount: entity.amount,
      currency: entity.currency,
      network,
      reasonCodeRaw: entity.reason_code,
      deadlineAt: new Date(entity.respond_by * 1000),
      status: entity.status,
      createdAt: new Date(entity.created_at * 1000),
    },
  });

  return NextResponse.json({ dispute }, { status: 201 });
}
