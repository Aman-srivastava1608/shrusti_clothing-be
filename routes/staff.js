const express = require("express");
const router = express.Router();
const db = require("../db"); // Assuming this is your promise-based pool
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/authMiddleware");

// ================== File Upload Config ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================== Add Staff ==================
router.post(
  "/add",
  auth,
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "panCardImage", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  async (req, res) => {
    const branchId = req.user.branch_id;
    const {
      fullName,
      operation,
      overlockOperator,
      flatlockOperator,
      aadharNumber,
      panNumber,
      mobileNumber,
    } = req.body;

    const aadharFront = req.files["aadharFront"]?.[0]?.filename || null;
    const aadharBack = req.files["aadharBack"]?.[0]?.filename || null;
    const panCardImage = req.files["panCardImage"]?.[0]?.filename || null;
    const photo = req.files["photo"]?.[0]?.filename || null;

    try {
      // Check for duplicates in Aadhar, PAN, and Mobile numbers
      const [existingStaff] = await db.query(
        "SELECT aadhar_number, pan_number, mobile_number FROM staff WHERE aadhar_number = ? OR pan_number = ? OR mobile_number = ?",
        [aadharNumber, panNumber, mobileNumber]
      );

      if (existingStaff.length > 0) {
        if (existingStaff[0].aadhar_number === aadharNumber) {
          return res.status(409).json({ success: false, error: "Staff member with this Aadhar number already exists." });
        }
        if (existingStaff[0].pan_number === panNumber) {
          return res.status(409).json({ success: false, error: "Staff member with this PAN number already exists." });
        }
        if (existingStaff[0].mobile_number === mobileNumber) {
          return res.status(409).json({ success: false, error: "Staff member with this mobile number already exists." });
        }
      }

      // Insert staff with mobile number included
      const sql = `INSERT INTO staff (branch_id, full_name, operation, overlock_operator, flatlock_operator, aadhar_number, pan_number, mobile_number, aadhar_front, aadhar_back, pan_card_image, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const [result] = await db.query(
        sql,
        [
          branchId,
          fullName,
          operation, 
          overlockOperator,
          flatlockOperator,
          aadharNumber,
          panNumber,
          mobileNumber,
          aadharFront,
          aadharBack,
          panCardImage,
          photo,
        ]
      );
      
      res.json({
        success: true,
        message: "Staff added successfully",
        id: result.insertId,
      });

    } catch (err) {
      console.error("Error inserting staff:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  }
);

// ================== Get All Staff (only branch wise) ==================
router.get("/", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query("SELECT * FROM staff WHERE branch_id = ?", [branchId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get staff by operation NAME ==================
router.get("/by-operation/:operationName", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { operationName } = req.params;

  try {
    const [staffResults] = await db.query(
      "SELECT id, full_name FROM staff WHERE operation = ? AND branch_id = ?",
      [operationName, branchId]
    );

    res.json(staffResults);
  } catch (err) {
    console.error("Error fetching staff by operation:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Get Operations (dropdown) ==================
router.get("/operations", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  try {
    const [results] = await db.query("SELECT id, name FROM operations WHERE branch_id = ?", [branchId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching operations:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// staff.js (backend)
router.get("/staff", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM staff WHERE operation = 'cutting'");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching cutting staff" });
  }
});

// Add this new route to your staff.js file
// ================== Get staff by ID (with all details) ==================
router.get("/:staffId", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { staffId } = req.params;

  try {
    const [staffResults] = await db.query(
      "SELECT id, full_name, operation, overlock_operator, flatlock_operator FROM staff WHERE id = ? AND branch_id = ?",
      [staffId, branchId]
    );

    if (staffResults.length > 0) {
      res.json(staffResults[0]);
    } else {
      res.status(404).json({ success: false, error: "Staff not found" });
    }
  } catch (err) {
    console.error("Error fetching staff by ID:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// ================== Delete Staff ==================
router.delete("/:staffId", auth, async (req, res) => {
  const branchId = req.user.branch_id;
  const { staffId } = req.params;

  try {
    // Optional: first check if staff exists in this branch
    const [staff] = await db.query(
      "SELECT * FROM staff WHERE id = ? AND branch_id = ?",
      [staffId, branchId]
    );

    if (staff.length === 0) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    // Delete staff
    await db.query("DELETE FROM staff WHERE id = ? AND branch_id = ?", [staffId, branchId]);

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
});



module.exports = router;