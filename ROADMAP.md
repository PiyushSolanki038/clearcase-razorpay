# 6-Day Roadmap — ClearCase Razorpay

Referenced by CLAUDE.md. Read this at the start of each day's session. Follow the day order strictly. If a day slips, use the cut list in CLAUDE.md — do not skip forward.

---

## Day 0 — Sat 30 Aug (6 hrs)

**Goal**: no code yet. Foundation only.

- [ ] **Hr 1** — Read Razorpay Dispute API docs end to end (`https://razorpay.com/docs/api/disputes/`). Note every field, state, webhook.
- [ ] **Hr 2** — Google "Visa Compelling Evidence 3.0 merchant guide". Read the Visa PDF. Note the 4 evidence pillars and the 2 undisputed-transaction requirement.
- [ ] **Hr 3** — Search "RuPay dispute reason codes NPCI". Pick 3 codes to cover. If RuPay docs are hard to find, use Visa 13.1 / 13.4 / 12.6 as canonical set and add RuPay equivalents later.
- [ ] **Hr 4** — Initialize repo:
  - `npx create-next-app@latest clearcase-razorpay --typescript --tailwind --app`
  - Install: `prisma @prisma/client @google/genai zod @supabase/supabase-js`
  - Install shadcn/ui: `npx shadcn@latest init`
  - Add `CLAUDE.md`, `ROADMAP.md`, `TODO.md` to repo root
  - Push to GitHub (public repo)
  - Deploy empty app to Vercel
- [ ] **Hr 5** — Set up Supabase project. Copy connection strings to `.env.local`. Design DB schema on paper (see CLAUDE.md).
- [ ] **Hr 6** — Draft 5 synthetic disputes as JSON files under `seed/disputes/`. Real Razorpay webhook shape.

**Ship**: repo public, empty app on Vercel, 5 disputes drafted, Supabase live.

---

## Day 1 — Sun 31 Aug (10 hrs)

**Goal**: rule engine + data foundation.

- [ ] **Hr 1–2** — Expand `seed/disputes.ts` to 50 synthetic disputes:
  - 3 reason codes × 2 networks = 6 groups
  - Distribution: 40% HIGH-clear, 30% MEDIUM-missing-one-doc, 20% LOW-conflicting, 10% edge cases (expired window, wrong network, etc.)
  - Each dispute has ground-truth label: `should_win | should_lose | should_ask_for_X`
- [ ] **Hr 3–4** — Encode rulebook JSON files under `rulebook/visa/` and `rulebook/rupay/`. Follow schema in CLAUDE.md. Cite source references honestly.
- [ ] **Hr 5–6** — Prisma schema (see CLAUDE.md). Migrate. Write `scripts/seed-db.ts`.
- [ ] **Hr 7–8** — `POST /api/disputes/ingest` — validates payload with Zod, stores, computes deadline.
- [ ] **Hr 9–10** — `GET /api/disputes` and `GET /api/disputes/[id]`. Test with `curl` or Postman.

**Ship**: 50 disputes in DB, rulebook loaded, ingest API working.

---

## Day 2 — Mon 1 Sept (10 hrs)

**Goal**: brain of the system.

- [ ] **Hr 1–2** — `lib/llm.ts` — wrap Gemini SDK (`@google/genai`, model `gemini-2.5-flash`). Add `extractStructured(prompt, schema)` that (a) requests JSON output, (b) strips markdown fences, (c) validates with Zod, (d) caches to `.llm-cache/` by prompt hash, (e) retries with exponential backoff on 429.
- [ ] **Hr 3** — `lib/rules/classifier.ts` — given dispute text + reason code list, Claude returns canonical code + confidence.
- [ ] **Hr 4–5** — `lib/rules/extractor.ts` — given uploaded doc text, Claude returns typed claims. **Rule: null over guess.**
- [ ] **Hr 6** — `lib/rules/exclusions.ts` — deterministic. Given claims, checks reason code precedence. Returns `{ excluded: bool, reclassify_to?: string }`.
- [ ] **Hr 7–8** — `lib/rules/scorer.ts` — deterministic. Compares claims against `required_evidence`. Returns `{ score: 0–1, present: [...], missing: [...] }`.
- [ ] **Hr 9–10** — Wire together as `POST /api/decide/[disputeId]/analyze` — runs classify → extract → exclude → score. Return debug JSON.

**Ship**: paste a dispute + evidence, get back full analysis.

---

## Day 3 — Tue 2 Sept (10 hrs)

**Goal**: decision layer + audit spine.

- [ ] **Hr 1–2** — `lib/rules/router.ts` — confidence router. Thresholds per code. Returns `{ band: HIGH/MEDIUM/LOW, action, reasoning }`.
- [ ] **Hr 3–5** — `lib/rebuttal/generate.ts` — given rule + present claims + dispute, Claude drafts a structured rebuttal document. Cite each claim to source doc.
- [ ] **Hr 6–7** — `lib/ce3/assemble.ts` — CE 3.0 pathway. Given cardholder ID, pull prior undisputed transactions from seed data, format per Visa CE 3.0 spec. **This is a differentiator — do not skip.**
- [ ] **Hr 8** — `lib/audit/chain.ts` — hash-chained log. Every write includes `prev_hash + serialize(payload) → sha256`.
- [ ] **Hr 9** — "Recommend Accept" pathway — Claude explains why merchant should give up. Include dollar math: arbitration fee (typically $500 USD or equivalent) vs disputed amount.
- [ ] **Hr 10** — `POST /api/decide/[disputeId]/execute` — runs full pipeline, writes Decision + AuditEntry.

**Ship**: dispute in → full decision out. Backend loop complete.

---

## Day 4 — Wed 3 Sept (10 hrs)

**Goal**: merchant-facing UI.

- [ ] **Hr 1–2** — Dashboard route `app/(dashboard)/disputes/page.tsx` — table of disputes. Columns: ID, amount, reason, deadline countdown (color-coded), status, confidence band.
- [ ] **Hr 3–4** — Detail route `app/(dashboard)/disputes/[id]/page.tsx`. Three-column layout:
  - Left: dispute summary + rulebook criteria (from JSON)
  - Center: extracted evidence (with confidence per claim)
  - Right: decision panel — action, rebuttal preview, or missing-doc request
- [ ] **Hr 5–6** — Evidence upload UI. Drag-drop. Show live extraction in the center column.
- [ ] **Hr 7–8** — Rebuttal preview with "Approve & Submit" button (logs to console, marks Decision as submitted).
- [ ] **Hr 9–10** — **Confidence Trace viewer**. Modal that shows: extracted claims → matched rules → exclusions checked → score computed → band assigned. Visual step-through. Judges will love this.

**Ship**: browsable, clickable, demoable product.

---

## Day 5 — Thu 4 Sept (10 hrs)

**Goal**: metrics + polish + break-fix.

- [ ] **Hr 1–2** — `scripts/run-metrics.ts` — runs system across all 50 seed disputes. Compares system decision to ground-truth label. Outputs JSON to `metrics/latest.json`.
- [ ] **Hr 3** — **Baseline comparison**: implement a "generic template rebuttal" as baseline. Run same 50 disputes through it (also LLM-generated but without rule grounding). Compare win-rates.
- [ ] **Hr 4** — `app/(dashboard)/metrics/page.tsx` — dashboard showing all 6 metrics from CLAUDE.md.
- [ ] **Hr 5–6** — Break-fix pass. Handle every error state. Empty states, loading states, error toasts.
- [ ] **Hr 7** — Add `?demo=true` mode that walks a first-time viewer through 3 example disputes automatically. Judges will click this.
- [ ] **Hr 8** — Polish. Consistent spacing. Fix mobile view. Add favicon.
- [ ] **Hr 9** — Final Vercel deploy. Test on mobile, desktop, incognito.
- [ ] **Hr 10** — Draft video script. Practice-record once.

**Ship**: production-ready deploy with real metrics.

---

## Day 6 — Fri 5 Sept (10 hrs — SUBMISSION DAY)

**Goal**: story, submit, done.

- [ ] **Hr 1–2** — Write `README.md`. Structure:
  - One-line hero (from CLAUDE.md positioning)
  - Live demo link + video link
  - The problem (3 bullets)
  - What's in the box (feature list)
  - Architecture diagram (embed image)
  - Metrics table (from `metrics/latest.json`)
  - What's synthetic vs real (be honest)
  - 4-week production roadmap
  - Rulebook source citations
  - One-command setup
- [ ] **Hr 3–4** — Architecture diagram in Excalidraw. Export PNG. Add to repo `docs/architecture.png`.
- [ ] **Hr 5–7** — Record 5-min pitch video. Screen-record + voiceover. Aim for 3 takes.
  - 0:00–0:30 — Problem
  - 0:30–1:00 — Where Razorpay sits + the gap
  - 1:00–3:00 — Live demo
  - 3:00–4:00 — Metrics slide
  - 4:00–4:30 — Architecture
  - 4:30–5:00 — Why Razorpay ships this
- [ ] **Hr 8** — Edit video. Add captions (auto-caption then correct). Upload to YouTube as unlisted.
- [ ] **Hr 9** — Fill Razorpay Buildathon Google Form. Include:
  - Repo URL
  - Live demo URL
  - Video URL
  - Architecture diagram
  - Track: 02 — AI Risk Manager
- [ ] **Hr 10** — Screenshot confirmation. Post repo link on your LinkedIn (even if you don't get selected, this becomes a portfolio piece). Sleep.

**Ship**: submitted. Done.
