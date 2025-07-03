const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const zkloginRoutes = require('./routes/zklogin');

const app = express();
const PORT = process.env.PORT || 8000;
const CORS_ORIGINS = process.env.CORS_ORIGINS;
const BASE_URL = process.env.BASE_URL;

// CORS configuration
const corsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/zklogin', zkloginRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SUI POAP Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start main server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads available at: ${BASE_URL}/uploads/`);
  console.log(`🌐 CORS origins: ${CORS_ORIGINS}`);
});