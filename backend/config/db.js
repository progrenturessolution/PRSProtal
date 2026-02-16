const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4 // Force IPv4
    });
    console.log('MongoDB Connected Successfully to database: progrentures');
    
    // Create dummy admin after connection
    await createDummyAdmin();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const createDummyAdmin = async () => {
  try {
    const Admin = require('../models/Admin');
    const bcrypt = require('bcryptjs');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@progrentures.com' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = new Admin({
        email: 'admin@progrentures.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ Dummy admin created successfully');
      console.log('   Email: admin@progrentures.com');
      console.log('   Password: admin123');
    } else {
      // Ensure existing admin has role field
      if (!existingAdmin.role) {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Admin role updated');
      }
      console.log('✅ Admin already exists with role:', existingAdmin.role);
    }
  } catch (error) {
    console.error('Error creating dummy admin:', error.message);
  }
};

module.exports = connectDB;
