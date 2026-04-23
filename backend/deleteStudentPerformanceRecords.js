require('dotenv').config();
const mongoose = require('mongoose');
const Interview = require('./models/Interview');
const Aptitude = require('./models/Aptitude');
const Assessment = require('./models/Assessment');
const Training = require('./models/Training');

const deleteStudentPerformanceRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const [interviewsResult, aptitudeResult, assessmentsResult, trainingsResult] = await Promise.all([
      Interview.deleteMany({}),
      Aptitude.deleteMany({}),
      Assessment.deleteMany({}),
      Training.deleteMany({}),
    ]);

    console.log(`Deleted interviews: ${interviewsResult.deletedCount}`);
    console.log(`Deleted aptitude records: ${aptitudeResult.deletedCount}`);
    console.log(`Deleted assessment records: ${assessmentsResult.deletedCount}`);
    console.log(`Deleted training records: ${trainingsResult.deletedCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting student performance records:', error.message);
    process.exit(1);
  }
};

deleteStudentPerformanceRecords();