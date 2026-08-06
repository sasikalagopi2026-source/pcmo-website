import "dotenv/config";

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const required = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const requiredInProduction = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (isProduction && (!process.env[name] || !value || value === fallback)) {
    throw new Error(`Missing production environment variable: ${name}`);
  }
  return value ?? "";
};

const positiveNumber = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Environment variable ${name} must be a positive number`);
  return value;
};

export const config = {
  nodeEnv,
  isProduction,
  host: process.env.API_HOST ?? "127.0.0.1",
  port: positiveNumber("API_PORT", 3001),
  clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:8080,http://127.0.0.1:8080").split(",").map((origin) => origin.trim()).filter(Boolean),
  clientUrl: (process.env.CLIENT_URL ?? (process.env.CLIENT_ORIGIN ?? "http://localhost:8080").split(",")[0]).replace(/\/$/, ""),
  activityNotifications: {
    recipient: process.env.ACTIVITY_NOTIFICATION_EMAIL ?? "sasikala@petrocontracts.com",
  },
  email: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpSecure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    fromAddress: process.env.EMAIL_FROM ?? `no-reply@${(process.env.CLIENT_URL ?? "pcmo.world").replace(/^https?:\/\//, "")}`,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    whatsappFrom: process.env.WHATSAPP_FROM ?? "",
  },
  jwtSecret: requiredInProduction("JWT_SECRET", "change-this-development-secret"),
  mysql: {
    host: requiredInProduction("MYSQL_HOST", "127.0.0.1"),
    port: positiveNumber("MYSQL_PORT", 3306),
    user: requiredInProduction("MYSQL_USER", "root"),
    password: requiredInProduction("MYSQL_PASSWORD", ""),
    database: requiredInProduction("MYSQL_DATABASE", "pcmo"),
    connectionLimit: positiveNumber("MYSQL_CONNECTION_LIMIT", 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
    autoReplyEnabled: (process.env.OPENAI_AUTO_REPLY_ENABLED ?? "true").toLowerCase() === "true",
  },
};
