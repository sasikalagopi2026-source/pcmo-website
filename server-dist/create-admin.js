import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db.js";
const input = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2),
}).parse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    displayName: process.env.ADMIN_DISPLAY_NAME,
});
const userId = randomUUID();
const passwordHash = await bcrypt.hash(input.password, 12);
const connection = await db.getConnection();
try {
    await connection.beginTransaction();
    await connection.execute(`INSERT INTO users (id, email, password_hash, role, status)
     VALUES (?, ?, ?, 'super_admin', 'active')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'super_admin', status = 'active'`, [userId, input.email.toLowerCase(), passwordHash]);
    const [users] = await connection.execute("SELECT id FROM users WHERE email = ?", [input.email.toLowerCase()]);
    const actualUserId = users[0].id;
    await connection.execute(`INSERT INTO profiles (id, user_id, display_name, member_number)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)`, [randomUUID(), actualUserId, input.displayName, `ADMIN-${Date.now().toString().slice(-8)}`]);
    await connection.commit();
    console.log(`Super admin ready: ${input.email}`);
}
catch (error) {
    await connection.rollback();
    throw error;
}
finally {
    connection.release();
    await db.end();
}
//# sourceMappingURL=create-admin.js.map