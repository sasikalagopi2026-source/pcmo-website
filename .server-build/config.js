import "dotenv/config";
const required = (name, fallback) => {
    const value = process.env[name] ?? fallback;
    if (!value)
        throw new Error(`Missing required environment variable: ${name}`);
    return value;
};
export const config = {
    port: Number(process.env.API_PORT ?? 3001),
    clientOrigins: (process.env.CLIENT_ORIGIN ?? "http://localhost:8080,http://127.0.0.1:8080").split(","),
    clientUrl: (process.env.CLIENT_URL ?? (process.env.CLIENT_ORIGIN ?? "http://localhost:8080").split(",")[0]).replace(/\/$/, ""),
    jwtSecret: required("JWT_SECRET", "change-this-development-secret"),
    mysql: {
        host: required("MYSQL_HOST", "127.0.0.1"),
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: required("MYSQL_USER", "root"),
        password: process.env.MYSQL_PASSWORD ?? "",
        database: required("MYSQL_DATABASE", "pcmo"),
        connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
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
