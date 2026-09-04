// Loads and caches rulebook JSON files from /rulebook. Deterministic, no LLM involved.

import { readFileSync, readdirSync } from "fs";
import path from "path";
import { z } from "zod";

const evidenceItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  acceptable_forms: z.array(z.string()).optional(),
});

export const rulebookEntrySchema = z.object({
  network: z.enum(["visa", "rupay", "mastercard"]),
  reason_code: z.string(),
  name: z.string(),
  response_window_days: z.number().int().positive(),
  required_evidence: z.array(evidenceItemSchema),
  any_one_of: z.array(evidenceItemSchema),
  all_required: z.array(z.string()),
  exclusions: z.array(
    z.object({ condition: z.string(), reclassify_to: z.string() })
  ),
  ce3_eligible: z.boolean(),
  source_reference: z.string(),
});

export type RulebookEntry = z.infer<typeof rulebookEntrySchema>;

const RULEBOOK_DIR = path.join(process.cwd(), "rulebook");

let cache: RulebookEntry[] | null = null;

export function loadRulebook(): RulebookEntry[] {
  if (cache) return cache;

  const entries: RulebookEntry[] = [];
  for (const network of ["visa", "rupay"] as const) {
    const dir = path.join(RULEBOOK_DIR, network);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const raw = JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
      entries.push(rulebookEntrySchema.parse(raw));
    }
  }

  cache = entries;
  return entries;
}

export function findRule(network: string, reasonCode: string): RulebookEntry | undefined {
  return loadRulebook().find(
    (r) => r.network === network && r.reason_code === reasonCode
  );
}
