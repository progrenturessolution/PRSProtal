require('dotenv').config();
const mongoose = require('mongoose');
const Intern = require('./models/Intern');

const deleteAllInterns = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Delete all interns
    const result = await Intern.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} interns`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

deleteAllInterns();
