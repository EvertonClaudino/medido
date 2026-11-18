-- CreateEnum
CREATE TYPE "ClientActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_visitRequestId_fkey";

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "visitRequestId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "client_activities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "ClientActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_activities_companyId_clientId_occurredAt_idx" ON "client_activities"("companyId", "clientId", "occurredAt");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_visitRequestId_fkey" FOREIGN KEY ("visitRequestId") REFERENCES "visit_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_activities" ADD CONSTRAINT "client_activities_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

