const mongoose = require('mongoose');
require('./models/Intern');

mongoose.connect('mongodb://127.0.0.1:27017/progrentures')
  .then(async () => {
    const Intern = mongoose.model('Intern');
    const interns = await Intern.find({});
    
    console.log('Total interns:', interns.length);
    console.log('\n=================================\n');
    
    interns.forEach((intern, i) => {
      console.log(`Intern ${i + 1}:`);
      console.log('  Name:', intern.name);
      console.log('  Email:', intern.email);
      console.log('  studentType:', intern.studentType);
      console.log('  status:', intern.status);
      console.log('  _id:', intern._id);
      console.log('\n---------------------------------\n');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
