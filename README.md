# ClearCase

**Razorpay Shield handles pre-transaction fraud. ClearCase handles post-transaction rebuttals — the missing half of Razorpay's dispute product.** Native to their Dispute API, tuned for Indian networks (RuPay, UPI) and Indian merchant reality (Hindi invoices, WhatsApp evidence, GST bills).

Built for the **Razorpay AI Buildathon — Track 02 (AI Risk Manager)**.

- **Live demo:** _pending Vercel deploy — link added once live_
- **Pitch video:** _added Day 6_
- **Repo:** [github.com/PiyushSolanki038/clearcase-razorpay](https://github.com/PiyushSolanki038/clearcase-razorpay)

---

## The problem

- Merchants who get chargebacked have to fight back manually, with generic templates, against a hard deadline — and most don't know what evidence a given reason code actually requires.
- Razorpay's Dispute API gives merchants the *ability* to contest, but no help deciding *whether* to, or *what to submit*.
- A wrong call in either direction is expensive: contesting a case you'll lose burns an arbitration fee on top of the loss; not contesting a winnable one is money left on the table.

## What's in the box

1. **Ingests** a chargeback dispute in real Razorpay webhook shape (`app/api/disputes/ingest`).
2. **Classifies** the reason code against versioned network rulebooks — Visa (13.1, 13.4, 12.6, 10.4/CE3.0) and RuPay (1061, 1062, 1002).
3. **Extracts** evidence from pasted documents into typed, cited claims via Gemini — never invents a claim that isn't in the source text (`lib/rules/extractor.ts`).
4. **Scores** the evidence deterministically against each rule's `required_evidence` — the LLM never decides what a rule requires, only what a document says.
5. **Routes** by confidence:
   - **HIGH** → auto-generates a rebuttal package, ready to submit.
   - **MEDIUM** → tells the merchant exactly which one document to add.
   - **LOW** → honestly recommends accepting, with the arbitration-fee math shown.
6. **Logs** every step of every decision in a hash-chained audit trail — reproducible from the source documents and rulebook version alone.

### The 5 differentiators

1. **Multi-network rulebook** — Visa + RuPay, not just Visa.
2. **CE3.0 evidence auto-assembly** — implements Visa's real 2-of-4 rule (dispute condition 10.4): pulls prior undisputed transactions and checks for 2+ matching data elements (account ID, device ID, shipping address, IP) in the 120–365 day window.
3. **Honest "accept" recommendation** — with real dollar math (arbitration fee vs. disputed amount), not just a vague "you'll probably lose."
4. **We name our own failure rate** — the metrics dashboard (`/metrics`) shows false-confidence rate and explicitly calls out which targets we missed and why, rather than hiding it.
5. **Hash-chained audit log** — every `AuditEntry` includes `prev_hash + sha256(payload) = current_hash`, independently verifiable.

## Architecture

![ClearCase architecture](docs/architecture.svg)

Solid green = deterministic rule engine (no LLM, no randomness). Dashed blue = Gemini call. Yellow = Postgres persistence. Full pipeline: `lib/rules/pipeline.ts` orchestrates classify → CE3.0 assemble → extract → exclude → score; `lib/rules/router.ts` routes by confidence; `lib/rebuttal/*` generates the output; `lib/audit/chain.ts` logs every step.

## Metrics

Run across all 53 seed disputes (`npx tsx scripts/run-metrics.ts`), compared against hand-labeled ground truth:

| Metric | Target | Measured | |
|---|---|---|---|
| Auto-resolution rate | 55–70% | **90.6%** | missed — see below |
| False-confidence rate | < 5% | **0.0%** | met |
| Missing-doc precision | > 90% | **100.0%** | met |
| Recommend-accept precision | > 90% | **100.0%** | met |
| Avg decision latency (excl. LLM) | < 3000ms | **~0.03ms** | met |
| Baseline delta (vs. generic template) | ≥ 15pp | **9.4pp** | missed — see below |

**Why two targets are missed — and why we're not tuning the numbers to hit them.** Of the 3 canonical reason codes, only `not_as_described` requires two pieces of evidence, so it's the only one that can produce a genuine "missing exactly one document, otherwise strong" MEDIUM case. `not_received` and `duplicate_processing` each need just one piece of evidence — you either have it (HIGH) or you don't (LOW); there's no valid partial state to engineer around. That structurally caps how often the system lands on MEDIUM, which caps both the auto-resolution rate (MEDIUM cases need a human to add a document, so they're not "auto") and the baseline delta (the system's edge over a blind-contest baseline comes largest from correctly identifying missing-doc cases). CLAUDE.md's own rule for this project: *if you can't hit the targets, adjust scope, not the numbers.* So these are the real, unedited results — the same honesty principle behind differentiator #4.

This was also caught the hard way: an earlier version of the seed data had already-broken ground truth here (asking for "the one required document" on a single-evidence-type rule leaves zero evidence, not a partial case), which was silently misrouting real disputes. Running the metrics script against the actual pipeline — not just reading the code — is what surfaced it.

## What's synthetic vs. real

- **Synthetic:** all 53 seed disputes, their evidence text, and the prior-transaction history used for CE3.0 matching. No real Razorpay API integration — webhook payloads are simulated in the real Razorpay shape (`seed/disputes.ts`), per this project's explicit MVP scope.
- **Real:** Razorpay's documented Dispute entity shape (verified against `razorpay.com/docs/api/disputes`), Visa's Compelling Evidence 3.0 2-of-4 rule (verified against Visa's public merchant readiness guide), Postgres via Supabase, and every LLM call — extraction, classification, and rebuttal generation genuinely go through Gemini, not mocked.
- **Honest gap:** RuPay's chargeback reason codes (1061/1062/1002) are sourced from community summaries — NPCI does not publish a public reason-code PDF we could find. Flagged in each rulebook file's `source_reference`.
- **Honest gap:** CE3.0's real-world scope is Visa dispute condition 10.4 only. We ship a 4th rulebook entry (`rulebook/visa/10.4.json`) specifically so the CE3.0 differentiator is grounded in a real rule rather than misapplied to the other 3 codes.

## 4-week production roadmap

1. **Week 1** — Real Razorpay Dispute API integration (webhook signature verification, live `accept`/`contest` calls), replacing simulated payloads.
2. **Week 2** — Evidence upload UI (drag-drop, OCR for scanned documents/Hindi invoices), Supabase Storage wiring for `EvidenceDoc`.
3. **Week 3** — Expand rulebook coverage: Mastercard, remaining Visa/RuPay reason codes, a verified NPCI source for RuPay codes.
4. **Week 4** — Multi-user auth (Clerk), team roles, real arbitration-fee schedule by network/region instead of the current representative flat figure.

## Rulebook source citations

- Visa Core Rules, reason codes 13.1 / 13.4 / 12.6 / 10.4 — see `source_reference` in each `rulebook/visa/*.json` file.
- Visa Compelling Evidence 3.0 — [Visa Compelling Evidence 3.0 Merchant Readiness guide, March 2023](https://usa.visa.com/content/dam/VCOM/regional/na/us/support-legal/documents/compelling-evidence-3.0-merchant-readiness-mar2023.pdf).
- RuPay / NPCI reason codes 1061 / 1062 / 1002 — community-sourced (no official public NPCI PDF found); see `source_reference` in each `rulebook/rupay/*.json` file. Flagged for verification before production use.

## Setup

```bash
git clone https://github.com/PiyushSolanki038/clearcase-razorpay.git
cd clearcase-razorpay
npm install
cp env.example .env.local   # fill in GEMINI_API_KEY (gemini-3.6-flash) and Supabase values
npx prisma migrate dev
npx tsx scripts/seed-db.ts
npm run dev
```

Then visit `http://localhost:3000` (redirects to `/disputes`), or `http://localhost:3000/disputes?demo=true` for a guided 3-example walkthrough.

To reproduce the metrics: `npx tsx scripts/run-metrics.ts`. Gemini's free-tier request limits vary sharply by key/account (see `env.example`) — the seed evidence templates are deliberately cache-friendly to keep a full run cheap.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS + shadcn/ui, PostgreSQL via Supabase, Prisma 6.19.3 (pinned — see `CLAUDE.md`), Google Gemini (`gemini-3.6-flash`), Zod for runtime validation at every LLM output and API boundary. See `CLAUDE.md` for the full locked-stack rationale and every deviation made along the way, documented as it happened.
