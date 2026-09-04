# ClearCase — Pitch Video Script (5:00 target)

Practice out loud once before recording — this reads at a natural pace in about 5 minutes. Timings are targets, not hard cuts; prioritize the demo over rushing narration.

---

## 0:00–0:30 — The problem

> "When a merchant on Razorpay gets a chargeback, they have 30 days to respond — and most of them have no idea what evidence actually wins. They either don't fight it and eat a loss they could've won, or they fight it with a generic template, lose anyway, *and* pay an arbitration fee on top. Both outcomes are avoidable, and both come down to the same missing piece: nobody's told them what the rulebook actually requires."

## 0:30–1:00 — Where Razorpay sits, and the gap

> "Razorpay Shield already handles pre-transaction fraud — it stops bad payments before they happen. But once a payment goes through and a chargeback lands, merchants are on their own. ClearCase is the other half of that story: post-transaction rebuttals, native to Razorpay's Dispute API, built specifically for Indian networks — RuPay and UPI — and Indian merchant reality: WhatsApp order confirmations, GST invoices, Hindi-language evidence."

## 1:00–3:00 — Live demo

Walk through `/disputes?demo=true` — the three curated examples are exactly this arc:

1. **HIGH case** (`disp_seed000`) — open it, paste the courier POD evidence, click Run analysis. Show the claim extraction (green, cited, confidence score), the HIGH badge, the auto-generated rebuttal letter citing the actual delivery proof. Click Approve & Submit.
2. **MEDIUM case** — open it, paste partial evidence (e.g. authenticity cert but not the product-match screenshot). Show it correctly asks for exactly the one missing document — not a vague "add more evidence."
3. **LOW case** (`disp_seed008`) — show the honest accept recommendation, with the actual dollar math on screen: disputed amount vs. arbitration fee.
4. Open **Confidence Trace** on any of them — step through classify → extract → exclude → score → route. This is the differentiator judges respond to: full reproducibility, not a black box.

If time allows: show the CE3.0 example (`disp_ce3_high`) — "this one has zero uploaded documents. The win comes entirely from matching this transaction against the cardholder's prior undisputed purchase history — the same 2-of-4 rule Visa itself uses."

## 3:00–4:00 — Metrics

Open `/metrics`.

> "We ran this against 53 seed disputes with hand-labeled ground truth. Zero false-confidence — we never told a merchant they'd win when they wouldn't. 100% precision on both 'ask for this document' and 'you should accept.' And two numbers *don't* hit our original targets — auto-resolution and the baseline-comparison delta — and we're showing that on screen instead of hiding it. [Point to the explanation box.] The reason is structural, not a bug: only one of our three reason codes has enough evidence complexity to produce a genuine 'medium confidence' case. We'd rather ship the real number than a flattering one."

## 4:00–4:30 — Architecture

Show `docs/architecture.svg` (or the README).

> "Everything green here is deterministic rule logic — no LLM, no randomness, fully reproducible. The LLM only ever does two things: reads documents to extract claims, and writes prose once the rule engine has already decided the outcome. It never decides what a rule requires. And every single step — every classification, every extracted claim, every score — writes to a hash-chained audit log, so any decision can be independently verified from the source documents and the rulebook version alone."

## 4:30–5:00 — Why Razorpay ships this

> "Razorpay already owns the dispute lifecycle end to end — the webhook, the deadline, the accept/contest API. ClearCase slots directly into that: no new integration surface, just a smarter response to data Razorpay already has. It's the fraud team's blind spot turned into a product surface — and for a market where the reason code, the evidence format, and the merchant's paperwork all look different from the US and Europe, that's exactly the wedge Razorpay is positioned to own first."

---

## Notes for recording

- Have `.env.local` filled and `npm run dev` running before you start — don't record setup.
- Pre-load the 3 demo dispute pages in separate tabs so you're not waiting on navigation on camera.
- If a live Gemini call is slow during recording, that's fine to leave in — it's honest, and the metrics slide already addresses latency (excluding LLM calls) directly.
- 3 takes, per CLAUDE.md's plan — don't try to nail it in one.
