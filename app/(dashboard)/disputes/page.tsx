// Day 4 Hr 1-2: dispute table. This IS the landing page per CLAUDE.md Hard NOs
// (no separate marketing page) — "/" redirects here.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDeadline } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const URGENCY_STYLES: Record<string, string> = {
  expired: "bg-red-100 text-red-800 border-red-300",
  urgent: "bg-red-50 text-red-700 border-red-200",
  soon: "bg-amber-50 text-amber-700 border-amber-200",
  ok: "bg-green-50 text-green-700 border-green-200",
};

const BAND_STYLES: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-red-100 text-red-800",
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">ClearCase</h1>
          <p className="text-sm text-muted-foreground">
            Post-transaction rebuttals for Razorpay disputes — tuned for RuPay, UPI, and
            Indian merchant evidence.
          </p>
        </div>
        <Link href="/metrics" className="text-sm text-muted-foreground hover:underline">
          Metrics &rarr;
        </Link>
      </div>

      {demoLinks.length > 0 && (
        <div className="mb-6 border rounded-md p-4 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium mb-2">
            Walkthrough: 3 disputes showing each confidence band
          </p>
          <div className="flex gap-3">
            {demoLinks.map((ex) => (
              <Link
                key={ex.razorpayDisputeId}
                href={`/disputes/${ex.dispute!.id}`}
                className="flex-1 border rounded p-3 bg-white hover:border-blue-400"
              >
                <div className="text-xs font-semibold">{ex.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{ex.description}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No disputes yet. Run <code className="bg-muted px-1 rounded">npx tsx scripts/seed-db.ts</code> or
          POST to <code className="bg-muted px-1 rounded">/api/disputes/ingest</code>.
        </p>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dispute</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disputes.map((d) => {
            const deadline = formatDeadline(d.deadlineAt);
            const latestDecision = d.decisions[0];
            return (
              <TableRow key={d.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/disputes/${d.id}`} className="hover:underline font-medium">
                    {d.razorpayDisputeId}
                  </Link>
                </TableCell>
                <TableCell>{formatMoney(d.amount, d.currency)}</TableCell>
                <TableCell>{d.reasonCodeRaw}</TableCell>
                <TableCell className="capitalize">{d.network}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-xs ${URGENCY_STYLES[deadline.urgency]}`}
                  >
                    {deadline.label}
                  </span>
                </TableCell>
                <TableCell className="capitalize">{d.status.replace("_", " ")}</TableCell>
                <TableCell>
                  {latestDecision ? (
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BAND_STYLES[latestDecision.confidenceBand]}`}
                    >
                      {latestDecision.confidenceBand}
                    </span>
                  ) : (
                    <Badge variant="outline">Not analyzed</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}
    </div>
  );
}
