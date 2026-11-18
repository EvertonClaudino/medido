-- Valores monetários em Decimal (arredondamento explícito ao cêntimo)
ALTER TABLE "projects" ALTER COLUMN "budget" SET DATA TYPE DECIMAL(14,2) USING round("budget"::numeric, 2);

-- Rate limiting persistente de início de sessão
CREATE TABLE "login_attempts" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "login_attempts_updatedAt_idx" ON "login_attempts"("updatedAt");
