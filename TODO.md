# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 5 — Thu 4 Sept)

- [ ] Confirm Vercel deploy is live (Piyush setting up via dashboard — see instructions left in session, includes env var list)
- [ ] Draft video script (deferred to Day 6, which already covers video recording in detail)

---

## Done today

- [x] `seed/evidenceTemplates.ts` — synthetic evidence text per dispute, deliberately **generic/non-unique per dispute** so the LLM filesystem cache collapses ~50 extraction calls into ~8-10 real API calls (see quota incident below)
- [x] `lib/rebuttal/baseline.ts` + `lib/metrics/compute.ts` + `scripts/run-metrics.ts` — runs the full pipeline across all 53 seed disputes, compares to ground truth, computes all 6 CLAUDE.md metrics, writes `metrics/latest.json`
- [x] `app/(dashboard)/metrics/page.tsx` — metrics dashboard, explicitly explains the 2 missed targets rather than hiding them (differentiator #4: name our own failure modes)
- [x] `?demo=true` walkthrough banner on `/disputes` — 3 curated examples (HIGH/MEDIUM/LOW)
- [x] Empty-state handling on disputes list
- [x] Page metadata branded (was still "Create Next App")

**Two infrastructure incidents, both real, both resolved — documented because they'll matter for the README's "what's synthetic vs real" honesty section:**

1. **Gemini free-tier quota was far stricter than assumed.** CLAUDE.md/env.example said ~1500 req/day; the actual key hit a hard 20/day cap partway through the first metrics run. Fixed two ways: (a) made evidence templates generic/cache-friendly instead of per-dispute-unique, cutting a full run from ~100+ calls to ~10-15, (b) switched to a second API key once the first was exhausted for the day.
2. **`gemini-2.5-flash` is deprecated for new-user API keys** — the second key hit a 404 pointing to `gemini-3.6-flash`. Switched the model (`lib/llm.ts`, CLAUDE.md updated) rather than keep fighting a dead model on a locked-stack assumption that's since gone stale.

**A real ground-truth design flaw, found by actually running the metrics script (not by inspecting code):** `not_received` and `duplicate_processing` only have one required evidence type each, so there's no valid "missing exactly one doc, otherwise strong" MEDIUM state for them — removing their one doc leaves zero evidence, which the router correctly scores as LOW. This was misrouting real MEDIUM-labeled disputes to LOW. Fixed the seed quotas (`seed/disputes.ts`) to only assign MEDIUM to `not_as_described` (the one code with 2 required items); redistributed the rest into HIGH/LOW. After the fix: 53/53 disputes match ground truth exactly.

**Final measured metrics** (see `metrics/latest.json`, decision made explicitly with Piyush to ship real numbers, not tune them):
- Auto-resolution: 90.6% (target 55-70%, missed — see metrics page for honest explanation)
- False-confidence: 0.0% (target <5%, met)
- Missing-doc precision: 100.0% (target >90%, met)
- Recommend-accept precision: 100.0% (target >90%, met)
- Avg decision latency: ~0.03ms excluding LLM calls (target <3000ms, met)
- Baseline delta: 9.4pp (target >=15pp, missed — same root cause as auto-resolution)

---

## Tomorrow (Day 6 — Fri 5 Sept — SUBMISSION DAY)

- [ ] Confirm Vercel deploy live, test on mobile/desktop/incognito
- [ ] `README.md` — hero, demo link, problem, features, architecture diagram, metrics table (honest about the 2 missed targets), what's synthetic vs real, 4-week roadmap, rulebook citations, setup instructions
- [ ] Architecture diagram (Excalidraw -> `docs/architecture.png`)
- [ ] Record + edit 5-min pitch video
- [ ] Fill Razorpay Buildathon submission form
- [ ] Post repo link, screenshot confirmation
