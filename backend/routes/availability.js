import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get availability slots for a mentor
router.get('/mentor/:mentorId', authenticateToken, (req, res) => {
  const { mentorId } = req.params;
  
  // mentorId is the mentor's sno from frontend, need to get user.id
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
      const query = "SELECT * FROM availability WHERE mentor_id = ? ORDER BY day, start_time";
      
      db.query(query, [mentorUserId], (err, results) => {
        if (err) {
          console.error("Error fetching availability:", err);
          return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
      });
    });
  });
});

// Create new availability slot
router.post('/', authenticateToken, authorizeRole(['mentor']), (req, res) => {
  const { day, start_time, end_time, location } = req.body;
  const mentorUserId = req.user.id;

  console.log("Creating availability slot for mentor user.id:", mentorUserId);

  if (!day || !start_time || !end_time) {
    return res.status(400).json({ error: "Day, start_time, and end_time are required" });
  }

  // Validate day is correct enum value
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (!validDays.includes(day)) {
    return res.status(400).json({ error: "Invalid day. Must be Monday-Sunday" });
  }

  const query = `
    INSERT INTO availability (mentor_id, day, start_time, end_time, location, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'free', NOW())
  `;

  db.query(query, [mentorUserId, day, start_time, end_time, location || null], (err, result) => {
    if (err) {
      console.error("Error creating availability slot:", err);
      return res.status(500).json({ 
        error: "Failed to create availability slot", 
        details: err.message
      });
    }
    
    console.log("Availability slot created successfully with id:", result.insertId);
    res.status(201).json({
      id: result.insertId,
      message: "Availability slot created successfully"
    });
  });
});

// ✅ UPDATE WITH TRANSACTION TO PREVENT RACE CONDITIONS
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { day, start_time, end_time, location, status } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'mentor') {
    // Mentor updating their own slot
    const query = `
      UPDATE availability 
      SET day = ?, start_time = ?, end_time = ?, location = ?, status = ?
      WHERE id = ? AND mentor_id = ?
    `;
    const params = [day, start_time, end_time, location, status, id, userId];

    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error updating availability slot:", err);
        return res.status(500).json({ error: "Failed to update availability slot" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Slot not found or access denied" });
      }
      res.json({ message: "Availability slot updated successfully" });
    });

  } else if (userRole === 'student') {
    // ✅ STUDENT BOOKING - WITH TRANSACTION
    const studentUserId = userId;

    // Start a transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error("Transaction error:", err);
        return res.status(500).json({ error: "Failed to start transaction" });
      }

      // Lock the row and check if it's still free
      const checkQuery = `
        SELECT * FROM availability 
        WHERE id = ? AND status = 'free'
        FOR UPDATE
      `;
      
      db.query(checkQuery, [id], (err, slots) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error checking slot:", err);
            res.status(500).json({ error: "Failed to check slot availability" });
          });
        }

        // Check if slot exists and is free
        if (slots.length === 0) {
          return db.rollback(() => {
            res.status(404).json({ 
              message: "Slot not found or already booked by someone else" 
            });
          });
        }

        // Slot is free, book it
        const bookQuery = `
          UPDATE availability 
          SET status = 'booked', student_id = ?
          WHERE id = ? AND status = 'free'
        `;
        
        db.query(bookQuery, [studentUserId, id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error booking slot:", err);
              res.status(500).json({ error: "Failed to book slot" });
            });
          }

          if (result.affectedRows === 0) {
            return db.rollback(() => {
              res.status(404).json({ 
                message: "Slot was just booked by someone else" 
              });
            });
          }

          // Commit the transaction
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error:", err);
                res.status(500).json({ error: "Failed to complete booking" });
              });
            }

            console.log(`Slot ${id} booked successfully by student ${studentUserId}`);
            res.json({ message: "Slot booked successfully" });
          });
        });
      });
    });

  } else {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
});

// Delete availability slot
router.delete('/:id', authenticateToken, authorizeRole(['mentor']), (req, res) => {
  const { id } = req.params;
  const mentorUserId = req.user.id;

  const query = "DELETE FROM availability WHERE id = ? AND mentor_id = ?";
  
  db.query(query, [id, mentorUserId], (err, result) => {
    if (err) {
      console.error("Error deleting availability slot:", err);
      return res.status(500).json({ error: "Failed to delete availability slot" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Slot not found or access denied" });
    }
    res.json({ message: "Availability slot deleted successfully" });
  });
});

export default router;