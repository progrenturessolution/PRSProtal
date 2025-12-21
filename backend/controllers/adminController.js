const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const { sendInternCredentials } = require('../config/emailService');

// Generate unique Intern ID
const generateInternId = async () => {
  const year = new Date().getFullYear();
  const count = await Intern.countDocuments();
  const internId = `PRG${year}${String(count + 1).padStart(4, '0')}`;
  return internId;
};

// Add new intern
exports.addIntern = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if intern already exists
    const existingIntern = await Intern.findOne({ email });
    if (existingIntern) {
      return res.status(400).json({
        success: false,
        message: 'Intern with this email already exists'
      });
    }

    // Generate intern ID
    const internId = await generateInternId();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new intern
    const intern = new Intern({
      name,
      email,
      internId,
      password: hashedPassword,
      role: 'intern'
    });

    await intern.save();

    // Send email with credentials
    const emailResult = await sendInternCredentials(name, email, internId, password);

    res.status(201).json({
      success: true,
      message: 'Intern added successfully',
      intern: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        internId: intern.internId
      },
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Add intern error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all interns
exports.getAllInterns = async (req, res) => {
  try {
    const interns = await Intern.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: interns.length,
      interns
    });

  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete all interns
exports.deleteAllInterns = async (req, res) => {
  try {
    const result = await Intern.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} interns`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Delete all interns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete single intern
exports.deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;

    const intern = await Intern.findByIdAndDelete(id);

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern deleted successfully'
    });

  } catch (error) {
    console.error('Delete intern error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const totalInterns = await Intern.countDocuments();
    const activeInterns = await Intern.countDocuments({ status: 'active' });
    const completedInterns = await Intern.countDocuments({ status: 'completed' });

    // Get interns added this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthInterns = await Intern.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalInterns,
        activeInterns,
        completedInterns,
        thisMonthInterns
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update intern status
exports.updateInternStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "completed"'
      });
    }

    const intern = await Intern.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Intern status updated successfully',
      intern
    });

  } catch (error) {
    console.error('Update intern status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
