// Landing page. Per CLAUDE.md (Day 7, post-submission): the "no landing page" Hard NO
// was reversed once submission was in, since this is now for portfolio/sharing use.
// /disputes (the dashboard) is unchanged and reachable via "View Dashboard" below.
// Day 7, take 4: full rewrite matching a GUVI-style reference — strict black/grey/white,
// navbar + one hero + footer, no color accents at all.

import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Dispute arrives",
    body: "Razorpay webhook delivers it automatically. No manual entry needed.",
  },
  {
    number: "02",
    title: "Rules applied",
    body: "Published Visa CE 3.0 and RuPay criteria checked — not an LLM guess.",
  },
  {
    number: "03",
    title: "Decision made",
    body: "HIGH: fight and win. MEDIUM: one doc missing. LOW: accept and save the arbitration fee.",
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-[#F8F8F8]">
      {/* Navbar */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-[#111]">ClearCase</span>
          <div className="flex items-center gap-5">
            <Link
              href="/disputes"
              className="inline-flex items-center rounded-md bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[55%_45%]">
        {/* Left */}
        <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-16 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#888]">
            Razorpay AI Buildathon 2026 — Track 02
          </p>
          <h1 className="mt-6 leading-[1.05]">
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#111]">
              Dispute.
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#B0B0B0]">
              Resolve. Win.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#444] mt-6 max-w-lg leading-relaxed">
            Indian merchants lose chargebacks not because they&apos;re wrong — because
            they sent the wrong proof. ClearCase checks your evidence against
            published Visa and RuPay rules and tells you exactly what to do.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
            <Link
              href="/disputes"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111] px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-colors"
            >
              View Dashboard &rarr;
            </Link>
            <Link
              href="/metrics"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D0D0D0] px-6 py-3 text-sm font-semibold text-[#444] hover:bg-[#F0F0F0] transition-colors"
            >
              See Metrics &rarr;
            </Link>
          </div>

          <div className="border-t border-[#E5E5E5] mt-10 pt-6">
            <p className="text-xs text-[#888] tracking-wide">
              Next.js &middot; PostgreSQL &middot; Gemini &middot; Visa CE 3.0 &middot; RuPay
            </p>
          </div>
        </div>

        {/* Divider + Right */}
        <div className="border-t lg:border-t-0 lg:border-l border-[#E5E5E5] px-6 sm:px-8 lg:px-12 py-16 flex flex-col justify-center gap-10">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-4">
              <span className="text-xs font-semibold text-[#888] tabular-nums pt-1">
                {step.number}
              </span>
              <div>
                <h3 className="text-base font-bold text-[#111]">{step.title}</h3>
                <p className="text-sm text-[#666] mt-1.5 leading-relaxed max-w-xs">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#F0F0F0] border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#888]">ClearCase — Razorpay AI Buildathon 2026</p>
          <div className="flex items-center gap-4 text-xs text-[#888]">
            <Link href="/disputes" className="hover:text-[#111] transition-colors">
              Dashboard &rarr;
            </Link>
            <Link href="/metrics" className="hover:text-[#111] transition-colors">
              Metrics &rarr;
            </Link>
            <a
              href="https://github.com/PiyushSolanki038/clearcase-razorpay"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111] transition-colors"
            >
              GitHub &rarr;
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
