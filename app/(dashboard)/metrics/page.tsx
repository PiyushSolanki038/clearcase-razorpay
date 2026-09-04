// Day 5 Hr 4: metrics dashboard. Reads the static metrics/latest.json produced by
// scripts/run-metrics.ts — this page IS the honesty differentiator (#4): we name our
// own failure modes, not just our wins.

import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsFile {
  generatedAt: string;
  metrics: {
    totalDisputes: number;
    autoResolutionRate: number;
    falseConfidenceRate: number;
    missingDocPrecision: number;
    recommendAcceptPrecision: number;
    averageDecisionLatencyMs: number;
    baselineWinRate: number;
    systemWinRate: number;
    baselineDeltaPercentagePoints: number;
  };
  targets: Record<string, string>;
  baselineMethodology: string;
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  target,
  hit,
}: {
  label: string;
  value: string;
  target: string;
  hit: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums text-foreground">{value}</div>
        <div
          className={`flex items-center gap-1.5 text-xs mt-2 ${hit ? "text-green-700" : "text-amber-700"}`}
        >
          {hit ? (
            <CheckCircle2 className="size-3.5 shrink-0" strokeWidth={2.25} />
          ) : (
            <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2.25} />
          )}
          target {target} {hit ? "— met" : "— missed (honest, not tuned)"}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MetricsPage() {
  let data: MetricsFile | null = null;
  try {
    const raw = await readFile(path.join(process.cwd(), "metrics", "latest.json"), "utf-8");
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <Link
          href="/disputes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All disputes
        </Link>
        <Card className="mt-6">
          <CardContent className="text-sm text-muted-foreground text-center py-12">
            No metrics yet — run{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              npx tsx scripts/run-metrics.ts
            </code>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Link
        href="/disputes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All disputes
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-foreground mt-3">Metrics</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Run across all {m.totalDisputes} seed disputes on{" "}
        {new Date(data.generatedAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
        .
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Auto-resolution rate"
          value={pct(m.autoResolutionRate)}
          target={data.targets.autoResolutionRate}
          hit={m.autoResolutionRate >= 0.55 && m.autoResolutionRate <= 0.7}
        />
        <StatCard
          label="False-confidence rate"
          value={pct(m.falseConfidenceRate)}
          target={data.targets.falseConfidenceRate}
          hit={m.falseConfidenceRate < 0.05}
        />
        <StatCard
          label="Missing-doc precision"
          value={pct(m.missingDocPrecision)}
          target={data.targets.missingDocPrecision}
          hit={m.missingDocPrecision > 0.9}
        />
        <StatCard
          label="Recommend-accept precision"
          value={pct(m.recommendAcceptPrecision)}
          target={data.targets.recommendAcceptPrecision}
          hit={m.recommendAcceptPrecision > 0.9}
        />
        <StatCard
          label="Avg decision latency"
          value={`${m.averageDecisionLatencyMs.toFixed(2)}ms`}
          target={data.targets.averageDecisionLatencyMs}
          hit={m.averageDecisionLatencyMs < 3000}
        />
        <StatCard
          label="Baseline delta"
          value={`${m.baselineDeltaPercentagePoints.toFixed(1)}pp`}
          target={data.targets.baselineDeltaPercentagePoints}
          hit={m.baselineDeltaPercentagePoints >= 15}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
            Why two targets are missed — on purpose, not hidden
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-muted-foreground leading-relaxed">
          <p>
            Auto-resolution rate and baseline delta both come in below their original
            targets. Root cause: of our 3 canonical reason codes, only{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">not_as_described</code>{" "}
            requires two pieces of evidence, so it&apos;s the only one that can produce a
            genuine &quot;missing exactly one document, otherwise strong&quot; MEDIUM case.{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">not_received</code> and{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">duplicate_processing</code>{" "}
            each need just one piece of evidence — so for those, you either have it (HIGH)
            or you don&apos;t (LOW). There&apos;s no valid partial state to engineer around.
          </p>
          <p>
            We chose to ship the real numbers rather than tune the dataset or the
            definitions to clear the bar. Surfacing where the system falls short of its
            own targets is the same honesty principle behind the false-confidence metric
            itself.
          </p>
          <p className="pt-1 border-t border-border mt-1">{data.baselineMethodology}</p>
        </CardContent>
      </Card>
    </div>
  );
}
