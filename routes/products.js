// routes/products.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET endpoint to retrieve all products for a specific branch
router.get('/', async (req, res) => {
    const { branch_id } = req.query; // Get branch_id from query parameters
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE branch_id = ?', [branch_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { product_name, fabric_type, operations, branch_id } = req.body;

        if (!product_name || !fabric_type || !operations || !branch_id) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        
        // Operations ko JSON string me convert karenge
        const operationsJson = JSON.stringify(operations);

        await pool.query(
            'INSERT INTO products (branch_id, product_name, fabric_type, operations) VALUES (?, ?, ?, ?)',
            [branch_id, product_name, fabric_type, operationsJson]
        );

        res.status(201).json({ message: 'Product added successfully!' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT endpoint to update an existing product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { product_name, fabric_type, operations, branch_id } = req.body; 
    
    try {
        const operationsJson = JSON.stringify(operations);
        await pool.query(
            'UPDATE products SET product_name = ?, fabric_type = ?, operations = ? WHERE id = ? AND branch_id = ?',
            [product_name, fabric_type, operationsJson, id, branch_id]
        );
        res.json({ message: 'Product updated successfully!' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE an operation
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { branch_id } = req.query; 

    try {
        await pool.query('DELETE FROM products WHERE id = ? AND branch_id = ?', [id, branch_id]);
        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
