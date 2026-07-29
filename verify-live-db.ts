import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const queries = [
  ["table_count", "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'"],
  ["users", "SELECT COUNT(*) AS count FROM users"],
  ["courses", "SELECT COUNT(*) AS count FROM courses"],
  ["course_materials", "SELECT COUNT(*) AS count FROM course_materials"],
  ["quiz_questions", "SELECT COUNT(*) AS count FROM quiz_questions"],
  ["website_pages", "SELECT COUNT(*) AS count FROM website_pages"],
  ["audit_records", "SELECT COUNT(*) AS count FROM audit_records"],
];

(async () => {
  try {
    const result: Record<string, number | string> = {};
    for (const [key, query] of queries) {
      try {
        const [rows] = await pool.query(query, [process.env.MYSQL_DATABASE]);
        const row = Array.isArray(rows) ? rows[0] : rows;
        result[key] = typeof row === "object" && row !== null ? (row as any).count ?? "null" : "unexpected";
      } catch (error) {
        result[key] = `ERROR: ${String(error)}`;
      }
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
