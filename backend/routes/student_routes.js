import express from "express";
import db from "../db.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// ✅ Get logged-in student info
router.get("/me", authenticateToken, authorizeRole(["student"]), (req, res) => {
  const query = "SELECT * FROM aiml_students WHERE Email = ?";
  db.query(query, [req.user.email], (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    if (results.length === 0)
      return res.status(404).json({ error: "Student not found" });
    res.json(results[0]);
  });
});

// ✅ Get all mentors list
router.get("/mentors", authenticateToken, authorizeRole(["student"]), (req, res) => {
  const query = "SELECT sno, facultyname, specialization, Email FROM aiml_mentors";
  db.query(query, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

export default router;
