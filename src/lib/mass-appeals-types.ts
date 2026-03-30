export type AppealType = "jo" | "gdpr" | "info" | "klagomal";

export type BillingModel = "payg" | "subscription";

export type UrgencyLevel = "standard" | "urgent";

export type DeliveryStatus = "queued" | "sent" | "delivered" | "manual_review" | "failed";

export type AppealTypeDefinition = {
  id: AppealType;
  label: string;
  summary: string;
  defaultRequestedAction: string;
  defaultLegalBasis: string;
  defaultSubjectPrefix: string;
};

export type AuthorityTarget = {
  id: string;
  name: string;
  category: "oversight" | "privacy" | "registrator" | "supervisory";
  region: string;
  channel: "E-postgateway" | "Registrator" | "Säker brevlåda";
  endpoint: string;
  estimatedResponseDays: number;
  supportedAppealTypes: AppealType[];
};

export type PricingEstimate = {
  billingModel: BillingModel;
  amountSek: number;
  label: string;
  summary: string;
};

export type GeneratedDocument = {
  id: string;
  recipientId: string;
  recipientName: string;
  title: string;
  subjectLine: string;
  channel: AuthorityTarget["channel"];
  body: string;
  estimatedFeeSek: number;
};

export type AuthorityDelivery = {
  authorityId: string;
  authorityName: string;
  channel: AuthorityTarget["channel"];
  endpoint: string;
  status: DeliveryStatus;
  trackingCode: string;
  estimatedResponseDays: number;
  feeSek: number;
  notes: string[];
  transport?: string;
  providerMessageId?: string;
  deliveredAt?: string;
  updatedAt: string;
};

export type MassAppealPayload = {
  appealType: AppealType;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  region: string;
  subject: string;
  caseReference: string;
  incidentSummary: string;
  requestedAction: string;
  legalBasis: string;
  selectedAuthorityIds: string[];
  billingModel: BillingModel;
  urgency: UrgencyLevel;
};

export type MassAppealPreview = {
  createdAt: string;
  appealType: AppealType;
  appealLabel: string;
  recipients: AuthorityDelivery[];
  documents: GeneratedDocument[];
  pricing: PricingEstimate;
  guardrails: string[];
  remainingQuota: {
    previews: number;
    sends: number;
    maxRecipientsPerBatch: number;
  };
};

export type MassAppealBatch = {
  id: string;
  createdAt: string;
  appealType: AppealType;
  appealLabel: string;
  region: string;
  subject: string;
  senderEmail: string;
  billingModel: BillingModel;
  pricing: PricingEstimate;
  deliveryMode: string;
  recipients: AuthorityDelivery[];
  documents: GeneratedDocument[];
  guardrails: string[];
};

export type MassAppealCatalog = {
  appealTypes: AppealTypeDefinition[];
  authorities: AuthorityTarget[];
  regions: string[];
  billingModels: Array<{
    id: BillingModel;
    label: string;
    summary: string;
  }>;
  antiAbuseSummary: string[];
};