// Pre-computes evidence + decisions for seed disputes so the demo path (judges opening
// any dispute detail page) shows real results immediately, with no manual input.
// Idempotent: skips any dispute that already has a Decision. Run with:
//   npx tsx scripts/seed-decisions.ts

import { prisma } from "../lib/prisma";
import { seedDisputes } from "../seed/disputes";
import { buildEvidenceDocs } from "../seed/evidenceTemplates";
import { executeDecisionForDispute } from "../lib/decide/executeDecision";

async function main() {
  let processed = 0;
  let skipped = 0;

  for (const seedDispute of seedDisputes) {
    const dispute = await prisma.dispute.findUnique({
      where: { razorpayDisputeId: seedDispute.razorpayDisputeId },
    });
    if (!dispute) {
      console.warn(`No DB row for ${seedDispute.razorpayDisputeId} — run seed-db.ts first.`);
      continue;
    }

    const existingDecision = await prisma.decision.findFirst({ where: { disputeId: dispute.id } });
    if (existingDecision) {
      skipped++;
      continue;
    }

    const evidenceDocs = buildEvidenceDocs(seedDispute);

    // Persist EvidenceDoc rows so the demo path has real data in that table too, not
    // just pipeline-computed claims.
    for (const doc of evidenceDocs) {
      await prisma.evidenceDoc.create({
        data: {
          disputeId: dispute.id,
          fileUrl: `seed://${seedDispute.razorpayDisputeId}/${doc.docType}`,
          docType: doc.docType,
          rawText: doc.rawText,
          extractedAt: new Date(),
        },
      });
    }

    try {
      const { decision } = await executeDecisionForDispute({
        dispute,
        evidenceDocs,
        ce3Transaction: seedDispute.ce3Transaction,
      });
      console.log(
        `${seedDispute.razorpayDisputeId}: ${decision.confidenceBand}/${decision.action}`
      );
      processed++;
    } catch (err) {
      console.error(`Failed for ${seedDispute.razorpayDisputeId}:`, err);
    }
  }

  console.log(`\nDone. ${processed} decisions computed, ${skipped} already existed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
