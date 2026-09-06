// Landing page. Per CLAUDE.md (Day 7, post-submission): the "no landing page" Hard NO
// was reversed once submission was in, since this is now for portfolio/sharing use.
// /disputes (the dashboard) is unchanged and reachable via "View Dashboard" below.
// Day 7, take 3: single full-height two-column hero, white/minimal — everything else
// (dark sections, stats, why-ClearCase, footer) removed per direction.

import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Dispute arrives",
    body: "Razorpay webhook delivers it automatically.",
  },
  {
    number: "02",
    title: "Rules applied",
    body: "Published Visa and RuPay criteria checked — not an LLM guess.",
  },
  {
    number: "03",
    title: "Decision made",
    body: "HIGH: fight. MEDIUM: one doc missing. LOW: accept and save money.",
  },
];

export default function Home() {
  return (
    <div className="min-h-full bg-white grid grid-cols-1 lg:grid-cols-[60%_40%]">
      {/* Left: hero copy */}
      <div className="flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-12 lg:py-16 min-h-screen lg:min-h-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Razorpay AI Buildathon 2026 — Track 02
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-950 mt-6 leading-[1.05]">
            Stop losing
            <br />
            <span className="text-[#2563EB]">chargebacks.</span>
            <br />
            Start winning.
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-6 max-w-lg leading-relaxed">
            Indian merchants lose disputes not because they&apos;re wrong — because
            they sent the wrong proof. ClearCase checks your evidence against
            published Visa and RuPay rules and tells you exactly what to do.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
            <Link
              href="/disputes"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2563EB]/90 transition-colors"
            >
              View Dashboard &rarr;
            </Link>
            <Link
              href="/metrics"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See Metrics &rarr;
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 tracking-wide mt-12">
          Next.js &middot; PostgreSQL &middot; Gemini &middot; Visa CE 3.0 &middot; RuPay
        </p>
      </div>

      {/* Divider + right: numbered steps */}
      <div className="border-t lg:border-t-0 lg:border-l border-gray-200 px-6 sm:px-12 lg:px-12 py-12 lg:py-16 flex flex-col justify-center gap-10">
        {STEPS.map((step) => (
          <div key={step.number}>
            <div className="text-sm font-bold text-[#2563EB] tabular-nums">
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-gray-950 mt-1">{step.title}</h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-xs">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
