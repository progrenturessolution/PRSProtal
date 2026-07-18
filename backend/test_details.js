const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const StudentGroup = require('./models/StudentGroup');
const Trainer = require('./models/Trainer');
const Intern = require('./models/Intern');

const test = async () => {
  try {
    await connectDB();
    console.log('DB connected');
    const groups = await StudentGroup.find();
    console.log('Total groups in DB:', groups.length);
    
    for (const g of groups) {
      console.log(`Processing group: ${g.groupName} (${g._id})`);
      const group = await StudentGroup.findById(g._id).populate(
        'students',
        'name internId studentType email mobile createdAt',
      );
      
      const studentsWithOtherGroups = await Promise.all(
        (group.students || []).map(async (student) => {
          if (!student) {
            console.log('Warning: Null student reference in group:', g.groupName);
            return null;
          }
          const studentObj = student.toObject ? student.toObject() : student;
          const otherGroups = await StudentGroup.find({
            _id: { $ne: group._id },
            students: student._id
          }).select('groupName').lean();
          
          studentObj.otherGroups = otherGroups.map(g => g.groupName);
          return studentObj;
        })
      );
      console.log(`Successfully processed group ${g.groupName}, students count:`, studentsWithOtherGroups.filter(Boolean).length);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
};

test();
