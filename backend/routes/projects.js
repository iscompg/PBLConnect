import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all projects (coordinator only)
router.get('/', authenticateToken, authorizeRole(['coordinator']), (req, res) => {
  const query = "SELECT * FROM projects ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Get projects by mentor
router.get('/mentor/:mentorId', authenticateToken, (req, res) => {
  const { mentorId } = req.params;
  // mentorId is the mentor's sno, need to get user.id
  db.query("SELECT Email FROM aiml_mentors WHERE sno = ?", [mentorId], (err, mentorResult) => {
    if (err || mentorResult.length === 0) {
      return res.status(404).json({ error: "Mentor not found" });
    }
    
    const mentorEmail = mentorResult[0].Email;
    
    db.query("SELECT id FROM users WHERE email = ?", [mentorEmail], (err, userResult) => {
      if (err || userResult.length === 0) {
        return res.status(404).json({ error: "Mentor user not found" });
      }
      
      const mentorUserId = userResult[0].id;
      const query = "SELECT * FROM projects WHERE mentor_id = ? ORDER BY created_at DESC";
      db.query(query, [mentorUserId], (err, results) => {
        if (err) {
          console.error("Error fetching projects:", err);
          return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
      });
    });
  });
});

// Get projects by student
router.get('/student/:studentId', authenticateToken, (req, res) => {
  const { studentId } = req.params;
  const query = "SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC";
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Create new project
router.post('/', authenticateToken, authorizeRole(['student']), (req, res) => {
  const { title, description, objectives, timeline, resources, mentor_id } = req.body;
  const student_id = req.user.id;
  const studentEmail = req.user.email;

  console.log("Creating project:", { title, mentor_id, student_id, studentEmail });

  if (!title || !mentor_id) {
    return res.status(400).json({ error: "Title and mentor_id are required" });
  }

  // First verify the student user.id exists
  db.query("SELECT id, email, role FROM users WHERE id = ?", [student_id], (err, studentCheck) => {
    if (err) {
      console.error("Error checking student user:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    if (studentCheck.length === 0) {
      console.error("Student user ID from JWT does not exist:", student_id);
      return res.status(404).json({ error: "Student user not found in database", userId: student_id });
    }
    console.log("Student verified:", studentCheck[0]);

    // mentor_id from frontend is the mentor's sno, need to get user.id from users table
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
        
        const query = `
          INSERT INTO projects (student_id, mentor_id, title, description, objectives, timeline, resources, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `;
        console.log("student_id, mentorUserId, title, description, objectives, timeline, resources", student_id, mentorUserId, title, description, objectives, timeline, resources);
        db.query(query, [student_id, mentorUserId, title, description || null, objectives || null, timeline || null, resources || null], (err, result) => {
          if (err) {
            console.error("Error creating project:", err);
            console.error("SQL Error:", err.sqlMessage);
            console.error("SQL State:", err.sqlState);
            console.error("SQL Code:", err.code);
            return res.status(500).json({ 
              error: "Failed to create project", 
              details: err.message,
              sqlError: err.sqlMessage,
              sqlState: err.sqlState,
              sqlCode: err.code
            });
          }
          console.log("Project created successfully with id:", result.insertId);
          res.status(201).json({
            id: result.insertId,
            message: "Project created successfully"
          });
        });
      });
    });
  });
});

// Update project
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, objectives, timeline, resources, mentor_id, status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Check if user owns the project or is coordinator
  if (userRole === 'coordinator') {
    const query = `
      UPDATE projects SET title = ?, description = ?, objectives = ?, timeline = ?, resources = ?, mentor_id = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const params = [title, description, objectives, timeline, resources, mentor_id, status, id];
    
    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error updating project:", err);
        return res.status(500).json({ error: "Failed to update project" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }
      res.json({ message: "Project updated successfully" });
    });
  } else if (userRole === 'student') {
    const query = `
      UPDATE projects SET title = ?, description = ?, objectives = ?, timeline = ?, resources = ?, mentor_id = ?, updated_at = NOW()
      WHERE id = ? AND student_id = ?
    `;
    const params = [title, description, objectives, timeline, resources, mentor_id, id, userId];
    
    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error updating project:", err);
        return res.status(500).json({ error: "Failed to update project" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Project not found or access denied" });
      }
      res.json({ message: "Project updated successfully" });
    });
  } else if (userRole === 'mentor') {
    const mentorUserId=req.user.id;

    const query = `
    UPDATE projects SET status = ?, updated_at = NOW()
    WHERE id = ? AND mentor_id = ?
    `;
     
    db.query(query, [status, id, mentorUserId], (err, result) => {
      if (err) {
        console.error("Error updating project:", err);
        return res.status(500).json({ error: "Failed to update project" });
      }
      if (result.affectedRows === 0) {
        console.log("mentor upadte failed: ", {
          projectId: id, 
          mentorUserId, 
          tokenUser: req.user
        });

        return res.status(404).json({ message: "Project not found or access denied" });
      }
      res.json({ message: "Project updated successfully" });
    });
  } else {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, authorizeRole(['student', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query, params;
  if (userRole === 'coordinator') {
    query = "DELETE FROM projects WHERE id = ?";
    params = [id];
  } else {
    query = "DELETE FROM projects WHERE id = ? AND student_id = ?";
    params = [id, userId];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error deleting project:", err);
      return res.status(500).json({ error: "Failed to delete project" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Project not found or access denied" });
    }
    res.json({ message: "Project deleted successfully" });
  });
});

export default router;
