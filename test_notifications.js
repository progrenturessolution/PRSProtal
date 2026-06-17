const mongoose = require('mongoose');
require('dotenv').config();

// Define a minimal Schema so we can connect and query
const NotificationSchema = new mongoose.Schema({
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: { type: Date, default: Date.now }
  }]
}, { collection: 'notifications' });

const Notification = mongoose.model('NotificationTest', NotificationSchema);

async function run() {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/prs_portal" || "mongodb://localhost:27017/prs_portal";
  console.log("Connecting to MongoDB:", mongoURI);
  await mongoose.connect(mongoURI);

  // Find a student/intern user
  const InternSchema = new mongoose.Schema({}, { collection: 'interns' });
  const Intern = mongoose.model('InternTest', InternSchema);
  const student = await Intern.findOne();
  if (!student) {
    console.log("No student found in DB.");
    process.exit(0);
  }

  const userId = student._id;
  console.log("Found student ID:", userId, typeof userId);

  // Count unread notifications
  const allNotifications = await mongoose.connection.db.collection('notifications').find().toArray();
  console.log(`Total notifications in collection: ${allNotifications.length}`);
  
  // Test updateMany matching logic
  const filter = {
    $or: [
      { sendTo: 'All' },
      { sendTo: 'Group', recipientModel: 'Intern', recipientIds: userId },
      { sendTo: 'Individual', recipientModel: 'Intern', recipientIds: userId }
    ]
  };

  const matchingNotesBefore = await mongoose.connection.db.collection('notifications').find(filter).toArray();
  console.log(`Matching notifications before update: ${matchingNotesBefore.length}`);
  const unreadBefore = matchingNotesBefore.filter(n => {
    return !(n.readBy && n.readBy.some(r => String(r.userId) === String(userId)));
  });
  console.log(`Unread before update: ${unreadBefore.length}`);

  // Perform update
  const result = await mongoose.connection.db.collection('notifications').updateMany(
    {
      ...filter,
      'readBy.userId': { $ne: userId }
    },
    {
      $push: {
        readBy: { userId: userId, readAt: new Date() }
      }
    }
  );

  console.log("Update result:", result);

  const matchingNotesAfter = await mongoose.connection.db.collection('notifications').find(filter).toArray();
  const unreadAfter = matchingNotesAfter.filter(n => {
    return !(n.readBy && n.readBy.some(r => String(r.userId) === String(userId)));
  });
  console.log(`Unread after update: ${unreadAfter.length}`);

  await mongoose.disconnect();
}

run().catch(console.error);
