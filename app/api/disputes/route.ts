import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const disputes = await prisma.dispute.findMany({
    orderBy: { deadlineAt: "asc" },
  });

  return NextResponse.json({ disputes });
}
