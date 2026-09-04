// Day 2 Hr 9-10: paste a dispute + evidence text, get back full analysis.
// Runs classify -> extract -> exclude -> score. No persistence yet (Decision/AuditEntry
// writes are Day 3's job, once the confidence router exists).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { classifyDispute } from "@/lib/rules/classifier";
import { extractClaims } from "@/lib/rules/extractor";
import { checkExclusions } from "@/lib/rules/exclusions";
import { scoreEvidence } from "@/lib/rules/scorer";
import { findRule } from "@/lib/rules/loader";

const requestSchema = z.object({
  evidenceDocs: z.array(
    z.object({
      docType: z.string(),
      rawText: z.string().min(1),
    })
  ),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const { disputeId } = await params;
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const classification = await classifyDispute({
    network: dispute.network,
    reasonCodeRaw: dispute.reasonCodeRaw,
  });

  const rule = findRule(dispute.network, classification.reason_code_canonical);
  if (!rule) {
    return NextResponse.json(
      { error: `No rulebook entry found for ${dispute.network}/${classification.reason_code_canonical}` },
      { status: 422 }
    );
  }

  const claimsPerDoc = await Promise.all(
    parsed.data.evidenceDocs.map((doc) =>
      extractClaims({ docText: doc.rawText, docType: doc.docType, rule })
    )
  );
  const allClaims = claimsPerDoc.flat();

  // A claim_type counts as present if any document produced a present:true claim for it.
  const mergedClaims = Array.from(
    allClaims.reduce((map, claim) => {
      const existing = map.get(claim.claim_type);
      if (!existing || (claim.present && !existing.present)) {
        map.set(claim.claim_type, claim);
      }
      return map;
    }, new Map<string, (typeof allClaims)[number]>())
  ).map(([, claim]) => claim);

  const exclusionResult = checkExclusions(rule, mergedClaims);
  const scoreResult = scoreEvidence(rule, mergedClaims);

  return NextResponse.json({
    dispute: { id: dispute.id, network: dispute.network, reasonCodeRaw: dispute.reasonCodeRaw },
    classification,
    rule: { reason_code: rule.reason_code, name: rule.name, ce3_eligible: rule.ce3_eligible },
    claims: mergedClaims,
    exclusion: exclusionResult,
    score: scoreResult,
  });
}
