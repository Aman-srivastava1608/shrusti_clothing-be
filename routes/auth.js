const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin Login (super_admin)
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ message: 'Admin not found' });
    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ user_id: admin.admin_id, role: admin.role }, process.env.JWT_SECRET || 'secretKey123', { expiresIn: '1d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/branch/login', async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  try {
    const [rows] = await pool.query('SELECT * FROM branch_users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, branch_id: user.branch_id, role: user.role || 'branch_admin' },
      process.env.JWT_SECRET || 'secretKey123',
      { expiresIn: '1d' }
    );

    res.json({ token, branch_id: user.branch_id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; // ✅ Yeh line add karo