"use client";

// Day 4 Hr 5-8: evidence input (pasted text, per cut list — no upload UI), execute the
// decision pipeline, preview the rebuttal/missing-doc/accept result, Approve & Submit.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfidenceTraceDialog, type AuditEntryView } from "./confidence-trace-dialog";

interface EvidenceDocInput {
  docType: string;
  rawText: string;
}

interface DecisionResult {
  decision: {
    id: string;
    confidenceBand: "HIGH" | "MEDIUM" | "LOW";
    action: "AUTO_REBUT" | "REQUEST_DOC" | "RECOMMEND_ACCEPT";
    rebuttalText: string | null;
    missingItems: string[] | null;
    submitted: boolean;
  };
  route: { band: string; action: string; reasoning: string };
}

const BANNER_STYLES: Record<string, string> = {
  HIGH: "bg-success text-success-foreground",
  MEDIUM: "bg-warning text-warning-foreground",
  LOW: "bg-destructive text-white",
};

const BANNER_ICON: Record<string, typeof CheckCircle2> = {
  HIGH: CheckCircle2,
  MEDIUM: AlertTriangle,
  LOW: XCircle,
};

const BANNER_TEXT: Record<string, string> = {
  HIGH: "HIGH CONFIDENCE — Rebuttal ready to submit",
  MEDIUM: "MEDIUM CONFIDENCE — One document needed",
  LOW: "LOW CONFIDENCE — Recommend accepting",
};

export function DecisionPanel({
  disputeId,
  ce3Eligible,
  initialAuditEntries,
  initialResult,
}: {
  disputeId: string;
  ce3Eligible: boolean;
  initialAuditEntries: AuditEntryView[];
  initialResult: DecisionResult | null;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<EvidenceDocInput[]>([{ docType: "", rawText: "" }]);
  const [ce3Fields, setCe3Fields] = useState({
    cardholderId: "",
    transactionDate: "",
    accountId: "",
    deviceId: "",
    shippingAddress: "",
    ipAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(initialResult);
  const [auditEntries, setAuditEntries] = useState<AuditEntryView[]>(initialAuditEntries);
  const [submitting, setSubmitting] = useState(false);

  function updateDoc(index: number, field: keyof EvidenceDocInput, value: string) {
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        evidenceDocs: docs.filter((d) => d.rawText.trim().length > 0),
      };
      if (ce3Eligible && ce3Fields.cardholderId) {
        body.ce3Transaction = ce3Fields;
      }

      const res = await fetch(`/api/decide/${disputeId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data);

      const disputeRes = await fetch(`/api/disputes/${disputeId}`);
      const disputeData = await disputeRes.json();
      setAuditEntries(disputeData.dispute.auditEntries ?? []);
      router.refresh();
    } catch {
      setError("Network error running analysis");
    } finally {
      setLoading(false);
    }
  }

  async function submitDecision() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/decide/${disputeId}/submit`, { method: "POST" });
      const data = await res.json();
      if (res.ok && result) {
        setResult({ ...result, decision: { ...result.decision, submitted: data.decision.submitted } });
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const BannerIcon = result ? BANNER_ICON[result.decision.confidenceBand] : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {docs.map((doc, i) => (
          <div key={i} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Document type
            </label>
            <Input
              placeholder="e.g. courier_pod, brand_certificate"
              value={doc.docType}
              onChange={(e) => updateDoc(i, "docType", e.target.value)}
            />
            <label className="text-xs font-medium text-muted-foreground">
              Evidence text
            </label>
            <Textarea
              placeholder="Paste evidence document text here..."
              value={doc.rawText}
              onChange={(e) => updateDoc(i, "rawText", e.target.value)}
              rows={4}
            />
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDocs((prev) => [...prev, { docType: "", rawText: "" }])}
      >
        <Plus className="size-3.5" />
        Add document
      </Button>

      {ce3Eligible && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            CE3.0 prior-transaction match (optional)
          </p>
          {(Object.keys(ce3Fields) as (keyof typeof ce3Fields)[]).map((key) => (
            <Input
              key={key}
              placeholder={key}
              value={ce3Fields[key]}
              onChange={(e) => setCe3Fields((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
        </div>
      )}

      <Button onClick={runAnalysis} disabled={loading} className="w-full">
        {loading ? "Analyzing..." : "Run analysis"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <>
          <Separator />
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 w-full rounded-md px-3 py-2.5 text-sm font-semibold ${BANNER_STYLES[result.decision.confidenceBand]}`}
            >
              {BannerIcon && <BannerIcon className="size-4 shrink-0" strokeWidth={2.25} />}
              {BANNER_TEXT[result.decision.confidenceBand]}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{result.decision.action}</Badge>
              {result.decision.submitted && (
                <Badge className="bg-primary/10 text-primary">Submitted</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {result.route.reasoning}
            </p>

            {result.decision.missingItems && result.decision.missingItems.length > 0 && (
              <p className="text-sm">
                Missing: <strong>{result.decision.missingItems.join(", ")}</strong>
              </p>
            )}

            {result.decision.rebuttalText && (
              <div className="text-sm rounded-lg border border-border p-3 whitespace-pre-wrap bg-muted/40 leading-relaxed">
                {result.decision.rebuttalText}
              </div>
            )}

            {result.decision.action === "AUTO_REBUT" && !result.decision.submitted && (
              <Button onClick={submitDecision} disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Approve & Submit"}
              </Button>
            )}
          </div>
        </>
      )}

      <Separator />
      <ConfidenceTraceDialog entries={auditEntries} />
    </div>
  );
}
