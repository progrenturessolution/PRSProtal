const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  // Some local DNS resolvers refuse MongoDB Atlas SRV lookups. Use reliable
  // resolvers only for mongodb+srv connections; this does not affect local MongoDB.
  if (mongoUri.startsWith('mongodb+srv://')) {
    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);

    dns.setServers(dnsServers);
    console.log(`MongoDB Atlas DNS servers: ${dnsServers.join(', ')}`);
  }

  try {
    await mongoose.connect(mongoUri, { family: 4, serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Connected Successfully to database: progrentures');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }

  // Create or sync default admin accounts after connection
  await syncDefaultAdmins();
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
      },
      {
        email: 'admin@progrentures.com',
        password: 'PRSPortal@2026'
      }
    ];

    for (const adminConfig of defaultAdmins) {
      const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

      await Admin.findOneAndUpdate(
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
    }
  } catch (error) {
    console.error('Error syncing default admins:', error.message);
  }
};

module.exports = connectDB;
