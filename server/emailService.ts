import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import type { RowDataPacket } from "mysql2";
import { config } from "./config.js";
import { db } from "./db.js";

export type EmailTemplate =
  | "welcome"
  | "purchase_confirmation"
  | "newsletter_confirmation"
  | "contact_acknowledgement"
  | "membership_confirmation"
  | "course_enrollment"
  | "certificate_issued"
  | "assessment_completion"
  | "password_reset"
  | "otp"
  | "event_registration"
  | "payment_success";

export type SendEmailInput = {
  userId?: string;
  template: EmailTemplate;
  recipient: string;
  subject: string;
  text: string;
  html: string;
  dedupKey?: string;
};

export type SendEmailResult = {
  status: "sent" | "failed" | "suppressed" | "not_configured" | "queued";
  logId?: string;
  error?: string;
};

export const emailTransport = config.email.smtpHost
  ? nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: config.email.smtpUser ? { user: config.email.smtpUser, pass: config.email.smtpPass } : undefined,
    })
  : null;

export const isEmailTransportConfigured = () => Boolean(emailTransport);

const MAX_ATTEMPTS = 3;
const DEDUP_WINDOW_MINUTES = 24 * 60;

type LogFields = {
  status: string;
  attempts?: number;
  error?: string | null;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  lastAttemptAt?: Date | null;
};

const insertEmailLog = async ({
  userId,
  template,
  recipient,
  subject,
  status,
  attempts,
  error,
  dedupKey,
  providerMessageId,
  sentAt,
  lastAttemptAt,
}: {
  userId?: string;
  template: string;
  recipient: string;
  subject: string;
  status: string;
  attempts: number;
  error?: string | null;
  dedupKey?: string | null;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  lastAttemptAt?: Date | null;
}) => {
  const id = randomUUID();
  await db.execute(
    `INSERT INTO email_logs
     (id, user_id, template, recipient, subject, status, attempts, error, dedup_key, provider_message_id, sent_at, last_attempt_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId ?? null,
      template,
      recipient,
      subject,
      status,
      attempts,
      error ?? null,
      dedupKey ?? null,
      providerMessageId ?? null,
      sentAt ?? null,
      lastAttemptAt ?? null,
    ],
  );
  return id;
};

const updateEmailLog = async (id: string, fields: LogFields) => {
  const updates: string[] = [];
  const values: (string | number | Date | null)[] = [];
  if (fields.status !== undefined) {
    updates.push("status = ?");
    values.push(fields.status);
  }
  if (fields.attempts !== undefined) {
    updates.push("attempts = ?");
    values.push(fields.attempts);
  }
  if (fields.error !== undefined) {
    updates.push("error = ?");
    values.push(fields.error ?? null);
  }
  if (fields.providerMessageId !== undefined) {
    updates.push("provider_message_id = ?");
    values.push(fields.providerMessageId ?? null);
  }
  if (fields.sentAt !== undefined) {
    updates.push("sent_at = ?");
    values.push(fields.sentAt ?? null);
  }
  if (fields.lastAttemptAt !== undefined) {
    updates.push("last_attempt_at = ?");
    values.push(fields.lastAttemptAt ?? null);
  }
  if (!updates.length) return;
  values.push(id);
  await db.execute(`UPDATE email_logs SET ${updates.join(", ")} WHERE id = ?`, values as string[]);
};

const findRecentSentEmail = async (recipient: string, template: string, dedupKey: string) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM email_logs
     WHERE recipient = ? AND template = ? AND status = 'sent' AND dedup_key = ?
       AND sent_at >= (NOW() - INTERVAL ${DEDUP_WINDOW_MINUTES} MINUTE)
     LIMIT 1`,
    [recipient, template, dedupKey],
  );
  return rows[0]?.id ? String(rows[0].id) : null;
};

export const sendEmail = async (input: SendEmailInput): Promise<SendEmailResult> => {
  const toAddress = input.recipient.trim().toLowerCase();
  if (!toAddress) return { status: "failed", error: "Empty recipient" };

  // Duplicate suppression: if a sent email with the same dedup key exists within the window, skip.
  if (input.dedupKey) {
    const existingLogId = await findRecentSentEmail(toAddress, input.template, input.dedupKey);
    if (existingLogId) {
      const logId = await insertEmailLog({
        userId: input.userId,
        template: input.template,
        recipient: toAddress,
        subject: input.subject,
        status: "suppressed",
        attempts: 0,
        dedupKey: input.dedupKey,
      });
      return { status: "suppressed", logId };
    }
  }

  if (!emailTransport) {
    const logId = await insertEmailLog({
      userId: input.userId,
      template: input.template,
      recipient: toAddress,
      subject: input.subject,
      status: "not_configured",
      attempts: 1,
      error: "SMTP transport is not configured",
      dedupKey: input.dedupKey,
    });
    return { status: "not_configured", logId };
  }

  const logId = await insertEmailLog({
    userId: input.userId,
    template: input.template,
    recipient: toAddress,
    subject: input.subject,
    status: "queued",
    attempts: 0,
    dedupKey: input.dedupKey,
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const info = await emailTransport.sendMail({
        from: config.email.fromAddress,
        to: toAddress,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      const providerMessageId = String(info?.messageId ?? "").replace(/[<>]/g, "") || null;
      await updateEmailLog(logId, {
        status: "sent",
        attempts: attempt,
        error: null,
        providerMessageId,
        sentAt: new Date(),
        lastAttemptAt: new Date(),
      });
      return { status: "sent", logId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email delivery error";
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      await updateEmailLog(logId, {
        status: lastAttempt ? "failed" : "queued",
        attempts: attempt,
        error: message.slice(0, 4000),
        lastAttemptAt: new Date(),
      });
      if (lastAttempt) return { status: "failed", logId, error: message.slice(0, 4000) };
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  return { status: "failed", logId, error: "Exhausted delivery attempts" };
};

export const retryFailedEmail = async (logId: string) => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM email_logs WHERE id = ? LIMIT 1", [logId]);
  const log = rows[0];
  if (!log) return { status: "not_found" };
  if (log.status !== "failed" && log.status !== "not_configured") {
    return { status: "not_retryable", currentStatus: log.status };
  }
  if (!emailTransport) {
    await updateEmailLog(logId, {
      status: "not_configured",
      attempts: Number(log.attempts ?? 0) + 1,
      error: "SMTP transport is not configured",
      lastAttemptAt: new Date(),
    });
    return { status: "not_configured" };
  }
  const originalSubject = String(log.subject ?? "PCMO email");
  const result = await sendEmail({
    userId: log.user_id ? String(log.user_id) : undefined,
    template: log.template as EmailTemplate,
    recipient: String(log.recipient),
    subject: originalSubject,
    text: `This is a retry of the PCMO email "${originalSubject}" that previously failed to deliver. If the issue continues, contact support.`,
    html: `<p style="font-family:Arial,Helvetica,sans-serif;color:#111;">This is a retry of the PCMO email <strong>${originalSubject}</strong> that previously failed to deliver.</p><p style="font-family:Arial,Helvetica,sans-serif;color:#111;">If the issue continues, contact support.</p>`,
  });
  return result;
};

