# Installation Guide for Windows

## Prerequisites Installation

### 1. Install Node.js

1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### 2. Install MongoDB

**Option A: MongoDB Community Server (Recommended)**

1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. Verify installation:
   ```powershell
   mongod --version
   ```

**Option B: MongoDB Atlas (Cloud)**

- Use cloud MongoDB at: https://www.mongodb.com/cloud/atlas
- Update MONGO_URI in `.env` with your Atlas connection string

### 3. Setup Gmail for Email Service

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and generate password
   - Copy the 16-character password

---

## Project Setup

### Step 1: Navigate to Project

```powershell
cd Desktop\Progrenstures
```

### Step 2: Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure .env file
# Open .env and update:
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-16-char-app-password

# (Optional) You can edit .env with:
notepad .env
```

### Step 3: Frontend Setup

```powershell
# Navigate to frontend (from project root)
cd ..\frontend

# Install dependencies
npm install
```

### Step 4: Start MongoDB Service

**If installed as Windows Service:**

```powershell
# MongoDB should already be running
# To check:
Get-Service MongoDB

# To start if stopped:
Start-Service MongoDB
```

**If not installed as service:**

```powershell
# Start MongoDB manually in a new terminal:
mongod

# Keep this terminal open while working
```

---

## Running the Application

### Terminal 1: Backend Server

```powershell
cd Desktop\Progrenstures\backend
npm start
```

You should see:

```
Server running on port 5000
MongoDB Connected Successfully to database: progrentures
✅ Dummy admin created successfully
   Email: admin@progrentures.com
   Password: admin123
```

### Terminal 2: Frontend Server

```powershell
cd Desktop\Progrenstures\frontend
npm run dev
```

You should see:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Access the Application

Open browser and go to: **http://localhost:3000**

---

## First Time Login

1. Click **"Admin Login"**
2. Enter credentials:
   - Email: `admin@progrentures.com`
   - Password: `admin123`
3. Click **Login**
4. You'll be redirected to the Admin Dashboard

---

## Testing the System

### Add Your First Intern

1. Click **"Add Intern"** in sidebar
2. Fill the form:
   - Name: `John Doe`
   - Email: `your-test-email@gmail.com`
   - Password: `intern123`
3. Click **"Add Intern"**
4. Check the email inbox for credentials

### Test Intern Login

1. Go back to main login page
2. Click **"Intern Login"**
3. Use the credentials received in email:
   - Intern ID: `PRG20250001`
   - Password: `intern123`
4. Login successful!

---

## Stopping the Application

### Stop Frontend

In the frontend terminal:

- Press `Ctrl + C`
- Type `Y` to confirm

### Stop Backend

In the backend terminal:

- Press `Ctrl + C`
- Type `Y` to confirm

### Stop MongoDB (if running manually)

In the MongoDB terminal:

- Press `Ctrl + C`

---

## Troubleshooting

### Port Already in Use

**Backend (Port 5000):**

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Frontend (Port 3000):**

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### MongoDB Not Running

```powershell
# Check MongoDB service status
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB

# If service doesn't exist, start manually:
mongod
```

### Cannot Connect to MongoDB

- Ensure MongoDB is running
- Check MONGO_URI in `.env` is correct
- Default: `mongodb://localhost:27017/progrentures`

### npm install fails

```powershell
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### Email Not Sending

- Verify Gmail 2FA is enabled
- Check App Password is correct (16 characters, no spaces)
- Ensure EMAIL_USER and EMAIL_PASS are correct in `.env`

---

## Running in Development Mode (Auto-reload)

### Backend with Nodemon

```powershell
cd backend
npm run dev
```

Changes to backend files will auto-restart the server.

### Frontend with Vite

```powershell
cd frontend
npm run dev
```

Changes to frontend files will auto-refresh the browser.

---

## Building for Production

### Frontend Build

```powershell
cd frontend
npm run build
```

Creates optimized production build in `dist/` folder.

### Preview Production Build

```powershell
cd frontend
npm run preview
```

---

## Useful Commands

### Check Node Version

```powershell
node --version
npm --version
```

### Check MongoDB Version

```powershell
mongod --version
mongo --version
```

### View MongoDB Data

```powershell
# Open MongoDB shell
mongo

# Use the database
use progrentures

# View all admins
db.admins.find().pretty()

# View all interns
db.interns.find().pretty()

# Exit MongoDB shell
exit
```

### Clear All Data (Reset Database)

```powershell
# In MongoDB shell:
use progrentures
db.admins.deleteMany({})
db.interns.deleteMany({})
```

The dummy admin will be recreated on next server start.

---

## Next Steps

- ✅ System is ready to use
- ✅ Add more interns
- ✅ Customize the UI
- ✅ Add new features

**Enjoy your Internship Management System!**
