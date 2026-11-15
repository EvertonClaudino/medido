-- CreateEnum
CREATE TYPE "MeasureUnit" AS ENUM ('M', 'M2', 'M3', 'UN', 'KG');

-- AlterEnum
BEGIN;
CREATE TYPE "WorkLogStatus_new" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
ALTER TABLE "public"."work_logs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "work_logs" ALTER COLUMN "status" TYPE "WorkLogStatus_new" USING (
  CASE "status"::text
    WHEN 'APPROVED' THEN 'VALIDATED'::"WorkLogStatus_new"
    WHEN 'VALIDATED' THEN 'VALIDATED'::"WorkLogStatus_new"
    WHEN 'REJECTED' THEN 'REJECTED'::"WorkLogStatus_new"
    ELSE 'PENDING'::"WorkLogStatus_new"
  END
);
ALTER TYPE "WorkLogStatus" RENAME TO "WorkLogStatus_old";
ALTER TYPE "WorkLogStatus_new" RENAME TO "WorkLogStatus";
DROP TYPE "public"."WorkLogStatus_old";
ALTER TABLE "work_logs" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "work_logs" DROP CONSTRAINT IF EXISTS "work_logs_reviewerId_fkey";
ALTER TABLE "work_logs" DROP CONSTRAINT IF EXISTS "work_logs_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "work_logs_companyId_idx";
DROP INDEX IF EXISTS "work_logs_projectId_idx";
DROP INDEX IF EXISTS "work_logs_userId_idx";

-- AlterTable com preservação de dados:
-- Adicionar novas colunas
ALTER TABLE "work_logs" 
  ADD COLUMN "authorId" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "workDate" DATE;

-- Migrar dados existentes de userId -> authorId, date -> workDate, notes -> rejectionReason
UPDATE "work_logs" SET 
  "authorId" = "userId",
  "workDate" = "date"::date,
  "reviewedById" = "reviewerId",
  "rejectionReason" = CASE WHEN "status" = 'REJECTED' THEN "notes" ELSE NULL END;

-- Tornar authorId e workDate NOT NULL após a migração de dados
ALTER TABLE "work_logs" 
  ALTER COLUMN "authorId" SET NOT NULL,
  ALTER COLUMN "workDate" SET NOT NULL;

-- Remover colunas antigas
ALTER TABLE "work_logs" 
  DROP COLUMN "date",
  DROP COLUMN "notes",
  DROP COLUMN "reviewerId",
  DROP COLUMN "userId";

-- Ajustar hours para Decimal(4,2) e anulável, e description para anulável
ALTER TABLE "work_logs" 
  ALTER COLUMN "hours" DROP NOT NULL,
  ALTER COLUMN "hours" SET DATA TYPE DECIMAL(4,2) USING ROUND("hours"::numeric, 2),
  ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "work_log_measurements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workLogId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "MeasureUnit" NOT NULL,

    CONSTRAINT "work_log_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_log_measurements_companyId_workLogId_idx" ON "work_log_measurements"("companyId", "workLogId");
CREATE INDEX "work_logs_companyId_projectId_status_idx" ON "work_logs"("companyId", "projectId", "status");
CREATE INDEX "work_logs_companyId_authorId_workDate_idx" ON "work_logs"("companyId", "authorId", "workDate");

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_log_measurements" ADD CONSTRAINT "work_log_measurements_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "work_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

