"use client";

// Day 4 Hr 5-8: evidence input (pasted text, per cut list — no upload UI), execute the
// decision pipeline, preview the rebuttal/missing-doc/accept result, Approve & Submit.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

const BAND_STYLES: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-red-100 text-red-800",
};

export function DecisionPanel({
  disputeId,
  ce3Eligible,
  initialAuditEntries,
}: {
  disputeId: string;
  ce3Eligible: boolean;
  initialAuditEntries: AuditEntryView[];
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
  const [result, setResult] = useState<DecisionResult | null>(null);
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

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Decision
      </h2>

      {docs.map((doc, i) => (
        <div key={i} className="space-y-2">
          <input
            className="w-full text-sm border rounded px-2 py-1"
            placeholder="Document type (e.g. courier_pod, brand_certificate)"
            value={doc.docType}
            onChange={(e) => updateDoc(i, "docType", e.target.value)}
          />
          <Textarea
            placeholder="Paste evidence document text here..."
            value={doc.rawText}
            onChange={(e) => updateDoc(i, "rawText", e.target.value)}
            rows={4}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDocs((prev) => [...prev, { docType: "", rawText: "" }])}
      >
        + Add document
      </Button>

      {ce3Eligible && (
        <div className="border rounded-md p-3 space-y-2 bg-muted/30">
          <p className="text-xs font-medium">CE3.0 prior-transaction match (optional)</p>
          {(Object.keys(ce3Fields) as (keyof typeof ce3Fields)[]).map((key) => (
            <input
              key={key}
              className="w-full text-sm border rounded px-2 py-1"
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BAND_STYLES[result.decision.confidenceBand]}`}
              >
                {result.decision.confidenceBand}
              </span>
              <Badge variant="outline">{result.decision.action}</Badge>
              {result.decision.submitted && (
                <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{result.route.reasoning}</p>

            {result.decision.missingItems && result.decision.missingItems.length > 0 && (
              <p className="text-sm">
                Missing: <strong>{result.decision.missingItems.join(", ")}</strong>
              </p>
            )}

            {result.decision.rebuttalText && (
              <div className="text-sm border rounded p-3 whitespace-pre-wrap bg-muted/30">
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
