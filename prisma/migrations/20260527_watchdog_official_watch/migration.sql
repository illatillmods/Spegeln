-- AlterTable
ALTER TABLE "Watch" ADD COLUMN "officialId" TEXT;

-- CreateIndex
CREATE INDEX "Watch_officialId_idx" ON "Watch"("officialId");

-- CreateIndex
CREATE UNIQUE INDEX "Watch_userId_officialId_key" ON "Watch"("userId", "officialId");

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;
