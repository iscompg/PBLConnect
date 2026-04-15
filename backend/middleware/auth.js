import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "secret123";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error("JWT verification failed:", err);
      return res.status(403).json({ error: "Invalid token" });
    }
    console.log("✅ Token verified:", user); // Debug line
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    console.log("❌ Unauthorized role:", req.user);
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};
