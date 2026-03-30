import nodemailer from "nodemailer";
import type { AuthorityDelivery, GeneratedDocument } from "@/lib/mass-appeals-types";

type DeliveryAttemptInput = {
  document: GeneratedDocument;
  recipient: AuthorityDelivery;
  senderEmail: string;
  senderName?: string;
};

type DeliveryAttemptResult = {
  status: AuthorityDelivery["status"];
  transport: string;
  providerMessageId?: string;
  deliveredAt?: string;
  notes: string[];
};

type SecureMailboxResponse = {
  id?: string;
  messageId?: string;
  status?: string;
};

let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.MASS_APPEALS_SMTP_HOST;
  const port = process.env.MASS_APPEALS_SMTP_PORT;
  const user = process.env.MASS_APPEALS_SMTP_USER;
  const pass = process.env.MASS_APPEALS_SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return {
    host,
    port: Number(port),
    secure: process.env.MASS_APPEALS_SMTP_SECURE === "true" || Number(port) === 465,
    user,
    pass,
    from: process.env.MASS_APPEALS_FROM_EMAIL || user,
  };
}

function getSecureMailboxConfig() {
  const url = process.env.MASS_APPEALS_SECURE_MAILBOX_WEBHOOK_URL;
  if (!url) {
    return null;
  }

  return {
    url,
    apiKey: process.env.MASS_APPEALS_SECURE_MAILBOX_API_KEY,
  };
}

async function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return smtpTransporter;
}

async function deliverBySmtp(input: DeliveryAttemptInput) {
  const transporter = await getSmtpTransporter();
  const config = getSmtpConfig();

  if (!transporter || !config) {
    return null;
  }

  const result = await transporter.sendMail({
    from: config.from,
    to: input.recipient.endpoint,
    replyTo: input.senderEmail,
    subject: input.document.subjectLine,
    text: input.document.body,
    headers: {
      "X-Spegeln-Tracking": input.recipient.trackingCode,
      "X-Spegeln-Channel": input.recipient.channel,
      "X-Spegeln-Recipient": input.recipient.authorityId,
    },
  });

  return {
    status: "sent",
    transport: "smtp",
    providerMessageId: result.messageId,
    deliveredAt: new Date().toISOString(),
    notes: [`Skickad via SMTP till ${input.recipient.endpoint}.`],
  } satisfies DeliveryAttemptResult;
}

async function deliverBySecureMailboxWebhook(input: DeliveryAttemptInput) {
  const config = getSecureMailboxConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      trackingCode: input.recipient.trackingCode,
      authorityId: input.recipient.authorityId,
      authorityName: input.recipient.authorityName,
      endpoint: input.recipient.endpoint,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
      subject: input.document.subjectLine,
      body: input.document.body,
      metadata: {
        channel: input.recipient.channel,
        feeSek: input.recipient.feeSek,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Secure mailbox-transporten svarade med ${response.status}.`);
  }

  const data = (await response.json().catch(() => null)) as SecureMailboxResponse | null;

  return {
    status: data?.status === "delivered" ? "delivered" : "sent",
    transport: "secure_mailbox_webhook",
    providerMessageId: data?.messageId || data?.id,
    deliveredAt: new Date().toISOString(),
    notes: ["Överlämnad till secure mailbox-workflow via konfigurerad webhook."],
  } satisfies DeliveryAttemptResult;
}

export function getConfiguredDeliveryMode() {
  const configured = [];
  if (getSmtpConfig()) {
    configured.push("SMTP");
  }
  if (getSecureMailboxConfig()) {
    configured.push("secure mailbox webhook");
  }

  return configured.length ? configured.join(" + ") : "Manuell granskning krävs";
}

export async function deliverGeneratedDocument(input: DeliveryAttemptInput): Promise<DeliveryAttemptResult> {
  if (input.recipient.status === "manual_review") {
    return {
      status: "manual_review",
      transport: "manual_review",
      notes: ["Ej skickad automatiskt eftersom batchen kräver manuell kontroll."],
    };
  }

  try {
    if (input.recipient.channel === "Säker brevlåda") {
      const secureMailboxResult = await deliverBySecureMailboxWebhook(input);
      if (secureMailboxResult) {
        return secureMailboxResult;
      }

      return {
        status: "failed",
        transport: "secure_mailbox_webhook",
        notes: ["Ingen secure mailbox-webhook är konfigurerad för denna leverans."],
      };
    }

    const smtpResult = await deliverBySmtp(input);
    if (smtpResult) {
      return smtpResult;
    }

    return {
      status: "failed",
      transport: "smtp",
      notes: ["SMTP-transporten är inte konfigurerad i miljön."],
    };
  } catch (error) {
    return {
      status: "failed",
      transport: input.recipient.channel === "Säker brevlåda" ? "secure_mailbox_webhook" : "smtp",
      notes: [error instanceof Error ? error.message : "Transporten misslyckades utan felmeddelande."],
    };
  }
}