// coordinator_routes.js
import express from "express";
import db from "../db.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET ALL STUDENTS
router.get("/students", authenticateToken, authorizeRole(["coordinator"]), (req, res) => {
  const query = "SELECT * FROM aiml_students ORDER BY studentname";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ error: "Database query failed", details: err.message });
    }
    res.json(results);
  });
});

// ✅ GET ALL MENTORS
router.get("/mentors", authenticateToken, authorizeRole(["coordinator"]), (req, res) => {
  const query = "SELECT * FROM aiml_mentors ORDER BY facultyname";
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching mentors:", err);
      return res.status(500).json({ error: "Database query failed", details: err.message });
    }
    res.json(results);
  });
});

// ✅ GET ALL PROJECTS WITH STUDENT AND MENTOR DETAILS
router.get("/projects", authenticateToken, authorizeRole(["coordinator"]), (req, res) => {
  // This query joins 3 tables to get complete information
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.status,
      p.created_at,
      p.updated_at,
      s.studentname,
      s.Email as student_email,
      m.facultyname,
      m.Email as mentor_email
    FROM projects p
    LEFT JOIN users u_student ON p.student_id = u_student.id
    LEFT JOIN aiml_students s ON u_student.email = s.Email
    LEFT JOIN users u_mentor ON p.mentor_id = u_mentor.id
    LEFT JOIN aiml_mentors m ON u_mentor.email = m.Email
    ORDER BY p.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({ error: "Database query failed", details: err.message });
    }
    res.json(results);
  });
});

// ✅ GET DASHBOARD STATISTICS
router.get("/stats", authenticateToken, authorizeRole(["coordinator"]), (req, res) => {
  // Count students
  db.query("SELECT COUNT(*) as count FROM aiml_students", (err, studentCount) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    // Count mentors
    db.query("SELECT COUNT(*) as count FROM aiml_mentors", (err, mentorCount) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch stats" });
      }

      // Count projects
      db.query("SELECT COUNT(*) as count FROM projects", (err, projectCount) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch stats" });
        }

        // Count pending projects
        db.query("SELECT COUNT(*) as count FROM projects WHERE status='pending'", (err, pendingCount) => {
          if (err) {
            return res.status(500).json({ error: "Failed to fetch stats" });
          }

          res.json({
            totalStudents: studentCount[0].count,
            totalMentors: mentorCount[0].count,
            totalProjects: projectCount[0].count,
            pendingProjects: pendingCount[0].count
          });
        });
      });
    });
  });
});

export default router;