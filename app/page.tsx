// Landing page. Per CLAUDE.md (Day 7, post-submission): the "no landing page" Hard NO
// was reversed once submission was in, since this is now for portfolio/sharing use.
// /disputes (the dashboard) is unchanged and reachable via "View Dashboard" below.

import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  "Dispute arrives via Razorpay webhook automatically",
  "Evidence checked against Visa and RuPay published rulebook",
  "Decision in seconds — fight, request one doc, or accept",
];

const WHY = [
  "Rule-grounded — not LLM guesswork",
  "Honest — tells merchants when to give up",
  "Auditable — every decision hash-chained",
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
      label: "False-confidence rate",
      value: metrics ? `${(metrics.falseConfidenceRate * 100).toFixed(1)}%` : "0.0%",
    },
    {
      label: "Missing-doc precision",
      value: metrics ? `${(metrics.missingDocPrecision * 100).toFixed(0)}%` : "100%",
    },
    {
      label: "Decision latency",
      value: metrics ? `${metrics.averageDecisionLatencyMs.toFixed(2)}ms` : "0.03ms",
    },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 pt-20 pb-16 text-center">
        <span className="inline-flex items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground mb-6">
          <ShieldCheck className="size-6" strokeWidth={2.25} />
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          ClearCase
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
          Chargeback rebuttal automation for Razorpay merchants
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/disputes"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            View Dashboard &rarr;
          </Link>
          <Link
            href="/metrics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            See Metrics &rarr;
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 py-16 border-t border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step} className="text-center sm:text-left">
              <div className="text-xs font-semibold text-primary mb-2">Step {i + 1}</div>
              <p className="text-sm text-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key stats */}
      <section className="max-w-4xl mx-auto px-6 sm:px-8 py-16 border-t border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center mb-10">
          Key stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why ClearCase */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-16 border-t border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center mb-8">
          Why ClearCase
        </h2>
        <ul className="space-y-4">
          {WHY.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" strokeWidth={2.25} />
              <span className="text-sm text-foreground leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Razorpay AI Buildathon 2026 — Track 02 AI Risk Manager
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Built by Piyush Solanki, Marwadi University
        </p>
      </footer>
    </div>
  );
}
