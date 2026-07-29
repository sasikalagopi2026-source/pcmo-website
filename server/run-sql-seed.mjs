import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const source = process.argv[2];
if (!source) throw new Error("Provide a SQL seed file path");
const sql = await readFile(source, "utf8");
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "pcmo",
  multipleStatements: true,
});
try {
  await connection.query(sql);
  console.log(`Applied ${source}`);
} finally {
  await connection.end();
}
