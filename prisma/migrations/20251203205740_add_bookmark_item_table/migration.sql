-- CreateEnum
CREATE TYPE "BookmarkType" AS ENUM ('SERVICE_ITEM', 'SUB_SERVICE_ITEM', 'MANONG');

-- CreateTable
CREATE TABLE "BookmarkItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "BookmarkType" NOT NULL,
    "serviceItemId" INTEGER,
    "subServiceItemId" INTEGER,
    "manongId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookmarkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookmarkItem_userId_idx" ON "BookmarkItem"("userId");

-- CreateIndex
CREATE INDEX "BookmarkItem_manongId_idx" ON "BookmarkItem"("manongId");

-- CreateIndex
CREATE INDEX "BookmarkItem_createdAt_idx" ON "BookmarkItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkItem_userId_type_serviceItemId_subServiceItemId_man_key" ON "BookmarkItem"("userId", "type", "serviceItemId", "subServiceItemId", "manongId");

-- AddForeignKey
ALTER TABLE "BookmarkItem" ADD CONSTRAINT "BookmarkItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkItem" ADD CONSTRAINT "BookmarkItem_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkItem" ADD CONSTRAINT "BookmarkItem_subServiceItemId_fkey" FOREIGN KEY ("subServiceItemId") REFERENCES "SubServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkItem" ADD CONSTRAINT "BookmarkItem_manongId_fkey" FOREIGN KEY ("manongId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
