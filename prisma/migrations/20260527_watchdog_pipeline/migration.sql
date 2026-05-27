-- CreateEnum
CREATE TYPE "OfficialCategory" AS ENUM ('POLITICIAN', 'MINISTER', 'AGENCY_HEAD', 'POLICE', 'JUDGE', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicRecordCategory" AS ENUM ('ROLE', 'INCOME', 'PROPERTY', 'TRAVEL', 'COURT', 'COMPANY', 'RELATIONSHIP', 'PROCUREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "IngestRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "IngestReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Official" ADD COLUMN "slug" TEXT,
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "category" "OfficialCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "lastIngestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Official_category_idx" ON "Official"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Official_authorityId_fullName_key" ON "Official"("authorityId", "fullName");

-- CreateTable
CREATE TABLE "OfficialIdentity" (
    "id" TEXT NOT NULL,
    "officialId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicRecord" (
    "id" TEXT NOT NULL,
    "category" "PublicRecordCategory" NOT NULL,
    "officialId" TEXT,
    "authorityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3),
    "sourceKind" "SourceKind" NOT NULL,
    "sourceUrl" TEXT,
    "sourceRecordId" TEXT,
    "legalBasis" TEXT,
    "contentHash" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "status" "IngestRunStatus" NOT NULL DEFAULT 'RUNNING',
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialRelationship" (
    "id" TEXT NOT NULL,
    "fromOfficialId" TEXT NOT NULL,
    "toOfficialId" TEXT,
    "toOrgName" TEXT,
    "relationshipType" TEXT NOT NULL,
    "publicBasis" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestReviewItem" (
    "id" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "suggestedName" TEXT,
    "suggestedTitle" TEXT,
    "authoritySlug" TEXT,
    "status" "IngestReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficialIdentity_sourceKey_externalId_key" ON "OfficialIdentity"("sourceKey", "externalId");

-- CreateIndex
CREATE INDEX "OfficialIdentity_officialId_idx" ON "OfficialIdentity"("officialId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicRecord_connectorKey_contentHash_key" ON "PublicRecord"("connectorKey", "contentHash");

-- CreateIndex
CREATE INDEX "PublicRecord_officialId_category_occurredAt_idx" ON "PublicRecord"("officialId", "category", "occurredAt");

-- CreateIndex
CREATE INDEX "PublicRecord_authorityId_category_publishedAt_idx" ON "PublicRecord"("authorityId", "category", "publishedAt");

-- CreateIndex
CREATE INDEX "PublicRecord_category_publishedAt_idx" ON "PublicRecord"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "IngestRun_connectorKey_startedAt_idx" ON "IngestRun"("connectorKey", "startedAt");

-- CreateIndex
CREATE INDEX "IngestRun_status_startedAt_idx" ON "IngestRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "OfficialRelationship_fromOfficialId_createdAt_idx" ON "OfficialRelationship"("fromOfficialId", "createdAt");

-- CreateIndex
CREATE INDEX "OfficialRelationship_toOfficialId_createdAt_idx" ON "OfficialRelationship"("toOfficialId", "createdAt");

-- CreateIndex
CREATE INDEX "IngestReviewItem_status_createdAt_idx" ON "IngestReviewItem"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OfficialIdentity" ADD CONSTRAINT "OfficialIdentity_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicRecord" ADD CONSTRAINT "PublicRecord_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicRecord" ADD CONSTRAINT "PublicRecord_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialRelationship" ADD CONSTRAINT "OfficialRelationship_fromOfficialId_fkey" FOREIGN KEY ("fromOfficialId") REFERENCES "Official"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialRelationship" ADD CONSTRAINT "OfficialRelationship_toOfficialId_fkey" FOREIGN KEY ("toOfficialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;
