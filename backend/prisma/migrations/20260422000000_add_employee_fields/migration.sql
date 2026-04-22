-- AlterTable: add employee detail fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "jobTitle"     TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legacyNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hireDate"     TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "anyDeskId"    TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "teamViewerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "networkName"  TEXT;
