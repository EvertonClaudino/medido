-- DropForeignKey
ALTER TABLE "work_logs" DROP CONSTRAINT IF EXISTS "work_logs_authorId_fkey";

-- AddForeignKey com ON DELETE RESTRICT em authorId
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey de work_log_measurements.companyId para companies
ALTER TABLE "work_log_measurements" ADD CONSTRAINT "work_log_measurements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

