// routes/operations.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware'); // ensure user login middleware

// ✅ GET all operations for logged-in user's branch
router.get('/', auth, async (req, res) => {
    const branch_id = req.user.branch_id; // automatically fetch from logged-in user
    try {
        const [rows] = await pool.query(
            'SELECT * FROM operations WHERE branch_id = ? ORDER BY id ASC',
            [branch_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching operations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ POST to add a new operation with duplicate check within the branch
router.post('/add', auth, async (req, res) => {
    const branch_id = req.user.branch_id; // auto branch_id
    const { name } = req.body;
    
    try {
        // Step 1: Check if an operation with the same name already exists in this branch
        const [existing] = await pool.query(
            'SELECT COUNT(*) AS count FROM operations WHERE name = ? AND branch_id = ?',
            [name, branch_id]
        );

        // Agar count 0 se zyada hai to iska matlab duplicate exist karta hai
        if (existing[0].count > 0) {
            return res.status(409).json({ message: 'An operation with this name already exists in your branch.' });
        }
        
        // Step 2: Agar duplicate nahi hai, to naya operation add karein
        const [result] = await pool.query(
            'INSERT INTO operations (name, branch_id) VALUES (?, ?)',
            [name, branch_id]
        );
        
        res.status(201).json({
            message: 'Operation added successfully!',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error adding operation:', error);
        // Database level error handling for safety
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Operation with this name already exists in your branch.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ PUT to update an existing operation (branch_id auto)
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const branch_id = req.user.branch_id;
    try {
        await pool.query(
            'UPDATE operations SET name = ? WHERE id = ? AND branch_id = ?',
            [name, id, branch_id]
        );
        res.json({ message: 'Operation updated successfully!' });
    } catch (error) {
        console.error('Error updating operation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ DELETE an operation (branch_id auto)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const branch_id = req.user.branch_id;
    try {
        await pool.query(
            'DELETE FROM operations WHERE id = ? AND branch_id = ?',
            [id, branch_id]
        );
        res.json({ message: 'Operation deleted successfully!' });
    } catch (error) {
        console.error('Error deleting operation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
