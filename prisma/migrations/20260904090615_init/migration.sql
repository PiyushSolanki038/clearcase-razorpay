-- CreateEnum
CREATE TYPE "DisputeNetwork" AS ENUM ('visa', 'rupay', 'mastercard');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'won', 'lost', 'closed');

-- CreateEnum
CREATE TYPE "ConfidenceBand" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DecisionAction" AS ENUM ('AUTO_REBUT', 'REQUEST_DOC', 'RECOMMEND_ACCEPT');

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "razorpayDisputeId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "network" "DisputeNetwork" NOT NULL,
    "reasonCodeRaw" TEXT NOT NULL,
    "reasonCodeCanonical" TEXT,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceDoc" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3),
    "rawText" TEXT,

    CONSTRAINT "EvidenceDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedClaim" (
    "id" TEXT NOT NULL,
    "evidenceDocId" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "claimData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceSpan" TEXT,

    CONSTRAINT "ExtractedClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "confidenceBand" "ConfidenceBand" NOT NULL,
    "action" "DecisionAction" NOT NULL,
    "rebuttalText" TEXT,
    "missingItems" JSONB,
    "reasoningTrace" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "prevHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_razorpayDisputeId_key" ON "Dispute"("razorpayDisputeId");

-- AddForeignKey
ALTER TABLE "EvidenceDoc" ADD CONSTRAINT "EvidenceDoc_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedClaim" ADD CONSTRAINT "ExtractedClaim_evidenceDocId_fkey" FOREIGN KEY ("evidenceDocId") REFERENCES "EvidenceDoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
