const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { sendTaskAssignmentEmail } = require('../config/emailService');

// Admin: Create and assign task
exports.createAndAssignTask = async (req, res) => {
  try {
    let { title, description, deadline, assignedTo, isTeamTask, teamMembers } = req.body;

    // Parse teamMembers if it's a JSON string (from FormData)
    if (typeof teamMembers === 'string') {
      try {
        teamMembers = JSON.parse(teamMembers);
      } catch (e) {
        console.error('Failed to parse teamMembers:', e);
        teamMembers = [];
      }
    }

    // Validation
    if (!title || !description || !deadline || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if intern exists
    const intern = await Intern.findById(assignedTo);
    if (!intern) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    // Handle file upload if present
    let taskDocument = null;
    if (req.file) {
      taskDocument = {
        filename: req.file.filename,
        filepath: req.file.path,
        uploadedAt: new Date()
      };
    }

    // Create task
    const task = new Task({
      title,
      description,
      deadline,
      assignedTo,
      status: 'Assigned',
      progress: 0,
      isTeamTask: isTeamTask || false,
      teamMembers: teamMembers || [],
      taskDocument: taskDocument
    });

    await task.save();

    // Send email notification
    const emailResult = await sendTaskAssignmentEmail(
      intern.name,
      intern.email,
      title,
      description,
      deadline
    );

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully',
      task,
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email internId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Approve task
exports.approveTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: 'Task is not pending approval'
      });
    }

    task.status = 'Completed';
    task.completedAt = new Date();
    task.hasUnreadFeedback = false;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task approved successfully',
      task
    });

  } catch (error) {
    console.error('Approve task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Send feedback/request changes for a task
exports.sendTaskFeedback = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Feedback message is required'
      });
    }

    const task = await Task.findById(taskId).populate('assignedTo');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Add comment to task
    task.comments.push({
      message: message.trim(),
      sentBy: 'admin',
      sentAt: new Date()
    });

    // Mark task back to In Progress and set unread flag
    task.status = 'In Progress';
    task.hasUnreadFeedback = true;
    await task.save();

    // Send email notification to intern
    const sendEmail = require('../utils/emailService');
    const emailResult = await sendEmail(
      task.assignedTo.email,
      'Task Feedback - Changes Requested',
      `
        <h2>Changes Requested for Task</h2>
        <p>Hi ${task.assignedTo.name},</p>
        <p>The admin has reviewed your task and requested some changes:</p>
        <div style="background: #f3f4f6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="margin-top: 0;">Task: ${task.title}</h3>
          <p><strong>Admin's Feedback:</strong></p>
          <p>${message}</p>
        </div>
        <p>Please review the feedback and make the necessary changes to your task.</p>
        <p>You can view this task in your dashboard and update it accordingly.</p>
        <br>
        <p>Best regards,<br>Progrentures Team</p>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
      emailSent: emailResult.success,
      task
    });

  } catch (error) {
    console.error('Send task feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Intern: Get assigned tasks
exports.getInternTasks = async (req, res) => {
  try {
    const internId = req.user.id;

    const tasks = await Task.find({ assignedTo: internId })
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Get intern tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Intern: Update task progress
exports.updateTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { progress } = req.body;
    const internId = req.user.id;

    const task = await Task.findOne({ _id: taskId, assignedTo: internId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed task'
      });
    }

    // Validate progress
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be between 0 and 100'
      });
    }

    task.progress = progress;

    // Update status based on progress
    if (progress === 0) {
      task.status = 'Assigned';
    } else if (progress > 0 && progress < 100) {
      task.status = 'In Progress';
    } else if (progress === 100) {
      task.status = 'Pending Approval';
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task progress updated successfully',
      task
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const assignedTasks = await Task.countDocuments({ status: 'Assigned' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const pendingApproval = await Task.countDocuments({ status: 'Pending Approval' });
    const completedTasks = await Task.countDocuments({ status: 'Completed' });

    res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        assignedTasks,
        inProgressTasks,
        pendingApproval,
        completedTasks
      }
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Edit task
exports.editTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, deadline } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update only provided fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (deadline) task.deadline = deadline;

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    console.error('Edit task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Intern: Send team message
exports.sendTeamMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, sentBy, senderName } = req.body;
    const internId = req.user.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if intern is part of the team
    if (!task.teamMembers || !task.teamMembers.includes(internId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this team'
      });
    }

    // Add message to team messages
    task.teamMessages.push({
      message,
      sentBy,
      senderName,
      sentAt: new Date()
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      task
    });

  } catch (error) {
    console.error('Send team message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
