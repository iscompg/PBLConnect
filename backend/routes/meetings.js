import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get meetings for a student
router.get('/student/:studentId', authenticateToken, (req, res) => {
  const { studentId } = req.params;
  const query = "SELECT * FROM meetings WHERE student_id = ? ORDER BY date DESC";
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error("Error fetching meetings:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Get meetings for a mentor
router.get('/mentor/:mentorId', authenticateToken, (req, res) => {
  const { mentorId } = req.params;
  const query = "SELECT * FROM meetings WHERE mentor_id = ? ORDER BY date DESC";
  db.query(query, [mentorId], (err, results) => {
    if (err) {
      console.error("Error fetching meetings:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json(results);
  });
});

// Create new meeting
router.post('/', authenticateToken, (req, res) => {
  const { student_id, mentor_id, meeting_date, meeting_time, location, topic, notes } = req.body;

  const query = `
    INSERT INTO meetings (student_id, mentor_id, meeting_date, meeting_time, location, topic, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())
  `;

  db.query(query, [student_id, mentor_id, meeting_date, meeting_time, location, topic, notes], (err, result) => {
    if (err) {
      console.error("Error creating meeting:", err);
      return res.status(500).json({ error: "Failed to create meeting" });
    }
    res.status(201).json({
      id: result.insertId,
      message: "Meeting created successfully"
    });
  });
});

// Update meeting
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { meeting_date, meeting_time, location, topic, notes, status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query, params;
  if (userRole === 'coordinator') {
    query = `
      UPDATE meetings SET meeting_date = ?, meeting_time = ?, location = ?, topic = ?, notes = ?, status = ?
      WHERE id = ?
    `;
    params = [meeting_date, meeting_time, location, topic, notes, status, id];
  } else {
    query = `
      UPDATE meetings SET meeting_date = ?, meeting_time = ?, location = ?, topic = ?, notes = ?, status = ?
      WHERE id = ? AND (student_id = ? OR mentor_id = ?)
    `;
    params = [date, time, location, topic, notes, status, id, userId, userId];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error updating meeting:", err);
      return res.status(500).json({ error: "Failed to update meeting" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meeting not found or access denied" });
    }
    res.json({ message: "Meeting updated successfully" });
  });
});

// Delete meeting
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query, params;
  if (userRole === 'coordinator') {
    query = "DELETE FROM meetings WHERE id = ?";
    params = [id];
  } else {
    query = "DELETE FROM meetings WHERE id = ? AND (student_id = ? OR mentor_id = ?)";
    params = [id, userId, userId];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error deleting meeting:", err);
      return res.status(500).json({ error: "Failed to delete meeting" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meeting not found or access denied" });
    }
    res.json({ message: "Meeting deleted successfully" });
  });
});

export default router;
