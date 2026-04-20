const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const representativeRoutes = require('./routes/representativeRoutes');
const { cleanupExpiredCertificates } = require('./controllers/certificateController');
const mongoose = require('mongoose');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify critical env variables
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);

// Initialize express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
const startServer = async () => {
  let cleanupJobStarted = false;
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down server...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
      } catch (error) {
        console.error('Error while closing database connection:', error.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const connectWithRetry = async () => {
    try {
      await connectDB();

      if (!cleanupJobStarted) {
        // Run expired-certificate cleanup on startup then every hour.
        await cleanupExpiredCertificates();
        setInterval(cleanupExpiredCertificates, 60 * 60 * 1000);
        cleanupJobStarted = true;
      }
    } catch (error) {
      console.error('Database unavailable. Retrying in 15 seconds:', error.message);
      setTimeout(connectWithRetry, 15000);
    }
  };

  await connectWithRetry();
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/representative', representativeRoutes);

// API health route with DB state for uptime checks
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is live'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = Number(err.statusCode) || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
startServer();
