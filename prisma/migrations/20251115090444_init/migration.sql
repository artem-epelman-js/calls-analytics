/*
  Warnings:

  - You are about to drop the column `price` on the `Messanger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Messanger" DROP COLUMN "price",
ADD COLUMN     "priceNonRecovery" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "priceRecovery" INTEGER NOT NULL DEFAULT 15;
