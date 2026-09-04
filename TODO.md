# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 3 — Tue 2 Sept)

- [ ] `lib/ce3/assemble.ts` — CE 3.0 evidence assembler. **Blocked on a scope decision from Piyush** (see notes below). Everything else on Day 3's list is done.

---

## Done today

- [x] `lib/rules/router.ts` — deterministic confidence router (HIGH/MEDIUM/LOW), checks expired deadline first, then exclusions, then score
- [x] `lib/rebuttal/generate.ts` — LLM-drafted rebuttal citing only extractor-found claims
- [x] `lib/rules/pipeline.ts` — extracted the shared classify->extract->exclude->score logic out of the Day 2 `/analyze` route so `/execute` doesn't duplicate it
- [x] `lib/audit/chain.ts` — hash-chained audit log (`appendAuditEntry`, `verifyChain`), verified programmatically that a real execute run produces a valid chain
- [x] `lib/rebuttal/accept-explanation.ts` — differentiator #3: honest accept recommendation with dollar math (disputed amount vs representative arbitration fee)
- [x] `POST /api/decide/[disputeId]/execute` — full pipeline, writes Decision + AuditEntry per step, tested live for all three confidence bands (HIGH/MEDIUM/LOW)

**Two more real bugs caught by live testing (not unit tests — actual API calls):**
- `Decision.reasoningTrace` write failed Prisma's Json type at build time (interfaces aren't plain objects) — fixed with a JSON round-trip at the write boundary.
- `checkExclusions`'s condition-to-claim-type map reused unrelated evidence (e.g. "authenticity_certificate present") as a false proxy for conditions it doesn't measure (e.g. "cardholder's return was accepted"). This silently misrouted a real MEDIUM case into a false LOW/RECOMMEND_ACCEPT during testing. Fixed: the map is now empty until real dedicated claim types exist for these conditions — exclusions never fire on a guess, matching the same "null over guess" principle used elsewhere.

**Decision needed before `lib/ce3/assemble.ts` can be built** (flagged since Day 1): real Visa CE 3.0 (the 2-of-4 rule) applies specifically to dispute condition 10.4 (first-party misuse/fraud). Our canonical code set is 13.1/13.4/12.6 per ROADMAP's fallback — none of these are actually CE3.0-eligible under real Visa rules. Options to put to Piyush:
  1. Add 10.4 as a 4th Visa code so the demo's CE3.0 pathway is grounded in a real rule.
  2. Build the CE3.0 assembler as a generic "prior undisputed transaction" evidence-puller and apply it to 13.1 specifically, clearly labeled in the README as a simplification (real-world scope is 10.4 only).
  3. Cut CE3.0 per the cut list — but CLAUDE.md marks it a "do not cut" differentiator, so this needs explicit sign-off.

---

## Tomorrow (Day 4 — Wed 3 Sept)

- [ ] Resolve CE3.0 scope decision above, then build `lib/ce3/assemble.ts`
- [ ] Dashboard route `app/(dashboard)/disputes/page.tsx` — table view
- [ ] Detail route `app/(dashboard)/disputes/[id]/page.tsx` — three-column layout
- [ ] Evidence upload UI (or pasted-text per cut list)
- [ ] Rebuttal preview + "Approve & Submit" button
- [ ] Confidence Trace viewer modal
