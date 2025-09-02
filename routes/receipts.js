const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper function to get supplier_id from supplier_name and branch_id
const getSupplierId = async (supplierName, branchId) => {
    const [rows] = await pool.query(
        'SELECT id FROM suppliers WHERE supplier_name = ? AND branch_id = ?',
        [supplierName, branchId]
    );
    return rows[0] ? rows[0].id : null;
};

// Helper function to get fabric_type_id from fabric_type_name and branch_id
const getFabricTypeId = async (fabricTypeName, branchId) => {
    const [rows] = await pool.query(
        'SELECT id FROM fabric_types WHERE fabric_type_name = ? AND branch_id = ?',
        [fabricTypeName, branchId]
    );
    return rows[0] ? rows[0].id : null;
};

// ✅ CORRECTED: GET endpoint for all receipts for a specific branch
router.get('/', async (req, res) => {
    const { branchId } = req.query;
    if (!branchId) {
        return res.status(400).json({ error: 'Branch ID is required.' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT r.*, s.supplier_short_name FROM receipts r JOIN suppliers s ON r.supplier_id = s.id WHERE r.branch_id = ? ORDER BY r.created_at DESC', 
            [branchId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ error: 'Failed to fetch receipts.' });
    }
});

// ✅ CORRECTED: POST endpoint to save a new receipt to the database
router.post('/', async (req, res) => {
    const { uniqueNumber, supplierName, invoiceNo, date, weightOfMaterial, fabricType, branchId } = req.body;

    if (!uniqueNumber || !supplierName || !invoiceNo || !date || !weightOfMaterial || !fabricType || !branchId) {
        return res.status(400).json({ error: 'All required fields and branch ID must be provided.' });
    }

    try {
        const supplierId = await getSupplierId(supplierName, branchId);
        if (!supplierId) {
            return res.status(404).json({ error: 'Supplier not found for this branch.' });
        }

        const insertQuery = "INSERT INTO receipts (unique_number, supplier_id, invoice_no, date, weight_of_material, fabric_type, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [uniqueNumber, supplierId, invoiceNo, date, weightOfMaterial, fabricType, branchId];
        const [insertResult] = await pool.query(insertQuery.trim(), values);

        res.status(201).json({ 
            message: 'Receipt saved successfully!', 
            id: insertResult.insertId
        });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save receipt. It might already exist.' });
    }
});

// GET endpoint to get all suppliers for a specific branch
router.get('/suppliers', async (req, res) => {
    const { branchId } = req.query;
    if (!branchId) {
        return res.status(400).json({ error: 'Branch ID is required.' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT id, supplier_name, supplier_short_name FROM suppliers WHERE branch_id = ? ORDER BY supplier_name ASC',
            [branchId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers.' });
    }
});

// POST endpoint to add a new supplier with branch ID
router.post('/suppliers', async (req, res) => {
    const { supplier_name, supplier_short_name, branchId } = req.body;

    if (!supplier_name || !supplier_short_name || !branchId) {
        return res.status(400).json({ error: 'All required fields and branch ID must be provided.' });
    }

    try {
        const [checkResults] = await pool.query(
            'SELECT COUNT(*) AS count FROM suppliers WHERE (supplier_name = ? OR supplier_short_name = ?) AND branch_id = ?',
            [supplier_name, supplier_short_name, branchId]
        );

        if (checkResults[0].count > 0) {
            return res.status(409).json({ error: 'Supplier with this name or short name already exists for this branch.' });
        }

        const [result] = await pool.query('INSERT INTO suppliers (supplier_name, supplier_short_name, branch_id) VALUES (?, ?, ?)', [supplier_name, supplier_short_name, branchId]);
        res.status(201).json({ message: 'Supplier added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error adding supplier:', error);
        res.status(500).json({ error: 'Failed to add supplier.' });
    }
});

// POST endpoint to add a new fabric type with branch ID
router.post('/fabric-types', async (req, res) => {
    const { fabric_type_name, branchId } = req.body;

    if (!fabric_type_name || !branchId) {
        return res.status(400).json({ error: 'Fabric type name and branch ID are required.' });
    }

    try {
        const [checkResults] = await pool.query('SELECT COUNT(*) AS count FROM fabric_types WHERE fabric_type_name = ? AND branch_id = ?', [fabric_type_name, branchId]);
        if (checkResults[0].count > 0) {
            return res.status(409).json({ error: 'Fabric type already exists for this branch.' });
        }
        
        const [result] = await pool.query('INSERT INTO fabric_types (fabric_type_name, branch_id) VALUES (?, ?)', [fabric_type_name, branchId]);
        res.status(201).json({ message: 'Fabric type added successfully!', id: result.insertId });
    } catch (error) {
        console.error('Error adding fabric type:', error);
        res.status(500).json({ error: 'Failed to add fabric type.' });
    }
});

// GET endpoint to get all fabric types for a specific branch
router.get('/fabric-types', async (req, res) => {
    const { branchId } = req.query;
    if (!branchId) {
        return res.status(400).json({ error: 'Branch ID is required.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM fabric_types WHERE branch_id = ? ORDER BY fabric_type_name ASC', [branchId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching fabric types:', error);
        res.status(500).json({ error: 'Failed to fetch fabric types.' });
    }
});

// GET endpoint: fetch single receipt by unique_number and branchId
router.get('/:uniqueNumber', async (req, res) => {
    const { uniqueNumber } = req.params;
    const { branchId } = req.query;

    if (!uniqueNumber || !branchId) {
        return res.status(400).json({ error: 'Unique Number and Branch ID are required.' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM receipts WHERE unique_number = ? AND branch_id = ?',
            [uniqueNumber, branchId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Receipt not found for this branch.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ error: 'Failed to fetch receipt.' });
    }
});

// GET endpoint: fetch all receipts by supplierId and branchId with Fabric Type Name
router.get('/by-supplier/:supplierId', async (req, res) => {
    const { supplierId } = req.params;
    const { branchId } = req.query;

    if (!supplierId || !branchId) {
        return res.status(400).json({ error: 'Supplier ID and Branch ID are required.' });
    }

    try {
        const query = `
            SELECT DISTINCT r.id, r.unique_number, r.invoice_no, r.date, r.weight_of_material,
                    f.fabric_type_name AS fabric_type
            FROM receipts r
            LEFT JOIN fabric_types f ON r.fabric_type = f.id
            WHERE r.supplier_id = ? AND r.branch_id = ?
            ORDER BY r.date DESC
        `;
        
        const [rows] = await pool.query(query.trim(), [supplierId, branchId]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching receipts by supplier:', error);
        res.status(500).json({ error: 'Failed to fetch receipts by supplier.', details: error.message });
    }
});

module.exports = router;