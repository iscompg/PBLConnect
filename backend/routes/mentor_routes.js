import express from "express";
import db from "../db.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

// Fetch mentor info
router.get("/me", authenticateToken, authorizeRole(["mentor"]), (req, res) => {
  const userEmail = req.user.email;
  const userId = req.user.id;
  console.log("Fetching mentor for email:", userEmail, "user.id:", userId);
  
  // First, let's check what emails exist in aiml_mentors
  db.query("SELECT Email FROM aiml_mentors LIMIT 5", (err, sampleEmails) => {
    if (!err) {
      console.log("Sample emails in aiml_mentors:", sampleEmails.map(e => e.Email));
    }
  });
  
  // Try multiple variations of email matching
  const query = "SELECT * FROM aiml_mentors WHERE Email = ? OR email = ? OR LOWER(Email) = LOWER(?) OR TRIM(LOWER(Email)) = TRIM(LOWER(?))";
  db.query(query, [userEmail, userEmail, userEmail, userEmail], (err, result) => {
    if (err) {
      console.error("Database error fetching mentor:", err);
      console.error("SQL Error:", err.sqlMessage);
      return res.status(500).json({ error: "Database query failed", details: err.message, sqlError: err.sqlMessage });
    }
    if (result.length === 0) {
      console.error("Mentor not found for email:", userEmail);
      // Try to find any mentor with similar email
      db.query("SELECT Email FROM aiml_mentors WHERE Email LIKE ?", [`%${userEmail.split('@')[0]}%`], (err, similar) => {
        if (!err && similar.length > 0) {
          console.log("Similar emails found:", similar.map(e => e.Email));
        }
      });
      return res.status(404).json({ error: "Mentor not found", email: userEmail, hint: "Check if email in users table matches Email in aiml_mentors table" });
    }
    console.log("Mentor found:", result[0].facultyname);
    res.json(result[0]);
  });
});


// List mentors for student dashboard
router.get("/", (req, res) => {
  const query = "SELECT sno, facultyname, specialization, Email FROM aiml_mentors";
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    res.json(result);
  });
});

// Update mentor specialty
router.put("/specialty", authenticateToken, authorizeRole(["mentor"]), (req, res) => {
  const { specialization } = req.body;
  const mentorEmail = req.user.email;

  if (!specialization) {
    return res.status(400).json({ error: "Specialization is required" });
  }

  const query = "UPDATE aiml_mentors SET specialization = ? WHERE Email = ?";
  db.query(query, [specialization, mentorEmail], (err, result) => {
    if (err) {
      console.error("Error updating specialty:", err);
      return res.status(500).json({ error: "Failed to update specialty" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    res.json({ message: "Specialty updated successfully" });
  });
});

// Get mentor statistics (students count, slots remaining)
router.get("/stats", authenticateToken, authorizeRole(["mentor"]), (req, res) => {
  const mentorEmail = req.user.email;

  // Get mentor's user.id and sno
  db.query("SELECT id FROM users WHERE email = ?", [mentorEmail], (err, userResult) => {
    if (err || userResult.length === 0) {
      return res.status(500).json({ error: "Mentor user not found" });
    }
    const mentorUserId = userResult[0].id;

    // Count accepted students (mentor_requests uses user.id)
    db.query(
      "SELECT COUNT(*) as studentCount FROM mentor_requests WHERE mentor_id = ? AND status = 'accepted'",
      [mentorUserId],
      (err, studentCountResult) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch stats" });
        }

        // Count booked slots (availability uses users.id)
        db.query(
          "SELECT COUNT(*) as bookedSlots FROM availability WHERE mentor_id = ? AND status = 'booked'",
          [mentorUserId],
          (err, slotsResult) => {
            if (err) {
              return res.status(500).json({ error: "Failed to fetch stats" });
            }

            const studentCount = studentCountResult[0].studentCount;
            const bookedSlots = slotsResult[0].bookedSlots;
            const remainingSlots = Math.max(0, 15 - bookedSlots);

            res.json({
              studentsCount: studentCount,
              bookedSlots: bookedSlots,
              remainingSlots: remainingSlots,
              totalSlots: 15
            });
          }
        );
      }
    );
  });
});

// Get mentor by ID (for frontend compatibility)
router.get("/:mentorId", authenticateToken, (req, res) => {
  const query = "SELECT * FROM aiml_mentors WHERE sno=?";
  db.query(query, [req.params.mentorId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database query failed" });
    if (result.length === 0) return res.status(404).json({ error: "Mentor not found" });
    res.json(result[0]);
  });
});

export default router;
