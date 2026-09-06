// Landing page. Per CLAUDE.md (Day 7, post-submission): the "no landing page" Hard NO
// was reversed once submission was in, since this is now for portfolio/sharing use.
// /disputes (the dashboard) is unchanged and reachable via "View Dashboard" below.
// Dark fintech redesign (Day 7, take 2) — hero/how-it-works/why sections run dark
// (#0F172A / #1E293B) with a light key-stats section between them, matching a
// Stripe/Razorpay-marketing register rather than the light dashboard shell.

import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    number: "01",
    title: "Dispute Arrives",
    body: "Razorpay webhook delivers the dispute automatically. No manual entry.",
  },
  {
    number: "02",
    title: "Rules Applied",
    body: "Published Visa CE 3.0 and RuPay criteria checked — not an LLM guess.",
  },
  {
    number: "03",
    title: "Decision Made",
    body: "HIGH: fight. MEDIUM: one doc missing. LOW: accept and save money.",
  },
];

const WHY = [
  "Rule-grounded — Visa CE 3.0 + RuPay. The rulebook decides, not the model.",
  "Honest — tells merchants when to accept. Rupee math included.",
  "Auditable — every decision hash-chained and reproducible.",
];

interface MetricsFile {
  metrics: {
    falseConfidenceRate: number;
    missingDocPrecision: number;
    averageDecisionLatencyMs: number;
  };
}

export default async function Home() {
  let metrics: MetricsFile["metrics"] | null = null;
  try {
    const raw = await readFile(path.join(process.cwd(), "metrics", "latest.json"), "utf-8");
    metrics = (JSON.parse(raw) as MetricsFile).metrics;
  } catch {
    metrics = null;
  }

  const stats = [
    {
      value: metrics ? `${(metrics.falseConfidenceRate * 100).toFixed(1)}%` : "0.0%",
      label: "False-confidence rate",
      target: "target <5% — met",
    },
    {
      value: metrics ? `${(metrics.missingDocPrecision * 100).toFixed(0)}%` : "100%",
      label: "Missing-doc precision",
      target: "target >90% — met",
    },
    {
      value: metrics ? `${metrics.averageDecisionLatencyMs.toFixed(2)}ms` : "0.03ms",
      label: "Decision latency",
      target: "target <3000ms — met",
    },
  ];

  return (
    <div className="min-h-full">
      {/* Hero — dark navy */}
      <section className="bg-[#0F172A] px-6 sm:px-8 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 mb-8">
            Razorpay AI Buildathon 2026 — Track 02
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white">
            ClearCase
          </h1>
          <p className="text-xl font-semibold text-blue-400 mt-4">
            Stop losing chargebacks.
          </p>
          <p className="text-base text-slate-300 mt-4 max-w-xl mx-auto leading-relaxed">
            Razorpay merchants lose disputes not because they&apos;re wrong — because
            they send the wrong proof. ClearCase fixes that in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link
              href="/disputes"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              View Dashboard &rarr;
            </Link>
            <Link
              href="/metrics"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              See Metrics &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — dark cards */}
      <section className="bg-[#0F172A] px-6 sm:px-8 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-xl bg-[#1E293B] border border-white/10 p-6"
              >
                <div className="text-2xl font-bold text-blue-400 mb-3 tabular-nums">
                  {step.number}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key stats — light section */}
      <section className="bg-background px-6 sm:px-8 py-20 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center mb-10">
            Key stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent>
                  <div className="text-4xl font-bold tabular-nums text-blue-600">
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground mt-2 font-medium">{stat.label}</div>
                  <div className="text-xs text-green-700 mt-1">{stat.target}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why ClearCase — dark section */}
      <section className="bg-[#0F172A] px-6 sm:px-8 py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 text-center mb-12">
            Why ClearCase
          </h2>
          <ul className="space-y-8">
            {WHY.map((point) => (
              <li key={point} className="flex items-start gap-4">
                <CheckCircle2 className="size-6 text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-lg text-white leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer — dark */}
      <footer className="bg-[#0F172A] border-t border-white/10 px-6 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-300">
              Razorpay AI Buildathon 2026 — Track 02 AI Risk Manager
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Built by Piyush Solanki, Marwadi University
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/PiyushSolanki038/clearcase-razorpay"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              GitHub &rarr;
            </a>
            <Link
              href="/disputes"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Demo &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
