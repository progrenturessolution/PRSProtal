# Archived Students (Recycle Bin) Feature

## Overview
A soft-delete system that allows administrators to safely archive students and restore them if needed, preventing accidental data loss.

## Features

### 1. **Soft Delete System**
- When a student is "deleted", they are archived instead of permanently removed
- All student data is preserved (profile, certificates, documents, tasks)
- Archived students are hidden from the main student list

### 2. **Recycle Bin / Archived Students Page**
- New menu item: **"Archived Students"** in Admin Dashboard sidebar
- Located under "STUDENT MANAGEMENT" section
- Archive icon for easy identification

### 3. **Archived Students View**
- Professional table layout showing:
  - Student ID
  - Name
  - Email
  - Student Type (Internship/SMS)
  - Deleted Date & Time
  - Action buttons (Restore / Delete Forever)
- Search functionality across all fields
- Total count of archived students
- Empty state when no archived students

### 4. **Restore Functionality**
- Green "Restore" button for each student
- Confirmation dialog before restoring
- Student is moved back to active students list
- All data is preserved and restored

### 5. **Permanent Delete**
- Red "Delete Forever" button for final removal
- Double confirmation with warning message
- Warns about irreversible data loss
- Actually removes student from database

### 6. **Safety Features**
- Confirmation dialogs prevent accidental actions
- Clear warning messages about data loss
- Color-coded buttons (Green = Safe, Red = Danger)
- Informative messages after each action

## How to Use

### Archiving a Student
1. Go to "View All Students"
2. Click the three-dot menu on a student
3. Click "Delete"
4. Confirm the action
5. Student is moved to "Archived Students"

### Restoring a Student
1. Go to "Archived Students" in sidebar
2. Find the student you want to restore
3. Click the green "Restore" button
4. Confirm the restoration
5. Student appears back in "View All Students"

### Permanently Deleting a Student
1. Go to "Archived Students" in sidebar
2. Find the student you want to delete forever
3. Click the red "Delete Forever" button
4. Read the warning carefully
5. Confirm if you're absolutely sure
6. Student is permanently removed from database

## Technical Implementation

### Database Schema
```javascript
// Added to Intern model
isDeleted: {
  type: Boolean,
  default: false
},
deletedAt: {
  type: Date,
  default: null
}
```

### API Endpoints
```
GET    /api/admin/deleted-interns          - Get all archived students
PATCH  /api/admin/intern/:id/restore       - Restore archived student
DELETE /api/admin/intern/:id               - Archive student (soft delete)
DELETE /api/admin/intern/:id/permanent     - Permanently delete student
```

### Frontend Components
- **ArchivedStudents.jsx** - Main page for archived students
- Updated **ViewInterns.jsx** - Changed delete message to reflect archiving
- Updated **AdminDashboard.jsx** - Added menu item and routing

### Frontend API Service
```javascript
adminAPI.getDeletedInterns()              // Fetch archived students
adminAPI.restoreIntern(id)                // Restore a student
adminAPI.permanentlyDeleteIntern(id)      // Permanently delete
```

## Benefits

1. **Data Safety**: Prevents accidental permanent deletion
2. **Recovery**: Easy to recover mistakenly deleted students
3. **Professional**: Industry-standard recycle bin pattern
4. **User-Friendly**: Clear interface with confirmations
5. **Audit Trail**: Deleted date/time tracked for each archived student

## Design Features

- **Dark Theme**: Matches overall admin panel design
- **Mobile Responsive**: Works on all device sizes
- **Color Coding**: 
  - Green = Restore (safe action)
  - Red = Permanent Delete (dangerous action)
- **Icons**: Archive/trash icons for visual clarity
- **Professional Layout**: Clean table with hover effects

## Important Notes

⚠️ **Permanent Delete is IRREVERSIBLE**
- Once permanently deleted, data cannot be recovered
- Always double-check before permanent deletion
- Consider archiving instead of permanent deletion

✅ **Restore is Safe**
- All data is preserved during archiving
- No data loss when restoring
- Student returns to exact same state

## Future Enhancements (Optional)

- Auto-delete archived students after X days
- Bulk restore/delete operations
- Export archived student data
- Detailed audit log of deletions/restorations
- Email notifications on student archiving
