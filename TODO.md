# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 2 — Mon 1 Sept)

_(empty — full day complete, see Done today)_

---

## Done today

- [x] `lib/llm.ts` — Gemini wrapper (`gemini-2.5-flash`), JSON-only responses, markdown-fence stripping, Zod validation, filesystem cache in `.llm-cache/` (gitignored), exponential backoff on 429 (max 3 retries)
- [x] `lib/rules/loader.ts` — loads + Zod-validates all rulebook JSON at runtime, deterministic lookup by network+code
- [x] `lib/rules/classifier.ts` — LLM picks best canonical code from rulebook candidates; exact raw-code matches skip the LLM call entirely (fast path, saves quota)
- [x] `lib/rules/extractor.ts` — typed claim extraction from evidence doc text, null-over-guess enforced via prompt + per-claim `present` boolean
- [x] `lib/rules/exclusions.ts` — deterministic exclusion/reclassification checks, no LLM
- [x] `lib/rules/scorer.ts` — deterministic evidence scoring against `all_required`/`any_one_of`
- [x] `POST /api/decide/[disputeId]/analyze` — wires classify -> extract -> exclude -> score, tested live end-to-end against real Gemini calls (not mocked)

**Bugs found and fixed during live testing (not just unit-level — caught by an actual API call):**
- Scorer was double-counting the same claim_type when a rule's `all_required` was empty and `any_one_of` covered it — the fallback logic incorrectly reused `required_evidence` (an informational catalog) as a second gate. Fixed: `all_required`/`any_one_of` are now used as-is, `required_evidence` is never a fallback.
- 5 of 6 rulebook exclusion rules had nonsensical `reclassify_to` targets (copied from CLAUDE.md's illustrative schema example without adapting the logic — e.g. "counterfeit-goods return accepted" incorrectly reclassified to "not received"). Fixed: all now point to a `closed_no_action` sentinel, which is semantically correct (refund/return already handled = case closed, not a different chargeback category).

---

## Tomorrow (Day 3 — Tue 2 Sept)

- [ ] `lib/rules/router.ts` — confidence router (HIGH/MEDIUM/LOW thresholds per code)
- [ ] `lib/rebuttal/generate.ts` — LLM-drafted rebuttal, cited to source docs
- [ ] `lib/ce3/assemble.ts` — CE 3.0 evidence assembly — **needs a scope decision first**: real CE3.0 applies to Visa dispute condition 10.4, not our fallback canonical set (13.1/13.4/12.6). Ask Piyush how to handle this before building it.
- [ ] `lib/audit/chain.ts` — hash-chained audit log
- [ ] Recommend-accept pathway with dollar math (arbitration fee vs disputed amount)
- [ ] `POST /api/decide/[disputeId]/execute` — full pipeline, writes Decision + AuditEntry
