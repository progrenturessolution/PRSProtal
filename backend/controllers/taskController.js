const Task = require('../models/Task');
const Intern = require('../models/Intern');

// Admin: Create and assign task
exports.createAndAssignTask = async (req, res) => {
  try {
    let { title, description, deadline, assignedTo, isTeamTask, teamMembers } = req.body;

    const teamTaskEnabled = isTeamTask === true || String(isTeamTask).toLowerCase() === 'true';

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

    let studentIds = [];
    if (Array.isArray(assignedTo)) {
      studentIds = assignedTo;
    } else if (typeof assignedTo === 'string' && assignedTo.length) {
      try {
        studentIds = JSON.parse(assignedTo);
        if (!Array.isArray(studentIds)) {
          studentIds = [assignedTo];
        }
      } catch (e) {
        studentIds = assignedTo.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one intern'
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

    if (teamTaskEnabled) {
      const assignedToId = studentIds[0];
      const normalizedTeamMembers = Array.isArray(teamMembers)
        ? teamMembers
            .map((member) => {
              if (typeof member === 'object' && member !== null) {
                return member._id || member.id || member.value || null;
              }
              return member;
            })
            .filter(Boolean)
        : [];

      if (normalizedTeamMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide team members for team task assignment'
        });
      }

      // Check if intern exists
      const intern = await Intern.findById(assignedToId);
      if (!intern) {
        return res.status(404).json({
          success: false,
          message: 'Intern not found'
        });
      }

      const recipientIds = [...new Set([
        String(assignedToId),
        ...normalizedTeamMembers.map((id) => String(id))
      ])];

      const recipients = await Intern.find({ _id: { $in: recipientIds } }).select('name email internId');
      if (recipients.length !== recipientIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more selected team members were not found'
        });
      }

      // Create task
      const task = new Task({
        title,
        description,
        deadline,
        assignedTo: assignedToId,
        status: 'Assigned',
        progress: 0,
        isTeamTask: true,
        teamMembers: normalizedTeamMembers,
        taskDocument: taskDocument
      });

      await task.save();

      return res.status(201).json({
        success: true,
        message: 'Task created and assigned successfully',
        task
      });
    } else {
      // Individual mode - validate all interns and create separate tasks
      const recipients = await Intern.find({ _id: { $in: studentIds } });
      if (recipients.length !== studentIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more selected interns were not found'
        });
      }

      const createdTasks = [];
      for (const id of studentIds) {
        const task = new Task({
          title,
          description,
          deadline,
          assignedTo: id,
          status: 'Assigned',
          progress: 0,
          isTeamTask: false,
          teamMembers: [],
          taskDocument: taskDocument
        });
        await task.save();
        createdTasks.push(task);
      }

      return res.status(201).json({
        success: true,
        message: `Task created and assigned to ${studentIds.length} intern(s) successfully`,
        tasks: createdTasks
      });
    }
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

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email internId')
      .populate('teamMembers', 'name email internId');

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
    const submissionMsg = [...task.teamMessages].reverse().find(m =>
      m.message && m.message.includes('submitted this task for admin review')
    );
    task.teamMessages.push({
      message: task.isTeamTask ? 'Task Approved! Great work team!' : 'Task Approved! Great work!',
      sentBy: req.user.id,
      senderName: 'Admin',
      sentAt: new Date(),
      replyToSnippet: submissionMsg ? submissionMsg.message : null,
      replyToSenderName: submissionMsg ? submissionMsg.senderName : null
    });
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

    // Mark task back to In Progress and set unread flag
    task.status = 'In Progress';
    task.hasUnreadFeedback = true;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
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
      .sort({ createdAt: -1 });

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
      const submitter = await Intern.findById(internId).select('name');
      task.teamMessages.push({
        message: task.isTeamTask
          ? `📤 ${submitter?.name || 'Team Member'} submitted this task for admin review`
          : `📤 ${submitter?.name || 'Intern'} submitted this task for admin review`,
        sentBy: internId,
        senderName: submitter?.name || (task.isTeamTask ? 'Team Member' : 'Intern'),
        sentAt: new Date(),
        replyToSnippet: null,
        replyToSenderName: null
      });
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
    let { title, description, deadline, assignedTo, teamMembers, status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update only provided fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline;
    const validStatuses = ['Assigned', 'In Progress', 'Pending Approval', 'Completed', 'Needs Improvement', 'Reviewed'];
    if (status && validStatuses.includes(status)) task.status = status;

    // Handle file upload if present
    if (req.file) {
      task.taskDocument = {
        filename: req.file.filename,
        filepath: req.file.path,
        uploadedAt: new Date()
      };
    }

    if (task.isTeamTask) {
      if (teamMembers) {
        // Parse teamMembers if stringified
        if (typeof teamMembers === 'string') {
          try {
            teamMembers = JSON.parse(teamMembers);
          } catch (e) {
            console.error('Failed to parse teamMembers in editTask:', e);
          }
        }
        if (Array.isArray(teamMembers) && teamMembers.length > 0) {
          task.teamMembers = teamMembers;
          task.assignedTo = teamMembers[0];
        }
      }
    } else {
      if (assignedTo) {
        task.assignedTo = assignedTo;
      }
    }

    await task.save();

    // Populate returned task
    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email internId')
      .populate('teamMembers', 'name email internId mobile studentType');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
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

// Intern: Mark feedback as read
exports.markFeedbackRead = async (req, res) => {
  try {
    const { taskId } = req.params;
    const internId = req.user.id;

    const task = await Task.findOne({
      _id: taskId,
      $or: [{ assignedTo: internId }, { teamMembers: internId }]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.hasUnreadFeedback = false;
    await task.save();

    res.status(200).json({ success: true, message: 'Feedback marked as read' });
  } catch (error) {
    console.error('Mark feedback read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
