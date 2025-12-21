# Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Install Dependencies

Open two terminal windows.

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Email (Optional but Recommended)

Edit `backend/.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> **How to get Gmail App Password:**
> 1. Enable 2FA on your Gmail account
> 2. Go to: https://myaccount.google.com/apppasswords
> 3. Generate password for "Mail"
> 4. Copy the 16-character password

### Step 3: Start MongoDB

Make sure MongoDB is running on your system:
```bash
# On Windows (if installed as service):
# MongoDB should already be running

# Or start manually:
mongod
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Access the Application

1. Open browser: `http://localhost:3000`
2. Click **"Admin Login"**
3. Use default credentials:
   - Email: `admin@progrentures.com`
   - Password: `admin123`

### Step 6: Add Your First Intern

1. Click **"Add Intern"** in the sidebar
2. Fill in the form:
   - Name: Test Intern
   - Email: test@example.com
   - Password: test123
3. Click **"Add Intern"**
4. The intern will receive an email with their credentials!

---

## Default Admin Credentials

- **Email**: admin@progrentures.com
- **Password**: admin123

(Automatically created on first server start)

---

## Port Configuration

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

---

## Troubleshooting

**Backend won't start?**
- Make sure MongoDB is running
- Check if port 5000 is available

**Frontend won't start?**
- Check if port 3000 is available
- Try: `npm install` again

**Can't login?**
- Backend must be running
- Check browser console for errors

**Email not sending?**
- Gmail App Password required
- Check .env file configuration

---

## Next Steps

- Add more interns
- Test intern login
- Customize the UI
- Add more features

Enjoy using Progrentures Internship Management System! 🚀
