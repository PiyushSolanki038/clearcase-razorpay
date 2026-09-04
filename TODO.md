# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 0 — Sat 30 Aug)

- [ ] Deploy empty app to Vercel (Piyush importing via dashboard — confirm once live)

---

## Done today

- [x] Read Razorpay Dispute API docs — captured dispute entity fields, status/phase enums, webhook shape
- [x] Read Visa CE 3.0 guidance — 2-of-4 rule (2+ matching data elements from prior undisputed txns, 120-365 days prior)
- [x] RuPay reason codes noted (1001-1065 range via NPCI RGCS); using Visa 13.1/13.4/12.6 as canonical set per ROADMAP fallback
- [x] `create-next-app` scaffolded — Next.js 16.3.4 (not 14; CLAUDE.md updated to reflect this, see Locked tech stack)
- [x] Gemini API key obtained, saved to `.env.local`
- [x] Installed deps: prisma, @prisma/client, @google/genai, zod, @supabase/supabase-js
  - Note: Prisma pinned to 6.19.3, not latest (8.0 RC breaks schema.prisma datasource pattern — see CLAUDE.md)
- [x] shadcn/ui initialized (button component + lib/utils.ts scaffolded)
- [x] Pushed repo to GitHub (public): github.com/PiyushSolanki038/clearcase-razorpay
  - Note: found `C:\Users\Piyus` itself was a misconfigured git repo pointed at an unrelated project (Queue-Cure). Left it untouched; ClearCase now has its own properly-scoped repo.
- [x] Supabase project created (ref: ehraopztcpyxmozklkte), connection strings + API keys in `.env.local`, verified live via `prisma db pull`
- [x] DB schema designed and drafted as `prisma/schema.prisma` (not migrated yet — that's Day 1 Hr 5-6)
- [x] 5 synthetic disputes drafted under `seed/disputes/` in real Razorpay webhook shape, with ground-truth labels (should_win / should_ask_for_doc / should_lose / edge case)

---

## Tomorrow (Day 1 — Sun 31 Aug)

- [ ] Expand `seed/disputes.ts` to 50 synthetic disputes (3 reason codes x 2 networks, distribution per ROADMAP: 40% HIGH / 30% MEDIUM / 20% LOW / 10% edge)
- [ ] Encode rulebook JSON files under `rulebook/visa/` and `rulebook/rupay/` per CLAUDE.md schema
- [ ] Run `prisma migrate dev` against Supabase, write `scripts/seed-db.ts`
- [ ] `POST /api/disputes/ingest` — Zod validation, store, compute deadline
- [ ] `GET /api/disputes` and `GET /api/disputes/[id]`
