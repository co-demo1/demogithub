-- Existing todos have no due date. No data backfill is needed.
ALTER TABLE "Todo" ADD COLUMN "dueDate" DATE;
