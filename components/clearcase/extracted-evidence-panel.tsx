"use client";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAnalysisLoading } from "./analysis-context";

interface Claim {
  claim_type: string;
  present: boolean;
  confidence: number;
  source_span: string | null;
}

export function ExtractedEvidencePanel({ claims }: { claims: Claim[] | undefined }) {
  const { loading } = useAnalysisLoading();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" strokeWidth={2.25} />
        <p className="text-sm">Extracting evidence...</p>
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Run analysis to extract claims from evidence.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {claims.map((c) => (
        <div
          key={c.claim_type}
          className={`rounded-lg border p-3 ${c.present ? "border-green-200 bg-green-50/60" : "border-border bg-muted/40"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {c.present ? (
                <CheckCircle2 className="size-4 text-green-600 shrink-0" strokeWidth={2} />
              ) : (
                <XCircle className="size-4 text-muted-foreground shrink-0" strokeWidth={2} />
              )}
              {c.claim_type}
            </span>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {c.present ? `${Math.round(c.confidence * 100)}%` : "not found"}
            </span>
          </div>
          {c.source_span && (
            <p className="text-xs text-muted-foreground mt-1.5 italic pl-5.5 leading-relaxed">
              &quot;{c.source_span}&quot;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
