// routes/ranges.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Import your MySQL connection pool
const auth = require('../middleware/authMiddleware'); // Authentication middleware

// ✅ GET all ranges for the logged-in user's branch
router.get('/', auth, async (req, res) => {
    // Get branch_id from the authenticated user
    const branch_id = req.user.branch_id;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM ranges WHERE branch_id = ? ORDER BY id ASC',
            [branch_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching ranges:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ POST to add a new range, allowing overlaps
router.post('/add', auth, async (req, res) => {
    const branch_id = req.user.branch_id;
    const { startRange, endRange } = req.body;
    
    try {
        // Step 1: Check if the exact range already exists.
        // This is not an overlap check, but a check for a duplicate row.
        const [existing] = await pool.query(
            'SELECT COUNT(*) AS count FROM ranges WHERE startRange = ? AND endRange = ? AND branch_id = ?',
            [startRange, endRange, branch_id]
        );

        if (existing[0].count > 0) {
            return res.status(409).json({ message: 'This exact range already exists in your branch.' });
        }
        
        // Step 2: Insert the new range without checking for overlaps.
        const [result] = await pool.query(
            'INSERT INTO ranges (startRange, endRange, branch_id) VALUES (?, ?, ?)',
            [startRange, endRange, branch_id]
        );
        
        res.status(201).json({
            message: 'Range added successfully!',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error adding range:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ PUT to update an existing range
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { startRange, endRange } = req.body;
    const branch_id = req.user.branch_id;
    try {
        const [result] = await pool.query(
            'UPDATE ranges SET startRange = ?, endRange = ? WHERE id = ? AND branch_id = ?',
            [startRange, endRange, id, branch_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Range not found or you do not have permission to update it.' });
        }
        
        res.json({ message: 'Range updated successfully!' });
    } catch (error) {
        console.error('Error updating range:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ DELETE a range
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const branch_id = req.user.branch_id;
    try {
        const [result] = await pool.query(
            'DELETE FROM ranges WHERE id = ? AND branch_id = ?',
            [id, branch_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Range not found or you do not have permission to delete it.' });
        }
        
        res.json({ message: 'Range deleted successfully!' });
    } catch (error) {
        console.error('Error deleting range:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
