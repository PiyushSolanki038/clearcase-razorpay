// Hash-chained audit log. Every write includes prev_hash + sha256(serialize(payload)).
// Per CLAUDE.md: every decision writes to AuditEntry, no exceptions. Reproducible from
// source docs + rulebook version alone — no reliance on external state.

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const GENESIS_HASH = "0".repeat(64);

function serialize(payload: unknown): string {
  // Deterministic stringify: sorted keys so the same payload always hashes the same way.
  return JSON.stringify(payload, Object.keys(payload as object).sort());
}

function computeHash(prevHash: string, payload: unknown): string {
  return createHash("sha256").update(prevHash + serialize(payload)).digest("hex");
}

export async function appendAuditEntry(
  disputeId: string,
  step: string,
  payload: unknown
): Promise<{ id: string; currentHash: string }> {
  const lastEntry = await prisma.auditEntry.findFirst({
    where: { disputeId },
    orderBy: { createdAt: "desc" },
  });

  const prevHash = lastEntry?.currentHash ?? GENESIS_HASH;
  const currentHash = computeHash(prevHash, payload);

  const entry = await prisma.auditEntry.create({
    data: {
      disputeId,
      step,
      payload: payload as object,
      prevHash,
      currentHash,
    },
  });

  return { id: entry.id, currentHash: entry.currentHash };
}

/**
 * Re-derives the hash chain from stored entries and confirms it matches. Used to prove
 * a dispute's audit trail hasn't been tampered with.
 */
export async function verifyChain(disputeId: string): Promise<{ valid: boolean; brokenAt?: string }> {
  const entries = await prisma.auditEntry.findMany({
    where: { disputeId },
    orderBy: { createdAt: "asc" },
  });

  let expectedPrevHash = GENESIS_HASH;
  for (const entry of entries) {
    if (entry.prevHash !== expectedPrevHash) {
      return { valid: false, brokenAt: entry.id };
    }
    const recomputed = computeHash(entry.prevHash, entry.payload);
    if (recomputed !== entry.currentHash) {
      return { valid: false, brokenAt: entry.id };
    }
    expectedPrevHash = entry.currentHash;
  }

  return { valid: true };
}
