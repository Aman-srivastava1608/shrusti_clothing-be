const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/authMiddleware");

// ================== Get All Staff for Dropdown ==================
router.get("/staff-list", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query(
      "SELECT id, full_name, aadhar_number, pan_number, mobile_number FROM staff WHERE branch_id = ?",
      [branchId]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching staff list:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get Staff Details by ID ==================
router.get("/staff/:staffId", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { staffId } = req.params;

  try {
    const [results] = await db.query(
      "SELECT full_name, aadhar_number, pan_number, mobile_number FROM staff WHERE id = ? AND branch_id = ?",
      [staffId, branchId]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Add/Update Advance Payment ==================
router.post("/add", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const {
    staffId,
    staffName,
    aadharNumber,
    panNumber,
    mobileNumber,
    amount,
    paymentMethod,
    paymentDate,
  } = req.body;

  try {
    if (!staffId || !staffName || !amount || !paymentMethod || !paymentDate) {
      return res
        .status(400)
        .json({ success: false, error: "All required fields must be filled" });
    }

    // 1. Check if a pending payment for this staff already exists
    const [existingPayment] = await db.query(
      "SELECT id, amount FROM advance_payments WHERE staff_id = ? AND branch_id = ?",
      [staffId, branchId]
    );

    if (existingPayment.length > 0) {
      // 2. If it exists, update the amount
      const existingAmount = existingPayment[0].amount;
      const newAmount = parseFloat(existingAmount) + parseFloat(amount);

      await db.query(
        "UPDATE advance_payments SET amount = ? WHERE id = ?",
        [newAmount, existingPayment[0].id]
      );

      res.json({
        success: true,
        message: "Advance payment updated successfully!",
      });
    } else {
      // 3. If it does not exist, insert a new record
      const sql = `INSERT INTO advance_payments 
                (branch_id, staff_id, staff_name, aadhar_number, pan_number, mobile_number, amount, payment_method, payment_date, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const [result] = await db.query(sql, [
        branchId,
        staffId,
        staffName,
        aadharNumber,
        panNumber,
        mobileNumber,
        amount,
        paymentMethod,
        paymentDate,
      ]);

      res.json({
        success: true,
        message: "Advance payment recorded successfully!",
        id: result.insertId,
      });
    }
  } catch (err) {
    console.error("Error adding/updating advance payment:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get All Pending Payments ==================
router.get("/pending", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query(
      "SELECT * FROM advance_payments WHERE branch_id = ? ORDER BY created_at DESC",
      [branchId]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching pending payments:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get All Paid Payments ==================
router.get("/paid", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query(
      "SELECT * FROM paid_payments WHERE branch_id = ? ORDER BY created_at DESC",
      [branchId]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching paid payments:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get All Advance Payments ==================
router.get("/", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query(
      "SELECT * FROM advance_payments WHERE branch_id = ? ORDER BY created_at DESC",
      [branchId]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching advance payments:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get Staff Pending Balance (👈 moved UP before /:paymentId) ==================
router.get("/pending-balance", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { staff_id } = req.query;

  if (!staff_id) {
    return res.status(400).json({ success: false, error: "staff_id is required" });
  }

  try {
    const [results] = await db.query(
      "SELECT SUM(amount) AS total_pending_amount FROM advance_payments WHERE staff_id = ? AND branch_id = ?",
      [staff_id, branchId]
    );

    const pendingBalance = results[0].total_pending_amount || 0;
    res.json({ success: true, pendingBalance });
  } catch (err) {
    console.error("Error fetching pending balance:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get Advance Payment by ID ==================
router.get("/:paymentId", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { paymentId } = req.params;

  try {
    const [results] = await db.query(
      "SELECT * FROM advance_payments WHERE id = ? AND branch_id = ?",
      [paymentId, branchId]
    );

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Payment record not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching payment details:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Handle Payment Submission ==================
router.post("/pay-amount", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { paymentId, amountPaid } = req.body;

  try {
    const [pendingPayment] = await db.query(
      "SELECT * FROM advance_payments WHERE id = ? AND branch_id = ?",
      [paymentId, branchId]
    );

    if (pendingPayment.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Pending payment not found." });
    }

    const originalAmount = pendingPayment[0].amount;
    const remainingAmount = originalAmount - amountPaid;

    // Insert into paid_payments table
    const paidSql = `INSERT INTO paid_payments 
            (branch_id, staff_id, staff_name, aadhar_number, pan_number, mobile_number, amount_paid, payment_method, payment_date, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    await db.query(paidSql, [
      branchId,
      pendingPayment[0].staff_id,
      pendingPayment[0].staff_name,
      pendingPayment[0].aadhar_number,
      pendingPayment[0].pan_number,
      pendingPayment[0].mobile_number,
      amountPaid,
      pendingPayment[0].payment_method,
    ]);

    // Update or delete pending record
    if (remainingAmount <= 0) {
      await db.query("DELETE FROM advance_payments WHERE id = ?", [paymentId]);
    } else {
      await db.query("UPDATE advance_payments SET amount = ? WHERE id = ?", [
        remainingAmount,
        paymentId,
      ]);
    }

    res.json({ success: true, message: "Payment successfully recorded." });
  } catch (err) {
    console.error("Error processing payment:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to process payment." });
  }
});

module.exports = router;
