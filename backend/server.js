const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const trainerRoutes = require('./routes/trainerRoutes');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify critical env variables
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Missing');
console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/trainer', trainerRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Progrentures Internship Management System API' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
