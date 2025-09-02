// wages.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// ================== Add New Wages Entry (FIXED) ==================
router.post("/add", auth, async (req, res) => {
  const { payments } = req.body;

  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return res.status(400).json({ success: false, error: "Payments array is missing or empty." });
  }

  try {
    const payment = payments[0];
    const isSingerOperation = payment.operation_name.toLowerCase() === "singer";

    const sql = `
      INSERT INTO wages (
        branch_id, product_name, operation_name, staff_name, 
        overlock_operator, flatlock_operator, size_wise_entry, 
        extra_pieces, total_pieces, gross_amount, deduct_advance_pay, 
        payable_amount, overlock_gross_amount, overlock_deduct_advance, 
        overlock_payable_amount, flatlock_gross_amount, flatlock_deduct_advance, 
        flatlock_payable_amount, payment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `.trim();

    const staffName = payment.staff_name || null;
    const overlockOperator = isSingerOperation ? payment.overlock_operator || null : null;
    const flatlockOperator = isSingerOperation ? payment.flatlock_operator || null : null;

    const totalPieces = parseInt(payment.total_pieces, 10) || 0;
    const extraPieces = parseInt(payment.extra_pieces, 10) || 0;
    const grossAmount = parseFloat(payment.gross_amount) || 0;
    const deductAdvancePay = parseFloat(payment.deduct_advance_pay) || 0;
    const payableAmount = parseFloat(payment.payable_amount) || 0;

    // ➡️ Using correct column names from your SQL schema
    const flatlockGrossAmount = isSingerOperation ? parseFloat(payment.flatlockWages) || 0 : 0;
    const flatlockDeductAdvance = isSingerOperation ? parseFloat(payment.flatlockDeductAdvance) || 0 : 0;
    const flatlockPayableAmount = isSingerOperation ? parseFloat(payment.flatlockPayableAmount) || 0 : 0;
    
    const overlockGrossAmount = isSingerOperation ? parseFloat(payment.overlockWages) || 0 : 0;
    const overlockDeductAdvance = isSingerOperation ? parseFloat(payment.overlockDeductAdvance) || 0 : 0;
    const overlockPayableAmount = isSingerOperation ? parseFloat(payment.overlockPayableAmount) || 0 : 0;

    let sizeWiseEntryJson;
    try {
      sizeWiseEntryJson = payment.size_wise_entry ? JSON.stringify(payment.size_wise_entry) : JSON.stringify({});
    } catch (err) {
      return res.status(400).json({ success: false, error: `Invalid size_wise_entry format: ${JSON.stringify(payment)}` });
    }

    const values = [
      payment.branchId,
      payment.product_name || null,
      payment.operation_name || null,
      staffName,
      overlockOperator,
      flatlockOperator,
      sizeWiseEntryJson,
      extraPieces,
      totalPieces,
      grossAmount,
      deductAdvancePay,
      payableAmount,
      overlockGrossAmount,
      overlockDeductAdvance,
      overlockPayableAmount,
      flatlockGrossAmount,
      flatlockDeductAdvance,
      flatlockPayableAmount,
      payment.payment_type || null,
    ];

    await db.query(sql, values);

    res.json({ success: true, message: "Wages added successfully" });
  } catch (err) {
    console.error("Error adding wages:", err);
    res.status(500).json({ success: false, error: `Database error: ${err.message}` });
  }
});

// ================== Get Wages by Operation ==================
router.get("/by-operation", auth, async (req, res) => {
  const { branch_id, operation } = req.query;

  if (!branch_id || !operation) {
    return res.status(400).json({ success: false, error: "Branch ID and operation are required." });
  }

  try {
    const sql = `
      SELECT *
      FROM wages
      WHERE branch_id = ? AND operation_name = ?
      ORDER BY date DESC
    `;
    const [rows] = await db.query(sql, [branch_id, operation]);

    if (rows.length === 0) {
      return res.json({ success: true, message: "No wages found for this operation.", data: [] });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error fetching wages by operation:", err);
    res.status(500).json({ success: false, error: "Failed to fetch wages." });
  }
});

module.exports = router;