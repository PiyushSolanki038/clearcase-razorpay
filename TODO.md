# TODO — Current Day

**Update this file at the start and end of every session.** Move done items to `## Done today`. Add tomorrow's tasks to `## Tomorrow`. Only ever keep 3 sections live: Today / Done today / Tomorrow.

---

## Today (Day 4 — Wed 3 Sept)

_(empty — full day complete, see Done today)_

---

## Done today

- [x] Dashboard route `app/(dashboard)/disputes/page.tsx` — table with amount/reason/network/deadline countdown (color-coded)/status/confidence band; root `/` redirects here (no separate landing page, per Hard NOs)
- [x] Detail route `app/(dashboard)/disputes/[id]/page.tsx` — three-column layout: dispute summary + rulebook criteria / extracted evidence / decision panel
- [x] Evidence input — pasted text per cut list (no upload UI), supports multiple documents
- [x] `POST /api/decide/[disputeId]/submit` + `Decision.submitted` field (small migration) — Approve & Submit button, logs to console per Hard NO on real Razorpay integration
- [x] Confidence Trace viewer modal — step-through of the full AuditEntry chain (classify -> ce3 -> extract -> exclude -> score -> route -> generate -> decision)
- [x] Actually launched and drove the app in a real browser (Playwright, since `chromium-cli` wasn't installed here) — not just typechecked. Verified the golden path end-to-end: list -> detail -> paste evidence -> run analysis -> HIGH rebuttal -> submit, plus a LOW/expired-window case and the confidence trace dialog.

**Two real bugs found by actually looking at screenshots, not just checking exit codes:**
- `DialogTrigger asChild` (Radix pattern) doesn't exist on this project's Base UI-based shadcn dialog — build would have shipped a broken confidence-trace button. Fixed with Base UI's `render` prop.
- `globals.css` had `--font-sans: var(--font-sans)` — a self-referential variable from the shadcn scaffold that never resolved, silently falling back to the browser's default serif font on every page. Not something I introduced, but it would have shipped since `next build` doesn't catch broken CSS variable references. Fixed to point at the actual `--font-geist-sans` variable `layout.tsx` defines.

(One false alarm: the confidence-trace dialog appeared empty in an early screenshot — turned out to be my own test script clicking the button before React's post-analysis state update landed, not an app bug. Confirmed by checking the API response directly.)

---

## Tomorrow (Day 5 — Thu 4 Sept)

- [ ] `scripts/run-metrics.ts` — run all 53 seed disputes through the pipeline, compare to ground truth, output `metrics/latest.json`
- [ ] Baseline comparison — generic template rebuttal (LLM, no rule grounding) run through the same 53 disputes
- [ ] `app/(dashboard)/metrics/page.tsx` — dashboard for all 6 metrics from CLAUDE.md
- [ ] Break-fix pass: error states, loading states, empty states
- [ ] `?demo=true` walkthrough mode
- [ ] Final Vercel deploy + cross-browser/mobile check
- [ ] Draft video script
