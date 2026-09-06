// Landing page. Per CLAUDE.md (Day 7, post-submission): the "no landing page" Hard NO
// was reversed once submission was in, since this is now for portfolio/sharing use.
// /disputes (the dashboard) is unchanged and reachable via "View Demo" below.

import Link from "next/link";
import { ShieldCheck, Zap, FileCheck2, Route, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Zap,
    title: "Dispute arrives",
    body: "When a customer disputes a payment, Razorpay sends a webhook to ClearCase automatically. No manual entry needed.",
  },
  {
    icon: FileCheck2,
    title: "Evidence analyzed",
    body: "Merchant uploads evidence. ClearCase checks it against published Visa and RuPay rulebook criteria — not an LLM guess.",
  },
  {
    icon: Route,
    title: "Decision in seconds",
    body: "HIGH confidence → rebuttal letter ready to submit. MEDIUM → exactly one missing document flagged. LOW → honest recommendation to accept with rupee math.",
  },
];

const WHY = [
  "Rule-grounded — Visa CE 3.0 + RuPay published criteria",
  "0.0% false-confidence — never said fight and was wrong",
  "Hash-chained audit trail — every decision auditable",
];

export default function Home() {
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
            View Demo &rarr;
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
      <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 border-t border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-center mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center sm:text-left">
              <span className="inline-flex items-center justify-center size-10 rounded-lg bg-accent text-accent-foreground mb-4">
                <step.icon className="size-5" strokeWidth={2.25} />
              </span>
              <div className="text-xs font-semibold text-primary mb-1">Step {i + 1}</div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </div>
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
          Built for Razorpay AI Buildathon 2026 — Track 02 AI Risk Manager
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          By Piyush Solanki, Marwadi University
        </p>
      </footer>
    </div>
  );
}
