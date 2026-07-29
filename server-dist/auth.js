import jwt from "jsonwebtoken";
import { config } from "./config.js";
export const signToken = (user) => jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
export const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token)
        return res.status(401).json({ error: "Authentication required" });
    try {
        req.user = jwt.verify(token, config.jwtSecret);
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired session" });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
        return res.status(403).json({ error: "Administrator access required" });
    }
    next();
};
//# sourceMappingURL=auth.js.map