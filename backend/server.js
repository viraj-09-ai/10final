const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Serve uploaded visitor photos and generated PDF badges
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route to fix the 'Cannot GET /' error on Render
app.get('/', (req, res) => {
    res.send('Visitor Management API is active.');
});

// API routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/visitors', require('./src/routes/visitorRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/passes', require('./src/routes/passRoutes'));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Centralized error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
