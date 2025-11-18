-- CreateEnum
CREATE TYPE "MessangerType" AS ENUM ('TELEGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "geo" AS ENUM ('KZ', 'KG', 'UZ', 'BY');

-- CreateTable
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "stage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calls" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.25,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Live" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "geo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Live_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messanger" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 10,
    "type" "MessangerType" NOT NULL,
    "isRecovery" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Messanger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calls_phone_date_key" ON "Calls"("phone", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Live_agentId_geo_date_key" ON "Live"("agentId", "geo", "date");

-- CreateIndex
CREATE INDEX "Messanger_date_idx" ON "Messanger"("date");

-- CreateIndex
CREATE INDEX "Messanger_agentId_idx" ON "Messanger"("agentId");

-- AddForeignKey
ALTER TABLE "Calls" ADD CONSTRAINT "Calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Live" ADD CONSTRAINT "Live_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messanger" ADD CONSTRAINT "Messanger_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
