import mysql from "mysql2/promise";
import { config } from "./config.js";
export const db = mysql.createPool({
    ...config.mysql,
    waitForConnections: true,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true,
});
export const pingDatabase = async () => {
    const connection = await db.getConnection();
    try {
        await connection.ping();
    }
    finally {
        connection.release();
    }
};
//# sourceMappingURL=db.js.map