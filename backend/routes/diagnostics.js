import express from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Diagnostic endpoint to check user data
router.get("/user-check", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  const userRole = req.user.role;

  console.log("Diagnostic check for user:", { userId, userEmail, userRole });

  // Check if user exists in users table
  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, userResult) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    if (userResult.length === 0) {
      return res.json({
        status: "error",
        message: "User ID from JWT does not exist in users table",
        userId,
        userEmail,
        userRole
      });
    }

    const user = userResult[0];

    // Check if mentor exists in aiml_mentors
    if (userRole === "mentor") {
      db.query("SELECT * FROM aiml_mentors WHERE Email = ? OR LOWER(Email) = LOWER(?)", [userEmail, userEmail], (err, mentorResult) => {
        if (err) {
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        return res.json({
          status: "ok",
          user: user,
          mentor: mentorResult.length > 0 ? mentorResult[0] : null,
          message: mentorResult.length > 0 ? "Mentor found" : "Mentor not found in aiml_mentors table"
        });
      });
    } else if (userRole === "student") {
      db.query("SELECT * FROM aiml_students WHERE Email = ? OR LOWER(Email) = LOWER(?)", [userEmail, userEmail], (err, studentResult) => {
        if (err) {
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        return res.json({
          status: "ok",
          user: user,
          student: studentResult.length > 0 ? studentResult[0] : null,
          message: studentResult.length > 0 ? "Student found" : "Student not found in aiml_students table"
        });
      });
    } else {
      res.json({
        status: "ok",
        user: user,
        message: "User found"
      });
    }
  });
});

export default router;

