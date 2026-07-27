/**
 * One-time migration script:
 * Fix all existing "Send" type AdminPayment records so that pendingPayment = 0.
 * The unsent balance (totalPayment - payment) is not a debt owed to us, so pending should be 0.
 *
 * Run with: node scripts/fixSendPaymentPending.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminPayment = require('../models/AdminPayment');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/prs_portal';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Find all Send-type payments with non-zero pendingPayment
    const sendPayments = await AdminPayment.find({
      paymentType: { $regex: /^send$/i },
      pendingPayment: { $gt: 0 }
    });

    console.log(`Found ${sendPayments.length} Send-type payment(s) with non-zero pendingPayment.`);

    if (sendPayments.length === 0) {
      console.log('Nothing to fix. Exiting.');
      process.exit(0);
    }

    let fixed = 0;
    for (const payment of sendPayments) {
      console.log(`  Fixing: ${payment.name} | pendingPayment: ${payment.pendingPayment} -> 0`);
      payment.pendingPayment = 0;
      await payment.save();
      fixed++;
    }

    console.log(`\nDone! Fixed ${fixed} record(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
