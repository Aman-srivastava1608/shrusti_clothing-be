const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // serve uploaded files

// DB connection
const pool = require('./db');

// Routes import
const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const productRoutes = require('./routes/products');
const branchAuthRoutes = require('./routes/branchAuth');
const receiptRoutes = require('./routes/receipts');
const operationRoutes = require('./routes/operations');
const staffRoutes = require('./routes/staff');
const advancePaymentRoutes = require('./routes/advancePayment');
const rangesRouter = require('./routes/ranges'); // ✅ Import the ranges router
const cuttingEntryRoutes = require("./routes/cuttingEntry");
const wagesRouter = require('./routes/wages');

app.get('/', (req, res) => res.json({ status: 'ok', service: 'multi-branch-backend' }));

// Main routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api', branchAuthRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ranges', rangesRouter); // ✅ Add the new route for ranges
app.use('/api/advance-payment', advancePaymentRoutes);
app.use("/api/cutting-entry", cuttingEntryRoutes);
app.use('/api/wages', wagesRouter);


app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS result');
        res.json({ success: true, result: rows });
    } catch (err) {
        console.error("DB Connection Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
