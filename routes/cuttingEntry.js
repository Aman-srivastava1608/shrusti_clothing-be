const express = require("express");
const router = express.Router();
const pool = require("../db"); // Your database connection module
const auth = require("../middleware/authMiddleware"); // Your JWT authentication middleware

// Add new Cutting Entry
router.post("/add", auth, async (req, res) => {
  try {
    const {
      inward_number,
      cutting_master,
      product_name,
      fabric_type,
      weight_of_fabric,
      size_wise_entry,
      total_pcs,
      gross_amount,
      deduct_advance_pay,
      payable_amount,
      payment_type,
      branchId,
    } = req.body;

    // Validate that all required fields are present
    if (
      !inward_number ||
      !cutting_master ||
      !product_name ||
      !fabric_type ||
      !weight_of_fabric ||
      !total_pcs ||
      !branchId ||
      gross_amount == null ||
      deduct_advance_pay == null ||
      payable_amount == null ||
      !payment_type
    ) {
      return res.status(400).json({ error: "All required fields are missing or invalid." });
    }

    // Insert the cutting entry into the cutting_entries table
    const cuttingEntryQuery = `
      INSERT INTO cutting_entries 
      (inward_number, cutting_master, product_name, fabric_type, weight_of_fabric, 
      size_wise_entry, total_pcs, gross_amount, deduct_advance_pay, payable_amount, 
      payment_type, branch_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await pool.query(cuttingEntryQuery, [
      inward_number,
      cutting_master,
      product_name,
      fabric_type,
      weight_of_fabric,
      JSON.stringify(size_wise_entry),
      total_pcs,
      gross_amount,
      deduct_advance_pay,
      payable_amount,
      payment_type,
      branchId,
    ]);

    // Update staff pending balance
    const staffIdQuery = `SELECT id FROM staff WHERE full_name = ? AND branch_id = ?`;
    const [staffRows] = await pool.query(staffIdQuery, [cutting_master, branchId]);

    if (staffRows.length > 0) {
        const staffId = staffRows[0].id;

        // Insert a new entry for the advance deduction
        const updateBalanceQuery = `
            INSERT INTO advance_payments (staff_id, amount, type, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        await pool.query(updateBalanceQuery, [
            staffId,
            deduct_advance_pay,
            'deduction',
        ]);
        
        // Recalculate and update the staff's total pending balance
        const updateStaffBalance = `
            UPDATE staff
            SET pending_balance = (
                SELECT SUM(CASE WHEN type = 'advance' THEN amount ELSE -amount END) 
                FROM advance_payments 
                WHERE staff_id = ?
            )
            WHERE id = ?
        `;
        await pool.query(updateStaffBalance, [staffId, staffId]);
    }

    res.status(201).json({ message: "Cutting entry added successfully ✅" });
  } catch (error) {
    console.error("Error inserting cutting entry:", error);
    res.status(500).json({ error: "Server error while adding cutting entry" });
  }
});

// Get all cutting entries (with optional filters)
router.get("/list", auth, async (req, res) => {
  try {
    const { branchId, masterName, date, amount } = req.query;

    // The fix: Cleanly re-typed SQL query
    let query = `
      SELECT id, cutting_master, inward_number, product_name, fabric_type, weight_of_fabric,
      size_wise_entry, total_pcs, gross_amount, deduct_advance_pay, payable_amount, payment_type, created_at
      FROM cutting_entries
      WHERE branch_id = ?
    `;

    let params = [branchId];

    if (masterName) {
      query += " AND cutting_master LIKE ?";
      params.push(`%${masterName}%`);
    }

    if (date) {
      query += " AND DATE(created_at) = ?";
      params.push(date);
    }

    if (amount) {
      query += " AND total_pcs = ?";
      params.push(amount);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);

    const formatted = rows.map((row) => ({
      ...row,
      // Calculate average on backend
      average: row.total_pcs > 0 ? (row.weight_of_fabric / row.total_pcs).toFixed(2) : 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching cutting entries:", error);
    res.status(500).json({ error: "Server error while fetching cutting entries" });
  }
});

module.exports = router;