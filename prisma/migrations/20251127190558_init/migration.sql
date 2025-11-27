-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending', 'onHold', 'verified', 'rejected', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "AddressCategory" AS ENUM ('residential', 'apartment', 'condominium', 'commercial');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'manong', 'admin', 'superadmin', 'moderator', 'guest');

-- CreateEnum
CREATE TYPE "ServiceItemStatus" AS ENUM ('active', 'inactive', 'comingSoon', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('awaitingAcceptance', 'accepted', 'inProgress', 'completed', 'failed', 'cancelled', 'rejected', 'paused', 'pending', 'expired', 'refunding');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('payment', 'refund', 'adjustment');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'approved', 'rejected', 'failed', 'requiresAction', 'processing', 'processed');

-- CreateEnum
CREATE TYPE "ManongStatus" AS ENUM ('available', 'busy', 'offline', 'inactive', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'deleted');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('refund', 'discount', 'fee', 'correction', 'promotion', 'penalty');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('pending', 'approved', 'rejected', 'applied', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT,
    "email" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL,
    "addressCategory" "AddressCategory" DEFAULT 'residential',
    "addressLine" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "lastKnownLat" DECIMAL(10,7),
    "lastKnownLng" DECIMAL(10,7),
    "fcmToken" TEXT,
    "profilePhoto" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'pending',
    "hasSeenVerificationCongrats" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("email","token")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMin" DECIMAL(10,2) NOT NULL,
    "priceMax" DECIMAL(10,2) NOT NULL,
    "ratePerKm" DECIMAL(8,2),
    "iconName" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "iconTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "status" "ServiceItemStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubServiceItem" (
    "id" SERIAL NOT NULL,
    "serviceItemId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "iconName" TEXT,
    "iconTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "fee" DECIMAL(10,2),
    "status" "ServiceItemStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SubServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrgencyLevel" (
    "id" SERIAL NOT NULL,
    "level" VARCHAR(50) NOT NULL,
    "time" VARCHAR(50) NOT NULL,
    "price" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrgencyLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" SERIAL NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "manongId" INTEGER,
    "serviceItemId" INTEGER NOT NULL,
    "subServiceItemId" INTEGER,
    "paymentMethodId" INTEGER,
    "urgencyLevelId" INTEGER NOT NULL,
    "otherServiceName" TEXT,
    "serviceDetails" TEXT,
    "imagesPath" TEXT,
    "customerFullAddress" TEXT,
    "customerLat" DECIMAL(10,7) NOT NULL,
    "customerLng" DECIMAL(10,7) NOT NULL,
    "notes" TEXT,
    "status" "ServiceRequestStatus",
    "total" DECIMAL(10,2),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "arrivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "paymentIdOnGateway" TEXT,
    "refundIdOnGateway" TEXT,
    "handledManually" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "type" "TransactionType" NOT NULL DEFAULT 'payment',
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "paymentTransactionId" INTEGER,
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "amount" DECIMAL(10,2),
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "handledManually" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" INTEGER,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "revieweeId" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "attachmentsPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManongProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "ManongStatus" NOT NULL DEFAULT 'available',
    "licenseNumber" TEXT,
    "yearsExperience" INTEGER,
    "hourlyRate" DECIMAL(8,2),
    "startingPrice" DECIMAL(8,2),
    "isProfessionallyVerified" BOOLEAN NOT NULL DEFAULT false,
    "dailyServiceLimit" INTEGER NOT NULL DEFAULT 5,
    "experienceDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ManongProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManongSpecialities" (
    "id" SERIAL NOT NULL,
    "manongProfileId" INTEGER NOT NULL,
    "subServiceItemId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ManongSpecialities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManongAssistant" (
    "id" SERIAL NOT NULL,
    "manongProfileId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ManongAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManongReport" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "manongId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "materialsUsed" TEXT,
    "laborDuration" INTEGER,
    "imagesPath" TEXT NOT NULL,
    "issuesFound" TEXT,
    "customerPresent" BOOLEAN,
    "verifiedByUser" BOOLEAN DEFAULT false,
    "totalCost" DECIMAL(10,2),
    "warrantyInfo" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManongReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "reviewedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaymentMethod" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "paymentMethodIdOnGateway" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "cardHolderName" TEXT,
    "billingEmail" TEXT,
    "customerId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "roomId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3),
    "serviceRequestId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" TEXT,
    "userId" INTEGER NOT NULL,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSettings" (
    "id" SERIAL NOT NULL,
    "serviceTax" DOUBLE PRECISION NOT NULL,
    "maxDistanceFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppMaintenance" (
    "id" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" SERIAL NOT NULL,
    "serviceRequestId" INTEGER NOT NULL,
    "paymentTransactionId" INTEGER,
    "type" "AdjustmentType" NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "requestedBy" INTEGER,
    "approvedBy" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCodeUsage" (
    "id" SERIAL NOT NULL,
    "referralCodeId" INTEGER NOT NULL,
    "userId" INTEGER,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "SubServiceItem_serviceItemId_idx" ON "SubServiceItem"("serviceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_requestNumber_key" ON "ServiceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "ServiceRequest_userId_idx" ON "ServiceRequest"("userId");

-- CreateIndex
CREATE INDEX "ServiceRequest_manongId_idx" ON "ServiceRequest"("manongId");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_serviceRequestId_idx" ON "PaymentTransaction"("serviceRequestId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_paymentTransactionId_key" ON "RefundRequest"("paymentTransactionId");

-- CreateIndex
CREATE INDEX "RefundRequest_serviceRequestId_idx" ON "RefundRequest"("serviceRequestId");

-- CreateIndex
CREATE INDEX "RefundRequest_userId_idx" ON "RefundRequest"("userId");

-- CreateIndex
CREATE INDEX "RefundRequest_status_idx" ON "RefundRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_serviceRequestId_key" ON "Feedback"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Feedback_revieweeId_idx" ON "Feedback"("revieweeId");

-- CreateIndex
CREATE INDEX "Feedback_reviewerId_idx" ON "Feedback"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_serviceRequestId_reviewerId_key" ON "Feedback"("serviceRequestId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ManongProfile_userId_key" ON "ManongProfile"("userId");

-- CreateIndex
CREATE INDEX "ManongProfile_status_idx" ON "ManongProfile"("status");

-- CreateIndex
CREATE INDEX "ManongProfile_isProfessionallyVerified_idx" ON "ManongProfile"("isProfessionallyVerified");

-- CreateIndex
CREATE UNIQUE INDEX "ManongReport_serviceRequestId_key" ON "ManongReport"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ManongReport_manongId_idx" ON "ManongReport"("manongId");

-- CreateIndex
CREATE INDEX "ProviderVerification_userId_idx" ON "ProviderVerification"("userId");

-- CreateIndex
CREATE INDEX "ProviderVerification_status_idx" ON "ProviderVerification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaymentMethod_userId_provider_paymentMethodIdOnGateway_key" ON "UserPaymentMethod"("userId", "provider", "paymentMethodIdOnGateway");

-- CreateIndex
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- CreateIndex
CREATE INDEX "Message_serviceRequestId_idx" ON "Message"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "UserNotification_userId_idx" ON "UserNotification"("userId");

-- CreateIndex
CREATE INDEX "UserNotification_seenAt_idx" ON "UserNotification"("seenAt");

-- CreateIndex
CREATE INDEX "Adjustment_serviceRequestId_idx" ON "Adjustment"("serviceRequestId");

-- CreateIndex
CREATE INDEX "Adjustment_type_idx" ON "Adjustment"("type");

-- CreateIndex
CREATE INDEX "Adjustment_status_idx" ON "Adjustment"("status");

-- CreateIndex
CREATE INDEX "Adjustment_createdAt_idx" ON "Adjustment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCodeUsage_deviceId_referralCodeId_key" ON "ReferralCodeUsage"("deviceId", "referralCodeId");

-- AddForeignKey
ALTER TABLE "SubServiceItem" ADD CONSTRAINT "SubServiceItem_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_manongId_fkey" FOREIGN KEY ("manongId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_subServiceItemId_fkey" FOREIGN KEY ("subServiceItemId") REFERENCES "SubServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_urgencyLevelId_fkey" FOREIGN KEY ("urgencyLevelId") REFERENCES "UrgencyLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongProfile" ADD CONSTRAINT "ManongProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongSpecialities" ADD CONSTRAINT "ManongSpecialities_manongProfileId_fkey" FOREIGN KEY ("manongProfileId") REFERENCES "ManongProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongSpecialities" ADD CONSTRAINT "ManongSpecialities_subServiceItemId_fkey" FOREIGN KEY ("subServiceItemId") REFERENCES "SubServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongAssistant" ADD CONSTRAINT "ManongAssistant_manongProfileId_fkey" FOREIGN KEY ("manongProfileId") REFERENCES "ManongProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongReport" ADD CONSTRAINT "ManongReport_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManongReport" ADD CONSTRAINT "ManongReport_manongId_fkey" FOREIGN KEY ("manongId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderVerification" ADD CONSTRAINT "ProviderVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderVerification" ADD CONSTRAINT "ProviderVerification_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaymentMethod" ADD CONSTRAINT "UserPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaymentMethod" ADD CONSTRAINT "UserPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCodeUsage" ADD CONSTRAINT "ReferralCodeUsage_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCodeUsage" ADD CONSTRAINT "ReferralCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
