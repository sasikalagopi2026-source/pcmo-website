import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "./config.js";
const connection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: true,
});
try {
    const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
    await connection.query(schema);
    console.log(`MySQL schema applied to ${config.mysql.database}`);
}
finally {
    await connection.end();
}
