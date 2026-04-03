const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4 // Force IPv4
    });
    console.log('MongoDB Connected Successfully to database: progrentures');

    // Create or sync default admin accounts after connection
    await syncDefaultAdmins();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const syncDefaultAdmins = async () => {
  try {
    const Admin = require('../models/Admin');
    const bcrypt = require('bcryptjs');

    const defaultAdmins = [
      {
        email: 'aniruddharaut2004@gmail.com',
        password: 'Raut@2004'
      },
      {
        email: 'rohanghatol4@gamil.com',
        password: 'Rohan@2004'
      }
    ];

    for (const adminConfig of defaultAdmins) {
      const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

      const admin = await Admin.findOneAndUpdate(
        { email: adminConfig.email },
        {
          $set: {
            email: adminConfig.email,
            password: hashedPassword,
            role: 'admin'
          }
        },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(`✅ Admin ready: ${admin.email}`);
    }
  } catch (error) {
    console.error('Error syncing default admins:', error.message);
  }
};

module.exports = connectDB;
