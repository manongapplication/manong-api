-- CreateEnum
CREATE TYPE "AppPlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "UpdatePriority" AS ENUM ('NORMAL', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" SERIAL NOT NULL,
    "platform" "AppPlatform" NOT NULL,
    "version" TEXT NOT NULL,
    "buildNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "priority" "UpdatePriority" NOT NULL DEFAULT 'NORMAL',
    "minVersion" TEXT,
    "releaseNotes" TEXT,
    "whatsNew" TEXT,
    "androidStoreUrl" TEXT,
    "iosStoreUrl" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forceUpdateDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAppVersion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "platform" "AppPlatform" NOT NULL,
    "version" TEXT NOT NULL,
    "buildNumber" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppVersion_platform_isActive_idx" ON "AppVersion"("platform", "isActive");

-- CreateIndex
CREATE INDEX "AppVersion_platform_isMandatory_idx" ON "AppVersion"("platform", "isMandatory");

-- CreateIndex
CREATE INDEX "AppVersion_createdAt_idx" ON "AppVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_platform_version_key" ON "AppVersion"("platform", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_platform_buildNumber_key" ON "AppVersion"("platform", "buildNumber");

-- CreateIndex
CREATE INDEX "UserAppVersion_platform_version_idx" ON "UserAppVersion"("platform", "version");

-- CreateIndex
CREATE INDEX "UserAppVersion_lastSeen_idx" ON "UserAppVersion"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppVersion_userId_platform_key" ON "UserAppVersion"("userId", "platform");

-- AddForeignKey
ALTER TABLE "UserAppVersion" ADD CONSTRAINT "UserAppVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
