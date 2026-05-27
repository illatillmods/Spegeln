-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'JOURNALIST', 'ANALYST', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PLUS', 'PRO', 'CIVIC_LAB');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'GITHUB', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "MonitoringCadence" AS ENUM ('DAILY', 'HOURLY', 'REALTIME');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('PUBLIC_REGISTRY', 'COURT_RECORD', 'PROCUREMENT', 'NEWS', 'FOI_RESPONSE', 'TIP', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'FACT_CHECK', 'LEGAL_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LegalReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('RECEIVED', 'MODERATED', 'ESCALATED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AuthorityCategory" AS ENUM ('AGENCY', 'MUNICIPALITY', 'REGION', 'COURT', 'POLICE', 'REGULATOR', 'MINISTRY', 'PUBLIC_COMPANY', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'RESPONDED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REPORTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeaderboardWindow" AS ENUM ('WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "ApiConsumerStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "IntakeLifecycleStatus" AS ENUM ('RECEIVED', 'AI_TRIAGED', 'MODERATION', 'LEGAL_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvidenceAssetKind" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ModerationDecision" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TrustVoteDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "WikiPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppealAutomationStatus" AS ENUM ('RECEIVED', 'PARSED', 'DRAFTED', 'SUBMITTED', 'RESPONDED', 'FAILED');

-- CreateEnum
CREATE TYPE "AppealArtifactKind" AS ENUM ('APPEAL', 'COMPLAINT', 'DOCUMENT_REQUEST');

-- CreateEnum
CREATE TYPE "VideoRedactionStatus" AS ENUM ('QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "MassAppealType" AS ENUM ('JO', 'GDPR', 'INFO', 'KLAGOMAL');

-- CreateEnum
CREATE TYPE "MassAppealBillingModel" AS ENUM ('PAYG', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "MassAppealUrgency" AS ENUM ('STANDARD', 'URGENT');

-- CreateEnum
CREATE TYPE "PrivacyRequestKind" AS ENUM ('ACCESS', 'EXPORT', 'DELETE', 'RECTIFY', 'OBJECTION', 'RESTRICTION');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('CARD', 'KLARNA', 'SWISH', 'BTC', 'XMR', 'LTC', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentFlowType" AS ENUM ('SUBSCRIPTION', 'PAY_PER_USE', 'DONATION', 'API_ACCESS');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING_REVIEW', 'AWAITING_PAYMENT', 'PAID', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BetaFeedbackStatus" AS ENUM ('RECEIVED', 'TRIAGED', 'ACTIONED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "publicAlias" TEXT,
    "countryCode" TEXT DEFAULT 'SE',
    "locale" TEXT DEFAULT 'sv-SE',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'sv',
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "privacyConsentAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authority" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "region" TEXT,
    "regionCode" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "category" "AuthorityCategory" NOT NULL DEFAULT 'AGENCY',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Authority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Official" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "riskNote" TEXT,
    "authorityId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Official_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceKind" "SourceKind" NOT NULL,
    "baseUrl" TEXT,
    "description" TEXT,
    "legalBasisNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "cadence" "MonitoringCadence" NOT NULL DEFAULT 'DAILY',
    "notes" TEXT,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "reportId" TEXT,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "bodyMarkdown" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "authorityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReview" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "LegalReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewer" TEXT,
    "notes" TEXT,
    "nextCheckpointAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicTip" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "authorityId" TEXT,
    "authorId" TEXT,
    "status" "TipStatus" NOT NULL DEFAULT 'RECEIVED',
    "consentToProcessing" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "officialId" TEXT,
    "authorId" TEXT,
    "publicReportId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "officialResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintVote" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "leadUserId" TEXT,
    "publicReportId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "methodologyNote" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationEndorsement" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "window" "LeaderboardWindow" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "complaintsWithResponse" INTEGER NOT NULL DEFAULT 0,
    "investigationsReported" INTEGER NOT NULL DEFAULT 0,
    "peerEndorsements" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityScorecard" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "transparencyScore" INTEGER NOT NULL,
    "responseTimeScore" INTEGER NOT NULL,
    "complaintsScore" INTEGER NOT NULL,
    "resolutionScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "explanation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorityScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "legalNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiConsumer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[],
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 120,
    "status" "ApiConsumerStatus" NOT NULL DEFAULT 'ACTIVE',
    "countryCode" TEXT DEFAULT 'SE',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiConsumer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestStat" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastRequestAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysisJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "authorityId" TEXT,
    "featureKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AiAnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "unitPriceSek" INTEGER,
    "totalPriceSek" INTEGER,
    "metadata" JSONB,
    "massAppealBatchId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyConsentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "policyVersion" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
    "acceptedPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "personalizationConsent" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "requestKind" "PrivacyRequestKind" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "details" TEXT,
    "legalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "method" "PaymentMethodKind" NOT NULL,
    "flowType" "PaymentFlowType" NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "currency" TEXT NOT NULL DEFAULT 'SEK',
    "amountSek" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "finalAmountSek" INTEGER NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "metadata" JSONB,
    "complianceNotes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "status" "BetaFeedbackStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MassAppealBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "senderRole" TEXT,
    "appealType" "MassAppealType" NOT NULL,
    "region" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "caseReference" TEXT,
    "urgency" "MassAppealUrgency" NOT NULL,
    "billingModel" "MassAppealBillingModel" NOT NULL,
    "priceSek" INTEGER NOT NULL DEFAULT 0,
    "billingLabel" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "guardrails" JSONB NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MassAppealBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MassAppealDocument" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectLine" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "estimatedFeeSek" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MassAppealDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MassAppealDelivery" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "authorityExternalId" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "estimatedResponseDays" INTEGER NOT NULL,
    "feeSek" INTEGER NOT NULL DEFAULT 0,
    "notes" JSONB NOT NULL,
    "transport" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MassAppealDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityFailureReport" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT,
    "officialId" TEXT,
    "submittedByUserId" TEXT,
    "publicReportId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "anonymousAlias" TEXT,
    "reporterFingerprintHash" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3),
    "lifecycleStatus" "IntakeLifecycleStatus" NOT NULL DEFAULT 'RECEIVED',
    "aiSeverity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "aiPriorityScore" INTEGER NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "pressReleaseDraft" TEXT,
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "legalReviewDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorityFailureReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReverseSurveillanceSubmission" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT,
    "officialId" TEXT,
    "linkedFailureReportId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "anonymousAlias" TEXT,
    "uploaderFingerprintHash" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "lifecycleStatus" "IntakeLifecycleStatus" NOT NULL DEFAULT 'RECEIVED',
    "redactionStatus" "VideoRedactionStatus" NOT NULL DEFAULT 'QUEUED',
    "redactionPolicy" TEXT NOT NULL DEFAULT 'bystanders-and-sensitive-persons',
    "sharePack" JSONB,
    "alertSentAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReverseSurveillanceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceAsset" (
    "id" TEXT NOT NULL,
    "failureReportId" TEXT,
    "surveillanceSubmissionId" TEXT,
    "automatedAppealJobId" TEXT,
    "assetKind" "EvidenceAssetKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT,
    "extractedText" TEXT,
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "redactionStatus" "VideoRedactionStatus",
    "redactionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueueItem" (
    "id" TEXT NOT NULL,
    "failureReportId" TEXT,
    "surveillanceSubmissionId" TEXT,
    "wikiRevisionId" TEXT,
    "targetType" TEXT NOT NULL,
    "status" "IntakeLifecycleStatus" NOT NULL DEFAULT 'MODERATION',
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "legalDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialConfidenceVote" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT,
    "officialId" TEXT,
    "userId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "anonymousAlias" TEXT,
    "voterFingerprintHash" TEXT,
    "direction" "TrustVoteDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialConfidenceVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfidenceTestimonial" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT,
    "officialId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "anonymousAlias" TEXT,
    "authorFingerprintHash" TEXT,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfidenceTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopholeWikiPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "status" "WikiPageStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoopholeWikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopholeWikiRevision" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "anonymousAlias" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "changeSummary" TEXT,
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoopholeWikiRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopholeWikiDiscussion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "anonymousAlias" TEXT,
    "body" TEXT NOT NULL,
    "moderationDecision" "ModerationDecision" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoopholeWikiDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoopholeWikiVote" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT,
    "voterFingerprintHash" TEXT,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoopholeWikiVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomatedAppealJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "authorityId" TEXT,
    "officialId" TEXT,
    "massAppealBatchId" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SE',
    "regionCode" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sv-SE',
    "sourceTitle" TEXT NOT NULL,
    "sourceSummary" TEXT NOT NULL,
    "parsedDecisionSummary" TEXT,
    "aiRiskSummary" TEXT,
    "status" "AppealAutomationStatus" NOT NULL DEFAULT 'RECEIVED',
    "submissionMode" TEXT NOT NULL DEFAULT 'payg',
    "priceSek" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomatedAppealJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppealGeneratedArtifact" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "artifactKind" "AppealArtifactKind" NOT NULL,
    "title" TEXT NOT NULL,
    "subjectLine" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetAuthorities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppealGeneratedArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuthorityToMonitoringSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AuthorityToMonitoringSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicAlias_key" ON "User"("publicAlias");

-- CreateIndex
CREATE UNIQUE INDEX "Authority_slug_key" ON "Authority"("slug");

-- CreateIndex
CREATE INDEX "Authority_countryCode_regionCode_idx" ON "Authority"("countryCode", "regionCode");

-- CreateIndex
CREATE INDEX "Authority_category_createdAt_idx" ON "Authority"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Official_authorityId_idx" ON "Official"("authorityId");

-- CreateIndex
CREATE INDEX "Watch_authorityId_idx" ON "Watch"("authorityId");

-- CreateIndex
CREATE UNIQUE INDEX "Watch_userId_authorityId_key" ON "Watch"("userId", "authorityId");

-- CreateIndex
CREATE INDEX "Alert_authorityId_detectedAt_idx" ON "Alert"("authorityId", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_slug_key" ON "Report"("slug");

-- CreateIndex
CREATE INDEX "Report_authorityId_status_idx" ON "Report"("authorityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalReview_reportId_key" ON "LegalReview"("reportId");

-- CreateIndex
CREATE INDEX "PublicTip_status_createdAt_idx" ON "PublicTip"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_authorityId_status_createdAt_idx" ON "Complaint"("authorityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_countryCode_regionCode_createdAt_idx" ON "Complaint"("countryCode", "regionCode", "createdAt");

-- CreateIndex
CREATE INDEX "ComplaintVote_userId_createdAt_idx" ON "ComplaintVote"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintVote_complaintId_userId_key" ON "ComplaintVote"("complaintId", "userId");

-- CreateIndex
CREATE INDEX "Investigation_authorityId_status_createdAt_idx" ON "Investigation"("authorityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Investigation_countryCode_regionCode_createdAt_idx" ON "Investigation"("countryCode", "regionCode", "createdAt");

-- CreateIndex
CREATE INDEX "InvestigationEndorsement_userId_createdAt_idx" ON "InvestigationEndorsement"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationEndorsement_investigationId_userId_key" ON "InvestigationEndorsement"("investigationId", "userId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_window_windowStart_rank_idx" ON "LeaderboardSnapshot"("window", "windowStart", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardSnapshot_userId_window_windowStart_windowEnd_key" ON "LeaderboardSnapshot"("userId", "window", "windowStart", "windowEnd");

-- CreateIndex
CREATE INDEX "AuthorityScorecard_overallScore_createdAt_idx" ON "AuthorityScorecard"("overallScore", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorityScorecard_authorityId_windowStart_windowEnd_method_key" ON "AuthorityScorecard"("authorityId", "windowStart", "windowEnd", "methodologyVersion");

-- CreateIndex
CREATE INDEX "ComplaintTemplate_countryCode_locale_isActive_idx" ON "ComplaintTemplate"("countryCode", "locale", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintTemplate_key_countryCode_regionCode_locale_key" ON "ComplaintTemplate"("key", "countryCode", "regionCode", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ApiConsumer_hashedKey_key" ON "ApiConsumer"("hashedKey");

-- CreateIndex
CREATE INDEX "ApiConsumer_status_createdAt_idx" ON "ApiConsumer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestStat_windowStart_routeKey_idx" ON "ApiRequestStat"("windowStart", "routeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ApiRequestStat_consumerId_routeKey_windowStart_key" ON "ApiRequestStat"("consumerId", "routeKey", "windowStart");

-- CreateIndex
CREATE INDEX "AiAnalysisJob_featureKey_status_createdAt_idx" ON "AiAnalysisJob"("featureKey", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAnalysisJob_authorityId_createdAt_idx" ON "AiAnalysisJob"("authorityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_massAppealBatchId_key" ON "UsageRecord"("massAppealBatchId");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_featureKey_periodStart_idx" ON "UsageRecord"("userId", "featureKey", "periodStart");

-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "PrivacyConsentEvent_userId_createdAt_idx" ON "PrivacyConsentEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_status_requestKind_createdAt_idx" ON "PrivacyRequest"("status", "requestKind", "createdAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_email_createdAt_idx" ON "PrivacyRequest"("email", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_method_createdAt_idx" ON "PaymentRequest"("status", "method", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRequest_email_createdAt_idx" ON "PaymentRequest"("email", "createdAt");

-- CreateIndex
CREATE INDEX "BetaFeedback_status_createdAt_idx" ON "BetaFeedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MassAppealBatch_senderEmail_createdAt_idx" ON "MassAppealBatch"("senderEmail", "createdAt");

-- CreateIndex
CREATE INDEX "MassAppealBatch_userId_createdAt_idx" ON "MassAppealBatch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MassAppealDocument_batchId_idx" ON "MassAppealDocument"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "MassAppealDelivery_trackingCode_key" ON "MassAppealDelivery"("trackingCode");

-- CreateIndex
CREATE INDEX "MassAppealDelivery_batchId_status_idx" ON "MassAppealDelivery"("batchId", "status");

-- CreateIndex
CREATE INDEX "MassAppealDelivery_authorityExternalId_createdAt_idx" ON "MassAppealDelivery"("authorityExternalId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthorityFailureReport_lifecycleStatus_aiSeverity_createdAt_idx" ON "AuthorityFailureReport"("lifecycleStatus", "aiSeverity", "createdAt");

-- CreateIndex
CREATE INDEX "AuthorityFailureReport_authorityId_createdAt_idx" ON "AuthorityFailureReport"("authorityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthorityFailureReport_countryCode_regionCode_createdAt_idx" ON "AuthorityFailureReport"("countryCode", "regionCode", "createdAt");

-- CreateIndex
CREATE INDEX "ReverseSurveillanceSubmission_lifecycleStatus_redactionStat_idx" ON "ReverseSurveillanceSubmission"("lifecycleStatus", "redactionStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ReverseSurveillanceSubmission_authorityId_createdAt_idx" ON "ReverseSurveillanceSubmission"("authorityId", "createdAt");

-- CreateIndex
CREATE INDEX "EvidenceAsset_failureReportId_assetKind_idx" ON "EvidenceAsset"("failureReportId", "assetKind");

-- CreateIndex
CREATE INDEX "EvidenceAsset_surveillanceSubmissionId_assetKind_idx" ON "EvidenceAsset"("surveillanceSubmissionId", "assetKind");

-- CreateIndex
CREATE INDEX "EvidenceAsset_automatedAppealJobId_assetKind_idx" ON "EvidenceAsset"("automatedAppealJobId", "assetKind");

-- CreateIndex
CREATE INDEX "ReviewQueueItem_status_moderationDecision_createdAt_idx" ON "ReviewQueueItem"("status", "moderationDecision", "createdAt");

-- CreateIndex
CREATE INDEX "OfficialConfidenceVote_officialId_createdAt_idx" ON "OfficialConfidenceVote"("officialId", "createdAt");

-- CreateIndex
CREATE INDEX "OfficialConfidenceVote_authorityId_createdAt_idx" ON "OfficialConfidenceVote"("authorityId", "createdAt");

-- CreateIndex
CREATE INDEX "OfficialConfidenceVote_countryCode_regionCode_createdAt_idx" ON "OfficialConfidenceVote"("countryCode", "regionCode", "createdAt");

-- CreateIndex
CREATE INDEX "ConfidenceTestimonial_officialId_moderationDecision_created_idx" ON "ConfidenceTestimonial"("officialId", "moderationDecision", "createdAt");

-- CreateIndex
CREATE INDEX "ConfidenceTestimonial_authorityId_moderationDecision_create_idx" ON "ConfidenceTestimonial"("authorityId", "moderationDecision", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoopholeWikiPage_slug_key" ON "LoopholeWikiPage"("slug");

-- CreateIndex
CREATE INDEX "LoopholeWikiPage_countryCode_regionCode_category_idx" ON "LoopholeWikiPage"("countryCode", "regionCode", "category");

-- CreateIndex
CREATE INDEX "LoopholeWikiPage_status_updatedAt_idx" ON "LoopholeWikiPage"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "LoopholeWikiRevision_moderationDecision_createdAt_idx" ON "LoopholeWikiRevision"("moderationDecision", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoopholeWikiRevision_pageId_revisionNumber_key" ON "LoopholeWikiRevision"("pageId", "revisionNumber");

-- CreateIndex
CREATE INDEX "LoopholeWikiDiscussion_pageId_moderationDecision_createdAt_idx" ON "LoopholeWikiDiscussion"("pageId", "moderationDecision", "createdAt");

-- CreateIndex
CREATE INDEX "LoopholeWikiVote_pageId_createdAt_idx" ON "LoopholeWikiVote"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "AutomatedAppealJob_status_createdAt_idx" ON "AutomatedAppealJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AutomatedAppealJob_authorityId_createdAt_idx" ON "AutomatedAppealJob"("authorityId", "createdAt");

-- CreateIndex
CREATE INDEX "AppealGeneratedArtifact_jobId_artifactKind_idx" ON "AppealGeneratedArtifact"("jobId", "artifactKind");

-- CreateIndex
CREATE INDEX "_AuthorityToMonitoringSource_B_index" ON "_AuthorityToMonitoringSource"("B");

-- AddForeignKey
ALTER TABLE "Official" ADD CONSTRAINT "Official_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalReview" ADD CONSTRAINT "LegalReview_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTip" ADD CONSTRAINT "PublicTip_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTip" ADD CONSTRAINT "PublicTip_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_publicReportId_fkey" FOREIGN KEY ("publicReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_leadUserId_fkey" FOREIGN KEY ("leadUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_publicReportId_fkey" FOREIGN KEY ("publicReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationEndorsement" ADD CONSTRAINT "InvestigationEndorsement_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationEndorsement" ADD CONSTRAINT "InvestigationEndorsement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityScorecard" ADD CONSTRAINT "AuthorityScorecard_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiConsumer" ADD CONSTRAINT "ApiConsumer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestStat" ADD CONSTRAINT "ApiRequestStat_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "ApiConsumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysisJob" ADD CONSTRAINT "AiAnalysisJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysisJob" ADD CONSTRAINT "AiAnalysisJob_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_massAppealBatchId_fkey" FOREIGN KEY ("massAppealBatchId") REFERENCES "MassAppealBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyConsentEvent" ADD CONSTRAINT "PrivacyConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaFeedback" ADD CONSTRAINT "BetaFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MassAppealBatch" ADD CONSTRAINT "MassAppealBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MassAppealDocument" ADD CONSTRAINT "MassAppealDocument_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MassAppealBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MassAppealDelivery" ADD CONSTRAINT "MassAppealDelivery_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MassAppealBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityFailureReport" ADD CONSTRAINT "AuthorityFailureReport_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityFailureReport" ADD CONSTRAINT "AuthorityFailureReport_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityFailureReport" ADD CONSTRAINT "AuthorityFailureReport_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorityFailureReport" ADD CONSTRAINT "AuthorityFailureReport_publicReportId_fkey" FOREIGN KEY ("publicReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReverseSurveillanceSubmission" ADD CONSTRAINT "ReverseSurveillanceSubmission_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReverseSurveillanceSubmission" ADD CONSTRAINT "ReverseSurveillanceSubmission_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReverseSurveillanceSubmission" ADD CONSTRAINT "ReverseSurveillanceSubmission_linkedFailureReportId_fkey" FOREIGN KEY ("linkedFailureReportId") REFERENCES "AuthorityFailureReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAsset" ADD CONSTRAINT "EvidenceAsset_failureReportId_fkey" FOREIGN KEY ("failureReportId") REFERENCES "AuthorityFailureReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAsset" ADD CONSTRAINT "EvidenceAsset_surveillanceSubmissionId_fkey" FOREIGN KEY ("surveillanceSubmissionId") REFERENCES "ReverseSurveillanceSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAsset" ADD CONSTRAINT "EvidenceAsset_automatedAppealJobId_fkey" FOREIGN KEY ("automatedAppealJobId") REFERENCES "AutomatedAppealJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_failureReportId_fkey" FOREIGN KEY ("failureReportId") REFERENCES "AuthorityFailureReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_surveillanceSubmissionId_fkey" FOREIGN KEY ("surveillanceSubmissionId") REFERENCES "ReverseSurveillanceSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueueItem" ADD CONSTRAINT "ReviewQueueItem_wikiRevisionId_fkey" FOREIGN KEY ("wikiRevisionId") REFERENCES "LoopholeWikiRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialConfidenceVote" ADD CONSTRAINT "OfficialConfidenceVote_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialConfidenceVote" ADD CONSTRAINT "OfficialConfidenceVote_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialConfidenceVote" ADD CONSTRAINT "OfficialConfidenceVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceTestimonial" ADD CONSTRAINT "ConfidenceTestimonial_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceTestimonial" ADD CONSTRAINT "ConfidenceTestimonial_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopholeWikiRevision" ADD CONSTRAINT "LoopholeWikiRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LoopholeWikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopholeWikiRevision" ADD CONSTRAINT "LoopholeWikiRevision_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopholeWikiDiscussion" ADD CONSTRAINT "LoopholeWikiDiscussion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LoopholeWikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopholeWikiVote" ADD CONSTRAINT "LoopholeWikiVote_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LoopholeWikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoopholeWikiVote" ADD CONSTRAINT "LoopholeWikiVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedAppealJob" ADD CONSTRAINT "AutomatedAppealJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedAppealJob" ADD CONSTRAINT "AutomatedAppealJob_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedAppealJob" ADD CONSTRAINT "AutomatedAppealJob_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedAppealJob" ADD CONSTRAINT "AutomatedAppealJob_massAppealBatchId_fkey" FOREIGN KEY ("massAppealBatchId") REFERENCES "MassAppealBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppealGeneratedArtifact" ADD CONSTRAINT "AppealGeneratedArtifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AutomatedAppealJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthorityToMonitoringSource" ADD CONSTRAINT "_AuthorityToMonitoringSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Authority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthorityToMonitoringSource" ADD CONSTRAINT "_AuthorityToMonitoringSource_B_fkey" FOREIGN KEY ("B") REFERENCES "MonitoringSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

