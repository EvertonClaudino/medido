CREATE TYPE "VisitStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "BudgetRevisionType" AS ENUM ('CREATED', 'CONTENT_EDIT', 'STATUS_CHANGE');

CREATE TABLE "visit_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requestedAddress" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "visitRequestId" TEXT NOT NULL,
    "projectId" TEXT,
    "projectName" TEXT NOT NULL,
    "workAddress" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_revisions" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "type" "BudgetRevisionType" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "editorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budgets_visitRequestId_key" ON "budgets"("visitRequestId");
CREATE UNIQUE INDEX "budgets_projectId_key" ON "budgets"("projectId");
CREATE INDEX "visit_requests_companyId_status_createdAt_idx" ON "visit_requests"("companyId", "status", "createdAt");
CREATE INDEX "visit_requests_companyId_clientId_idx" ON "visit_requests"("companyId", "clientId");
CREATE INDEX "budgets_companyId_status_updatedAt_idx" ON "budgets"("companyId", "status", "updatedAt");
CREATE INDEX "budgets_companyId_clientId_idx" ON "budgets"("companyId", "clientId");
CREATE INDEX "budget_items_budgetId_position_idx" ON "budget_items"("budgetId", "position");
CREATE UNIQUE INDEX "budget_revisions_budgetId_revisionNumber_key" ON "budget_revisions"("budgetId", "revisionNumber");
CREATE INDEX "budget_revisions_budgetId_createdAt_idx" ON "budget_revisions"("budgetId", "createdAt");

ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "visit_requests" ADD CONSTRAINT "visit_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_visitRequestId_fkey" FOREIGN KEY ("visitRequestId") REFERENCES "visit_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
