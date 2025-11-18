/*
  Warnings:

  - You are about to drop the column `priceNonRecovery` on the `Messanger` table. All the data in the column will be lost.
  - You are about to drop the column `priceRecovery` on the `Messanger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Messanger" DROP COLUMN "priceNonRecovery",
DROP COLUMN "priceRecovery",
ALTER COLUMN "price" SET DEFAULT 10;
