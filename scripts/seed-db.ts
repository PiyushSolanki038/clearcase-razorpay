// Day 1 Hr 5-6 — seeds the 50 synthetic disputes from seed/disputes.ts into Postgres.
// Run with: npx tsx scripts/seed-db.ts

import { PrismaClient } from "@prisma/client";
import { seedDisputes } from "../seed/disputes";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${seedDisputes.length} disputes...`);

  for (const d of seedDisputes) {
    await prisma.dispute.upsert({
      where: { razorpayDisputeId: d.razorpayDisputeId },
      update: {},
      create: {
        razorpayDisputeId: d.razorpayDisputeId,
        paymentId: d.paymentId,
        amount: d.amount,
        currency: d.currency,
        network: d.network,
        reasonCodeRaw: d.reasonCodeRaw,
        reasonCodeCanonical: d.reasonCodeCanonical,
        deadlineAt: new Date(d.deadlineAt),
        status: "open",
        createdAt: new Date(d.createdAt),
      },
    });
  }

  const count = await prisma.dispute.count();
  console.log(`Done. ${count} disputes in database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
