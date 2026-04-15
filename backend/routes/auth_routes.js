import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "secret123";


// ✅ VALIDATION FUNCTIONS
function validateEmail(email) {
  // Check if email format is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // Password must be at least 8 characters
  // Must contain: 1 uppercase, 1 lowercase, 1 number
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

// Register (activate existing user)
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const hashed = await bcrypt.hash(password, 10);
  const query = `
    UPDATE users 
    SET password=?, is_activated=1
    WHERE email=?`;

  db.query(query, [hashed, email], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "User not found. Contact admin." });
    res.json({ message: "Account activated successfully" });
  });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email=?", [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    if (!user.is_activated)
      return res.status(403).json({ error: "Account not activated" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: user.id, role: user.role });
  });
});

export default router;
