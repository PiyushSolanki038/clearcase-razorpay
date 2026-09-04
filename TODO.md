# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 1 — Sun 31 Aug)

_(empty — full day complete, see Done today)_

---

## Done today

- [x] Expanded `seed/disputes.ts` to 50 synthetic disputes (deterministic generator, not hand-written JSON) — 3 canonical reason-code families x 2 networks, distribution 40% HIGH / 30% MEDIUM / 20% LOW / 10% edge, matches ROADMAP spec exactly
- [x] Encoded 6 rulebook JSON files under `rulebook/visa/` (13.1, 13.4, 12.6) and `rulebook/rupay/` (1061, 1062, 1002)
  - Flagged for Day 3: real Visa CE 3.0 (2-of-4 rule) applies to dispute condition 10.4, not to our fallback canonical set — marked `ce3_eligible: false` on all for honesty, need a scope decision before building `lib/ce3/assemble.ts`
  - Flagged: RuPay reason code docs have no official public NPCI PDF — sourced from community summaries, noted in `source_reference`
- [x] Prisma schema migrated to live Supabase Postgres (`prisma migrate dev --name init`)
- [x] `scripts/seed-db.ts` written and run — 50 disputes now in the DB
- [x] `POST /api/disputes/ingest` — Zod-validated against real Razorpay webhook shape, upserts by `razorpayDisputeId`, network auto-detected from reason code shape (`lib/network.ts`)
- [x] `GET /api/disputes` and `GET /api/disputes/[id]` — tested live via curl, including 404 case
- [x] Added `tsx` as dev dependency for running TS scripts directly

---

## Tomorrow (Day 2 — Mon 1 Sept)

- [ ] `lib/llm.ts` — Gemini SDK wrapper (`gemini-2.5-flash`), JSON extraction + fence-stripping + Zod validation, filesystem cache in `.llm-cache/`, exponential backoff on 429
- [ ] `lib/rules/classifier.ts` — LLM canonical reason-code classification against rulebook
- [ ] `lib/rules/extractor.ts` — typed claim extraction from evidence docs, null-over-guess
- [ ] `lib/rules/exclusions.ts` — deterministic exclusion/reclassification checks
- [ ] `lib/rules/scorer.ts` — deterministic evidence scoring against `required_evidence`
- [ ] `POST /api/decide/[disputeId]/analyze` — wire classify -> extract -> exclude -> score
