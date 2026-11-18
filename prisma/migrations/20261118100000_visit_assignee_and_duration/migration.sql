-- AlterTable
ALTER TABLE "visit_requests" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60;

-- CreateIndex
CREATE INDEX "visit_requests_companyId_assignedToId_scheduledAt_idx" ON "visit_requests"("companyId", "assignedToId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

