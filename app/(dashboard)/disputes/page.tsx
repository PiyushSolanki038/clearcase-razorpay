// Day 4 Hr 1-2: dispute table. This IS the landing page per CLAUDE.md Hard NOs
// (no separate marketing page) — "/" redirects here.

import Link from "next/link";
import { Compass, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDeadline } from "@/lib/format";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const URGENCY_STYLES: Record<string, string> = {
  expired: "bg-red-50 text-red-700 border-red-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
  soon: "bg-amber-50 text-amber-700 border-amber-200",
  ok: "bg-secondary text-muted-foreground border-transparent",
};

const BAND_STYLES: Record<string, string> = {
  HIGH: "bg-success/15 text-green-800",
  MEDIUM: "bg-warning/20 text-amber-800",
  LOW: "bg-destructive/10 text-destructive",
};

const BAND_DOT: Record<string, string> = {
  HIGH: "bg-green-600",
  MEDIUM: "bg-amber-500",
  LOW: "bg-destructive",
};

const ROW_BORDER_STYLES: Record<string, string> = {
  HIGH: "border-l-4 border-l-green-500",
  MEDIUM: "border-l-4 border-l-amber-500",
  LOW: "border-l-4 border-l-destructive",
  NONE: "border-l-4 border-l-transparent",
};

const DEMO_EXAMPLES = [
  { razorpayDisputeId: "disp_seed000", label: "HIGH — clean win", description: "Full delivery proof, auto-generates a rebuttal" },
  { razorpayDisputeId: "disp_seed021", label: "MEDIUM — missing one doc", description: "Has authenticity cert, missing product match" },
  { razorpayDisputeId: "disp_seed008", label: "LOW — honest accept", description: "No credible evidence, recommends accepting" },
];

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const disputes = await prisma.dispute.findMany({
    orderBy: { deadlineAt: "asc" },
    include: { decisions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const demoLinks = demo
    ? DEMO_EXAMPLES.map((ex) => ({
        ...ex,
        dispute: disputes.find((d) => d.razorpayDisputeId === ex.razorpayDisputeId),
      })).filter((ex) => ex.dispute)
    : [];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Disputes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Post-transaction rebuttals for Razorpay disputes — tuned for RuPay, UPI, and Indian
          merchant evidence.{" "}
          {disputes.length > 0 && (
            <span className="text-foreground font-medium">{disputes.length} total</span>
          )}
        </p>
      </div>

      {demoLinks.length > 0 && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-accent p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent-foreground mb-3">
            <Compass className="size-4" strokeWidth={2.25} />
            Walkthrough: 3 disputes showing each confidence band
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {demoLinks.map((ex) => (
              <Link
                key={ex.razorpayDisputeId}
                href={`/disputes/${ex.dispute!.id}`}
                className="rounded-md border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40 hover:shadow-md"
              >
                <div className="text-xs font-semibold text-foreground">{ex.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{ex.description}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 ? (
        <Card className="items-center py-16 text-center">
          <Inbox className="size-8 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">No disputes yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx scripts/seed-db.ts</code>{" "}
            or POST to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/api/disputes/ingest</code>.
          </p>
        </Card>
      ) : (
        <Card className="py-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 pl-4">
                  Dispute
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Network
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Deadline
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Confidence
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => {
                const deadline = formatDeadline(d.deadlineAt);
                const latestDecision = d.decisions[0];
                const rowBorder = ROW_BORDER_STYLES[latestDecision?.confidenceBand ?? "NONE"];
                return (
                  <TableRow key={d.id} className={`group ${rowBorder}`}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/disputes/${d.id}`}
                        className="font-medium text-foreground group-hover:text-primary transition-colors"
                      >
                        {d.razorpayDisputeId}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMoney(d.amount, d.currency)}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{d.reasonCodeRaw}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{d.network}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[deadline.urgency]}`}
                      >
                        {deadline.label}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {d.status.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      {latestDecision ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${BAND_STYLES[latestDecision.confidenceBand]}`}
                        >
                          <span className={`size-1.5 rounded-full ${BAND_DOT[latestDecision.confidenceBand]}`} />
                          {latestDecision.confidenceBand}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-gray-300" />
                          Not analyzed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
