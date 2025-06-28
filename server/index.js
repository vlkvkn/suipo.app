const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const zkloginRoutes = require('./routes/zklogin');

const app = express();
const PORT = process.env.PORT || 8000;
const ASSETS_PORT = process.env.ASSETS_PORT || 8001;
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

// Create assets server
const assetsApp = express();

// CORS for assets server
assetsApp.use(cors({
  origin: '*', // Allow all origins for assets
  credentials: false
}));

// Serve static files from uploads directory for assets subdomain
assetsApp.use('/', express.static(path.join(__dirname, 'uploads')));

// Health check for assets server
assetsApp.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Assets Server is running' });
});

// Start main server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads available at: ${BASE_URL}:${PORT}/uploads/`);
  console.log(`🌐 CORS origins: ${CORS_ORIGINS}`);
});

// Start assets server
assetsApp.listen(ASSETS_PORT, () => {
  console.log(`📁 Assets server running on port ${ASSETS_PORT}`);
  console.log(`📁 Assets available at: ${BASE_URL}:${ASSETS_PORT}/`);
  console.log(`📁 Configure assets.localhost to point to ${BASE_URL}:${ASSETS_PORT}`);
}); 