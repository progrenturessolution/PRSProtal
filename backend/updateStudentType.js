const mongoose = require('mongoose');
require('./models/Intern');

mongoose.connect('mongodb://127.0.0.1:27017/progrentures')
  .then(async () => {
    const Intern = mongoose.model('Intern');
    
    // Update the student type
    const result = await Intern.updateOne(
      { email: 'tejasdamale111@gmail.com' },
      { $set: { studentType: 'Internship' } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const intern = await Intern.findOne({ email: 'tejasdamale111@gmail.com' });
    console.log('\nUpdated student:');
    console.log('  Name:', intern.name);
    console.log('  Email:', intern.email);
    console.log('  studentType:', intern.studentType);
    console.log('  status:', intern.status);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
