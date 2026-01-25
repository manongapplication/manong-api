-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('topup', 'job_fee', 'payout', 'adjustment', 'refund');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "ManongWallet" (
    "id" SERIAL NOT NULL,
    "manongId" INTEGER NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pending" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "locked" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManongWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManongWalletTransaction" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManongWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManongWallet_manongId_key" ON "ManongWallet"("manongId");

-- CreateIndex
CREATE INDEX "ManongWallet_manongId_idx" ON "ManongWallet"("manongId");

-- CreateIndex
CREATE INDEX "ManongWalletTransaction_walletId_idx" ON "ManongWalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "ManongWalletTransaction_type_idx" ON "ManongWalletTransaction"("type");

-- CreateIndex
CREATE INDEX "ManongWalletTransaction_status_idx" ON "ManongWalletTransaction"("status");

-- AddForeignKey
ALTER TABLE "ManongWallet" ADD CONSTRAINT "ManongWallet_manongId_fkey" FOREIGN KEY ("manongId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongWalletTransaction" ADD CONSTRAINT "ManongWalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "ManongWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
