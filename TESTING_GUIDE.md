# Intern Portal - Quick Testing Guide

## Servers Running

- Backend: http://localhost:5000 (MongoDB Connected)
- Frontend: http://localhost:3000

---

## Test Scenario: Complete Intern Portal Flow

### Step 1: Create Test Intern (Admin Task)

1. Open http://localhost:3000/admin-login
2. Login:
   - Email: `admin@progrentures.com`
   - Password: `admin123`
3. Navigate to "Add Intern"
4. Create a test intern:
   ```
   Name: Test Intern
   Email: intern@test.com
   Internship Start: 2024-01-01
   Internship End: 2024-06-01
   Status: Active
   ```
5. **Note the Intern ID** (e.g., PRG20240001)
6. **Note the Password** shown in the success message

---

### Step 2: Create Tasks for Intern (Admin Task)

1. In Admin Dashboard, go to "Create Task"
2. Create Task 1:
   ```
   Title: Setup Development Environment
   Description: Install Node.js, VS Code, and Git
   Deadline: Tomorrow
   Assign To: [Select Test Intern]
   ```
3. Create Task 2:
   ```
   Title: Complete React Tutorial
   Description: Learn React basics from official docs
   Deadline: In 3 days
   Assign To: [Select Test Intern]
   ```
4. Create Task 3:
   ```
   Title: Build Todo App
   Description: Create a simple todo application
   Deadline: In 1 week
   Assign To: [Select Test Intern]
   ```

---

### Step 3: Intern Login & View Dashboard

1. **Logout from Admin**
2. Open http://localhost:3000/intern-login
3. Login with:
   - Intern ID: `PRG20240001` (from Step 1)
   - Password: (password from Step 1)
4. You should see:
   - ✅ **Intern Dashboard** with profile details
   - ✅ Name, Intern ID, Email, Status cards
   - ✅ Task statistics showing:
     - Total Tasks: 3
     - Assigned: 3
     - In Progress: 0
     - Pending Approval: 0
     - Completed: 0

---

### Step 4: View My Tasks

1. Click "My Tasks" in sidebar OR "View My Tasks" button
2. Verify tasks display:
   - All 3 tasks visible
   - Desktop: Table view with columns
   - Mobile: Card view (resize browser to < 768px)
   - Each task shows: Title, Description, Deadline, Progress bar, Status

---

### Step 5: Update Task Progress

#### Task 1: Start Working

1. Find "Setup Development Environment" task
2. Change progress dropdown to: **25% - Started**
3. Verify:
   - Progress bar updates to 25%
   - Status changes to "In Progress" (Blue badge)
   - Update happens instantly

#### Task 2: Half Complete

1. Find "Complete React Tutorial" task
2. Change progress to: **50% - Half Done**
3. Verify:
   - Progress bar shows 50%
   - Status is "In Progress"

#### Task 3: Submit for Approval

1. Find "Build Todo App" task
2. Change progress to: **100% - Submit for Approval**
3. Verify:
   - Progress bar is full (100%)
   - Status changes to "Pending Approval" (Orange badge)
   - Shows message: "Waiting for admin approval"
   - Dropdown becomes DISABLED (cannot change progress)

---

### Step 6: Admin Approval Process

1. **Logout from Intern**
2. Login as **Admin** again
3. Navigate to "Pending Approvals"
4. Find "Build Todo App" task (100% progress)
5. Click "Approve" button
6. Verify success message

---

### Step 7: Verify Task Completion

1. **Logout from Admin**
2. Login as **Intern** again
3. Go to "My Tasks"
4. Find "Build Todo App" task
5. Verify:
   - Status is "Completed" (Green badge)
   - Shows message: "Task Completed & Approved"
   - No progress dropdown (task is done)
   - Dashboard statistics updated:
     - Completed: 1
     - In Progress: 2

---

### Step 8: Test Mobile Responsiveness

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Set device to "iPhone 12 Pro" or width: 375px
4. Navigate through intern portal:
   - Dashboard cards stack vertically
   - Task table switches to card view
   - Sidebar adapts properly
   - All buttons are touch-friendly
   - Text is readable without zoom

---

### Step 9: Test Restrictions

#### Verify Intern CANNOT:

1. Mark task as completed directly (must submit for approval)
2. Change progress when status is "Pending Approval"
3. Update progress of completed tasks
4. Access admin panel features
5. View other interns' tasks

#### Test Edge Cases:

1. **Overdue Task**:
   - Wait for deadline to pass OR manually set past deadline in DB
   - Verify red warning shows: "[date]"

2. **Progress Rollback**:
   - Set task to 75%
   - Change back to 25%
   - Verify status remains "In Progress"

3. **Zero Progress**:
   - Set task to 0%
   - Verify status changes back to "Assigned"

---

## Expected Results Summary

### Dashboard Section

- Displays intern profile (Name, ID, Email, Status)
- Shows accurate task statistics
- "View My Tasks" button works

### My Tasks Section

- Lists all assigned tasks
- Progress dropdown works (0%, 25%, 50%, 75%, 100%)
- Status updates automatically based on progress
- 100% triggers "Pending Approval"
- Approved tasks show "Completed" status
- Overdue tasks show warning
- Desktop table and mobile cards both work

### Security

- Only logged-in intern can access
- Intern sees only their own tasks
- Cannot complete tasks without admin approval
- Cannot modify pending/completed tasks

### Mobile

- Responsive at 768px breakpoint
- Touch-friendly interface
- All features work on mobile

---

## Troubleshooting

### Problem: Tasks not loading

**Solution**:

- Check browser console for errors
- Verify backend is running on port 5000
- Check MongoDB is connected
- Verify intern is logged in (check localStorage for token)

### Problem: Progress not updating

**Solution**:

- Check if task status is "Pending Approval" or "Completed"
- Verify network request succeeds (check Network tab)
- Ensure JWT token is valid

### Problem: Dropdown disabled

**Solution**:

- This is EXPECTED behavior when status is "Pending Approval"
- Admin must approve the task first

### Problem: Can't login

**Solution**:

- Verify correct Intern ID format (PRG20240001)
- Check password (case-sensitive)
- Ensure intern exists in database

---

## API Endpoints Used

### Intern APIs

- `GET /api/task/intern/tasks` - Fetch assigned tasks
- `PUT /api/task/intern/update-task/:taskId` - Update progress

### Admin APIs (for testing)

- `POST /api/task/admin/create-task` - Create task
- `PUT /api/task/admin/approve-task/:taskId` - Approve task

---

## Success Indicators

All features working if:

1. Intern can login and see dashboard
2. All assigned tasks display correctly
3. Progress updates work smoothly
4. 100% progress -> Pending Approval
5. Admin approval -> Completed status
6. Mobile view works perfectly
7. No console errors
8. Secure (can't access other interns' data)

---

**Happy Testing!**

If all steps pass, the Intern Portal is ready for production use.
