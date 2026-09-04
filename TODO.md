# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 3 — Tue 2 Sept)

_(empty — full day complete including CE3.0, see Done today)_

---

## Done today

- [x] `lib/rules/router.ts`, `lib/rebuttal/generate.ts`, `lib/audit/chain.ts`, `lib/rebuttal/accept-explanation.ts`, `POST /api/decide/[disputeId]/execute` (see earlier commit for details)
- [x] **CE3.0 scope resolved with Piyush**: added Visa 10.4 as a 4th canonical code (`rulebook/visa/10.4.json`), grounded in the real 2-of-4 rule rather than misapplying it to 13.1/13.4/12.6
- [x] `seed/priorTransactions.ts` — synthetic prior-transaction history for 3 cardholders (one clean CE3.0 win, one out-of-window, one insufficient-matching-elements)
- [x] `lib/ce3/assemble.ts` — deterministic 2-of-4 rule implementation (2+ qualifying prior transactions, 2+ matching element types, 120-365 day window)
- [x] Wired CE3.0 into `lib/rules/pipeline.ts` — when a rule is `ce3_eligible` and a `ce3Transaction` is provided, an eligible match injects a synthetic `ce3_prior_transactions` claim that flows through scoring/routing/rebuttal like any other evidence
- [x] Added 3 dedicated CE3.0 demo disputes on top of the 50 (total seed count now 53) — flagging this count change explicitly since ROADMAP specified 50
- [x] Live-tested all 3 CE3.0 scenarios end-to-end (HIGH win, LOW out-of-window, LOW insufficient-elements) — all routed correctly

**A third live-testing bug, worth calling out because of what it demonstrates**: the rebuttal generator only read `source_span` (a document quote) to build its evidence prompt. The CE3.0 claim has no source document — its facts live in `claim_data` — so the LLM saw `"null"` for that claim and hallucinated a directly contradictory rebuttal ("no prior transactions found, we cannot contest this") despite the system's own score being a perfect 1.0. This is exactly the failure mode CLAUDE.md's "no hallucinated evidence" rule warns about, and it would have shipped invisibly without testing against real Gemini calls. Fixed: the generator now falls back to `claim_data` when `source_span` is absent.

---

## Tomorrow (Day 4 — Wed 3 Sept)

- [ ] Dashboard route `app/(dashboard)/disputes/page.tsx` — table view (columns: ID, amount, reason, deadline countdown, status, confidence band)
- [ ] Detail route `app/(dashboard)/disputes/[id]/page.tsx` — three-column layout (rulebook criteria / evidence / decision panel)
- [ ] Evidence upload UI — or pasted-text per cut list if time is tight
- [ ] Rebuttal preview + "Approve & Submit" button
- [ ] Confidence Trace viewer modal (extracted claims -> matched rules -> exclusions -> score -> band, visual step-through)
