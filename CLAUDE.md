# ClearCase — Razorpay AI Buildathon Submission

You are helping Piyush ship a working submission by **5 Sept 2026**. This document is your persistent memory. Read it at the start of every session. If you disagree with anything here, **push back before coding**, don't silently change direction.

---

## Mission

Build a **Razorpay-native chargeback rebuttal engine** that:

1. Ingests a chargeback dispute (Razorpay webhook format).
2. Classifies the reason code against network rulebooks (Visa CE 3.0, RuPay).
3. Extracts evidence from uploaded documents into typed claims (via Claude API).
4. Scores the merchant's evidence against published requirements.
5. Routes by confidence:
   - **HIGH** → auto-generate a rebuttal package ready to submit.
   - **MEDIUM** → tell merchant exactly which one document to add.
   - **LOW** → honestly recommend "accept this dispute, you'll lose."
6. Logs every decision in a hash-chained audit trail.

**Track**: Razorpay AI Buildathon Track 02 (AI Risk Manager).
**Deadline**: 5 Sept 2026.
**Format**: public repo + 5-min pitch video + architecture diagram.

---

## Non-negotiable positioning

Do NOT frame this as "AI that decides chargebacks." Razorpay is an acquirer, not an adjudicator. Always frame this as:

> "Razorpay Shield handles pre-transaction fraud. ClearCase handles post-transaction rebuttals — the missing half of Razorpay's dispute product. Native to their Dispute API, tuned for Indian networks (RuPay, UPI) and Indian merchant reality (Hindi invoices, WhatsApp evidence, GST bills)."

Every commit, every doc line, every UI copy string must support this framing.

---

## Locked tech stack (do NOT suggest alternatives)

- **Framework**: Next.js 16 (App Router) + TypeScript — updated from originally-planned v14 on Day 0 since `create-next-app@latest` ships 16; using latest to avoid fighting current shadcn/Tailwind v4 tooling.
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL via Supabase (free tier)
- **ORM**: Prisma
- **LLM**: Google Gemini API (free tier) — use `gemini-2.5-flash` for extraction, classification, and rebuttal generation. SDK: `@google/genai`. Chosen because it has a genuine free tier with limits that fit this project (~1500 req/day). All LLM logic lives in `lib/llm.ts`.
- **File storage**: Supabase Storage
- **Auth**: Skip for MVP (single hardcoded user). Add Clerk only if time permits on Day 5.
- **Deployment**: Vercel
- **Rulebook storage**: versioned JSON in `/rulebook/*.json` inside the repo

**Why locked**: solo build, 6 days, one language (TypeScript), one deploy target. Any deviation costs hours we don't have.

---

## Directory structure

```
clearcase-razorpay/
├── CLAUDE.md              # this file
├── ROADMAP.md             # 6-day plan detail
├── TODO.md                # today's tasks (update daily)
├── README.md              # user-facing (write on Day 6)
├── app/
│   ├── (dashboard)/       # merchant dashboard routes
│   ├── api/
│   │   ├── disputes/      # ingest, list, get
│   │   ├── extract/       # LLM evidence extraction
│   │   ├── decide/        # classifier + scorer + router
│   │   └── metrics/       # aggregate metrics
│   └── layout.tsx
├── lib/
│   ├── llm.ts             # Gemini API wrapper (single source for all LLM calls)
│   ├── rules/             # rule engine
│   │   ├── loader.ts
│   │   ├── classifier.ts
│   │   ├── exclusions.ts
│   │   └── scorer.ts
│   ├── rebuttal/          # rebuttal generation
│   ├── audit/             # hash-chained log
│   └── ce3/               # Visa CE 3.0 evidence assembler
├── rulebook/
│   ├── visa/              # per-reason-code JSON
│   ├── rupay/
│   └── schema.json        # rulebook JSON schema
├── prisma/
│   └── schema.prisma
├── seed/
│   ├── disputes.ts        # 50 synthetic disputes
│   └── evidence/          # synthetic PDFs/images
└── scripts/
    ├── seed-db.ts
    └── run-metrics.ts     # runs system across all 50 disputes
```

---

## Rulebook JSON schema (authoritative)

Every rule file must follow this shape. **Do not deviate.**

```json
{
  "network": "visa" | "rupay" | "mastercard",
  "reason_code": "13.1",
  "name": "Merchandise/Services Not Received",
  "response_window_days": 30,
  "required_evidence": [
    {
      "id": "proof_of_delivery",
      "description": "Signed delivery confirmation showing recipient and address",
      "acceptable_forms": ["courier_pod", "email_signed_receipt", "otp_delivery_log"]
    }
  ],
  "any_one_of": [ ... ],           // qualifying items - one is enough
  "all_required": [ ... ],          // all must be present
  "exclusions": [
    {
      "condition": "cardholder_signed_receipt_present",
      "reclassify_to": "13.4"
    }
  ],
  "ce3_eligible": true,             // Visa CE 3.0 pathway applies
  "source_reference": "Visa Core Rules ID#0004544, updated 2026-01"
}
```

---

## Database schema (Prisma)

Core tables:
- `Dispute` — id, razorpay_dispute_id, payment_id, amount, currency, network, reason_code_raw, reason_code_canonical, deadline_at, status, created_at
- `EvidenceDoc` — id, dispute_id, file_url, doc_type, extracted_at, raw_text
- `ExtractedClaim` — id, evidence_doc_id, claim_type, claim_data (JSON), confidence, source_span
- `Decision` — id, dispute_id, confidence_band (HIGH/MEDIUM/LOW), action (AUTO_REBUT/REQUEST_DOC/RECOMMEND_ACCEPT), rebuttal_text, missing_items (JSON), reasoning_trace (JSON)
- `AuditEntry` — id, dispute_id, step, payload (JSON), prev_hash, current_hash, created_at

---

## Coding conventions

- **Every LLM call goes through `lib/llm.ts`.** No direct calls to Gemini from anywhere else.
- **Every LLM prompt includes an explicit JSON schema and requests JSON output.** Parse defensively — Gemini sometimes wraps JSON in markdown fences; strip before parsing.
- **Retry with exponential backoff on 429 rate limits.** Max 3 retries, then fail loud.
- **Filesystem cache in `lib/llm.ts`.** Same prompt hash → cached response during dev. Keeps you well under the daily free quota.
- **No hallucinated evidence.** If the extractor cannot find a claim in the source doc, it must return `null`, never invent.
- **Every decision writes to AuditEntry.** No exceptions. This is the product's core promise.
- **All rulebook lookups are deterministic.** The LLM never "decides" what a rule says. The LLM only reads documents; the rule engine applies rules.
- **Types are king.** Use Zod for runtime validation of every LLM output and every API boundary.
- **File length**: no source file over 200 lines. Split modules aggressively.
- **Commit after every module works.** Commit messages: `<day>: <what shipped>`. Example: `day-2: evidence extractor + typed claims`.

---

## Hard NOs

- ❌ Do not add features not in ROADMAP.md without explicit approval.
- ❌ Do not switch tech stack.
- ❌ Do not build authentication until Day 5 (and only if all else is done).
- ❌ Do not build multi-user or teams. One merchant. One demo user.
- ❌ Do not integrate real Razorpay API. Simulate webhook payloads with real Razorpay shape.
- ❌ Do not use `any` in TypeScript.
- ❌ Do not skip the metrics script. It IS the submission.
- ❌ Do not skip the hash chain in AuditEntry.
- ❌ Do not add animations, splash screens, or "polish" before core loop works end-to-end.
- ❌ Do not build a landing page. The dashboard IS the landing page.

---

## Metrics we must ship (Day 5 target numbers)

Run `scripts/run-metrics.ts` across all 50 seed disputes. Report:

- **Auto-resolution rate**: target 55–70%
- **False-confidence rate**: target < 5% (cases we said HIGH but ground truth would lose)
- **Missing-doc precision**: target > 90% (when we ask for a doc, is it actually the right doc)
- **Recommend-accept precision**: target > 90% (when we say "give up", would merchant actually lose)
- **Average end-to-end latency**: target < 3s excluding LLM calls
- **Baseline comparison**: our win-rate vs "generic template response" baseline — target delta ≥ 15 percentage points

These numbers **must** appear in the metrics page and the pitch video. If you can't hit them, we adjust the demo scope, not the numbers.

---

## The 5 differentiators (do not cut these)

1. **Multi-network rulebook** — Visa CE 3.0 + RuPay at minimum.
2. **CE 3.0 evidence auto-assembly** — pull prior undisputed transactions from same cardholder.
3. **Honest "accept" recommendation** — with dollar math (arbitration fee vs disputed amount).
4. **False-confidence metric surfaced in the UI** — we name our own failure rate.
5. **Hash-chained audit log** — every decision reproducible from source docs + rulebook version.

---

## Cut list (in order, if behind schedule)

Cut top-first only if a day slips:

1. Mastercard rulebook → keep Visa + RuPay
2. Third reason code → ship 2 codes deeply
3. Evidence upload UI → accept pasted text
4. Third confidence bucket (LOW) → ship HIGH + MEDIUM, mention LOW in "future work"
5. Auth → single hardcoded user

**Never cut**: metrics script, audit log, honest-failure section in video, README.

---

## Environment variables

```
ANTHROPIC_API_KEY=
DATABASE_URL=            # Supabase Postgres URL
DIRECT_URL=              # Supabase direct URL for Prisma
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Working rhythm (for Claude Code sessions)

At the start of each session:

1. Read this file.
2. Read `TODO.md` for today's tasks.
3. Read `ROADMAP.md` for the day's plan.
4. Ask Piyush: "Any changes from yesterday? What's the goal for this session?"
5. Work in small commits. After each commit, update `TODO.md`.

At the end of each session:

1. Update `TODO.md` — mark done, add tomorrow's tasks.
2. Update this file if any decision changed.
3. Commit and push.

---

## Push back on Piyush when

- He wants to add scope not in ROADMAP.
- He wants to skip metrics or audit log.
- He wants to make the UI fancy before the core loop works.
- He wants to use the real Razorpay API (out of scope for MVP).
- He wants to shorten the video below 4:30 or extend beyond 5:00.

Ship the plan. Push back is not disrespect — it protects the deadline.
