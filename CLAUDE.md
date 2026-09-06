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
- **ORM**: Prisma — pinned to `6.19.3` (not latest). Prisma 7/8 moved connection URLs out of `schema.prisma` into `prisma.config.ts`, which would break the documented schema pattern below. Do not upgrade mid-build.
- **LLM**: Google Gemini API (free tier) — use `gemini-3.6-flash` for extraction, classification, and rebuttal generation (switched from `gemini-2.5-flash` on Day 5 after it was deprecated for new-user API keys — the API started returning 404 and pointing to 3.6). SDK: `@google/genai`. Real observed free-tier limits varied sharply by key (as low as 5 req/min / 20 req/day on one key) — do not assume ~1500 req/day holds; keep prompts cache-friendly (see `seed/evidenceTemplates.ts`) so a full metrics run stays cheap. All LLM logic lives in `lib/llm.ts`.
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
- ~~❌ Do not build a landing page. The dashboard IS the landing page.~~ **Reversed Day 7 (post-submission, 6 Sept 2026)**: submission is already in, so this is now for portfolio/sharing purposes. `/` is a real landing page (hero, how-it-works, why-ClearCase, footer); `/disputes` is unchanged and still reachable via the landing page's "View Demo" button.

---

## Metrics we must ship (Day 5 — actual measured numbers)

Run `scripts/run-metrics.ts` across all 53 seed disputes (50 + 3 CE3.0 demo disputes added Day 3). Original targets vs. what we actually measured, with honest ground truth (see Day 5 finding below):

- **Auto-resolution rate**: target 55–70% — **measured 90.6%**. Missed on purpose, not by accident: only `not_as_described` (2 required evidence items) can validly produce a MEDIUM case in our 3-reason-code rulebook; `not_received` and `duplicate_processing` have a single required evidence item each, so "missing the one doc" is indistinguishable from "no evidence" — there's no valid partial state. This is a real characteristic of these specific reason codes, not a system flaw: evidence for them is genuinely closer to binary.
- **False-confidence rate**: target < 5% — **measured 0.0%**.
- **Missing-doc precision**: target > 90% — **measured 100.0%**.
- **Recommend-accept precision**: target > 90% — **measured 100.0%**.
- **Average decision latency**: target < 3s excluding LLM calls — **measured ~0.03-0.08ms** (the deterministic exclusion/score/route steps are near-instant; LLM calls are the real bottleneck and are excluded from this figure per the target's own definition).
- **Baseline comparison**: target delta ≥ 15pp — **measured 9.4pp** (system 60.4% vs. baseline 50.9% win rate). Below target for the same structural reason as auto-resolution — with only one reason code able to produce a MEDIUM/missing-doc win, the system's edge over a blind-contest baseline is smaller than it would be with a richer evidence-tier mix.

Decision made explicitly with Piyush on Day 5: ship the real numbers, don't tune the dataset or definitions to hit the original targets. The README and pitch video present these as measured results and explain the auto-resolution/baseline-delta shortfall honestly rather than hiding it — this is itself a demonstration of the product's core promise (surfacing its own failure modes, not just its wins).

These numbers **must** appear in the metrics page and the pitch video.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
