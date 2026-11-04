-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DONOR');

-- CreateEnum
CREATE TYPE "Need" AS ENUM ('PENSION', 'LIVELIHOOD', 'HEALTH', 'EDUCATION');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'APPROVED');

-- CreateEnum
CREATE TYPE "ContentOrigin" AS ENUM ('HUMAN', 'AI_DRAFT');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'BLOCKED_FOREIGN');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('NEW', 'DONE');

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "need" "Need" NOT NULL,
    "districts" TEXT[],
    "rules" JSONB NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "isIllustrative" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_content" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "whoCanApply" TEXT NOT NULL,
    "documents" TEXT[],
    "howToApply" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "origin" "ContentOrigin" NOT NULL DEFAULT 'HUMAN',
    "aiWarnings" JSONB,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheme_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_centre" (
    "id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "help_centre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pan" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,

    CONSTRAINT "donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleHi" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "descriptionEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "type" "DonationType" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "paymentRef" TEXT,
    "cardCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorPan" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "campaignTitle" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_counter" (
    "fy" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL,

    CONSTRAINT "receipt_counter_pkey" PRIMARY KEY ("fy")
);

-- CreateTable
CREATE TABLE "recurring_plan" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextRunOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callback_request" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "schemeCodes" TEXT[],
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "CallbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callback_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finder_use" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "resultCount" INTEGER NOT NULL,

    CONSTRAINT "finder_use_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_code_key" ON "scheme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_slug_key" ON "scheme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_content_schemeId_lang_key" ON "scheme_content"("schemeId", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "donor_userId_key" ON "donor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "donor_email_key" ON "donor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_slug_key" ON "campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "donation_idempotencyKey_key" ON "donation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "donation_paymentRef_key" ON "donation"("paymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_donationId_key" ON "receipt"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_number_key" ON "receipt"("number");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_publicToken_key" ON "receipt"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_fy_seq_key" ON "receipt"("fy", "seq");

-- AddForeignKey
ALTER TABLE "scheme_content" ADD CONSTRAINT "scheme_content_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor" ADD CONSTRAINT "donor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_plan" ADD CONSTRAINT "recurring_plan_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
