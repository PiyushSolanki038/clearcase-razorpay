"use client";

// Day 4 Hr 9-10: Confidence Trace viewer. Visual step-through of the AuditEntry chain
// for one dispute — extracted claims -> matched rules -> exclusions -> score -> band.

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AuditEntryView {
  id: string;
  step: string;
  payload: unknown;
  currentHash: string;
  createdAt: string;
}

const STEP_LABELS: Record<string, string> = {
  classify: "1. Classify reason code",
  ce3_assemble: "2. CE3.0 evidence assembly",
  extract: "3. Extract claims from evidence",
  exclude: "4. Check exclusions",
  score: "5. Score evidence",
  route: "6. Route by confidence",
  generate_rebuttal: "7. Generate rebuttal",
  request_doc: "7. Request missing document",
  recommend_accept: "7. Recommend accept",
  decision_created: "8. Decision recorded",
  submitted: "9. Submitted",
};

export function ConfidenceTraceDialog({ entries }: { entries: AuditEntryView[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        View confidence trace
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confidence Trace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No decisions run yet for this dispute.
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {STEP_LABELS[entry.step] ?? entry.step}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {entry.currentHash.slice(0, 10)}...
                </span>
              </div>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
