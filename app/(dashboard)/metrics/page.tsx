// Day 5 Hr 4: metrics dashboard. Reads the static metrics/latest.json produced by
// scripts/run-metrics.ts — this page IS the honesty differentiator (#4): we name our
// own failure modes, not just our wins.

import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
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
        <CardTitle className="text-sm text-muted-foreground font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <div className={`text-xs mt-1 ${hit ? "text-green-700" : "text-amber-700"}`}>
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
      <div className="p-8 max-w-4xl mx-auto">
        <Link href="/disputes" className="text-sm text-muted-foreground hover:underline">
          &larr; All disputes
        </Link>
        <p className="mt-4 text-sm">
          No metrics yet — run <code className="bg-muted px-1 rounded">npx tsx scripts/run-metrics.ts</code>.
        </p>
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/disputes" className="text-sm text-muted-foreground hover:underline">
        &larr; All disputes
      </Link>
      <h1 className="text-2xl font-semibold mt-2">Metrics</h1>
      <p className="text-sm text-muted-foreground mb-6">
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

      <div className="grid grid-cols-3 gap-4 mb-8">
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
          <CardTitle className="text-base">Why two targets are missed — on purpose, not hidden</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            Auto-resolution rate and baseline delta both come in below their original
            targets. Root cause: of our 3 canonical reason codes, only{" "}
            <code className="bg-muted px-1 rounded">not_as_described</code> requires two
            pieces of evidence, so it&apos;s the only one that can produce a genuine
            &quot;missing exactly one document, otherwise strong&quot; MEDIUM case.{" "}
            <code className="bg-muted px-1 rounded">not_received</code> and{" "}
            <code className="bg-muted px-1 rounded">duplicate_processing</code> each need
            just one piece of evidence — so for those, you either have it (HIGH) or you
            don&apos;t (LOW). There&apos;s no valid partial state to engineer around.
          </p>
          <p>
            We chose to ship the real numbers rather than tune the dataset or the
            definitions to clear the bar. Surfacing where the system falls short of its
            own targets is the same honesty principle behind the false-confidence metric
            itself.
          </p>
          <p className="pt-2">{data.baselineMethodology}</p>
        </CardContent>
      </Card>
    </div>
  );
}
