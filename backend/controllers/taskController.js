const Task = require('../models/Task');
const Intern = require('../models/Intern');
const { sendTaskAssignmentEmail, sendEmail } = require('../config/emailService');

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
      .populate('teamMembers', 'name email internId mobile studentType')
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
    // For team tasks: auto-post approval as a reply to the submission message
    if (task.isTeamTask) {
      const submissionMsg = [...task.teamMessages].reverse().find(m =>
        m.message && m.message.includes('submitted this task for admin review')
      );
      task.teamMessages.push({
        message: '✅ Task Approved! Great work team! 🎉',
        sentBy: req.user.id,
        senderName: 'Admin',
        sentAt: new Date(),
        replyToSnippet: submissionMsg ? submissionMsg.message : null,
        replyToSenderName: submissionMsg ? submissionMsg.senderName : null
      });
    }
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

    // For team tasks: post feedback as a reply to the submission message
    if (task.isTeamTask) {
      const submissionMsg = [...task.teamMessages].reverse().find(m =>
        m.message && m.message.includes('submitted this task for admin review')
      );
      task.teamMessages.push({
        message: `🔄 Changes requested — ${message.trim()}`,
        sentBy: req.user.id,
        senderName: 'Admin',
        sentAt: new Date(),
        replyToSnippet: submissionMsg ? submissionMsg.message : null,
        replyToSenderName: submissionMsg ? submissionMsg.senderName : null
      });
    }

    // Mark task back to In Progress and set unread flag
    task.status = 'In Progress';
    task.hasUnreadFeedback = true;
    await task.save();

    // Send email notification (non-blocking — don't fail the API if email fails)
    let emailSent = false;
    try {
      const emailResult = await sendEmail(
        task.assignedTo.email,
        'Task Feedback - Changes Requested',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 26px;">⚠️ Changes Requested</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${task.assignedTo.name}</strong>,</p>
              <p style="font-size: 15px; color: #555;">The admin has reviewed your task and requested some changes:</p>
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Task: ${task.title}</h3>
                <p style="font-weight: bold; color: #78350f;">Admin Feedback:</p>
                <p style="color: #334155;">${message}</p>
              </div>
              <p style="font-size: 15px; color: #555;">Please review the feedback and make the necessary changes in your dashboard.</p>
              <p style="margin-top: 30px; color: #666;">Best regards,<br><strong>Progrentures Team</strong></p>
            </div>
          </div>
        `
      );
      emailSent = emailResult.success;
    } catch (emailError) {
      console.warn('Email notification failed (non-critical):', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
      emailSent,
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

    const tasks = await Task.find({
      $or: [
        { assignedTo: internId },
        { teamMembers: internId }
      ]
    })
      .populate('teamMembers', 'name email internId mobile studentType')
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

    // Support both individually assigned tasks and team tasks
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ assignedTo: internId }, { teamMembers: internId }]
    });

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
      // For team tasks: auto-post a submission message so the whole team sees it
      if (task.isTeamTask) {
        const submitter = await Intern.findById(internId).select('name');
        task.teamMessages.push({
          message: `📤 ${submitter?.name || 'Team Member'} submitted this task for admin review`,
          sentBy: internId,
          senderName: submitter?.name || 'Team Member',
          sentAt: new Date(),
          replyToSnippet: null,
          replyToSenderName: null
        });
      }
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

    // Allow both teamMembers AND assignedTo person to send messages
    const isTeamMember = task.teamMembers && task.teamMembers.some(id => id.toString() === internId);
    const isAssignedTo = task.assignedTo && task.assignedTo.toString() === internId;

    if (!isTeamMember && !isAssignedTo) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this team'
      });
    }

    // Add message to team messages
    task.teamMessages.push({
      message,
      sentBy: req.user.id,
      senderName,
      sentAt: new Date()
    });

    await task.save();

    // Return populated task so frontend can update in place
    const updatedTask = await Task.findById(taskId)
      .populate('teamMembers', 'name email internId mobile studentType');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Send team message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Send broadcast message to team task
exports.sendAdminTeamMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, senderName } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.teamMessages.push({
      message,
      sentBy: req.user.id,
      senderName: senderName || 'Admin',
      sentAt: new Date()
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email internId')
      .populate('teamMembers', 'name email internId mobile studentType');

    res.status(200).json({ success: true, message: 'Message sent', task: updatedTask });
  } catch (error) {
    console.error('Admin team message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
