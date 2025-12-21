# Intern Portal Documentation
## Internship Management System

---

## Overview
The Intern Portal is a complete web application for interns to manage their assigned tasks, track progress, and communicate with administrators.

---

## Tech Stack
- **Frontend**: React 18
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (24-hour token expiration)
- **UI**: Professional dark slate theme with mobile responsiveness

---

## Features Implemented

### 1. Intern Dashboard (Landing Page)
**Route**: `/intern-dashboard`

After intern login, the dashboard displays:
- ✅ Intern Name
- ✅ Intern ID
- ✅ Email Address
- ✅ Internship Status (Active/Inactive)
- ✅ Logout Button
- ✅ Task Statistics Overview
  - Total Tasks
  - Assigned Tasks
  - In Progress Tasks
  - Pending Approval Tasks
  - Completed Tasks
- ✅ Quick Actions (View My Tasks button)

**Navigation**: 
- Dashboard section (🏠 Dashboard)
- Tasks section (📋 My Tasks)

---

### 2. My Tasks Section
Intern can view all tasks assigned to them.

**For Each Task, Display**:
- ✅ Task Title
- ✅ Task Description
- ✅ Deadline (Date & Time)
- ✅ Current Progress (0%, 25%, 50%, 75%, 100%)
- ✅ Current Status (Assigned, In Progress, Pending Approval, Completed)
- ✅ Overdue Warning (⚠️ if deadline passed and not completed)

**View Modes**:
- **Desktop**: Table view with all columns
- **Mobile**: Card view with responsive layout

---

### 3. Update Task Progress
Intern can update task progress using a dropdown selector.

**Progress Options**:
- ✅ 0% - Not Started
- ✅ 25% - Started
- ✅ 50% - Half Done
- ✅ 75% - Almost Done
- ✅ 100% - Submit for Approval

**Rules Implemented**:
1. ✅ If progress = 0%, status = "Assigned"
2. ✅ If progress > 0% and < 100%, status = "In Progress"
3. ✅ If progress = 100%, status automatically becomes "Pending Approval"
4. ✅ When status = "Pending Approval", dropdown is disabled (waiting for admin)
5. ✅ Admin must approve the task for status to become "Completed"

---

### 4. Task Status Visibility

**Status Indicators**:
- ✅ **Assigned** (Gray badge)
- ✅ **In Progress** (Blue badge)
- ✅ **Pending Approval** (Orange badge) - Shows "⏳ Waiting for admin approval" message
- ✅ **Completed** (Green badge) - Shows "✓ Task Completed & Approved" message

**Visual Feedback**:
- Color-coded status badges
- Progress bars with percentage
- Overdue warnings (red text with ⚠️ icon)
- Disabled controls when waiting for approval

---

### 5. Backend APIs (Intern)

#### GET /api/task/intern/tasks
**Description**: Fetch all tasks assigned to the logged-in intern

**Authentication**: Required (JWT token)

**Authorization**: Only intern can access their own tasks

**Response**:
```json
{
  "success": true,
  "count": 5,
  "tasks": [
    {
      "_id": "...",
      "title": "Task Title",
      "description": "Task Description",
      "deadline": "2024-12-31T23:59:00.000Z",
      "assignedTo": "intern_id",
      "progress": 50,
      "status": "In Progress",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### PUT /api/task/intern/update-task/:taskId
**Description**: Update task progress

**Authentication**: Required (JWT token)

**Authorization**: Only assigned intern can update their task

**Request Body**:
```json
{
  "progress": 75
}
```

**Rules**:
- Progress must be between 0 and 100
- Cannot update completed tasks
- Status automatically updates based on progress:
  - 0% → "Assigned"
  - 1-99% → "In Progress"
  - 100% → "Pending Approval"

**Response**:
```json
{
  "success": true,
  "message": "Task progress updated successfully",
  "task": { ... }
}
```

---

## Security & Access Control

### Authentication
- ✅ JWT token required for all intern routes
- ✅ Token stored in localStorage
- ✅ Automatic redirect to login if token missing/invalid

### Authorization
- ✅ Role-based access (intern role required)
- ✅ Interns can ONLY view/update their own tasks
- ✅ Interns CANNOT:
  - Mark tasks as completed (admin approval required)
  - View other interns' tasks
  - Create/delete tasks
  - Access admin features

---

## Task Workflow

1. **Admin Creates Task** → Status: "Assigned" (0%)
   ↓
2. **Intern Updates Progress** → Status: "In Progress" (25%, 50%, 75%)
   ↓
3. **Intern Sets 100%** → Status: "Pending Approval"
   ↓
4. **Admin Approves Task** → Status: "Completed"

**Important**: Intern CANNOT skip approval process. Task marked 100% must wait for admin approval.

---

## UI/UX Features

### Design Principles
- ✅ Clean and simple interface
- ✅ Professional dark slate color scheme
- ✅ Clear visual hierarchy
- ✅ No over-engineering

### Mobile Responsiveness
- ✅ Responsive breakpoint at 768px
- ✅ Desktop: Table layout
- ✅ Mobile: Card-based layout
- ✅ Touch-friendly buttons
- ✅ Sidebar adapts to mobile

### User Feedback
- ✅ Progress bars with visual indicators
- ✅ Color-coded status badges
- ✅ Overdue task warnings
- ✅ Approval pending notifications
- ✅ Success/error messages

---

## File Structure

### Frontend
```
frontend/src/
├── pages/
│   └── InternDashboard.jsx    # Main intern portal (Dashboard + Tasks)
├── services/
│   └── api.js                 # API methods (getInternTasks, updateTaskProgress)
├── assets/
│   └── logo.png               # Company logo
└── index.css                  # Global styles (responsive classes)
```

### Backend
```
backend/
├── controllers/
│   └── taskController.js      # getInternTasks(), updateTaskProgress()
├── routes/
│   └── taskRoutes.js          # GET /intern/tasks, PUT /intern/update-task/:taskId
├── models/
│   └── Task.js                # Task schema
└── middleware/
    └── authMiddleware.js      # verifyToken middleware
```

---

## Testing Instructions

### 1. Login as Intern
```
URL: http://localhost:3000/intern-login
Credentials: Use intern credentials from database
```

### 2. View Dashboard
- Check if intern details display correctly (Name, ID, Email, Status)
- Verify task statistics are accurate
- Click "View My Tasks" button

### 3. View Tasks
- Navigate to "My Tasks" section
- Verify all assigned tasks are displayed
- Check if overdue tasks show warning

### 4. Update Progress
- Select a task with status "Assigned" or "In Progress"
- Change progress using dropdown
- Verify status updates automatically:
  - 25% → "In Progress"
  - 100% → "Pending Approval"
- Verify dropdown disables when "Pending Approval"

### 5. Wait for Approval
- Task at 100% should show "Waiting for admin approval"
- Login as admin and approve the task
- Login back as intern
- Verify task status is now "Completed"
- Verify "Task Completed & Approved" message displays

### 6. Mobile Testing
- Open browser DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Set width to 375px (mobile)
- Verify:
  - Dashboard cards are responsive
  - Tasks switch from table to card view
  - All buttons are touch-friendly
  - Sidebar adapts properly

---

## API Routes Summary

### Intern Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/task/intern/tasks` | Get all assigned tasks | Required (Intern) |
| PUT | `/api/task/intern/update-task/:taskId` | Update task progress | Required (Intern) |

### Admin Routes (For Reference)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/task/admin/create-task` | Create and assign task | Required (Admin) |
| PUT | `/api/task/admin/approve-task/:taskId` | Approve task | Required (Admin) |
| PUT | `/api/task/admin/edit-task/:taskId` | Edit task | Required (Admin) |
| DELETE | `/api/task/admin/delete-task/:taskId` | Delete task | Required (Admin) |
| GET | `/api/task/admin/tasks` | Get all tasks | Required (Admin) |
| GET | `/api/task/admin/task-stats` | Get task statistics | Required (Admin) |

---

## Status & Completion

### ✅ Completed Features
1. ✅ Intern Dashboard with profile details
2. ✅ Task statistics overview
3. ✅ My Tasks section with table and card views
4. ✅ Progress update functionality (0%, 25%, 50%, 75%, 100%)
5. ✅ Automatic status updates based on progress
6. ✅ Submit for approval workflow (100% → Pending Approval)
7. ✅ Admin approval required for completion
8. ✅ Visual status indicators and feedback
9. ✅ Overdue task warnings
10. ✅ Mobile responsive design
11. ✅ Role-based access control
12. ✅ Secure API endpoints

### 🚫 Not Implemented (As Per Requirements)
- ❌ File upload (not required)
- ❌ Auto-completion without admin approval (security rule)
- ❌ Task creation by intern (admin-only feature)

---

## Environment Setup

### Prerequisites
- Node.js installed
- MongoDB running on `mongodb://127.0.0.1:27017/progrentures`
- Backend running on port 5000
- Frontend running on port 3000

### Running the Application

**Backend**:
```bash
cd backend
node server.js
```

**Frontend**:
```bash
cd frontend
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Intern Login: http://localhost:3000/intern-login
- Admin Login: http://localhost:3000/admin-login

---

## Success Criteria ✅

All requirements met:
- ✅ Intern can view dashboard with personal details
- ✅ Intern can view all assigned tasks
- ✅ Intern can update task progress (0-100%)
- ✅ Progress updates automatically change status
- ✅ 100% progress triggers "Pending Approval" status
- ✅ Admin approval required for task completion
- ✅ Clear visual indicators for all task states
- ✅ Mobile responsive interface
- ✅ Secure API with role-based access
- ✅ Clean, simple UI (no over-engineering)

---

## Support & Maintenance

For issues or questions:
1. Check browser console for errors
2. Verify backend server is running
3. Confirm MongoDB is connected
4. Check JWT token in localStorage
5. Verify user role is 'intern'

---

**Last Updated**: December 13, 2025
**Version**: 1.0.0
**Status**: ✅ PRODUCTION READY
