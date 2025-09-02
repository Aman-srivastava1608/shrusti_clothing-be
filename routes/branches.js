const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

// Create new branch (super_admin only)
router.post("/create", auth, requireRole("super_admin"), async (req, res) => {
  try {
    // Destructure the field names coming from the frontend
    const {
      branch_name,
      address,
      gst_number,
      mobile_number,
      admin_username,
      admin_password,
    } = req.body;

    // Basic validation - ensure all required fields are present
    // All fields except GST are required
    if (
      !branch_name ||
      !address ||
      !mobile_number ||
      !admin_username ||
      !admin_password
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const hashedPassword = await bcrypt.hash(admin_password, 10);

      // Insert into the branches table
      const [result] = await conn.query(
        `INSERT INTO branches 
           (branch_name, address, gst_number, mobile_number, email, \`password\`) 
           VALUES (?,?,?,?,?,?)`,
        [
          branch_name,
          address,
          gst_number || null, // GST number can be null
          mobile_number,
          admin_username, // 'email' is stored in the `email` column
          hashedPassword, // 'password' is stored in the `password` column
        ]
      );

      const branchId = result.insertId;

      // Create a default branch admin user
      await conn.query(
        `INSERT INTO branch_users (branch_id, email, password, role) 
           VALUES (?,?,?,?)`,
        [branchId, admin_username, hashedPassword, "branch_admin"]
      );

      await conn.commit();
      res.json({ message: "Branch created successfully", branch_id: branchId });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ message: "Database error" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List branches (super_admin only)
router.get("/", auth, requireRole("super_admin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT branch_id, branch_name, address, gst_number, 
               mobile_number, alternate_number, created_at 
          FROM branches 
          ORDER BY branch_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
