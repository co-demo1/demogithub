-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "scheduledAt" TIMESTAMP(3);
-- CreateIndex
CREATE UNIQUE INDEX "Todo_userId_scheduledAt_key" ON "Todo"("userId", "scheduledAt");
