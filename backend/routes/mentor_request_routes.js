// mentor_request_routes.js
import express from "express";
import db from "../db.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// Create mentor request
router.post("/", authenticateToken, authorizeRole(["student"]), (req, res) => {
  const studentId = req.user.id;
  const { mentor_id, project_title, project_id, student_name, student_email } = req.body;
  
  console.log("Creating mentor request:", { studentId, mentor_id, project_title });
  
  if (!mentor_id || !project_title) {
    return res.status(400).json({ error: "Mentor ID and project title are required" });
  }

  // mentor_id from frontend is the mentor's sno, need to get user.id
  db.query("SELECT Email FROM aiml_mentors WHERE sno = ?", [mentor_id], (err, mentorResult) => {
    if (err) {
      console.error("Error finding mentor by sno:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    if (mentorResult.length === 0) {
      console.error("Mentor not found with sno:", mentor_id);
      return res.status(400).json({ error: "Mentor not found" });
    }
    
    const mentorEmail = mentorResult[0].Email;
    console.log("Found mentor email:", mentorEmail);
    
    // Get user.id for this mentor
    db.query("SELECT id FROM users WHERE email = ? OR LOWER(email) = LOWER(?)", [mentorEmail, mentorEmail], (err, userResult) => {
      if (err) {
        console.error("Error finding mentor user:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (userResult.length === 0) {
        console.error("Mentor user not found for email:", mentorEmail);
        return res.status(400).json({ error: "Mentor user not found", email: mentorEmail });
      }
      
      const mentorUserId = userResult[0].id;
      console.log("Found mentor user.id:", mentorUserId);
      
      // Get student info if not provided
      const finalStudentEmail = student_email || req.user.email;
      
      if (!student_name) {
        // Fetch student name from database
        db.query("SELECT studentname, Email FROM aiml_students WHERE Email = ? OR LOWER(Email) = LOWER(?)", [req.user.email, req.user.email], (err, results) => {
          if (err) {
            console.error("Error fetching student info:", err);
            return res.status(500).json({ error: "Could not fetch student information", details: err.message });
          }
          if (results.length === 0) {
            console.error("Student not found for email:", req.user.email);
            return res.status(404).json({ error: "Student not found" });
          }
          
          const finalStudentName = results[0].studentname;
          createRequest(finalStudentName, finalStudentEmail, mentorUserId);
        });
      } else {
        createRequest(student_name, finalStudentEmail, mentorUserId);
      }
    });
  });
  
  function createRequest(finalStudentName, finalStudentEmail, mentorUserId) {
    const query = `
      INSERT INTO mentor_requests (student_id, mentor_id, project_id, project_title, student_name, student_email, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;
    
    console.log("Creating mentor request with:", { studentId, mentorUserId, project_title, finalStudentName });
    
    db.query(query, [studentId, mentorUserId, project_id || null, project_title, finalStudentName, finalStudentEmail], (err, result) => {
      if (err) {
        console.error("Error creating mentor request:", err);
        return res.status(500).json({ error: "Failed to create request", details: err.message });
      }
      console.log("Mentor request created successfully with id:", result.insertId);
      res.json({ message: "Request sent successfully", id: result.insertId });
    });
  }
});

// Get mentor requests for a student
router.get("/student/:studentId", authenticateToken, (req, res) => {
  const { studentId } = req.params;
  const query = "SELECT * FROM mentor_requests WHERE student_id = ? ORDER BY created_at DESC";
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Error fetching mentor requests:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Get mentor requests for a mentor
router.get("/mentor/:mentorId", authenticateToken, (req, res) => {
  const { mentorId } = req.params;
  const query = "SELECT * FROM mentor_requests WHERE mentor_id = ? ORDER BY created_at DESC";
  db.query(query, [mentorId], (err, results) => {
    if (err) {
      console.error("Error fetching mentor requests:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Update mentor request status
router.put("/:id", authenticateToken, authorizeRole(["mentor"]), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'accepted' or 'rejected'" });
  }
  
  // Get mentor's user.id from email
  db.query("SELECT id FROM users WHERE email = ?", [req.user.email], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(404).json({ error: "Mentor user not found" });
    }
    
    const mentorUserId = userResult[0].id;
    
    const query = `
      UPDATE mentor_requests 
      SET status = ?
      WHERE id = ? AND mentor_id = ?
    `;
    
    db.query(query, [status, id, mentorUserId], (err, result) => {
      if (err) {
        console.error("Error updating mentor request:", err);
        return res.status(500).json({ error: "Failed to update request" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Request not found or access denied" });
      }
      res.json({ message: "Request updated successfully" });
    });
  });
});

export default router;