import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import type { ResultSetHeader, RowDataPacket, OkPacket } from "mysql2";
import { Server as SocketServer } from "socket.io";
import Stripe from "stripe";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { z } from "zod";
import nodemailer from "nodemailer";
import Twilio from "twilio";
import { requireAdmin, requireAuth, signToken } from "./auth.js";
import { config } from "./config.js";
import { db, pingDatabase } from "./db.js";
import { jsonFields, resources } from "./resources.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: { origin: config.clientOrigins } });
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;
const emailTransport = config.email.smtpHost ? nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: config.email.smtpSecure,
  auth: config.email.smtpUser ? { user: config.email.smtpUser, pass: config.email.smtpPass } : undefined,
}) : null;
const twilioClient = config.twilio.accountSid && config.twilio.authToken ? Twilio(config.twilio.accountSid, config.twilio.authToken) : null;

app.disable("x-powered-by");
if (config.isProduction) app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.clientOrigins, credentials: true }));
const uploadDirectory = path.resolve("public", "uploads", "courses");
mkdirSync(uploadDirectory, { recursive: true });
const libraryUploadDirectory = path.resolve("public", "uploads", "library");
mkdirSync(libraryUploadDirectory, { recursive: true });
const communityUploadDirectory = path.resolve("public", "uploads", "community");
mkdirSync(communityUploadDirectory, { recursive: true });
const profileUploadDirectory = path.resolve("public", "uploads", "profiles");
mkdirSync(profileUploadDirectory, { recursive: true });
const cvUploadDirectory = path.resolve("public", "uploads", "cv");
mkdirSync(cvUploadDirectory, { recursive: true });
const courseUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});
const libraryUpload = multer({
  storage: multer.diskStorage({
    destination: libraryUploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    callback(null, file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || allowed.includes(file.mimetype));
  },
});
const communityUpload = multer({
  storage: multer.diskStorage({
    destination: communityUploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    callback(null, allowed.includes(file.mimetype));
  },
});
const profileUpload = multer({
  storage: multer.diskStorage({
    destination: profileUploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    callback(null, allowed.includes(file.mimetype));
  },
});
const cvUpload = multer({
  storage: multer.diskStorage({
    destination: cvUploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    callback(null, allowed.includes(file.mimetype));
  },
});
app.use("/uploads", express.static(path.resolve("public", "uploads")));

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const parseJsonFields = (row: Record<string, unknown>) => {
  const result: Record<string, unknown> = { ...row };
  for (const field of jsonFields) {
    const value = result[field];
    if (typeof value === "string") {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
  }
  return result;
};

const booleanFromInput = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return value;
}, z.boolean());

const preferenceSchema = z.object({
  notification_preferences: z.record(z.string(), booleanFromInput).default({}),
  privacy_settings: z.record(z.string(), z.string()).default({}),
});

const libraryVisibilityClause = "status = 'published' AND (published_at IS NULL OR published_at <= NOW()) AND (expires_at IS NULL OR expires_at > NOW())";

const serializeValue = (field: string, value: unknown) =>
  jsonFields.has(field) && value !== null && value !== undefined ? JSON.stringify(value) : value;

const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

const isAdminRole = (role?: string) => role === "admin" || role === "super_admin";

const requiresBookPurchase = (row: Record<string, unknown>) =>
  Boolean(row.sale_enabled) && Number(row.price ?? 0) > 0;

const redactAttachmentUrls = (row: Record<string, unknown>, canDownload: boolean) => {
  const parsed = parseJsonFields(row);
  if (Array.isArray(parsed.attachments)) {
    parsed.attachments = parsed.attachments.map((file, index) => {
      if (!file || typeof file !== "object") return file;
      const { url: _url, ...safeFile } = file as Record<string, unknown>;
      return canDownload ? { ...safeFile, download_url: `/api/books/${String(parsed.id)}/download/${index}` } : safeFile;
    });
  }
  return parsed;
};

const userOwnsBook = async (userId: string, bookId: string) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM book_purchases WHERE user_id = ? AND book_id = ? AND status = 'paid' LIMIT 1",
    [userId, bookId],
  );
  return Boolean(rows[0]);
};

const safeLibraryFilePath = (url?: string) => {
  if (!url?.startsWith("/uploads/library/")) return null;
  const filename = path.basename(url);
  const absolute = path.resolve(libraryUploadDirectory, filename);
  return absolute.startsWith(libraryUploadDirectory) ? absolute : null;
};

const parseCvText = async (filePath: string, mimeType: string) => {
  const fileBuffer = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (mimeType === "application/pdf" || extension === ".pdf") {
    const parsed = await pdfParse(fileBuffer);
    return String(parsed.text ?? "").replace(/\r\n/g, "\n").trim();
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return String(result.value ?? "").replace(/\r\n/g, "\n").trim();
  }
  if (mimeType === "text/plain" || extension === ".txt") {
    return fileBuffer.toString("utf8").replace(/\r\n/g, "\n").trim();
  }
  throw new Error("Unsupported resume file type.");
};

const sectionKeywords: Record<string, string[]> = {
  summary: ["summary", "professional summary", "profile", "about me", "career summary", "career profile"],
  education: ["education", "academic background", "qualifications", "academic qualifications", "education and training"],
  experience: ["experience", "work experience", "employment history", "professional experience", "career history"],
  skills: ["skills", "technical skills", "core skills", "competencies", "areas of expertise"],
  certifications: ["certifications", "credentials", "licenses", "licences", "awards", "professional certifications"],
  projects: ["projects", "selected projects", "portfolio", "project experience"],
};

const normalizeHeading = (line: string) => line.trim().replace(/[:\-–—]+$/, "").toLowerCase();

const findSection = (line: string) => {
  const normalized = normalizeHeading(line);
  return Object.entries(sectionKeywords).find(([_key, patterns]) =>
    patterns.some((pattern) => normalized === pattern || normalized.startsWith(`${pattern}:`) || normalized === `my ${pattern}` || normalized.includes(` ${pattern}`)),
  )?.[0];
};

const extractCvSections = (text: string) => {
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const sections: Record<string, string> = {
    personal_information: "",
    summary: "",
    education: "",
    experience: "",
    skills: "",
    certifications: "",
    projects: "",
    other: "",
  };
  let currentSection = "personal_information";

  for (const line of lines) {
    const section = findSection(line);
    if (section) {
      currentSection = section;
      continue;
    }
    sections[currentSection] = `${sections[currentSection]}${sections[currentSection] ? "\n" : ""}${line}`;
  }

  const personalLines = sections.personal_information.split(/\n+/).filter(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/\+?\d[\d\s().-]{6,}\d/);
  const linkedin = text.match(/https?:\/\/([\w.-]+\.)?linkedin\.com\/[\w\-./?=&#%]+/i)?.[0];
  const website = text.match(/https?:\/\/[^\s]+/i)?.[0];
  const personalInformation: string[] = [];
  if (personalLines[0]) {
    personalInformation.push(personalLines[0]);
  }
  if (email) personalInformation.push(`Email: ${email}`);
  if (phone) personalInformation.push(`Phone: ${phone[0]}`);
  if (linkedin) personalInformation.push(`LinkedIn: ${linkedin}`);
  if (website && website !== linkedin) personalInformation.push(`Website: ${website}`);
  sections.personal_information = personalInformation.join("\n").trim();

  return sections;
};

const formatSection = (title: string, content: string) => {
  if (!content) return "";
  const lines = content.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return `## ${title}\n${lines.map((line) => `- ${line}`).join("\n")}`;
};

const buildStandardCv = (sections: Record<string, string>) => {
  const blocks: string[] = [];
  if (sections.personal_information) {
    blocks.push(`## Personal Information\n${sections.personal_information}`);
  }
  if (sections.summary) {
    blocks.push(`## Summary\n${sections.summary}`);
  }
  if (sections.education) {
    blocks.push(formatSection("Education", sections.education));
  }
  if (sections.experience) {
    blocks.push(formatSection("Experience", sections.experience));
  }
  if (sections.skills) {
    blocks.push(formatSection("Skills", sections.skills));
  }
  if (sections.certifications) {
    blocks.push(formatSection("Certifications", sections.certifications));
  }
  if (sections.projects) {
    blocks.push(formatSection("Projects", sections.projects));
  }
  if (!sections.summary && !sections.education && !sections.experience && !sections.skills && !sections.certifications && !sections.projects) {
    blocks.push("## Standardized CV\nThe uploaded CV was parsed successfully, but no specific sections were identified. Please review and refine the text below.");
  }
  return blocks.join("\n\n");
};

const getAssessmentAccess = async (userId: string, courseId: string) => {
  const [[totalRows], [completedRows]] = await Promise.all([
    db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) count FROM course_materials WHERE course_id = ? AND status = 'published'",
      [courseId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT cmp.material_id) count
       FROM course_module_progress cmp
       JOIN course_materials cm ON cm.id = cmp.material_id
       WHERE cmp.user_id = ? AND cmp.course_id = ? AND cm.status = 'published'`,
      [userId, courseId],
    ),
  ]);
  const totalMaterials = Number(totalRows[0]?.count ?? 0);
  const completedMaterials = Number(completedRows[0]?.count ?? 0);
  return {
    totalMaterials,
    completedMaterials,
    unlocked: totalMaterials > 0 && completedMaterials >= totalMaterials,
  };
};

const audit = async (userId: string | undefined, action: string, resource: string, resourceId?: string, details?: unknown) => {
  await db.execute(
    "INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)",
    [randomUUID(), userId ?? null, action, resource, resourceId ?? null, details ? JSON.stringify(details) : null],
  );
};

const trackMemberActivity = async (
  userId: string | undefined,
  activityType: string,
  resource: string,
  resourceId?: string,
  metadata?: unknown,
) => {
  await db.execute(
    `INSERT INTO member_activity_events
     (id, user_id, activity_type, resource, resource_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId ?? null, activityType, resource, resourceId ?? null, metadata ? JSON.stringify(metadata) : null],
  );
  if (userId) {
    const [actors] = await db.execute<RowDataPacket[]>(
      "SELECT u.role,u.email,COALESCE(p.display_name,u.email) display_name FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=? LIMIT 1",
      [userId],
    );
    if (actors[0]?.role === "student") {
      const [admins] = await db.execute<RowDataPacket[]>("SELECT id FROM users WHERE role IN ('admin','super_admin') AND status='active'");
      const readableAction = activityType.replaceAll("_", " ");
      const actorName = String(actors[0].display_name || actors[0].email || "A member");
      for (const admin of admins) {
        const notificationId = randomUUID();
        await db.execute(
          "INSERT INTO notifications (id,user_id,title,message,type,action_url) VALUES (?,?,?,?,?,?)",
          [notificationId, admin.id, "Student activity", `${actorName}: ${readableAction}`, "admin_activity", resource === "community-chat-rooms" ? "/admin/community-chat" : resource.startsWith("volunteer-") ? "/admin/manage/volunteer-applications" : "/admin"],
        );
        io.to(`user:${String(admin.id)}`).emit("notifications:changed", { action: "create", id: notificationId });
      }
    }
  }
};

const getNotificationPreferences = async (userId: string) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT notification_preferences FROM account_preferences WHERE user_id = ?",
    [userId],
  );
  const preferenceRow = rows[0];
  const notificationPreferences = preferenceRow ? parseJsonFields(preferenceRow).notification_preferences as Record<string, boolean> : {};
  return notificationPreferences || {};
};

const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type = "info",
  actionUrl?: string,
) => {
  const id = randomUUID();
  await db.execute(
    "INSERT INTO notifications (id, user_id, title, message, type, action_url) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId, title, message, type, actionUrl ?? null],
  );
  io.to(`user:${userId}`).emit("notifications:changed", { action: "create", id });
  return id;
};

 

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendEmailNotification = async (userId: string, title: string, message: string, actionUrl?: string) => {
  if (!emailTransport) {
    console.log("Email transport not configured. Skipping email notification.");
    return;
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.email, COALESCE(p.display_name, u.email) display_name
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );
  const recipient = rows[0];
  if (!recipient?.email) {
    console.log(`Email notification skipped because user ${userId} has no email address.`);
    return;
  }

  const subject = title?.trim() || "PCMO Notification";
  const bodyMessage = message?.trim() || "You have a new PCMO notification.";
  const url = actionUrl ? `${config.clientUrl}${actionUrl}` : undefined;
  const textBody = `${bodyMessage}${url ? `\n\nView details: ${url}` : ""}`;
  const htmlBody = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6;">
      <h2 style="margin:0 0 16px 0;font-size:20px;color:#0b3c78;">${escapeHtml(subject)}</h2>
      <p style="margin:0 0 16px 0;font-size:14px;">${escapeHtml(bodyMessage).replace(/\n/g, "<br />")}</p>
      ${url ? `<p style="margin:0 0 24px 0;"><a href="${escapeHtml(url)}" style="color:#1a73e8;text-decoration:none;">View details</a></p>` : ""}
      <p style="margin:0;font-size:12px;color:#666;">This email was sent by PCMO.</p>
    </div>
  `;
  await emailTransport.sendMail({
    from: config.email.fromAddress,
    to: recipient.email,
    subject,
    text: textBody,
    html: htmlBody,
  });
};

const sendWhatsappNotification = async (userId: string, title: string, message: string, actionUrl?: string) => {
  if (!twilioClient || !config.twilio.whatsappFrom) {
    console.log("WhatsApp client not configured. Skipping WhatsApp notification.");
    return;
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(p.phone, u.phone) AS phone, COALESCE(p.display_name, u.email) display_name
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );
  const recipient = rows[0];
  if (!recipient?.phone) {
    console.log(`WhatsApp notification skipped because user ${userId} has no phone number.`);
    return;
  }

  const toPhone = recipient.phone.startsWith("+") ? recipient.phone : `+${recipient.phone.replace(/\D/g, "")}`;
  const body = `${title}\n${message}${actionUrl ? `\n\n${config.clientUrl}${actionUrl}` : ""}`;
  await twilioClient.messages.create({
    from: `whatsapp:${config.twilio.whatsappFrom}`,
    to: `whatsapp:${toPhone}`,
    body,
  });
};

const notifyUser = async (
  userId: string,
  title: string,
  message: string,
  category = "info",
  actionUrl?: string,
  channels: string[] = ["in_app"],
) => {
  const prefs = await getNotificationPreferences(userId);
  const shouldSendInApp = prefs[category] ?? true;
  const shouldSendEmail = channels.includes("email") && (prefs.email ?? true);
  const shouldSendWhatsapp = channels.includes("whatsapp") && (prefs.whatsapp ?? true);

  if (shouldSendInApp) {
    await createNotification(userId, title, message, category, actionUrl);
  }
  if (shouldSendEmail) {
    await sendEmailNotification(userId, title, message, actionUrl);
  }
  if (shouldSendWhatsapp) {
    await sendWhatsappNotification(userId, title, message, actionUrl);
  }
};

const completeCourseEnrollment = async (userId: string, courseId: string) => {
  await db.execute(
    `UPDATE course_enrollments
     SET progress = 100, status = 'completed', last_viewed_at = COALESCE(last_viewed_at, CURRENT_TIMESTAMP)
     WHERE user_id = ? AND course_id = ?`,
    [userId, courseId],
  );
  io.emit("course-progress:changed", { userId, courseId, progress: 100, status: "completed" });
};

const issueCertificateForCourse = async (userId: string, courseId: string, metadata?: Record<string, unknown>) => {
  const [certificates] = await db.execute<RowDataPacket[]>(
    "SELECT id, recipient_name, designation FROM certifications WHERE user_id = ? AND course_id = ? AND status = 'active' LIMIT 1",
    [userId, courseId],
  );
  const [profiles] = await db.execute<RowDataPacket[]>(
    `SELECT u.email, p.display_name, p.headline, p.company
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [userId],
  );
  const profile = profiles[0];
  const recipientName = String(profile?.display_name || profile?.email || "PCMO Member");
  const designation = String(profile?.headline || profile?.company || "Certified Professional");

  if (certificates[0]?.id) {
    await completeCourseEnrollment(userId, courseId);
    if (!certificates[0].recipient_name || !certificates[0].designation) {
      await db.execute(
        `UPDATE certifications
         SET recipient_name = COALESCE(recipient_name, ?), designation = COALESCE(designation, ?)
         WHERE id = ?`,
        [recipientName, designation, certificates[0].id],
      );
    }
    return String(certificates[0].id);
  }

  const [courses] = await db.execute<RowDataPacket[]>(
    "SELECT title, expiry_date FROM courses WHERE id = ? LIMIT 1",
    [courseId],
  );
  const course = courses[0];
  const certificateId = randomUUID();
  await db.execute(
    `INSERT INTO certifications
     (id, user_id, course_id, title, recipient_name, designation, issuer, credential_id, issue_date, expiry_date, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PCMO', ?, CURDATE(), ?, 'active')`,
    [
      certificateId,
      userId,
      courseId,
      course?.title ? `${course.title} Certificate` : "Course Certificate",
      recipientName,
      designation,
      `PCMO-${Date.now().toString(36).toUpperCase()}-${certificateId.slice(0, 8).toUpperCase()}`,
      course?.expiry_date ?? null,
    ],
  );
  await completeCourseEnrollment(userId, courseId);
  await createNotification(
    userId,
    "Certificate issued",
    `Your certificate for ${course?.title ?? "this course"} is ready to view and download.`,
    "certificate",
    "/certifications",
  );
  await trackMemberActivity(userId, "certificate_issued", "certifications", certificateId, { courseId, ...metadata });
  io.to(`user:${userId}`).emit("certifications:changed", { certificateId, courseId });
  return certificateId;
};

const backfillPassedCertificates = async (userId?: string) => {
  const params = userId ? [userId] : [];
  const [attempts] = await db.execute<RowDataPacket[]>(
    `SELECT qa.user_id, qa.course_id, qa.id attemptId, qa.score
     FROM quiz_attempts qa
     LEFT JOIN certifications cert
       ON cert.user_id = qa.user_id AND cert.course_id = qa.course_id AND cert.status = 'active'
     WHERE qa.passed = TRUE AND cert.id IS NULL${userId ? " AND qa.user_id = ?" : ""}
     ORDER BY qa.created_at DESC`,
    params,
  );
  const seen = new Set<string>();
  for (const attempt of attempts) {
    const key = `${attempt.user_id}:${attempt.course_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await issueCertificateForCourse(String(attempt.user_id), String(attempt.course_id), {
      attemptId: attempt.attemptId,
      score: attempt.score,
      backfilled: true,
    });
  }
};

const syncCertificateRecipientDetails = async (userId?: string) => {
  const params = userId ? [userId] : [];
  const [certificates] = await db.execute<RowDataPacket[]>(
    `SELECT cert.id, u.email, p.display_name, p.headline, p.company
     FROM certifications cert
     JOIN users u ON u.id = cert.user_id
     LEFT JOIN profiles p ON p.user_id = cert.user_id
     WHERE (cert.recipient_name IS NULL OR cert.recipient_name = '' OR cert.designation IS NULL OR cert.designation = '')${userId ? " AND cert.user_id = ?" : ""}`,
    params,
  );
  for (const certificate of certificates) {
    await db.execute(
      `UPDATE certifications
       SET recipient_name = COALESCE(NULLIF(recipient_name, ''), ?),
           designation = COALESCE(NULLIF(designation, ''), ?)
       WHERE id = ?`,
      [
        String(certificate.display_name || certificate.email || "PCMO Member"),
        String(certificate.headline || certificate.company || "Certified Professional"),
        certificate.id,
      ],
    );
  }
};

const syncCertifiedCourseCompletions = async (userId?: string) => {
  const params = userId ? [userId] : [];
  const [certificates] = await db.execute<RowDataPacket[]>(
    `SELECT user_id, course_id FROM certifications
     WHERE status = 'active' AND course_id IS NOT NULL${userId ? " AND user_id = ?" : ""}`,
    params,
  );
  const seen = new Set<string>();
  for (const certificate of certificates) {
    const key = `${certificate.user_id}:${certificate.course_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await completeCourseEnrollment(String(certificate.user_id), String(certificate.course_id));
  }
};

const activateStripeMembership = async (session: Stripe.Checkout.Session) => {
  const membershipId = session.metadata?.membershipId;
  const subscriptionId = session.metadata?.subscriptionId;
  const userId = session.metadata?.userId;
  if (!subscriptionId || !userId) return;

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const stripePaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const planId = session.metadata?.planId;
  const planName = session.metadata?.planName ?? "PCMO Membership";
  let finalMembershipId = membershipId;
  let membershipUpdated = false;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (membershipId) {
      const [updateResult] = await connection.execute<OkPacket>(
        `UPDATE memberships
         SET status='active', stripe_customer_id=?, stripe_checkout_session_id=?, stripe_subscription_id=?, stripe_payment_intent_id=?
         WHERE id=? AND user_id=?`,
        [stripeCustomerId, session.id, stripeSubscriptionId, stripePaymentIntentId, membershipId, userId],
      );
      membershipUpdated = (updateResult as OkPacket).affectedRows > 0;
    }

    if (!membershipUpdated) {
      const [planRows] = planId
        ? await connection.execute<RowDataPacket[]>(
            "SELECT billing_period FROM membership_plans WHERE id = ? LIMIT 1",
            [planId],
          )
        : [[],];
      const planRow = planRows[0];
      let endsAt: Date | null = null;
      if (planRow?.billing_period === "yearly") {
        endsAt = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
      } else if (planRow?.billing_period === "monthly") {
        endsAt = new Date(new Date().setMonth(new Date().getMonth() + 1));
      }
      finalMembershipId = membershipId ?? randomUUID();
      await connection.execute(
        `INSERT INTO memberships (id, user_id, plan_name, status, starts_at, ends_at, stripe_customer_id, stripe_checkout_session_id, stripe_subscription_id, stripe_payment_intent_id)
         VALUES (?, ?, ?, 'active', CURDATE(), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status='active',
           stripe_customer_id=VALUES(stripe_customer_id),
           stripe_checkout_session_id=VALUES(stripe_checkout_session_id),
           stripe_subscription_id=VALUES(stripe_subscription_id),
           stripe_payment_intent_id=VALUES(stripe_payment_intent_id)`,
        [finalMembershipId, userId, planName, endsAt, stripeCustomerId, session.id, stripeSubscriptionId, stripePaymentIntentId],
      );
    }

    await connection.execute(
      `UPDATE subscriptions
       SET status='active', payment_method='stripe', stripe_customer_id=?, stripe_checkout_session_id=?, stripe_subscription_id=?, stripe_payment_intent_id=?
       WHERE id=? AND user_id=?`,
      [stripeCustomerId, session.id, stripeSubscriptionId, stripePaymentIntentId, subscriptionId, userId],
    );

    const amount = Number(session.amount_total ?? 0) / 100;
    if (amount > 0) {
      await connection.execute(
        `INSERT INTO invoices
         (id, user_id, subscription_id, invoice_number, description, amount, currency, status, invoice_date, stripe_checkout_session_id, stripe_payment_intent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', CURDATE(), ?, ?)
         ON DUPLICATE KEY UPDATE status='paid', stripe_checkout_session_id=VALUES(stripe_checkout_session_id), stripe_payment_intent_id=VALUES(stripe_payment_intent_id)`,
        [
          randomUUID(),
          userId,
          subscriptionId,
          `STRIPE-${session.id}`,
          `Paid membership checkout: ${planName}`,
          amount,
          String(session.currency ?? "usd").toUpperCase(),
          session.id,
          stripePaymentIntentId,
        ],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await audit(userId, "stripe_checkout_completed", "memberships", finalMembershipId, {
    sessionId: session.id,
    subscriptionId,
    stripeSubscriptionId,
    stripePaymentIntentId,
  });
  io.to(`user:${userId}`).emit("membership:changed", { membershipId: finalMembershipId, status: "active" });
  io.to(`user:${userId}`).emit("subscriptions:changed", { subscriptionId, status: "active" });
};

const activateStripeBookPurchase = async (session: Stripe.Checkout.Session) => {
  const purchaseId = session.metadata?.purchaseId;
  const bookId = session.metadata?.bookId;
  const userId = session.metadata?.userId;
  if (!purchaseId || !bookId || !userId) return;

  const stripePaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const amount = Number(session.amount_total ?? 0) / 100;
  const currency = String(session.currency ?? "usd").toUpperCase();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE book_purchases
       SET status='paid', amount=?, currency=?, stripe_checkout_session_id=?, stripe_payment_intent_id=?, purchased_at=COALESCE(purchased_at, NOW())
       WHERE id=? AND user_id=? AND book_id=?`,
      [amount, currency, session.id, stripePaymentIntentId, purchaseId, userId, bookId],
    );
    await connection.execute(
      `INSERT INTO invoices
       (id, user_id, invoice_number, description, amount, currency, status, invoice_date, stripe_checkout_session_id, stripe_payment_intent_id)
       VALUES (?, ?, ?, ?, ?, ?, 'paid', CURDATE(), ?, ?)
       ON DUPLICATE KEY UPDATE status='paid', stripe_checkout_session_id=VALUES(stripe_checkout_session_id), stripe_payment_intent_id=VALUES(stripe_payment_intent_id)`,
      [
        randomUUID(),
        userId,
        `BOOK-${session.id}`,
        `Book purchase: ${session.metadata?.bookTitle ?? "PCMO book"}`,
        amount,
        currency,
        session.id,
        stripePaymentIntentId,
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await audit(userId, "stripe_checkout_completed", "book-purchases", purchaseId, { sessionId: session.id, bookId });
  await trackMemberActivity(userId, "book_purchase_completed", "library_contents", bookId, { purchaseId, amount, currency });
  io.to(`user:${userId}`).emit("book-purchases:changed", { purchaseId, bookId, status: "paid" });
};

const activateStripeBookCartPurchase = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;
  let purchaseIds: string[] = [];
  try { purchaseIds = JSON.parse(session.metadata?.purchaseIds ?? "[]") as string[]; } catch { /* invalid Stripe metadata */ }
  if (!userId || !purchaseIds.length) return;
  const ids = purchaseIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length) return;
  const stripePaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const amount = Number(session.amount_total ?? 0) / 100;
  const currency = String(session.currency ?? "usd").toUpperCase();
  const placeholders = ids.map(() => "?").join(",");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE book_purchases SET status='paid', stripe_checkout_session_id=?, stripe_payment_intent_id=?, purchased_at=COALESCE(purchased_at, NOW()) WHERE user_id=? AND id IN (${placeholders})`,
      [session.id, stripePaymentIntentId, userId, ...ids],
    );
    await connection.execute("DELETE FROM book_cart_items WHERE user_id=? AND book_id IN (SELECT book_id FROM book_purchases WHERE user_id=? AND id IN (" + placeholders + "))", [userId, userId, ...ids]);
    await connection.execute(
      `INSERT INTO invoices (id, user_id, invoice_number, description, amount, currency, status, invoice_date, stripe_checkout_session_id, stripe_payment_intent_id)
       VALUES (?, ?, ?, ?, ?, ?, 'paid', CURDATE(), ?, ?)
       ON DUPLICATE KEY UPDATE status='paid', stripe_payment_intent_id=VALUES(stripe_payment_intent_id)`,
      [randomUUID(), userId, `BOOK-CART-${session.id}`, "Bookstore order", amount, currency, session.id, stripePaymentIntentId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await audit(userId, "stripe_checkout_completed", "book-purchases", undefined, { sessionId: session.id, purchaseIds: ids });
  io.to(`user:${userId}`).emit("book-purchases:changed", { purchaseIds: ids, status: "paid" });
};

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), asyncRoute(async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) return res.status(503).json({ error: "Stripe webhook is not configured" });
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).json({ error: "Missing Stripe signature" });
  const event = stripe.webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.checkoutType === "book") await activateStripeBookPurchase(session);
    else if (session.metadata?.checkoutType === "book-cart") await activateStripeBookCartPurchase(session);
    else await activateStripeMembership(session);
  }
  res.json({ received: true });
}));

app.use(express.json({ limit: "5mb" }));

app.get("/api/pages/:slug", asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM website_pages WHERE slug = ? AND status = 'published' LIMIT 1",
    [routeParam(req.params.slug)],
  );
  if (!rows[0]) return res.status(404).json({ error: "Page not found" });
  res.json(rows[0]);
}));

app.get("/api/public/pages", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT title, slug, menu_label, summary, hero_image, page_group, sort_order FROM website_pages WHERE status = 'published' ORDER BY page_group, sort_order, title",
  );
  res.json(rows);
}));

app.get("/api/public/site", asyncRoute(async (_req, res) => {
  const [[settingRows], [navigationRows], [blockRows], [faqRows], [testimonialRows]] = await Promise.all([
    db.execute<RowDataPacket[]>("SELECT setting_key,value FROM site_settings WHERE status='published'"),
    db.execute<RowDataPacket[]>("SELECT * FROM navigation_items WHERE status='published' ORDER BY location,sort_order,id"),
    db.execute<RowDataPacket[]>("SELECT * FROM content_blocks WHERE status='published' ORDER BY scope,sort_order,id"),
    db.execute<RowDataPacket[]>("SELECT * FROM faqs WHERE status='published' ORDER BY sort_order,id"),
    db.execute<RowDataPacket[]>("SELECT * FROM testimonials WHERE status='published' ORDER BY sort_order,id"),
  ]);
  const settings = Object.fromEntries(settingRows.map((row) => [row.setting_key, parseJsonFields(row).value]));
  res.json({ settings, navigation: navigationRows.map(parseJsonFields), blocks: blockRows.map(parseJsonFields), faqs: faqRows.map(parseJsonFields), testimonials: testimonialRows.map(parseJsonFields) });
}));

app.get("/api/public/homepage", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT section_key, title, eyebrow, body, image_url, action_label, action_url, items, sort_order FROM homepage_sections WHERE status = 'published' ORDER BY sort_order",
  );
  res.json(rows);
}));

app.get("/api/public/membership-plans", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id, slug, name, description, price, currency, billing_period, benefits, featured_image, page_eyebrow, page_tagline, page_audience, page_content, page_sections FROM membership_plans WHERE status = 'published' ORDER BY price, name",
  );
  res.json(rows);
}));

app.get("/api/public/certificates/validate/:credentialId", asyncRoute(async (req, res) => {
  const credentialId = routeParam(req.params.credentialId).trim();
  if (credentialId.length < 4 || credentialId.length > 120) {
    return res.status(400).json({ error: "Enter a valid credential ID" });
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT credential_id, title, recipient_name, designation, issuer, issue_date, expiry_date, status
     FROM certifications WHERE credential_id = ? LIMIT 1`,
    [credentialId],
  );
  const certificate = rows[0];
  if (!certificate) return res.status(404).json({ error: "Certificate not found" });
  const expired = certificate.expiry_date && new Date(String(certificate.expiry_date)) < new Date(new Date().toDateString());
  res.json({
    ...certificate,
    verification_status: certificate.status === "active" && !expired ? "valid" : expired ? "expired" : certificate.status,
    verified_at: new Date().toISOString(),
  });
}));

const memberPublications = {
  "project-management-field-guide": { title: "PCMO Project Management Field Guide", file: "project-management-field-guide.pdf" },
  "contract-management-practice-handbook": { title: "PCMO Contract Management Practice Handbook", file: "contract-management-practice-handbook.pdf" },
  "integrated-project-contract-playbook": { title: "PCMO Integrated Project and Contract Playbook", file: "integrated-project-contract-playbook.pdf" },
} as const;

app.get("/api/public/publications", (_req, res) => res.json(Object.entries(memberPublications).map(([slug, publication]) => ({ slug, title: publication.title, pages: 100, access: "members" }))));

app.get("/api/member-publications/:slug/download", requireAuth, asyncRoute(async (req, res) => {
  const slug = routeParam(req.params.slug) as keyof typeof memberPublications;
  const publication = memberPublications[slug];
  if (!publication) return res.status(404).json({ error: "Publication not found" });
  if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
    const [access] = await db.execute<RowDataPacket[]>(
      `SELECT
        EXISTS(SELECT 1 FROM memberships WHERE user_id=? AND status='active' AND (ends_at IS NULL OR ends_at >= CURDATE())) AS active_membership,
        EXISTS(SELECT 1 FROM subscriptions WHERE user_id=? AND status='active' AND price > 0) AS active_subscription`,
      [req.user!.id, req.user!.id],
    );
    if (!access[0]?.active_membership && !access[0]?.active_subscription) {
      return res.status(403).json({ error: "An active membership subscription is required to download PCMO publications" });
    }
  }
  res.download(path.resolve("output", "pdf", publication.file), publication.file);
}));

const memberSegmentSql = `
  CASE WHEN EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = u.id AND s.status = 'active' AND s.price > 0
  ) THEN 'Paid Members' ELSE 'Free Members' END
`;

const getAdminMemberSegments = async () => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT segment,
      COUNT(*) members,
      SUM(active_this_month) activeThisMonth,
      SUM(course_enrollments) courseEnrollments,
      ROUND(SUM(revenue), 2) revenue
     FROM (
       SELECT u.id, ${memberSegmentSql} segment,
        CASE WHEN u.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END active_this_month,
        (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.user_id = u.id) course_enrollments,
        (SELECT COALESCE(SUM(i.amount), 0) FROM invoices i WHERE i.user_id = u.id AND i.status = 'paid') revenue
       FROM users u WHERE u.role = 'student'
     ) member_rollup
     GROUP BY segment
     ORDER BY segment`,
  );
  const bySegment = new Map(rows.map((row) => [row.segment, row]));
  return ["Free Members", "Paid Members"].map((segment) => ({
    segment,
    members: Number(bySegment.get(segment)?.members ?? 0),
    activeThisMonth: Number(bySegment.get(segment)?.activeThisMonth ?? 0),
    courseEnrollments: Number(bySegment.get(segment)?.courseEnrollments ?? 0),
    revenue: Number(bySegment.get(segment)?.revenue ?? 0),
  }));
};

const getAdminReportRows = async () => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT ${memberSegmentSql} segment,
      COUNT(DISTINCT u.id) registeredMembers,
      SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) activeMembers,
      SUM((SELECT COUNT(*) FROM course_enrollments ce WHERE ce.user_id = u.id)) courseEnrollments,
      SUM((SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.user_id = u.id)) quizAttempts,
      ROUND(COALESCE(AVG((SELECT AVG(ce.progress) FROM course_enrollments ce WHERE ce.user_id = u.id)), 0), 2) averageCourseProgress,
      ROUND(SUM((SELECT COALESCE(SUM(i.amount), 0) FROM invoices i WHERE i.user_id = u.id AND i.status = 'paid')), 2) revenue,
      SUM((SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active')) activeSubscriptions
     FROM users u
     WHERE u.role = 'student'
     GROUP BY segment`,
  );
  const values = new Map(rows.map((row) => [row.segment, row]));
  const free = (values.get("Free Members") ?? {}) as RowDataPacket;
  const paid = (values.get("Paid Members") ?? {}) as RowDataPacket;
  const reportRow = (section: string, metric: string, key: string, source: string, format: "number" | "percent" | "currency" = "number") => {
    const freeValue = Number(free[key] ?? 0);
    const paidValue = Number(paid[key] ?? 0);
    const total = key === "averageCourseProgress"
      ? ((freeValue + paidValue) / ([free, paid].filter((row) => row[key] !== undefined).length || 1))
      : freeValue + paidValue;
    const display = (value: number) => format === "currency"
      ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : format === "percent" ? `${value.toFixed(1)}%` : value.toLocaleString();
    return {
      section,
      metric,
      freeMembers: display(freeValue),
      paidMembers: display(paidValue),
      total: display(total),
      databaseSource: source,
    };
  };
  return [
    reportRow("Marketing", "Registered member audience", "registeredMembers", "users"),
    reportRow("Marketing", "Active member audience", "activeMembers", "users"),
    reportRow("Admin", "Course enrollments", "courseEnrollments", "course_enrollments"),
    reportRow("Admin", "Active member accounts", "activeMembers", "users"),
    reportRow("Revenue", "Paid invoice revenue", "revenue", "invoices", "currency"),
    reportRow("Revenue", "Active subscriptions", "activeSubscriptions", "subscriptions"),
    reportRow("Analytics", "Average course progress", "averageCourseProgress", "course_enrollments", "percent"),
    reportRow("Analytics", "Quiz attempts", "quizAttempts", "quiz_attempts"),
  ];
};

const getAdminActivityAccess = async (section?: string) => {
  const params: string[] = [];
  const where = section ? "WHERE section = ? AND active = TRUE" : "WHERE active = TRUE";
  if (section) params.push(section);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, activity, section, owner_role ownerRole, access_level accessLevel,
      database_table databaseTable, updated_at updatedAt
     FROM admin_activity_access ${where}
     ORDER BY section, activity`,
    params,
  );
  return rows;
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(255),
});

app.get("/api/health", asyncRoute(async (_req, res) => {
  await pingDatabase();
  res.json({ status: "ok", service: "pcmo-mysql-api", database: "connected", timestamp: new Date().toISOString() });
}));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  if (existing[0]) {
    return res.status(409).json({
      error: "This email is already registered. Please sign in instead.",
      code: "EMAIL_EXISTS",
    });
  }
  const id = randomUUID();
  const profileId = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'student')",
      [id, email, passwordHash],
    );
    await connection.execute(
      "INSERT INTO profiles (id, user_id, display_name, member_number) VALUES (?, ?, ?, ?)",
      [profileId, id, input.displayName, `PCMO-${Date.now().toString().slice(-8)}`],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  const user = { id, email, role: "student" as const };
  res.status(201).json({ token: signToken(user), user });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const email = input.email.trim().toLowerCase();
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const record = rows[0];
  if (!record || record.status !== "active" || !(await bcrypt.compare(input.password, record.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const user = { id: record.id, email: record.email, role: record.role };
  res.json({ token: signToken(user), user });
}));

app.post("/api/auth/reset-password", asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id, role, status FROM users WHERE email = ? LIMIT 1",
    [input.email.toLowerCase()],
  );
  const record = rows[0];
  if (!record || record.role !== "student" || record.status !== "active") {
    return res.status(404).json({ error: "Active student account not found" });
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, record.id]);
  res.json({ success: true });
}));

app.get("/api/auth/me", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.email, u.role, u.status, u.created_at,
      p.display_name, p.headline, p.bio, p.company, p.phone, p.location,
      p.avatar_url, p.cover_url, p.member_number,p.specialties,p.open_to,p.links,p.resume_text
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?`,
    [req.user!.id],
  );
  res.json(rows[0] ?? null);
}));

app.put("/api/auth/password", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }).parse(req.body);
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
    [req.user!.id],
  );
  const record = rows[0];
  if (!record || !(await bcrypt.compare(input.currentPassword, record.password_hash))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, req.user!.id]);
  res.json({ success: true });
}));

app.get("/api/student/dashboard", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.id;
  await syncCertifiedCourseCompletions(userId);
  const [[profileRows], [statsRows], [membershipRows], [courseRows], [certificateRows]] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
       p.display_name, p.headline, p.bio, p.company, p.phone, p.location,
       p.avatar_url, p.cover_url, p.member_number
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?`,
      [userId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT
       (SELECT COUNT(*) FROM course_enrollments WHERE user_id = ?) courses,
       (SELECT COUNT(*) FROM certifications WHERE user_id = ?) certificates,
       (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ?) assignments,
       (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL) notifications`,
      [userId, userId, userId, userId],
    ),
    db.execute<RowDataPacket[]>(
      "SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT c.*, ce.progress, ce.status enrollment_status, ce.enrolled_at, ce.last_viewed_at
       FROM course_enrollments ce JOIN courses c ON c.id = ce.course_id
       WHERE ce.user_id = ? ORDER BY ce.enrolled_at DESC`,
      [userId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT id, course_id, title, recipient_name, designation, issuer, credential_id, issue_date, expiry_date, status
       FROM certifications
       WHERE user_id = ? AND status = 'active'
       ORDER BY COALESCE(issue_date, created_at) DESC
       LIMIT 3`,
      [userId],
    ),
  ]);
  res.json({
    profile: profileRows[0] ?? null,
    stats: statsRows[0] ?? { courses: 0, certificates: 0, assignments: 0, notifications: 0 },
    membership: membershipRows[0] ?? null,
    courses: courseRows.map(parseJsonFields),
    certificates: certificateRows,
  });
}));

app.put("/api/profile", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({
    display_name: z.string().min(2).max(255),
    headline: z.string().max(255).nullable().optional(),
    bio: z.string().max(5000).nullable().optional(),
    company: z.string().max(255).nullable().optional(),
    phone: z.string().max(80).nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    avatar_url: z.string().max(4000).nullable().optional(),
    cover_url: z.string().max(4000).nullable().optional(),
    specialties: z.array(z.string().max(100)).max(30).optional(),
    open_to: z.array(z.string().max(150)).max(20).optional(),
    links: z.record(z.string(), z.string().max(1000)).optional(),
    resume_text: z.string().max(20000).nullable().optional(),
    resume_file_url: z.string().max(4000).nullable().optional(),
  }).parse(req.body);
  const fields = Object.keys(input);
  const values = Object.entries(input).map(([field,value]) => ["specialties","open_to","links"].includes(field) ? JSON.stringify(value) : value);
  await db.execute(
    `UPDATE profiles SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE user_id = ?`,
    [...values, req.user!.id],
  );
  await audit(req.user!.id, "update", "profile", req.user!.id, input);
  io.to(`user:${req.user!.id}`).emit("profile:updated", input);
  res.json({ success: true });
}));

app.post("/api/profile/avatar", requireAuth, profileUpload.single("avatar"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a JPG, PNG, WebP, or GIF image." });
  const avatarUrl = `/uploads/profiles/${req.file.filename}`;
  await db.execute("UPDATE profiles SET avatar_url = ? WHERE user_id = ?", [avatarUrl, req.user!.id]);
  await audit(req.user!.id, "upload", "profile-avatar", req.user!.id, { avatar_url: avatarUrl });
  io.to(`user:${req.user!.id}`).emit("profile:updated", { avatar_url: avatarUrl });
  res.json({ avatar_url: avatarUrl });
}));

app.post("/api/profile/cv/standardize", requireAuth, cvUpload.single("file"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Upload a PDF, DOCX, or TXT resume file." });
  const originalText = await parseCvText(req.file.path, req.file.mimetype);
  const sections = extractCvSections(originalText);
  const standardizedText = buildStandardCv(sections);
  res.json({
    standardized_text: standardizedText,
    sections,
    original_text: originalText,
    original_file_name: req.file.originalname,
    original_file_url: `/uploads/cv/${req.file.filename}`,
  });
}));

app.get("/api/community/profile", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.id;
  const [[profileRows],[projectRows],[badgeRows],[recommendationRows],[connectionRows],[inviteRows],[postRows],[volunteerRows]] = await Promise.all([
    db.execute<RowDataPacket[]>(`SELECT u.id,u.email,u.created_at,p.* FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=? LIMIT 1`,[userId]),
    db.execute<RowDataPacket[]>("SELECT * FROM member_projects WHERE user_id=? ORDER BY started_on DESC,created_at DESC",[userId]),
    db.execute<RowDataPacket[]>("SELECT * FROM member_badges WHERE user_id=? AND status='active' ORDER BY issued_at DESC,created_at DESC",[userId]),
    db.execute<RowDataPacket[]>(`SELECT mr.*,COALESCE(p.display_name,u.email) author_name,p.headline author_headline,p.avatar_url author_avatar_url FROM member_recommendations mr JOIN users u ON u.id=mr.author_id LEFT JOIN profiles p ON p.user_id=u.id WHERE mr.recipient_id=? AND mr.status='published' ORDER BY mr.created_at DESC`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT mc.*,CASE WHEN mc.requester_id=? THEN mc.recipient_id ELSE mc.requester_id END member_id,COALESCE(p.display_name,u.email) display_name,p.headline,p.company,p.location,p.avatar_url FROM member_connections mc JOIN users u ON u.id=CASE WHEN mc.requester_id=? THEN mc.recipient_id ELSE mc.requester_id END LEFT JOIN profiles p ON p.user_id=u.id WHERE (mc.requester_id=? OR mc.recipient_id=?) AND mc.status='accepted' ORDER BY mc.updated_at DESC`,[userId,userId,userId,userId]),
    db.execute<RowDataPacket[]>(`SELECT mc.*,COALESCE(p.display_name,u.email) display_name,p.headline,p.company,p.location,p.avatar_url FROM member_connections mc JOIN users u ON u.id=mc.requester_id LEFT JOIN profiles p ON p.user_id=u.id WHERE mc.recipient_id=? AND mc.status='pending' ORDER BY mc.created_at DESC`,[userId]),
    db.execute<RowDataPacket[]>("SELECT * FROM community_posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100",[userId]),
    db.execute<RowDataPacket[]>(`SELECT va.*,vo.title opportunity_title,vo.category FROM volunteer_applications va JOIN volunteer_opportunities vo ON vo.id=va.opportunity_id WHERE va.user_id=? ORDER BY va.updated_at DESC`,[userId]),
  ]);
  res.json({profile:parseJsonFields(profileRows[0]??{}),projects:projectRows.map(parseJsonFields),badges:badgeRows,recommendations:recommendationRows,connections:connectionRows,invites:inviteRows,contributions:postRows,volunteering:volunteerRows});
}));

app.get("/api/community/people", requireAuth, asyncRoute(async (req,res)=>{
  const search=String(req.query.search??"").trim();
  const params:any[]=[req.user!.id];
  let clause="";
  if(search){clause=" AND (p.display_name LIKE ? OR p.headline LIKE ? OR p.company LIKE ? OR p.location LIKE ?)";params.push(...Array(4).fill(`%${search}%`));}
  const [rows]=await db.execute<RowDataPacket[]>(`SELECT u.id,COALESCE(p.display_name,u.email) display_name,p.headline,p.company,p.location,p.avatar_url FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.role='student' AND u.status='active' AND u.id<>? ${clause} ORDER BY p.display_name LIMIT 50`,params);
  res.json(rows);
}));

app.post("/api/community/connections/:userId", requireAuth, asyncRoute(async (req,res)=>{
  const recipientId = routeParam(req.params.userId);
  if (recipientId === req.user!.id) return res.status(400).json({ error: "You cannot connect with yourself" });

  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id,status FROM member_connections WHERE requester_id = ? AND recipient_id = ? LIMIT 1",
    [req.user!.id, recipientId],
  );
  if (existing[0]) {
    if (existing[0].status === "pending") {
      return res.status(409).json({ error: "Connection request already pending" });
    }
    if (existing[0].status === "accepted") {
      return res.status(409).json({ error: "You are already connected" });
    }
    await db.execute(
      "UPDATE member_connections SET status='pending', message=?, responded_at=NULL, updated_at=NOW() WHERE id=?",
      [String(req.body.message ?? "").slice(0, 500) || null, existing[0].id],
    );
    await createNotification(recipientId, "Connection request updated", "A PCMO member has sent you another connection request.", "community", "/community-profile");
    return res.status(200).json({ success: true });
  }

  const [reverse] = await db.execute<RowDataPacket[]>(
    "SELECT id,status FROM member_connections WHERE requester_id = ? AND recipient_id = ? LIMIT 1",
    [recipientId, req.user!.id],
  );
  if (reverse[0]) {
    if (reverse[0].status === "pending") {
      return res.status(409).json({ error: "This member has already invited you. Check your invitations." });
    }
    if (reverse[0].status === "accepted") {
      return res.status(409).json({ error: "You are already connected" });
    }
  }

  const id = randomUUID();
  await db.execute(
    `INSERT INTO member_connections (id,requester_id,recipient_id,status,message)
     VALUES (?, ?, ?, 'pending', ?)`,
    [id, req.user!.id, recipientId, String(req.body.message ?? "").slice(0, 500) || null],
  );
  await createNotification(recipientId, "New connection invitation", "A PCMO member would like to connect with you.", "community", "/community-profile");
  res.status(201).json({ success: true });
}));

app.put("/api/community/connections/:id", requireAuth, asyncRoute(async (req,res)=>{
  const status = z.enum(["accepted","declined"]).parse(req.body.status);
  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE member_connections SET status=?,responded_at=NOW() WHERE id=? AND recipient_id=? AND status='pending'",
    [status, routeParam(req.params.id), req.user!.id],
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Invitation not found" });
  res.json({ success: true });
}));

app.get("/api/preferences", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM account_preferences WHERE user_id = ?", [req.user!.id]);
  res.json(preferenceSchema.parse(rows[0] ? parseJsonFields(rows[0]) : {}));
}));

app.put("/api/preferences", requireAuth, asyncRoute(async (req, res) => {
  const input = preferenceSchema.parse(req.body);
  await db.execute(
    `INSERT INTO account_preferences (user_id, notification_preferences, privacy_settings)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE
     notification_preferences = VALUES(notification_preferences),
     privacy_settings = VALUES(privacy_settings)`,
    [req.user!.id, JSON.stringify(input.notification_preferences), JSON.stringify(input.privacy_settings)],
  );
  res.json({ success: true });
}));

app.get("/api/account/overview", requireAuth, asyncRoute(async (req,res)=>{
  const userId=req.user!.id;
  const [[profileRows],[subscriptionRows],[invoiceRows],[purchaseRows],[membershipRows],[activityRows]] = await Promise.all([
    db.execute<RowDataPacket[]>(`SELECT u.id,u.email,u.role,u.status,u.created_at,p.display_name,p.headline,p.bio,p.company,p.phone,p.location,p.avatar_url,p.member_number FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=? LIMIT 1`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT id,plan_name,price,currency,status,starts_at,ends_at,next_billing,auto_renew,payment_method FROM subscriptions WHERE user_id=? ORDER BY created_at DESC`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT id,invoice_number,description,amount,currency,status,invoice_date,due_date FROM invoices WHERE user_id=? ORDER BY invoice_date DESC,created_at DESC`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT bp.id,bp.status,bp.amount,bp.currency,bp.purchased_at,lc.title FROM book_purchases bp JOIN library_contents lc ON lc.id=bp.book_id WHERE bp.user_id=? ORDER BY bp.created_at DESC`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT id,plan_name,status,starts_at,ends_at FROM memberships WHERE user_id=? ORDER BY created_at DESC LIMIT 1`,[userId]),
    db.execute<RowDataPacket[]>(`SELECT activity_type,resource,created_at FROM member_activity_events WHERE user_id=? ORDER BY created_at DESC LIMIT 10`,[userId]),
  ]);
  res.json({profile:profileRows[0],subscriptions:subscriptionRows,invoices:invoiceRows,purchases:purchaseRows,membership:membershipRows[0]??null,recentActivity:activityRows});
}));

app.put("/api/account/email", requireAuth, asyncRoute(async (req,res)=>{
  const input=z.object({email:z.string().email(),currentPassword:z.string().min(1)}).parse(req.body);
  const [rows]=await db.execute<RowDataPacket[]>("SELECT password_hash FROM users WHERE id=? LIMIT 1",[req.user!.id]);
  if(!rows[0]||!(await bcrypt.compare(input.currentPassword,String(rows[0].password_hash))))return res.status(401).json({error:"Current password is incorrect"});
  try{await db.execute("UPDATE users SET email=? WHERE id=?",[input.email.toLowerCase(),req.user!.id]);}catch(error:any){if(error?.code==="ER_DUP_ENTRY")return res.status(409).json({error:"That email address is already in use"});throw error;}
  await audit(req.user!.id,"update_email","account",req.user!.id);
  res.json({success:true,email:input.email.toLowerCase()});
}));

app.post("/api/membership/select", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ planId: z.string().uuid() }).parse(req.body);
  const [plans] = await db.execute<RowDataPacket[]>(
    "SELECT id, name, price, currency, billing_period, status FROM membership_plans WHERE id = ? AND status = 'published' LIMIT 1",
    [input.planId],
  );
  const plan = plans[0];
  if (!plan) return res.status(404).json({ error: "Membership plan not found" });

  const status = Number(plan.price ?? 0) === 0 ? "active" : "pending";
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM memberships WHERE user_id = ? AND plan_name = ? AND status IN ('active', 'pending') LIMIT 1",
    [req.user!.id, plan.name],
  );
  if (existing[0]) return res.json({ membershipId: existing[0].id, status: existing[0].status, existing: true });

  const membershipId = randomUUID();
  const endsAt = plan.billing_period === "yearly"
    ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    : null;
  await db.execute(
    "INSERT INTO memberships (id, user_id, plan_name, status, starts_at, ends_at) VALUES (?, ?, ?, ?, CURDATE(), ?)",
    [membershipId, req.user!.id, plan.name, status, endsAt],
  );
  if (Number(plan.price ?? 0) > 0) {
    await db.execute(
      `INSERT INTO subscriptions
       (id, user_id, plan_name, price, currency, status, starts_at, next_billing, auto_renew)
       VALUES (?, ?, ?, ?, ?, 'pending', CURDATE(), ?, TRUE)`,
      [randomUUID(), req.user!.id, plan.name, plan.price, plan.currency, endsAt],
    );
  }
  await trackMemberActivity(req.user!.id, "membership_selected", "membership_plans", plan.id, { planName: plan.name, status });
  io.to(`user:${req.user!.id}`).emit("membership:changed", { planId: plan.id, status });
  res.status(201).json({ membershipId, status, existing: false });
}));

app.post("/api/membership/checkout", requireAuth, asyncRoute(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to the API environment." });
  const input = z.object({ planId: z.string().uuid() }).parse(req.body);
  const [plans] = await db.execute<RowDataPacket[]>(
    "SELECT id, name, price, currency, billing_period, status FROM membership_plans WHERE id = ? AND status = 'published' LIMIT 1",
    [input.planId],
  );
  const plan = plans[0];
  if (!plan) return res.status(404).json({ error: "Membership plan not found" });
  const price = Number(plan.price ?? 0);
  if (price <= 0) return res.status(400).json({ error: "Free plans do not require checkout" });

  const [users] = await db.execute<RowDataPacket[]>("SELECT email FROM users WHERE id = ? LIMIT 1", [req.user!.id]);
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM memberships WHERE user_id = ? AND plan_name = ? AND status IN ('active', 'pending') LIMIT 1",
    [req.user!.id, plan.name],
  );
  if (existing[0]?.status === "active") {
    return res.json({ status: "active", existing: true });
  }

  const membershipId = existing[0]?.id;
  const subscriptionId = randomUUID();
  const endsAt = plan.billing_period === "yearly"
    ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    : plan.billing_period === "monthly" ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : null;

  const isOneTime = plan.billing_period === "one-time";
  const interval = plan.billing_period === "monthly" ? "month" : "year";
  const session = await stripe.checkout.sessions.create({
    mode: isOneTime ? "payment" : "subscription",
    customer_email: users[0]?.email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: String(plan.currency ?? "USD").toLowerCase(),
        product_data: { name: plan.name },
        unit_amount: Math.round(price * 100),
        ...(isOneTime ? {} : { recurring: { interval } }),
      },
    }],
    success_url: `${config.clientUrl}/membership?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/membership?payment=cancelled`,
    metadata: {
      userId: req.user!.id,
      planId: plan.id,
      planName: plan.name,
      membershipId,
      subscriptionId,
    },
  });

  if (membershipId) {
    await db.execute(
      "UPDATE memberships SET stripe_checkout_session_id=? WHERE id=? AND user_id=?",
      [session.id, membershipId, req.user!.id],
    );
  }

  await db.execute(
    `INSERT INTO subscriptions
     (id, user_id, plan_name, price, currency, status, starts_at, next_billing, auto_renew, payment_method, stripe_checkout_session_id)
     VALUES (?, ?, ?, ?, ?, 'pending', CURDATE(), ?, ?, 'stripe', ?)`,
    [subscriptionId, req.user!.id, plan.name, price, plan.currency, endsAt, plan.billing_period !== "one-time", session.id],
  );
  await trackMemberActivity(req.user!.id, "membership_checkout_started", "membership_plans", plan.id, { planName: plan.name, sessionId: session.id });
  const response: Record<string, unknown> = { checkoutUrl: session.url, sessionId: session.id, subscriptionId, status: "pending" };
  if (membershipId) response.membershipId = membershipId;
  res.status(201).json(response);
}));

app.post("/api/courses/:id/enroll", requireAuth, asyncRoute(async (req, res) => {
  const id = randomUUID();
  await db.execute(
    `INSERT INTO course_enrollments (id, user_id, course_id)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = 'active'`,
    [id, req.user!.id, routeParam(req.params.id)],
  );
  await audit(req.user!.id, "enroll", "courses", routeParam(req.params.id));
  await trackMemberActivity(req.user!.id, "course_enrollment", "courses", routeParam(req.params.id));
  io.to(`user:${req.user!.id}`).emit("enrollment:changed", { courseId: routeParam(req.params.id) });
  res.status(201).json({ success: true });
}));

app.delete("/api/courses/:id/enroll", requireAuth, asyncRoute(async (req, res) => {
  await db.execute("DELETE FROM course_enrollments WHERE user_id = ? AND course_id = ?", [req.user!.id, routeParam(req.params.id)]);
  await trackMemberActivity(req.user!.id, "course_unenrollment", "courses", routeParam(req.params.id));
  io.to(`user:${req.user!.id}`).emit("enrollment:changed", { courseId: routeParam(req.params.id) });
  res.status(204).end();
}));

app.get("/api/courses", requireAuth, asyncRoute(async (req, res) => {
  await syncCertifiedCourseCompletions(req.user!.id);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*, ce.progress, ce.status enrollment_status, ce.enrolled_at, ce.last_viewed_at
     FROM courses c
     LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.user_id = ?
     WHERE c.status = 'published'
     ORDER BY c.updated_at DESC`,
    [req.user!.id],
  );
  res.json(rows.map(parseJsonFields));
}));

app.get("/api/courses/:id", requireAuth, asyncRoute(async (req, res) => {
  const courseId = routeParam(req.params.id);
  const admin = ["admin", "super_admin"].includes(req.user!.role);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*, ce.progress, ce.status enrollment_status, ce.enrolled_at, ce.last_viewed_at,
      (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.course_id = c.id AND qq.active = TRUE) quiz_question_count,
      (SELECT COUNT(*) FROM course_materials cm WHERE cm.course_id = c.id AND cm.status = 'published') module_count,
      (SELECT COUNT(*) FROM course_module_progress cmp WHERE cmp.course_id = c.id AND cmp.user_id = ?) completed_module_count
     FROM courses c
     LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.user_id = ?
     WHERE c.id = ?
     LIMIT 1`,
    [req.user!.id, req.user!.id, courseId],
  );
  const course = rows[0];
  if (!course) return res.status(404).json({ error: "Course not found" });
  if (!admin && course.status !== "published") return res.status(404).json({ error: "Course not found" });
  if (!admin && !["active", "completed"].includes(course.enrollment_status)) {
    return res.status(403).json({ error: "Enroll in this course before viewing its content" });
  }
  res.json(parseJsonFields(course));
}));

app.put("/api/courses/:courseId/modules/:materialId/progress", requireAuth, asyncRoute(async (req, res) => {
  const courseId = routeParam(req.params.courseId);
  const materialId = routeParam(req.params.materialId);
  const input = z.object({ completed: z.boolean() }).parse(req.body);
  const [enrollments] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ? AND status IN ('active', 'completed') LIMIT 1",
    [req.user!.id, courseId],
  );
  if (!enrollments[0]) return res.status(403).json({ error: "Enroll in this course before tracking module progress" });
  const [materials] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM course_materials WHERE id = ? AND course_id = ? AND status = 'published' LIMIT 1",
    [materialId, courseId],
  );
  if (!materials[0]) return res.status(404).json({ error: "Course module not found" });

  if (input.completed) {
    await db.execute(
      `INSERT INTO course_module_progress (id, user_id, course_id, material_id)
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
      [randomUUID(), req.user!.id, courseId, materialId],
    );
  } else {
    await db.execute(
      "DELETE FROM course_module_progress WHERE user_id = ? AND course_id = ? AND material_id = ?",
      [req.user!.id, courseId, materialId],
    );
  }

  const [[totalRows], [completedRows]] = await Promise.all([
    db.execute<RowDataPacket[]>("SELECT COUNT(*) count FROM course_materials WHERE course_id = ? AND status = 'published'", [courseId]),
    db.execute<RowDataPacket[]>("SELECT COUNT(*) count FROM course_module_progress WHERE user_id = ? AND course_id = ?", [req.user!.id, courseId]),
  ]);
  const total = Number(totalRows[0]?.count ?? 0);
  const completed = Number(completedRows[0]?.count ?? 0);
  const progress = total ? Math.round((completed / total) * 100) : 0;
  await db.execute(
    "UPDATE course_enrollments SET progress = ?, status = ?, last_viewed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?",
    [progress, progress >= 100 ? "completed" : "active", req.user!.id, courseId],
  );
  await trackMemberActivity(req.user!.id, input.completed ? "module_completed" : "module_reopened", "courses", courseId, { materialId, progress });
  io.emit("course-progress:changed", { userId: req.user!.id, courseId, materialId, progress });
  res.json({ completed, total, progress });
}));

app.get("/api/courses/:id/module-progress", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT material_id, completed_at FROM course_module_progress WHERE user_id = ? AND course_id = ?",
    [req.user!.id, routeParam(req.params.id)],
  );
  res.json(rows);
}));

app.get("/api/courses/:id/assessment-access", requireAuth, asyncRoute(async (req, res) => {
  const courseId = routeParam(req.params.id);
  const access = await getAssessmentAccess(req.user!.id, courseId);
  res.json(access);
}));

app.get("/api/courses/:id/quiz", requireAuth, asyncRoute(async (req, res) => {
  const courseId = routeParam(req.params.id);
  if (!["admin", "super_admin"].includes(req.user!.role)) {
    const [enrollments] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ? AND status IN ('active', 'completed') LIMIT 1",
      [req.user!.id, courseId],
    );
    if (!enrollments[0]) {
      return res.status(403).json({ error: "Enroll in this course before taking its assessment" });
    }
    const access = await getAssessmentAccess(req.user!.id, courseId);
    if (!access.unlocked) {
      return res.status(403).json({
        error: `Complete all learning materials before opening the assessment (${access.completedMaterials}/${access.totalMaterials} completed)`,
        prerequisite: access,
      });
    }
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, course_id, module_index, question_text, options, explanation, sort_order
     FROM quiz_questions WHERE course_id = ? AND active = TRUE ORDER BY module_index, sort_order`,
    [courseId],
  );
  res.json(rows.map(parseJsonFields));
}));

app.post("/api/courses/:id/quiz/submit", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ answers: z.record(z.string(), z.string()) }).parse(req.body);
  const courseId = routeParam(req.params.id);
  if (!["admin", "super_admin"].includes(req.user!.role)) {
    const [enrollments] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ? AND status IN ('active', 'completed') LIMIT 1",
      [req.user!.id, courseId],
    );
    if (!enrollments[0]) {
      return res.status(403).json({ error: "Enroll in this course before submitting its assessment" });
    }
    const access = await getAssessmentAccess(req.user!.id, courseId);
    if (!access.unlocked) {
      return res.status(403).json({
        error: `Complete all learning materials before submitting the assessment (${access.completedMaterials}/${access.totalMaterials} completed)`,
        prerequisite: access,
      });
    }
  }
  const [questions] = await db.execute<RowDataPacket[]>(
    "SELECT id, module_index, question_text, correct_option FROM quiz_questions WHERE course_id = ? AND active = TRUE",
    [courseId],
  );
  if (!questions.length) return res.status(400).json({ error: "This course has no active quiz questions" });
  const incorrect = questions.filter((question) => input.answers[question.id] !== question.correct_option);
  const score = ((questions.length - incorrect.length) / questions.length) * 100;
  const passed = score >= 70;
  const [attemptRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) count FROM quiz_attempts WHERE user_id = ? AND course_id = ?",
    [req.user!.id, courseId],
  );
  const attemptId = randomUUID();
  await db.execute(
    `INSERT INTO quiz_attempts
     (id, user_id, course_id, attempt_number, score, passed, answered_count, total_questions, completed_modules, module_progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attemptId, req.user!.id, courseId, Number(attemptRows[0].count) + 1, score, passed, Object.keys(input.answers).length, questions.length, 0, JSON.stringify([])],
  );
  for (const question of incorrect) {
    await db.execute(
      `INSERT INTO incorrect_answers
       (id, user_id, course_id, question_text, selected_option, correct_option, module_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), req.user!.id, courseId, question.question_text, input.answers[question.id] ?? null, question.correct_option, question.module_index],
    );
  }
  let certificateId: string | null = null;
  if (passed) {
    certificateId = await issueCertificateForCourse(req.user!.id, courseId, { attemptId, score });
  }
  await trackMemberActivity(req.user!.id, "quiz_submission", "courses", courseId, { attemptId, score, passed });
  io.to(`user:${req.user!.id}`).emit("quiz:submitted", { courseId, attemptId, score });
  res.status(201).json({ attemptId, score, passed, incorrectCount: incorrect.length, total: questions.length, certificateId });
}));

const AI_ASSISTANT_USER_ID = "44000000-0000-4000-8000-000000000001";
const sensitiveChatPattern = /\b(legal advice|lawsuit|litigation|dispute|claim strategy|payment|refund|invoice|stripe|password|account access|certificate fraud|medical|self[- ]harm|harassment|emergency)\b/i;

const generateAiCommunityReply = async (roomId: string, roomSlug: string, sourceMessageId: string, memberMessage: string) => {
  const sensitivity = memberMessage.match(sensitiveChatPattern)?.[0];
  if (sensitivity) {
    await db.execute(
      "INSERT INTO ai_chat_replies (id,room_id,source_message_id,model,status,sensitivity_reason) VALUES (?,?,?,?,?,?)",
      [randomUUID(), roomId, sourceMessageId, config.openai.model, "escalated", sensitivity],
    );
    const [admins] = await db.execute<RowDataPacket[]>("SELECT id FROM users WHERE role IN ('admin','super_admin') AND status='active' AND id<>?", [AI_ASSISTANT_USER_ID]);
    for (const admin of admins) await createNotification(String(admin.id), "AI review required", `A sensitive message in ${roomSlug} needs a human response.`, "ai_escalation", `/admin/community-chat/${roomSlug}`);
    return;
  }
  if (!config.openai.autoReplyEnabled || !config.openai.apiKey) {
    await db.execute(
      "INSERT INTO ai_chat_replies (id,room_id,source_message_id,model,status,error_message) VALUES (?,?,?,?,?,?)",
      [randomUUID(), roomId, sourceMessageId, config.openai.model, "not_configured", "OPENAI_API_KEY is missing or automatic replies are disabled"],
    );
    return;
  }
  const [contextRows] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(p.display_name,u.email) author,m.message FROM community_chat_messages m
     JOIN users u ON u.id=m.user_id LEFT JOIN profiles p ON p.user_id=u.id
     WHERE m.room_id=? AND m.status='published' ORDER BY m.created_at DESC LIMIT 12`, [roomId],
  );
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openai.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.openai.model,
        instructions: "You are the PCMO AI Assistant in a professional project and contracts management community. Give a concise, practical, friendly answer in 2-5 short paragraphs. Use the room context when useful. Do not present legal, financial, medical, certification, or contractual decisions as authoritative advice. If uncertain, say so and recommend a qualified PCMO expert. Do not claim to be human.",
        input: `Recent room conversation:\n${contextRows.reverse().map(row => `${String(row.author)}: ${String(row.message)}`).join("\n")}\n\nReply to the newest member message.`,
        max_output_tokens: 450,
      }),
    });
    const payload = await response.json() as { error?: { message?: string }; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status})`);
    const responseText = payload.output?.flatMap(item => item.content ?? []).find(item => item.type === "output_text")?.text?.trim();
    if (!responseText) throw new Error("OpenAI returned no text response");
    const responseMessageId = randomUUID();
    await db.execute("INSERT INTO community_chat_messages (id,room_id,user_id,message,status) VALUES (?,?,?,?,'published')", [responseMessageId, roomId, AI_ASSISTANT_USER_ID, responseText]);
    await db.execute(
      "INSERT INTO ai_chat_replies (id,room_id,source_message_id,response_message_id,model,status,response_text) VALUES (?,?,?,?,?,?,?)",
      [randomUUID(), roomId, sourceMessageId, responseMessageId, config.openai.model, "posted", responseText],
    );
    io.emit("community-chat-messages:changed", { roomId, slug: roomSlug, id: responseMessageId, ai: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    await db.execute(
      "INSERT INTO ai_chat_replies (id,room_id,source_message_id,model,status,error_message) VALUES (?,?,?,?,?,?)",
      [randomUUID(), roomId, sourceMessageId, config.openai.model, "failed", message.slice(0, 2000)],
    );
  }
};

app.get("/api/public/expert-rooms", asyncRoute(async (req, res) => {
  const userId = req.headers.authorization?.startsWith("Bearer ") ? (() => {
    try { return JSON.parse(Buffer.from(req.headers.authorization!.slice(7).split(".")[1], "base64url").toString()).id as string; } catch { return undefined; }
  })() : undefined;
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT r.*, COUNT(CASE WHEN rr.status='reserved' THEN 1 END) reserved_count,
      MAX(CASE WHEN rr.user_id=? AND rr.status='reserved' THEN 1 ELSE 0 END) user_reserved
     FROM expert_rooms r LEFT JOIN expert_room_reservations rr ON rr.room_id=r.id
     WHERE r.status='published' AND r.scheduled_at >= NOW()
     GROUP BY r.id ORDER BY r.scheduled_at ASC`,
    [userId ?? ""],
  );
  res.json({ rows, total: rows.length });
}));

app.get("/api/public/jobs", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM job_recommendations WHERE active=TRUE ORDER BY featured DESC, created_at DESC");
  res.json({ rows: rows.map(parseJsonFields), total: rows.length });
}));

app.get("/api/public/jobs/:slug", asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM job_recommendations WHERE slug=? AND active=TRUE LIMIT 1", [routeParam(req.params.slug)]);
  if (!rows[0]) return res.status(404).json({ error: "Job not found" });
  res.json(parseJsonFields(rows[0]));
}));

app.get("/api/public/chat-rooms", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT r.*,COUNT(DISTINCT m.id) message_count,COUNT(DISTINCT m.user_id) participant_count,
      MAX(m.created_at) last_activity
     FROM community_chat_rooms r LEFT JOIN community_chat_messages m ON m.room_id=r.id AND m.status='published'
     WHERE r.status='active' GROUP BY r.id ORDER BY r.featured DESC,last_activity DESC,r.name`,
  );
  res.json({ rows, total: rows.length });
}));

app.get("/api/public/conversations", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT p.id,p.title,p.content,p.category,p.views,p.likes,p.created_at,
      COUNT(DISTINCT c.id) reply_count,COUNT(DISTINCT c.user_id) + 1 contributor_count
     FROM community_posts p LEFT JOIN post_comments c ON c.post_id=p.id
     WHERE p.status='published' AND p.category IN ('Featured Conversation','Trending Conversation')
     GROUP BY p.id ORDER BY CASE WHEN p.category='Featured Conversation' THEN 0 ELSE 1 END,
       contributor_count DESC,p.created_at DESC`,
  );
  res.json({ featured: rows.find(row => row.category === "Featured Conversation") ?? null, trending: rows.filter(row => row.category === "Trending Conversation"), total: rows.length });
}));

app.get("/api/chat-rooms/:slug/messages", requireAuth, asyncRoute(async (req, res) => {
  const [rooms] = await db.execute<RowDataPacket[]>("SELECT * FROM community_chat_rooms WHERE slug=? AND status='active' LIMIT 1", [routeParam(req.params.slug)]);
  if (!rooms[0]) return res.status(404).json({ error: "Chat room not found" });
  const [messages] = await db.execute<RowDataPacket[]>(
    `SELECT m.id,m.message,m.reply_to_id,m.created_at,m.updated_at,u.id user_id,u.email,p.display_name,p.avatar_url
     FROM community_chat_messages m JOIN users u ON u.id=m.user_id LEFT JOIN profiles p ON p.user_id=u.id
     WHERE m.room_id=? AND m.status='published' ORDER BY m.created_at ASC LIMIT 200`, [rooms[0].id],
  );
  res.json({ room: rooms[0], rows: messages, total: messages.length });
}));

app.post("/api/chat-rooms/:slug/messages", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ message: z.string().trim().min(1).max(3000), replyToId: z.string().uuid().nullable().optional() }).parse(req.body);
  const [rooms] = await db.execute<RowDataPacket[]>("SELECT id,name FROM community_chat_rooms WHERE slug=? AND status='active' LIMIT 1", [routeParam(req.params.slug)]);
  if (!rooms[0]) return res.status(404).json({ error: "Chat room not found" });
  const id = randomUUID();
  await db.execute("INSERT INTO community_chat_messages (id,room_id,user_id,message,reply_to_id) VALUES (?,?,?,?,?)", [id, rooms[0].id, req.user!.id, input.message, input.replyToId ?? null]);
  await trackMemberActivity(req.user!.id, "community_chat_message", "community-chat-rooms", rooms[0].id);
  if (isAdminRole(req.user!.role)) {
    const [participants] = await db.execute<RowDataPacket[]>("SELECT DISTINCT user_id FROM community_chat_messages WHERE room_id=? AND user_id<>?", [rooms[0].id, req.user!.id]);
    for (const participant of participants) {
      await notifyUser(String(participant.user_id), `PCMO replied in ${String(rooms[0].name)}`, input.message.slice(0, 180), "community_replies", `/community/chat/${routeParam(req.params.slug)}`, ["in_app"]);
    }
  }
  io.emit("community-chat-messages:changed", { roomId: rooms[0].id, slug: routeParam(req.params.slug), id });
  res.status(201).json({ id, message: input.message, created_at: new Date().toISOString() });
  if (req.user!.role === "student") void generateAiCommunityReply(String(rooms[0].id), routeParam(req.params.slug), id, input.message).catch(console.error);
}));

app.post("/api/expert-rooms/:id/reserve", requireAuth, asyncRoute(async (req, res) => {
  const roomId = routeParam(req.params.id);
  const [rooms] = await db.execute<RowDataPacket[]>(
    `SELECT r.id,r.title,r.capacity,COUNT(CASE WHEN rr.status='reserved' THEN 1 END) reserved_count
     FROM expert_rooms r LEFT JOIN expert_room_reservations rr ON rr.room_id=r.id
     WHERE r.id=? AND r.status='published' AND r.scheduled_at>=NOW() GROUP BY r.id`, [roomId],
  );
  const room = rooms[0];
  if (!room) return res.status(404).json({ error: "Expert room is unavailable" });
  if (Number(room.reserved_count) >= Number(room.capacity)) return res.status(409).json({ error: "This expert room is full" });
  const id = randomUUID();
  await db.execute(
    `INSERT INTO expert_room_reservations (id,room_id,user_id,status) VALUES (?,?,?,'reserved')
     ON DUPLICATE KEY UPDATE status='reserved', reserved_at=NOW()`, [id, roomId, req.user!.id],
  );
  await createNotification(req.user!.id, "Expert room reserved", `Your seat for ${String(room.title)} is confirmed.`, "expert_room", "/pages/membership_community");
  await trackMemberActivity(req.user!.id, "expert_room_reservation", "expert-rooms", roomId);
  io.emit("expert-rooms:changed", { action: "reserve", roomId });
  res.status(201).json({ id, roomId, status: "reserved" });
}));

app.get("/api/expert-rooms/mine", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT rr.id reservation_id,rr.status,rr.reserved_at,r.id room_id,r.title,r.topic,r.expert_name,r.expert_role,
      r.format,r.scheduled_at,r.duration_minutes,r.meeting_url
     FROM expert_room_reservations rr JOIN expert_rooms r ON r.id=rr.room_id
     WHERE rr.user_id=? AND rr.status='reserved' AND r.status='published' AND r.scheduled_at>=NOW()
     ORDER BY r.scheduled_at ASC`, [req.user!.id],
  );
  res.json({ rows, total: rows.length });
}));

app.delete("/api/expert-rooms/:id/reserve", requireAuth, asyncRoute(async (req, res) => {
  const roomId = routeParam(req.params.id);
  await db.execute("UPDATE expert_room_reservations SET status='cancelled' WHERE room_id=? AND user_id=?", [roomId, req.user!.id]);
  await trackMemberActivity(req.user!.id, "expert_room_cancellation", "expert-rooms", roomId);
  io.emit("expert-rooms:changed", { action: "cancel", roomId });
  res.status(204).end();
}));

app.post("/api/events/:id/register", requireAuth, asyncRoute(async (req, res) => {
  await db.execute(
    `INSERT INTO event_registrations (id, user_id, event_id)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = 'registered'`,
    [randomUUID(), req.user!.id, routeParam(req.params.id)],
  );
  await trackMemberActivity(req.user!.id, "event_registration", "events", routeParam(req.params.id));
  io.to(`user:${req.user!.id}`).emit("event-registration:changed", { eventId: routeParam(req.params.id) });
  res.status(201).json({ success: true });
}));

app.delete("/api/events/:id/register", requireAuth, asyncRoute(async (req, res) => {
  await db.execute("DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?", [req.user!.id, routeParam(req.params.id)]);
  await trackMemberActivity(req.user!.id, "event_unregistration", "events", routeParam(req.params.id));
  io.to(`user:${req.user!.id}`).emit("event-registration:changed", { eventId: routeParam(req.params.id) });
  res.status(204).end();
}));

app.get("/api/public/events", asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT e.id,e.title,e.description,e.event_type,e.category,e.event_date,e.event_time,e.location,e.capacity,e.status,
     (SELECT COUNT(*) FROM event_registrations x WHERE x.event_id=e.id AND x.status='registered') attendees
     FROM events e WHERE e.status IN ('scheduled','published') AND e.event_date >= CURDATE()
     ORDER BY e.event_date ASC,e.event_time ASC`,
  );
  res.json(rows);
}));

app.get("/api/events", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT e.*, er.status registration_status,
     (SELECT COUNT(*) FROM event_registrations x WHERE x.event_id = e.id) attendees
     FROM events e
     LEFT JOIN event_registrations er ON er.event_id = e.id AND er.user_id = ?
     ORDER BY e.event_date DESC, e.event_time DESC`,
    [req.user!.id],
  );
  res.json(rows);
}));

app.post("/api/community/upload", requireAuth, communityUpload.single("image"), asyncRoute(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Upload a JPG, PNG, WebP, or GIF image up to 3 MB." });
  const url = `/uploads/community/${file.filename}`;
  await audit(req.user!.id, "upload", "community-image", undefined, {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  });
  res.status(201).json({
    url,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  });
}));

app.post("/api/contact-messages", asyncRoute(async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(255),
    email: z.string().email().max(255),
    phone: z.string().trim().max(80).optional().nullable(),
    subject: z.string().trim().min(2).max(255),
    message: z.string().trim().min(5).max(10000),
    enquiry_type: z.string().trim().max(120).optional().nullable(),
    audience: z.string().trim().max(120).optional().nullable(),
    organization: z.string().trim().max(255).optional().nullable(),
    role_title: z.string().trim().max(255).optional().nullable(),
    membership_status: z.string().trim().max(120).optional().nullable(),
    preferred_contact_method: z.string().trim().max(80).optional().nullable(),
    urgency: z.string().trim().max(80).optional().nullable(),
    consent: z.boolean().optional().default(false),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  }).parse(req.body);
  const id = randomUUID();
  const metadata = {
    ...(input.metadata ?? {}),
    submitted_at: new Date().toISOString(),
    source: "advanced_contact_page",
  };
  await db.execute(
    `INSERT INTO contact_messages
     (id, name, email, phone, subject, message, enquiry_type, audience, organization, role_title,
      membership_status, preferred_contact_method, urgency, consent, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.email.toLowerCase(),
      input.phone || null,
      input.subject,
      input.message,
      input.enquiry_type || null,
      input.audience || null,
      input.organization || null,
      input.role_title || null,
      input.membership_status || null,
      input.preferred_contact_method || null,
      input.urgency || null,
      Boolean(input.consent),
      JSON.stringify(metadata),
    ],
  );
  io.to("admins").emit("contact-messages:changed", { action: "create", id });
  res.status(201).json({ id, success: true });
}));

app.get("/api/admin/contact-messages", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  const conditions: string[] = [];
  const params: any[] = [];
  if (search) {
    conditions.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ? OR enquiry_type LIKE ? OR audience LIKE ? OR organization LIKE ? OR role_title LIKE ? OR membership_status LIKE ? OR preferred_contact_method LIKE ? OR urgency LIKE ?)");
    params.push(...Array(12).fill(`%${search}%`));
  }
  if (["new", "read", "replied", "archived"].includes(status)) {
    conditions.push("status = ?");
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT 500`,
    params,
  );
  res.json(rows);
}));

app.put("/api/admin/contact-messages/:id", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    status: z.enum(["new", "read", "replied", "archived"]).optional(),
    admin_notes: z.string().max(10000).nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, "No changes provided").parse(req.body);
  const fields = Object.keys(input);
  const values = Object.values(input);
  const replied = input.status === "replied" ? ", responded_at = COALESCE(responded_at, NOW())" : "";
  await db.execute(
    `UPDATE contact_messages SET ${fields.map((field) => `${field} = ?`).join(", ")}${replied} WHERE id = ?`,
    [...values, routeParam(req.params.id)],
  );
  res.json({ success: true });
}));

app.delete("/api/admin/contact-messages/:id", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  await db.execute("DELETE FROM contact_messages WHERE id = ?", [routeParam(req.params.id)]);
  res.status(204).end();
}));

app.post("/api/community/posts/:id/like", requireAuth, asyncRoute(async (req, res) => {
  await db.execute("UPDATE community_posts SET likes = likes + 1 WHERE id = ?", [routeParam(req.params.id)]);
  await trackMemberActivity(req.user!.id, "community_like", "community_posts", routeParam(req.params.id));
  io.emit("community-posts:changed", { action: "like", id: routeParam(req.params.id) });
  res.json({ success: true });
}));

app.post("/api/library/:id/share", requireAuth, asyncRoute(async (req, res) => {
  await db.execute(`UPDATE library_contents SET shares = shares + 1 WHERE id = ? AND ${libraryVisibilityClause}`, [routeParam(req.params.id)]);
  await trackMemberActivity(req.user!.id, "library_share", "library_contents", routeParam(req.params.id));
  io.emit("library:changed", { action: "share", id: routeParam(req.params.id) });
  res.json({ success: true });
}));

app.post("/api/library/:id/repost", requireAuth, asyncRoute(async (req, res) => {
  await db.execute(`UPDATE library_contents SET reposts = reposts + 1 WHERE id = ? AND ${libraryVisibilityClause}`, [routeParam(req.params.id)]);
  await trackMemberActivity(req.user!.id, "library_repost", "library_contents", routeParam(req.params.id));
  io.emit("library:changed", { action: "repost", id: routeParam(req.params.id) });
  res.json({ success: true });
}));

app.post("/api/library/:id/download", requireAuth, asyncRoute(async (req, res) => {
  const bookId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, sale_enabled, price, visibility FROM library_contents WHERE id = ? AND ${libraryVisibilityClause} LIMIT 1`,
    [bookId],
  );
  const book = rows[0];
  if (!book) return res.status(404).json({ error: "Book not found" });
  const visibility = parseJsonFields(book).visibility as Record<string, boolean> | undefined;
  if (visibility?.downloads === false) return res.status(403).json({ error: "Downloads are disabled for this item" });
  if (Boolean(book.sale_enabled) && Number(book.price ?? 0) > 0) {
    if (!await userOwnsBook(req.user!.id, bookId)) return res.status(403).json({ error: "Purchase this book before downloading it" });
  }
  await db.execute("UPDATE library_contents SET downloads = downloads + 1 WHERE id = ?", [bookId]);
  await trackMemberActivity(req.user!.id, "library_download", "library_contents", bookId);
  io.emit("library:changed", { action: "download", id: bookId });
  res.json({ success: true });
}));

app.get("/api/books/:id/download/:index", requireAuth, asyncRoute(async (req, res) => {
  const bookId = routeParam(req.params.id);
  const index = Number(routeParam(req.params.index));
  if (!Number.isInteger(index) || index < 0) return res.status(400).json({ error: "Invalid attachment" });
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, title, sale_enabled, price, attachments, visibility FROM library_contents WHERE id = ? AND ${libraryVisibilityClause} LIMIT 1`,
    [bookId],
  );
  const book = rows[0];
  if (!book) return res.status(404).json({ error: "Book not found" });
  const parsed = parseJsonFields(book);
  const visibility = parsed.visibility as Record<string, boolean> | undefined;
  if (visibility?.downloads === false || visibility?.attachments === false) {
    return res.status(403).json({ error: "Downloads are disabled for this item" });
  }
  if (requiresBookPurchase(book) && !await userOwnsBook(req.user!.id, bookId)) {
    return res.status(403).json({ error: "Purchase this book before downloading it" });
  }
  const attachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
  const attachment = attachments[index] as { name?: string; url?: string } | undefined;
  const absolutePath = safeLibraryFilePath(attachment?.url);
  if (!attachment || !absolutePath) return res.status(404).json({ error: "Attachment not found" });
  await db.execute("UPDATE library_contents SET downloads = downloads + 1 WHERE id = ?", [bookId]);
  await trackMemberActivity(req.user!.id, "book_file_download", "library_contents", bookId, { attachment: attachment.name ?? index });
  io.emit("library:changed", { action: "download", id: bookId });
  res.download(absolutePath, attachment.name || `${String(parsed.title ?? "ebook")}-${index + 1}`);
}));

app.get("/api/books/purchases", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT book_id, status, purchased_at FROM book_purchases WHERE user_id = ? AND status = 'paid'",
    [req.user!.id],
  );
  res.json(rows);
}));

app.get("/api/books/cart", requireAuth, asyncRoute(async (req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT bci.id AS cart_item_id, lc.id, lc.title, lc.excerpt, lc.featured_image, lc.price, lc.currency, lc.book_format, lc.page_count
     FROM book_cart_items bci JOIN library_contents lc ON lc.id=bci.book_id
     WHERE bci.user_id=? AND ${libraryVisibilityClause} ORDER BY bci.created_at DESC`,
    [req.user!.id],
  );
  res.json(rows.map(parseJsonFields));
}));

app.post("/api/books/cart", requireAuth, asyncRoute(async (req, res) => {
  const input = z.object({ bookId: z.string().uuid() }).parse(req.body);
  const [books] = await db.execute<RowDataPacket[]>(
    `SELECT id, sale_enabled, price FROM library_contents WHERE id=? AND ${libraryVisibilityClause} LIMIT 1`, [input.bookId],
  );
  if (!books[0]) return res.status(404).json({ error: "Book not found" });
  if (!requiresBookPurchase(books[0])) return res.status(400).json({ error: "Only paid books can be added to the cart" });
  if (await userOwnsBook(req.user!.id, input.bookId)) return res.status(409).json({ error: "You already own this book" });
  await db.execute("INSERT INTO book_cart_items (id,user_id,book_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE updated_at=NOW()", [randomUUID(), req.user!.id, input.bookId]);
  res.status(201).json({ success: true });
}));

app.delete("/api/books/cart/:bookId", requireAuth, asyncRoute(async (req, res) => {
  await db.execute("DELETE FROM book_cart_items WHERE user_id=? AND book_id=?", [req.user!.id, routeParam(req.params.bookId)]);
  res.json({ success: true });
}));

app.post("/api/books/cart/checkout", requireAuth, asyncRoute(async (req, res) => {
  if (!stripe) return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to the API environment." });
  const [books] = await db.execute<RowDataPacket[]>(
    `SELECT lc.id,lc.title,lc.excerpt,lc.price,lc.currency FROM book_cart_items bci JOIN library_contents lc ON lc.id=bci.book_id
     WHERE bci.user_id=? AND ${libraryVisibilityClause} AND lc.sale_enabled=TRUE AND lc.price>0 ORDER BY bci.created_at DESC LIMIT 20`, [req.user!.id],
  );
  if (!books.length) return res.status(400).json({ error: "Your cart is empty" });
  const currency = String(books[0].currency ?? "USD").toUpperCase();
  if (books.some((book) => String(book.currency ?? "USD").toUpperCase() !== currency)) return res.status(400).json({ error: "All cart books must use the same currency" });
  const purchaseIds = books.map(() => randomUUID());
  for (let index = 0; index < books.length; index += 1) {
    await db.execute(
      `INSERT INTO book_purchases (id,user_id,book_id,status,amount,currency) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status=CASE WHEN status='paid' THEN status ELSE 'pending' END,amount=VALUES(amount),currency=VALUES(currency)`,
      [purchaseIds[index], req.user!.id, books[index].id, "pending", books[index].price, currency],
    );
  }
  const [purchases] = await db.execute<RowDataPacket[]>("SELECT id,book_id,status FROM book_purchases WHERE user_id=? AND book_id IN (" + books.map(() => "?").join(",") + ")", [req.user!.id, ...books.map((book) => book.id)]);
  const pendingIds = purchases.filter((purchase) => purchase.status !== "paid").map((purchase) => String(purchase.id));
  if (!pendingIds.length) return res.json({ status: "paid", existing: true });
  const session = await stripe.checkout.sessions.create({
    mode: "payment", customer_email: req.user!.email,
    line_items: books.filter((book) => pendingIds.includes(String(purchases.find((purchase) => purchase.book_id === book.id)?.id))).map((book) => ({
      quantity: 1, price_data: { currency: currency.toLowerCase(), product_data: { name: book.title, description: book.excerpt ?? undefined }, unit_amount: Math.round(Number(book.price) * 100) },
    })),
    success_url: `${config.clientUrl}/bookstore?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/bookstore?payment=cancelled`,
    metadata: { checkoutType: "book-cart", userId: req.user!.id, purchaseIds: JSON.stringify(pendingIds) },
  });
  await db.execute("UPDATE book_purchases SET stripe_checkout_session_id=? WHERE user_id=? AND id IN (" + pendingIds.map(() => "?").join(",") + ")", [session.id, req.user!.id, ...pendingIds]);
  res.status(201).json({ checkoutUrl: session.url, status: "pending" });
}));

app.get("/api/books/:id/access", requireAuth, asyncRoute(async (req, res) => {
  const bookId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, sale_enabled, price, currency FROM library_contents WHERE id = ? AND ${libraryVisibilityClause} LIMIT 1`,
    [bookId],
  );
  const book = rows[0];
  if (!book) return res.status(404).json({ error: "Book not found" });
  const paidRequired = Boolean(book.sale_enabled) && Number(book.price ?? 0) > 0;
  const [purchases] = await db.execute<RowDataPacket[]>(
    "SELECT id, status, purchased_at FROM book_purchases WHERE user_id = ? AND book_id = ? AND status = 'paid' LIMIT 1",
    [req.user!.id, bookId],
  );
  res.json({
    paidRequired,
    purchased: !paidRequired || Boolean(purchases[0]),
    purchase: purchases[0] ?? null,
  });
}));

app.post("/api/books/:id/checkout", requireAuth, asyncRoute(async (req, res) => {
  const bookId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, title, excerpt, sale_enabled, price, currency FROM library_contents WHERE id = ? AND ${libraryVisibilityClause} LIMIT 1`,
    [bookId],
  );
  const book = rows[0];
  if (!book) return res.status(404).json({ error: "Book not found" });
  const price = Number(book.price ?? 0);
  const currency = String(book.currency ?? "USD").toUpperCase();
  if (!Boolean(book.sale_enabled) || price <= 0) {
    const purchaseId = randomUUID();
    await db.execute(
      `INSERT INTO book_purchases (id, user_id, book_id, status, amount, currency, purchased_at)
       VALUES (?, ?, ?, 'paid', 0, ?, NOW())
       ON DUPLICATE KEY UPDATE status='paid', amount=0, currency=VALUES(currency), purchased_at=COALESCE(purchased_at, NOW())`,
      [purchaseId, req.user!.id, bookId, currency],
    );
    return res.status(201).json({ status: "paid", purchaseId });
  }
  if (!stripe) return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to the API environment." });

  const existingId = randomUUID();
  await db.execute(
    `INSERT INTO book_purchases (id, user_id, book_id, status, amount, currency)
     VALUES (?, ?, ?, 'pending', ?, ?)
     ON DUPLICATE KEY UPDATE status = CASE WHEN status = 'paid' THEN status ELSE 'pending' END, amount=VALUES(amount), currency=VALUES(currency)`,
    [existingId, req.user!.id, bookId, price, currency],
  );
  const [purchaseRows] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM book_purchases WHERE user_id = ? AND book_id = ? LIMIT 1",
    [req.user!.id, bookId],
  );
  const purchase = purchaseRows[0];
  if (purchase?.status === "paid") return res.json({ status: "paid", existing: true });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: req.user!.email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: book.title, description: book.excerpt ?? undefined },
        unit_amount: Math.round(price * 100),
      },
    }],
    success_url: `${config.clientUrl}/ebook/${bookId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/ebook/${bookId}?payment=cancelled`,
    metadata: {
      checkoutType: "book",
      purchaseId: purchase.id,
      bookId,
      userId: req.user!.id,
      bookTitle: book.title,
    },
  });
  await db.execute("UPDATE book_purchases SET stripe_checkout_session_id=? WHERE id=? AND user_id=?", [session.id, purchase.id, req.user!.id]);
  await trackMemberActivity(req.user!.id, "book_checkout_started", "library_contents", bookId, { purchaseId: purchase.id, sessionId: session.id });
  res.status(201).json({ checkoutUrl: session.url, sessionId: session.id, purchaseId: purchase.id, status: "pending" });
}));

app.get("/api/volunteer/dashboard", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user!.id;
  const [[opportunities], [applications], [hourLogs], [summaryRows]] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT vo.*,
       (SELECT COUNT(*) FROM volunteer_applications va WHERE va.opportunity_id=vo.id AND va.status IN ('approved','active','completed')) accepted_count
       FROM volunteer_opportunities vo ORDER BY FIELD(vo.status,'open','closed','draft'), vo.updated_at DESC`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT va.*, vo.title opportunity_title, vo.category, vo.location, vo.time_commitment
       FROM volunteer_applications va JOIN volunteer_opportunities vo ON vo.id=va.opportunity_id
       WHERE va.user_id=? ORDER BY va.updated_at DESC`, [userId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT vhl.*, vo.title opportunity_title
       FROM volunteer_hour_logs vhl JOIN volunteer_opportunities vo ON vo.id=vhl.opportunity_id
       WHERE vhl.user_id=? ORDER BY vhl.service_date DESC, vhl.created_at DESC`, [userId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT
       COALESCE(SUM(CASE WHEN status='approved' THEN hours ELSE 0 END),0) approved_hours,
       COALESCE(SUM(CASE WHEN status='pending' THEN hours ELSE 0 END),0) pending_hours
       FROM volunteer_hour_logs WHERE user_id=?`, [userId],
    ),
  ]);
  res.json({
    opportunities: opportunities.map(parseJsonFields),
    applications: applications.map(parseJsonFields),
    hourLogs: hourLogs.map(parseJsonFields),
    summary: {
      approvedHours: Number(summaryRows[0]?.approved_hours ?? 0),
      pendingHours: Number(summaryRows[0]?.pending_hours ?? 0),
      applications: applications.length,
      approvedApplications: applications.filter((row) => ['approved','active','completed'].includes(String(row.status))).length,
      openOpportunities: opportunities.filter((row) => row.status === 'open').length,
    },
  });
}));

app.post("/api/volunteer/opportunities/:id/apply", requireAuth, asyncRoute(async (req, res) => {
  if (req.user!.role !== "student") return res.status(403).json({ error: "Student access required" });
  const opportunityId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>("SELECT id,title,status,spots_available FROM volunteer_opportunities WHERE id=? LIMIT 1", [opportunityId]);
  const opportunity = rows[0];
  if (!opportunity || opportunity.status !== "open") return res.status(409).json({ error: "This opportunity is not accepting applications" });
  const [existing] = await db.execute<RowDataPacket[]>("SELECT id,status FROM volunteer_applications WHERE user_id=? AND opportunity_id=? LIMIT 1", [req.user!.id, opportunityId]);
  if (existing[0]) return res.status(409).json({ error: "You have already applied for this opportunity" });
  const id = randomUUID();
  await db.execute("INSERT INTO volunteer_applications (id,user_id,opportunity_id,status,hours_logged) VALUES (?,?,?,'submitted',0)", [id, req.user!.id, opportunityId]);
  await trackMemberActivity(req.user!.id, "volunteer_application_submitted", "volunteer-applications", id, { opportunityId, title: opportunity.title });
  await createNotification(req.user!.id, "Volunteer application submitted", `Your application for “${opportunity.title}” is awaiting review.`, "volunteer", `/volunteer/${opportunityId}`);
  io.emit("volunteer-applications:changed", { action: "create", id });
  res.status(201).json({ id, opportunity_id: opportunityId, status: "submitted", hours_logged: 0 });
}));

app.post("/api/volunteer/applications/:id/hours", requireAuth, asyncRoute(async (req, res) => {
  const applicationId = routeParam(req.params.id);
  const hours = Number(req.body.hours);
  const activity = String(req.body.activity ?? "").trim();
  const serviceDate = String(req.body.service_date ?? "").slice(0, 10);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return res.status(400).json({ error: "Hours must be between 0 and 24" });
  if (activity.length < 10) return res.status(400).json({ error: "Describe the volunteer work completed" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) return res.status(400).json({ error: "A valid service date is required" });
  const [apps] = await db.execute<RowDataPacket[]>(
    `SELECT va.id,va.opportunity_id,va.status,vo.title FROM volunteer_applications va
     JOIN volunteer_opportunities vo ON vo.id=va.opportunity_id WHERE va.id=? AND va.user_id=? LIMIT 1`,
    [applicationId, req.user!.id],
  );
  const application = apps[0];
  if (!application || !['approved','active'].includes(String(application.status))) return res.status(409).json({ error: "Hours can be submitted after the application is approved" });
  const id = randomUUID();
  await db.execute(
    `INSERT INTO volunteer_hour_logs (id,user_id,application_id,opportunity_id,service_date,hours,activity,evidence_url,status)
     VALUES (?,?,?,?,?,?,?,?,'pending')`,
    [id, req.user!.id, applicationId, application.opportunity_id, serviceDate, hours, activity, req.body.evidence_url || null],
  );
  await trackMemberActivity(req.user!.id, "volunteer_hours_submitted", "volunteer-hour-logs", id, { hours, opportunity: application.title });
  io.emit("volunteer-hour-logs:changed", { action: "create", id });
  res.status(201).json({ id, status: "pending" });
}));

app.get("/api/admin/volunteer/overview", requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [[stats], [applications], [hourLogs]] = await Promise.all([
    db.execute<RowDataPacket[]>(`SELECT
      (SELECT COUNT(*) FROM volunteer_opportunities WHERE status='open') open_opportunities,
      (SELECT COUNT(*) FROM volunteer_applications WHERE status='submitted') pending_applications,
      (SELECT COUNT(*) FROM volunteer_hour_logs WHERE status='pending') pending_hour_logs,
      (SELECT COALESCE(SUM(hours),0) FROM volunteer_hour_logs WHERE status='approved') approved_hours`),
    db.execute<RowDataPacket[]>(`SELECT va.*,vo.title opportunity_title,COALESCE(p.display_name,u.email) volunteer_name,u.email
      FROM volunteer_applications va JOIN volunteer_opportunities vo ON vo.id=va.opportunity_id JOIN users u ON u.id=va.user_id LEFT JOIN profiles p ON p.user_id=u.id ORDER BY va.updated_at DESC LIMIT 100`),
    db.execute<RowDataPacket[]>(`SELECT vhl.*,vo.title opportunity_title,COALESCE(p.display_name,u.email) volunteer_name
      FROM volunteer_hour_logs vhl JOIN volunteer_opportunities vo ON vo.id=vhl.opportunity_id JOIN users u ON u.id=vhl.user_id LEFT JOIN profiles p ON p.user_id=u.id ORDER BY vhl.created_at DESC LIMIT 100`),
  ]);
  res.json({ stats: stats[0], applications, hourLogs });
}));

app.get("/api/resources/:resource", requireAuth, asyncRoute(async (req, res) => {
  const resourceName = routeParam(req.params.resource);
  const resource = resources[resourceName];
  if (!resource) return res.status(404).json({ error: "Unknown resource" });
  if (!resource.publicRead && !resource.ownerField && !["admin", "super_admin"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Administrator access required" });
  }
  if (resourceName === "certifications") {
    const userId = ["admin", "super_admin"].includes(req.user!.role) ? undefined : req.user!.id;
    await backfillPassedCertificates(userId);
    await syncCertificateRecipientDetails(userId);
    await syncCertifiedCourseCompletions(userId);
  }

  const requestedPage = Number(req.query.page ?? 1);
  const requestedLimit = Number(req.query.limit ?? 25);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.trunc(requestedPage)) : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.trunc(requestedLimit))) : 25;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];

  if (resource.ownerField && !resource.publicRead && !["admin", "super_admin"].includes(req.user!.role)) {
    conditions.push(`${resource.ownerField} = ?`);
    params.push(req.user!.id);
  }
  if (resourceName === "library" && !["admin", "super_admin"].includes(req.user!.role)) {
    conditions.push(libraryVisibilityClause);
  }
  if (req.query.search && resource.searchable?.length) {
    conditions.push(`(${resource.searchable.map((field) => `${field} LIKE ?`).join(" OR ")})`);
    for (const _field of resource.searchable) params.push(`%${req.query.search}%`);
  }
  if (req.query.status && resource.fields.includes("status")) {
    conditions.push("status = ?");
    params.push(req.query.status);
  }
  if (req.query.module_id && resource.fields.includes("module_id")) {
    conditions.push("module_id = ?");
    params.push(req.query.module_id);
  }
  for (const field of ["post_id", "course_id", "category", "page_group"]) {
    const value = req.query[field];
    if (value && resource.fields.includes(field)) {
      conditions.push(`${field} = ?`);
      params.push(Array.isArray(value) ? value[0] : value);
    }
  }
  for (const field of ["type", "author", "reviewer", "subcategory"]) {
    const value = req.query[field];
    if (value && resource.fields.includes(field)) {
      conditions.push(`${field} = ?`);
      params.push(Array.isArray(value) ? value[0] : value);
    }
  }
  if (resourceName === "library" && req.query.tag) {
    conditions.push("JSON_SEARCH(tags, 'one', ?) IS NOT NULL");
    params.push(Array.isArray(req.query.tag) ? req.query.tag[0] : req.query.tag);
  }
  if (resourceName === "library" && req.query.from) {
    conditions.push("COALESCE(published_at, created_at) >= ?");
    params.push(Array.isArray(req.query.from) ? req.query.from[0] : req.query.from);
  }
  if (resourceName === "library" && req.query.to) {
    conditions.push("COALESCE(published_at, created_at) <= ?");
    params.push(Array.isArray(req.query.to) ? req.query.to[0] : req.query.to);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy = resource.orderBy ?? "updated_at";
  if (resourceName === "community-posts") {
    const [[countRow], [rows]] = await Promise.all([
      db.execute<RowDataPacket[]>(`SELECT COUNT(*) total FROM community_posts ${where}`, params),
      db.execute<RowDataPacket[]>(
        `SELECT community_posts.*, profiles.display_name author_name, profiles.avatar_url author_avatar_url
         FROM community_posts
         LEFT JOIN profiles ON profiles.user_id = community_posts.user_id
         ${where}
         ORDER BY community_posts.${orderBy} DESC LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
    ]);
    return res.json({ rows: rows.map(parseJsonFields), total: countRow[0]?.total ?? 0, page, limit });
  }
  if (resourceName === "post-comments") {
    const [[countRow], [rows]] = await Promise.all([
      db.execute<RowDataPacket[]>(`SELECT COUNT(*) total FROM post_comments ${where}`, params),
      db.execute<RowDataPacket[]>(
        `SELECT post_comments.*, profiles.display_name author_name, profiles.avatar_url author_avatar_url
         FROM post_comments
         LEFT JOIN profiles ON profiles.user_id = post_comments.user_id
         ${where}
         ORDER BY post_comments.${orderBy} DESC LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
    ]);
    return res.json({ rows: rows.map(parseJsonFields), total: countRow[0]?.total ?? 0, page, limit });
  }
  const rowQuery = resource.fields.includes("user_id")
    ? `SELECT records.*, COALESCE(user_identity.display_name, user_identity.email) AS user_name, user_identity.email AS user_email
       FROM ${resource.table} records
       LEFT JOIN (
         SELECT u.id, u.email, p.display_name
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
       ) user_identity ON user_identity.id = records.user_id
       ${where} ORDER BY records.${orderBy} DESC LIMIT ${limit} OFFSET ${offset}`
    : `SELECT * FROM ${resource.table} ${where} ORDER BY ${orderBy} DESC LIMIT ${limit} OFFSET ${offset}`;
  const [[countRow], [rows]] = await Promise.all([
    db.execute<RowDataPacket[]>(`SELECT COUNT(*) total FROM ${resource.table} ${where}`, params),
    db.execute<RowDataPacket[]>(rowQuery, params),
  ]);
  if (resourceName === "library" && !isAdminRole(req.user!.role)) {
    const paidBookIds = rows.filter(requiresBookPurchase).map((row) => String(row.id));
    const owned = new Set<string>();
    if (paidBookIds.length) {
      const placeholders = paidBookIds.map(() => "?").join(",");
      const [purchaseRows] = await db.execute<RowDataPacket[]>(
        `SELECT book_id FROM book_purchases WHERE user_id = ? AND status = 'paid' AND book_id IN (${placeholders})`,
        [req.user!.id, ...paidBookIds],
      );
      purchaseRows.forEach((row) => owned.add(String(row.book_id)));
    }
    const sanitized = rows.map((row) => redactAttachmentUrls(row, !requiresBookPurchase(row) || owned.has(String(row.id))));
    return res.json({ rows: sanitized, total: countRow[0]?.total ?? 0, page, limit });
  }
  res.json({ rows: rows.map(parseJsonFields), total: countRow[0]?.total ?? 0, page, limit });
}));

app.get("/api/resources/:resource/:id", requireAuth, asyncRoute(async (req, res) => {
  const resourceName = routeParam(req.params.resource);
  const resource = resources[resourceName];
  if (!resource) return res.status(404).json({ error: "Unknown resource" });
  const params: any[] = [routeParam(req.params.id)];
  let ownerClause = "";
  if (resource.ownerField && !["admin", "super_admin"].includes(req.user!.role)) {
    ownerClause = ` AND ${resource.ownerField} = ?`;
    params.push(req.user!.id);
  }
  if (resourceName === "library" && !["admin", "super_admin"].includes(req.user!.role)) {
    ownerClause += ` AND ${libraryVisibilityClause}`;
  }
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM ${resource.table} WHERE id = ?${ownerClause} LIMIT 1`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: "Record not found" });
  if (resourceName === "library" && !["admin", "super_admin"].includes(req.user!.role)) {
    await db.execute("UPDATE library_contents SET views = views + 1 WHERE id = ?", [routeParam(req.params.id)]);
    rows[0].views = Number(rows[0].views ?? 0) + 1;
    const canDownload = !requiresBookPurchase(rows[0]) || await userOwnsBook(req.user!.id, routeParam(req.params.id));
    return res.json(redactAttachmentUrls(rows[0], canDownload));
  }
  res.json(parseJsonFields(rows[0]));
}));

app.post("/api/resources/:resource", requireAuth, asyncRoute(async (req, res) => {
  const resourceName = routeParam(req.params.resource);
  const resource = resources[resourceName];
  if (!resource) return res.status(404).json({ error: "Unknown resource" });
  const admin = ["admin", "super_admin"].includes(req.user!.role);
  if (!admin && !resource.studentCreate) return res.status(403).json({ error: "Administrator access required" });

  const input = Object.fromEntries(
    resource.fields
      .filter((field) => req.body[field] !== undefined)
      .map((field) => [field, serializeValue(field, req.body[field])]),
  );
  if (resource.ownerField && !admin) input[resource.ownerField] = req.user!.id;
  const id = randomUUID();
  const fields = Object.keys(input);
  if (!fields.length) return res.status(400).json({ error: "No valid fields supplied" });
  await db.execute(
    `INSERT INTO ${resource.table} (id, ${fields.join(", ")}) VALUES (?, ${fields.map(() => "?").join(", ")})`,
    [id, ...Object.values(input)] as any[],
  );
  await audit(req.user!.id, "create", resourceName, id, req.body);
  if (!admin && (resourceName === "community-posts" || resourceName === "post-comments")) {
    await trackMemberActivity(req.user!.id, resourceName === "community-posts" ? "community_post_created" : "community_reply_created", resourceName, id);
  }
  io.emit(`${resourceName}:changed`, { action: "create", id });

  if (resourceName === "post-comments") {
    const postId = String(input.post_id ?? "");
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT user_id, title FROM community_posts WHERE id = ? LIMIT 1",
      [postId],
    );
    const originalPost = rows[0];
    if (originalPost && originalPost.user_id !== req.user!.id) {
      await notifyUser(
        originalPost.user_id,
        "New reply on your community post",
        `Someone replied to your post \"${String(originalPost.title || "Untitled")}\".`,
        "community_replies",
        `/community/post/${postId}`,
        ["in_app", "email", "whatsapp"],
      );
    }
  }

  res.status(201).json({ id, ...req.body });
}));

app.put("/api/resources/:resource/:id", requireAuth, asyncRoute(async (req, res) => {
  const resourceName = routeParam(req.params.resource);
  const resource = resources[resourceName];
  if (!resource) return res.status(404).json({ error: "Unknown resource" });
  const admin = ["admin", "super_admin"].includes(req.user!.role);
  if (!admin && !resource.studentUpdate) return res.status(403).json({ error: "Administrator access required" });

  const input = Object.fromEntries(
    resource.fields
      .filter((field) => req.body[field] !== undefined)
      .filter((field) => admin || field !== resource.ownerField)
      .map((field) => [field, serializeValue(field, req.body[field])]),
  );
  const fields = Object.keys(input);
  if (!fields.length) return res.status(400).json({ error: "No valid fields supplied" });
  const params: any[] = [...Object.values(input), routeParam(req.params.id)];
  let ownerClause = "";
  if (resource.ownerField && !admin) {
    ownerClause = ` AND ${resource.ownerField} = ?`;
    params.push(req.user!.id);
  }
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE ${resource.table} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?${ownerClause}`,
    params,
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Record not found" });
  await audit(req.user!.id, "update", resourceName, routeParam(req.params.id), req.body);
  io.emit(`${resourceName}:changed`, { action: "update", id: routeParam(req.params.id) });

  if (admin && resourceName === "volunteer-applications" && req.body.status) {
    const [applications] = await db.execute<RowDataPacket[]>(
      `SELECT va.user_id,va.opportunity_id,vo.title FROM volunteer_applications va
       JOIN volunteer_opportunities vo ON vo.id=va.opportunity_id WHERE va.id=? LIMIT 1`,
      [routeParam(req.params.id)],
    );
    const application = applications[0];
    if (application) {
      const status = String(req.body.status);
      await createNotification(
        String(application.user_id),
        `Volunteer application ${status}`,
        `Your application for “${String(application.title)}” is now ${status}.`,
        "volunteer",
        `/volunteer/${String(application.opportunity_id)}`,
      );
    }
  }

  if (admin && resourceName === "volunteer-hour-logs" && req.body.status) {
    const logId = routeParam(req.params.id);
    await db.execute(
      "UPDATE volunteer_hour_logs SET reviewed_by=?, reviewed_at=NOW() WHERE id=?",
      [req.user!.id, logId],
    );
    const [logs] = await db.execute<RowDataPacket[]>(
      `SELECT vhl.user_id,vhl.application_id,vhl.opportunity_id,vhl.hours,vo.title
       FROM volunteer_hour_logs vhl JOIN volunteer_opportunities vo ON vo.id=vhl.opportunity_id WHERE vhl.id=? LIMIT 1`,
      [logId],
    );
    const log = logs[0];
    if (log) {
      await db.execute(
        `UPDATE volunteer_applications SET hours_logged=(SELECT COALESCE(SUM(hours),0) FROM volunteer_hour_logs WHERE application_id=? AND status='approved') WHERE id=?`,
        [log.application_id, log.application_id],
      );
      const status = String(req.body.status);
      await createNotification(
        String(log.user_id),
        `Volunteer hours ${status}`,
        `${Number(log.hours)} hours for “${String(log.title)}” were ${status}.`,
        "volunteer",
        `/volunteer/${String(log.opportunity_id)}`,
      );
      io.emit("volunteer-applications:changed", { action: "update", id: String(log.application_id) });
    }
  }

  if (resourceName === "events") {
    const eventId = routeParam(req.params.id);
    const [eventRows] = await db.execute<RowDataPacket[]>(
      "SELECT title FROM events WHERE id = ? LIMIT 1",
      [eventId],
    );
    const eventTitle = String(eventRows[0]?.title ?? "Event");
    const [registrants] = await db.execute<RowDataPacket[]>(
      "SELECT user_id FROM event_registrations WHERE event_id = ?",
      [eventId],
    );
    for (const registrant of registrants) {
      if (registrant.user_id !== req.user!.id) {
        await notifyUser(
          String(registrant.user_id),
          `Event updated: ${eventTitle}`,
          `The event \"${eventTitle}\" has been updated. Check the details before attending.`,
          "event_updates",
          `/events/${eventId}`,
          ["in_app", "email", "whatsapp"],
        );
      }
    }
  }

  res.json({ id: routeParam(req.params.id), ...req.body });
}));

app.delete("/api/resources/:resource/:id", requireAuth, asyncRoute(async (req, res) => {
  const resourceName = routeParam(req.params.resource);
  const resource = resources[resourceName];
  if (!resource) return res.status(404).json({ error: "Unknown resource" });
  const admin = ["admin", "super_admin"].includes(req.user!.role);
  if (!admin && (!resource.studentUpdate || !resource.ownerField)) return res.status(403).json({ error: "Administrator access required" });
  const [result] = await db.execute<ResultSetHeader>(
    `DELETE FROM ${resource.table} WHERE id = ?${admin ? "" : ` AND ${resource.ownerField} = ?`}`,
    admin ? [routeParam(req.params.id)] : [routeParam(req.params.id), req.user!.id],
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Record not found" });
  await audit(req.user!.id, "delete", resourceName, routeParam(req.params.id));
  io.emit(`${resourceName}:changed`, { action: "delete", id: routeParam(req.params.id) });
  res.status(204).end();
}));

app.post("/api/admin/library/upload", requireAuth, requireAdmin, libraryUpload.array("files", 20), asyncRoute(async (req, res) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  const category = typeof req.body.category === "string" ? req.body.category : null;
  const media = [];
  for (const file of files) {
    const id = randomUUID();
    const url = `/uploads/library/${file.filename}`;
    await db.execute(
      `INSERT INTO library_media (id, filename, original_name, mime_type, size_bytes, url, category, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, file.filename, file.originalname, file.mimetype, file.size, url, category, req.user!.id],
    );
    media.push({
      id,
      name: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url,
      category,
    });
  }
  await audit(req.user!.id, "upload", "library-media", undefined, { files: media.length, category });
  res.status(201).json({ media });
}));

app.post("/api/admin/library/:id/duplicate", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const sourceId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM library_contents WHERE id = ? LIMIT 1", [sourceId]);
  const source = rows[0];
  if (!source) return res.status(404).json({ error: "Content not found" });
  const parsed = parseJsonFields(source);
  const id = randomUUID();
  const title = typeof req.body.title === "string" && req.body.title.trim() ? req.body.title.trim() : `${source.title} Repost`;
  const slug = typeof req.body.slug === "string" && req.body.slug.trim()
    ? req.body.slug.trim()
    : `${source.slug}-repost-${Date.now().toString().slice(-6)}`;
  const publishDate = typeof req.body.published_at === "string" && req.body.published_at ? req.body.published_at : null;
  await db.execute(
     `INSERT INTO library_contents
      (id, title, slug, excerpt, body, type, category, subcategory, tags, author, reviewer, status, published_at, expires_at,
       featured_image, gallery, media, attachments, seo, flags, visibility, sale_enabled, price, currency, isbn, book_format, page_count,
       original_id, display_priority, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title,
      slug,
      source.excerpt,
      source.body,
      source.type,
      source.category,
      source.subcategory,
      JSON.stringify(parsed.tags ?? []),
      source.author,
      source.reviewer,
      publishDate ? "published" : "draft",
      publishDate,
      source.expires_at,
      source.featured_image,
      JSON.stringify(parsed.gallery ?? []),
      JSON.stringify(parsed.media ?? []),
      JSON.stringify(parsed.attachments ?? []),
      JSON.stringify(parsed.seo ?? {}),
      JSON.stringify(parsed.flags ?? {}),
      JSON.stringify(parsed.visibility ?? {}),
      Boolean(source.sale_enabled),
      source.price,
      source.currency,
      source.isbn,
      source.book_format,
      source.page_count,
      sourceId,
      Number(source.display_priority ?? 0),
      null,
    ],
  );
  await db.execute("UPDATE library_contents SET reposts = reposts + 1 WHERE id = ?", [sourceId]);
  await audit(req.user!.id, "duplicate", "library", id, { sourceId });
  io.emit("library:changed", { action: "duplicate", id, sourceId });
  res.status(201).json({ id, sourceId });
}));

app.post("/api/admin/library/bulk", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(["publish", "archive", "hide", "delete", "feature", "unfeature", "category", "visibility"]),
    category: z.string().optional(),
    visibility: z.record(z.string(), z.boolean()).optional(),
  }).parse(req.body);
  const placeholders = input.ids.map(() => "?").join(", ");
  if (input.action === "delete") {
    await db.execute(`DELETE FROM library_contents WHERE id IN (${placeholders})`, input.ids);
  } else if (input.action === "category") {
    await db.execute(`UPDATE library_contents SET category = ? WHERE id IN (${placeholders})`, [input.category ?? null, ...input.ids]);
  } else if (input.action === "visibility") {
    await db.execute(`UPDATE library_contents SET visibility = ? WHERE id IN (${placeholders})`, [JSON.stringify(input.visibility ?? {}), ...input.ids]);
  } else if (input.action === "feature" || input.action === "unfeature") {
    await db.execute(
      `UPDATE library_contents SET flags = JSON_SET(COALESCE(flags, JSON_OBJECT()), '$.featured', ?) WHERE id IN (${placeholders})`,
      [input.action === "feature", ...input.ids],
    );
  } else {
    const status = input.action === "publish" ? "published" : input.action === "archive" ? "archived" : "hidden";
    await db.execute(
      `UPDATE library_contents SET status = ?, published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END WHERE id IN (${placeholders})`,
      [status, status, ...input.ids],
    );
  }
  await audit(req.user!.id, "bulk", "library", undefined, input);
  io.emit("library:changed", { action: "bulk", ids: input.ids });
  res.json({ success: true, affected: input.ids.length });
}));

app.get("/api/admin/dashboard", requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [[overview], [recentUsers], [recentCourses], [recentAudit], memberSegments, reportRows, activityAccess] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'student') totalMembers,
       (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'paid' AND invoice_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) monthlyRevenue,
       (SELECT COALESCE(SUM(views), 0) FROM library_contents) contentViews,
       (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') activeSubscriptions,
       (SELECT COUNT(*) FROM courses) totalCourses,
       (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) unreadNotifications`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, p.display_name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id ORDER BY u.created_at DESC LIMIT 10`,
    ),
    db.execute<RowDataPacket[]>("SELECT * FROM courses ORDER BY updated_at DESC LIMIT 10"),
    db.execute<RowDataPacket[]>(
      `SELECT audit_logs.*, COALESCE(p.display_name, u.email) AS user_name, u.email AS user_email
       FROM audit_logs
       LEFT JOIN users u ON u.id = audit_logs.user_id
       LEFT JOIN profiles p ON p.user_id = audit_logs.user_id
       ORDER BY audit_logs.created_at DESC LIMIT 20`,
    ),
    getAdminMemberSegments(),
    getAdminReportRows(),
    getAdminActivityAccess(),
  ]);
  res.json({
    overview: overview[0],
    recentUsers,
    recentCourses: recentCourses.map(parseJsonFields),
    recentAudit: recentAudit.map(parseJsonFields),
    memberSegments,
    reportRows,
    activityAccess,
  });
}));

app.get("/api/admin/reports/:section", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const sectionMap: Record<string, string> = {
    marketing: "Marketing",
    "admin-section": "Admin",
    revenue: "Revenue",
    analytics: "Analytics",
  };
  const section = sectionMap[routeParam(req.params.section)];
  if (!section) return res.status(404).json({ error: "Unknown admin report section" });
  const [allRows, memberSegments, activityAccess] = await Promise.all([
    getAdminReportRows(),
    getAdminMemberSegments(),
    getAdminActivityAccess(section),
  ]);
  res.json({
    section,
    rows: allRows.filter((row) => row.section === section),
    memberSegments,
    activityAccess,
  });
}));

app.get("/api/admin/users", requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.email, u.role, u.status, u.created_at, u.updated_at,
     p.display_name, p.company, p.phone, p.location, p.member_number
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id ORDER BY u.created_at DESC`,
  );
  res.json(rows);
}));

app.put("/api/admin/users/:id", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    role: z.enum(["student", "admin", "super_admin"]).optional(),
    status: z.enum(["active", "suspended", "pending"]).optional(),
  }).parse(req.body);
  const fields = Object.keys(input);
  if (!fields.length) return res.status(400).json({ error: "No valid fields supplied" });
  await db.execute(`UPDATE users SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`, [...Object.values(input), routeParam(req.params.id)]);
  await audit(req.user!.id, "update", "users", routeParam(req.params.id), input);
  io.emit("users:changed", { id: routeParam(req.params.id) });
  res.json({ id: routeParam(req.params.id), ...input });
}));

app.get("/api/admin/course-dashboard", requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [
    [overviewRows],
    [courseRows],
    [moduleRows],
    [assessmentRows],
    [questionRows],
    [memberRows],
  ] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM courses) totalCourses,
        (SELECT COUNT(*) FROM courses WHERE status = 'published') activeCourses,
        (SELECT COUNT(*) FROM courses WHERE status <> 'published') inactiveCourses,
        (SELECT COUNT(*) FROM courses WHERE price = 0) freeCourses,
        (SELECT COUNT(*) FROM courses WHERE price > 0) paidCourses,
        (SELECT ROUND(COALESCE(AVG(progress), 0), 1) FROM course_enrollments) completionPercentage`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT c.id, c.title, c.category, c.price, c.duration, c.status,
        COUNT(DISTINCT cm.id) totalModules,
        COUNT(DISTINCT ce.user_id) enrolledMembers,
        ROUND(COALESCE(AVG(ce.progress), 0), 1) completionPercentage,
        COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.user_id END) completedMembers,
        COUNT(DISTINCT CASE WHEN ce.status = 'active' THEN ce.user_id END) pendingMembers,
        ROUND(COALESCE(AVG(CASE WHEN ce.status = 'completed'
          THEN TIMESTAMPDIFF(HOUR, ce.enrolled_at, COALESCE(ce.last_viewed_at, NOW())) END), 0), 1) averageCompletionHours
       FROM courses c
       LEFT JOIN course_materials cm ON cm.course_id = c.id
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT cm.id, cm.course_id courseId, c.title courseTitle, cm.title moduleTitle,
        cm.sort_order sortOrder, cm.duration,
        COUNT(DISTINCT ce.user_id) enrolledMembers,
        COUNT(DISTINCT cmp.user_id) completedMembers,
        GREATEST(COUNT(DISTINCT ce.user_id) - COUNT(DISTINCT cmp.user_id), 0) pendingMembers,
        ROUND(CASE WHEN COUNT(DISTINCT ce.user_id) = 0 THEN 0
          ELSE COUNT(DISTINCT cmp.user_id) * 100 / COUNT(DISTINCT ce.user_id) END, 1) completionPercentage,
        ROUND(COALESCE(AVG(TIMESTAMPDIFF(HOUR, ce.enrolled_at, cmp.completed_at)), 0), 1) averageCompletionHours
       FROM course_materials cm
       JOIN courses c ON c.id = cm.course_id
       LEFT JOIN course_enrollments ce ON ce.course_id = cm.course_id
       LEFT JOIN course_module_progress cmp ON cmp.material_id = cm.id AND cmp.user_id = ce.user_id
       GROUP BY cm.id
       ORDER BY c.title, cm.sort_order`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT c.id courseId, c.title courseTitle,
        COUNT(DISTINCT qq.id) totalQuestions,
        COUNT(DISTINCT qa.user_id) attemptedMembers,
        COUNT(DISTINCT CASE WHEN qa.passed = TRUE THEN qa.id END) passedCount,
        COUNT(DISTINCT CASE WHEN qa.passed = FALSE THEN qa.id END) failedCount,
        COUNT(DISTINCT CASE WHEN qa.attempt_number > 1 THEN qa.id END) retakeCount,
        COUNT(DISTINCT ia.id) incorrectAnswers
       FROM courses c
       LEFT JOIN quiz_questions qq ON qq.course_id = c.id AND qq.active = TRUE
       LEFT JOIN quiz_attempts qa ON qa.course_id = c.id
       LEFT JOIN incorrect_answers ia ON ia.course_id = c.id
       GROUP BY c.id
       ORDER BY c.title`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT qq.id, qq.course_id courseId, c.title courseTitle, qq.module_index moduleIndex,
        qq.question_text question, qq.correct_option correctAnswer,
        COUNT(ia.id) wrongAttempts
       FROM quiz_questions qq
       JOIN courses c ON c.id = qq.course_id
       LEFT JOIN incorrect_answers ia
         ON ia.course_id = qq.course_id AND ia.question_text = qq.question_text
       GROUP BY qq.id
       ORDER BY wrongAttempts DESC, c.title, qq.module_index, qq.sort_order`,
    ),
    db.execute<RowDataPacket[]>(
      `SELECT u.id userId, COALESCE(p.display_name, u.email) memberName, u.email,
        CASE WHEN EXISTS (
          SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active' AND s.price > 0
        ) THEN 'Paid' ELSE 'Free' END memberType,
        COUNT(DISTINCT ce.course_id) courseEnrollments,
        ROUND(COALESCE(AVG(ce.progress), 0), 1) averageProgress,
        COUNT(DISTINCT CASE WHEN ce.status = 'active' THEN ce.course_id END) pendingCourses,
        COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.course_id END) completedCourses,
        COUNT(DISTINCT cert.id) completedCertifications
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN course_enrollments ce ON ce.user_id = u.id
       LEFT JOIN certifications cert ON cert.user_id = u.id AND cert.status = 'active'
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    ),
  ]);

  const overview = overviewRows[0] ?? {};
  res.json({
    overview: {
      totalCourses: Number(overview.totalCourses ?? 0),
      activeCourses: Number(overview.activeCourses ?? 0),
      inactiveCourses: Number(overview.inactiveCourses ?? 0),
      freeCourses: Number(overview.freeCourses ?? 0),
      paidCourses: Number(overview.paidCourses ?? 0),
      completionPercentage: Number(overview.completionPercentage ?? 0),
    },
    courses: courseRows,
    modules: moduleRows,
    assessments: assessmentRows,
    questions: questionRows,
    members: memberRows,
  });
}));

app.get("/api/admin/courses/:id/workspace", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const courseId = routeParam(req.params.id);
  const [[courses], [modules], [assessments], [questions], [members], [campaigns], [revenue]] = await Promise.all([
    db.execute<RowDataPacket[]>("SELECT * FROM courses WHERE id = ? LIMIT 1", [courseId]),
    db.execute<RowDataPacket[]>(
      `SELECT cm.*, COUNT(DISTINCT cmp.user_id) completed_members
       FROM course_materials cm LEFT JOIN course_module_progress cmp ON cmp.material_id = cm.id
       WHERE cm.course_id = ? GROUP BY cm.id ORDER BY cm.sort_order`, [courseId],
    ),
    db.execute<RowDataPacket[]>("SELECT * FROM course_assessments WHERE course_id = ? ORDER BY sort_order", [courseId]),
    db.execute<RowDataPacket[]>(
      `SELECT qq.*, COUNT(ia.id) wrong_attempts
       FROM quiz_questions qq LEFT JOIN incorrect_answers ia ON ia.course_id = qq.course_id AND ia.question_text = qq.question_text
       WHERE qq.course_id = ? GROUP BY qq.id ORDER BY qq.module_index, qq.sort_order`, [courseId],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT u.id user_id, u.email, COALESCE(p.display_name, u.email) display_name,
        ce.progress, ce.status, ce.enrolled_at, ce.last_viewed_at,
        CASE WHEN EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id=u.id AND s.status='active' AND s.price>0) THEN 'Paid' ELSE 'Free' END member_type
       FROM course_enrollments ce JOIN users u ON u.id=ce.user_id LEFT JOIN profiles p ON p.user_id=u.id
       WHERE ce.course_id=? ORDER BY ce.enrolled_at DESC`, [courseId],
    ),
    db.execute<RowDataPacket[]>("SELECT * FROM course_notification_campaigns WHERE course_id = ? ORDER BY updated_at DESC", [courseId]),
    db.execute<RowDataPacket[]>(
      `SELECT DATE_FORMAT(ce.enrolled_at, '%Y-%m') month,
        COUNT(*) enrollments, SUM(CASE WHEN c.price > 0 THEN c.price * (1 - c.discount_percent / 100) ELSE 0 END) course_revenue
       FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id
       WHERE ce.course_id=? GROUP BY DATE_FORMAT(ce.enrolled_at, '%Y-%m') ORDER BY month DESC`, [courseId],
    ),
  ]);
  if (!courses[0]) return res.status(404).json({ error: "Course not found" });
  res.json({
    course: parseJsonFields(courses[0]),
    modules: modules.map(parseJsonFields),
    assessments,
    questions: questions.map(parseJsonFields),
    members,
    campaigns: campaigns.map(parseJsonFields),
    revenue,
  });
}));

app.post("/api/admin/courses/:id/duplicate", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const sourceId = routeParam(req.params.id);
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM courses WHERE id=? LIMIT 1", [sourceId]);
  const source = rows[0];
  if (!source) return res.status(404).json({ error: "Course not found" });
  const id = randomUUID();
  const slug = `${source.slug}-copy-${Date.now().toString().slice(-6)}`;
  await db.execute(
    `INSERT INTO courses (id,title,slug,description,level,duration,credits,category,instructor,price,capacity,status,preview_content,thumbnail_url,expiry_date,certificate_template,coupon_code,discount_percent)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,'draft',?,?,?,?,?,?)`,
    [id, `${source.title} Copy`, slug, source.description, source.level, source.duration, source.credits, source.category, source.instructor, source.price, source.capacity, source.preview_content, source.thumbnail_url, source.expiry_date, source.certificate_template, source.coupon_code, source.discount_percent],
  );
  const [modules] = await db.execute<RowDataPacket[]>("SELECT * FROM course_materials WHERE course_id=? ORDER BY sort_order", [sourceId]);
  for (const module of modules) {
    await db.execute(
      "INSERT INTO course_materials (id,course_id,material_type,title,description,content_url,body,duration,sort_order,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [randomUUID(), id, module.material_type, module.title, module.description, module.content_url, module.body, module.duration, module.sort_order, module.status],
    );
  }
  await audit(req.user!.id, "duplicate", "courses", id, { sourceId });
  io.emit("courses:changed", { action: "duplicate", id });
  res.status(201).json({ id });
}));

app.put("/api/admin/courses/:id/status", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({ status: z.enum(["draft", "waiting", "published", "archived"]) }).parse(req.body);
  await db.execute("UPDATE courses SET status=? WHERE id=?", [input.status, routeParam(req.params.id)]);
  await audit(req.user!.id, "status", "courses", routeParam(req.params.id), input);
  io.emit("courses:changed", { action: "status", id: routeParam(req.params.id) });
  res.json(input);
}));

app.post("/api/admin/courses/:id/thumbnail", requireAuth, requireAdmin, courseUpload.single("thumbnail"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "An image file is required" });
  const thumbnailUrl = `/uploads/courses/${req.file.filename}`;
  await db.execute("UPDATE courses SET thumbnail_url=? WHERE id=?", [thumbnailUrl, routeParam(req.params.id)]);
  io.emit("courses:changed", { action: "thumbnail", id: routeParam(req.params.id) });
  res.json({ thumbnailUrl });
}));

app.put("/api/admin/courses/:id/modules/order", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({ ids: z.array(z.string().uuid()) }).parse(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (let index = 0; index < input.ids.length; index += 1) {
      await connection.execute("UPDATE course_materials SET sort_order=? WHERE id=? AND course_id=?", [10000 + index, input.ids[index], routeParam(req.params.id)]);
    }
    for (let index = 0; index < input.ids.length; index += 1) {
      await connection.execute("UPDATE course_materials SET sort_order=? WHERE id=? AND course_id=?", [index, input.ids[index], routeParam(req.params.id)]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  io.emit("course-materials:changed", { action: "reorder", courseId: routeParam(req.params.id) });
  res.json({ success: true });
}));

app.post("/api/admin/courses/:id/questions/bulk", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    mode: z.enum(["append", "upsert", "replace"]).default("upsert"),
    questions: z.array(z.object({
      id: z.string().uuid().optional(),
      module_index: z.coerce.number().int().min(0).default(0),
      question_text: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      correct_option: z.string().min(1),
      explanation: z.string().optional().default(""),
      sort_order: z.coerce.number().int().min(0).optional(),
      active: booleanFromInput.default(true),
    })).min(1),
  }).parse(req.body);
  const courseId = routeParam(req.params.id);
  const connection = await db.getConnection();
  let created = 0;
  let updated = 0;
  try {
    await connection.beginTransaction();
    if (input.mode === "replace") {
      await connection.execute("DELETE FROM quiz_questions WHERE course_id = ?", [courseId]);
    }
    for (let index = 0; index < input.questions.length; index += 1) {
      const question = input.questions[index];
      const sortOrder = question.sort_order ?? index;
      const payload = [
        question.module_index,
        question.question_text,
        JSON.stringify(question.options),
        question.correct_option,
        question.explanation,
        sortOrder,
        question.active,
      ];
      if (input.mode !== "append" && question.id) {
        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE quiz_questions
           SET module_index=?, question_text=?, options=?, correct_option=?, explanation=?, sort_order=?, active=?
           WHERE id=? AND course_id=?`,
          [...payload, question.id, courseId],
        );
        if (result.affectedRows) {
          updated += 1;
          continue;
        }
      }
      if (input.mode === "upsert") {
        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE quiz_questions
           SET module_index=?, options=?, correct_option=?, explanation=?, sort_order=?, active=?
           WHERE course_id=? AND question_text=?`,
          [question.module_index, JSON.stringify(question.options), question.correct_option, question.explanation, sortOrder, question.active, courseId, question.question_text],
        );
        if (result.affectedRows) {
          updated += 1;
          continue;
        }
      }
      await connection.execute(
        `INSERT INTO quiz_questions
         (id, course_id, module_index, question_text, options, correct_option, explanation, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), courseId, ...payload],
      );
      created += 1;
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await audit(req.user!.id, "bulk_questions", "courses", courseId, { mode: input.mode, created, updated });
  io.emit("quiz-questions:changed", { action: "bulk", courseId, created, updated });
  res.json({ success: true, created, updated, total: input.questions.length });
}));

app.post("/api/admin/courses/:id/campaigns", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    campaignType: z.enum(["course_reminder", "pending_reminder", "newsletter"]),
    title: z.string().min(1).max(255),
    message: z.string().min(1).max(5000),
    channels: z.array(z.enum(["email", "whatsapp", "in_app"])).min(1),
    targetStatus: z.string().default("active"),
    status: z.enum(["draft", "sent"]).default("draft"),
  }).parse(req.body);
  const courseId = routeParam(req.params.id);
  const [recipients] = await db.execute<RowDataPacket[]>(
    `SELECT ce.user_id FROM course_enrollments ce WHERE ce.course_id=? AND (?='all' OR ce.status=?)`,
    [courseId, input.targetStatus, input.targetStatus],
  );
  const campaignId = randomUUID();
  await db.execute(
    `INSERT INTO course_notification_campaigns
     (id,course_id,campaign_type,title,message,channels,target_status,status,recipient_count,sent_at,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [campaignId, courseId, input.campaignType, input.title, input.message, JSON.stringify(input.channels), input.targetStatus, input.status, recipients.length, input.status === "sent" ? new Date() : null, req.user!.id],
  );
  if (input.status === "sent") {
    const notificationCategory = input.campaignType === "course_reminder" || input.campaignType === "pending_reminder"
      ? "course_reminders"
      : input.campaignType;
    for (const recipient of recipients) {
      await notifyUser(
        recipient.user_id,
        input.title,
        input.message,
        notificationCategory,
        `/courses/${courseId}`,
        input.channels,
      );
    }
  }
  await audit(req.user!.id, input.status === "sent" ? "send_campaign" : "draft_campaign", "courses", courseId, input);
  res.status(201).json({ id: campaignId, recipients: recipients.length, status: input.status });
}));

app.get("/api/admin/reminders/:courseId", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const threshold = Math.min(100, Math.max(0, Number(req.query.threshold ?? 100)));
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id user_id, u.email, p.display_name, p.phone, ce.progress
     FROM course_enrollments ce
     JOIN users u ON u.id = ce.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE ce.course_id = ? AND ce.status = 'active' AND ce.progress < ?
     ORDER BY ce.progress ASC`,
    [routeParam(req.params.courseId), threshold],
  );
  res.json(rows);
}));

app.post("/api/admin/reminders/:courseId", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({
    userIds: z.array(z.string().uuid()).min(1),
    channels: z.array(z.enum(["email", "whatsapp", "in_app"])).min(1),
    title: z.string().min(1).max(255),
    message: z.string().min(1).max(5000),
  }).parse(req.body);
  for (const userId of input.userIds) {
    await notifyUser(
      userId,
      input.title,
      input.message,
      "course_reminders",
      `/courses/${routeParam(req.params.courseId)}`,
      input.channels,
    );
  }
  await audit(req.user!.id, "send_reminders", "courses", routeParam(req.params.courseId), { recipients: input.userIds.length, channels: input.channels });
  res.status(201).json({ sent: input.userIds.length, channels: input.channels });
}));

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) return;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { id?: string };
    if (payload.id) socket.join(`user:${payload.id}`);
  } catch {
    socket.disconnect();
  }
});

// Serve the production client from the API process for a stable local runtime.
// API and upload requests have already been handled by the routes above.
const clientDirectory = path.resolve("dist");
app.use(express.static(clientDirectory));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return next();
  }
  return res.sendFile(path.join(clientDirectory, "index.html"));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: error.issues });
  const mysqlError = error as { code?: string };
  if (mysqlError.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A record with this value already exists" });
  if (mysqlError.code === "ECONNREFUSED") return res.status(503).json({ error: "MySQL is unavailable" });
  res.status(500).json({ error: "Internal server error" });
});

httpServer.listen(config.port, config.host, () => {
  console.log(`PCMO API running at http://${config.host}:${config.port} (${config.nodeEnv})`);
});
