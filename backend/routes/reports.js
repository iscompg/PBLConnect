// reports.js
import express from "express";
import multer from "multer";
import db from "../db.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload report
router.post("/upload", authenticateToken, authorizeRole(["student"]), upload.single("report"), (req, res) => {
  console.log("Report upload request received");
  console.log("File:", req.file);
  console.log("Body:", req.body);
  
  if (!req.file) {
    console.error("No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const studentId = req.user.id;
  const studentEmail = req.user.email;
  const { title, description, type } = req.body;
  const file_path = req.file.path;
  
  console.log("Uploading report for student:", studentId, "email:", studentEmail, "File:", file_path);
  
  // First verify the student user.id exists
  db.query("SELECT id, email, role FROM users WHERE id = ?", [studentId], (err, userCheck) => {
    if (err) {
      console.error("Error checking student user:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    if (userCheck.length === 0) {
      console.error("Student user ID from JWT does not exist:", studentId);
      return res.status(404).json({ error: "Student user not found in database", userId: studentId });
    }
    console.log("Student verified:", userCheck[0]);
  
    const query = `
      INSERT INTO reports (student_id, title, description, type, file_url, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `;
    
    db.query(query, [studentId, title || req.file.originalname, description || "", type || "progress", file_url], (err, result) => {
    if (err) {
      console.error("Error uploading report:", err);
      console.error("SQL Error:", err.sqlMessage);
      console.error("SQL State:", err.sqlState);
      console.error("SQL Code:", err.code);
      console.error("Student ID used:", studentId);
      return res.status(500).json({ 
        error: "Upload failed", 
        details: err.message,
        sqlError: err.sqlMessage,
        sqlState: err.sqlState,
        sqlCode: err.code,
        studentId: studentId
      });
    }
      console.log("Report uploaded successfully with id:", result.insertId);
      res.json({ message: "Report uploaded successfully", id: result.insertId });
    });
  });
});

// Get reports for student
router.get("/student/:studentId", authenticateToken, (req, res) => {
  const { studentId } = req.params;
  const query = "SELECT * FROM reports WHERE student_id = ? ORDER BY submitted_at DESC";
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Error fetching reports:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Get all reports (for mentors/coordinators)
router.get("/", authenticateToken, authorizeRole(["mentor", "coordinator"]), (req, res) => {
  const query = "SELECT * FROM reports ORDER BY submitted_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching reports:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Update report status (for mentors/coordinators)
router.put("/:id", authenticateToken, authorizeRole(["mentor", "coordinator"]), (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;
  
  const query = `
    UPDATE reports 
    SET status = ?, feedback = ?, reviewed_at = NOW()
    WHERE id = ?
  `;
  
  db.query(query, [status, feedback || null, id], (err, result) => {
    if (err) {
      console.error("Error updating report:", err);
      return res.status(500).json({ error: "Failed to update report" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json({ message: "Report updated successfully" });
  });
});

export default router;