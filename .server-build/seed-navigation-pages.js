import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "./config.js";
const connection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    multipleStatements: true,
});
try {
    const sql = await readFile(new URL("./seed-navigation-pages.sql", import.meta.url), "utf8");
    await connection.query(sql);
    console.log("Navigation detail pages seeded without overwriting existing records");
}
finally {
    await connection.end();
}
