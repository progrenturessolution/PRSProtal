# Progrentures Internship Management System
## Complete Project Summary

---

## 📁 Project Structure

```
Progrenstures/
│
├── backend/                     # Node.js + Express Backend
│   ├── config/
│   │   ├── db.js               # MongoDB connection & dummy admin creation
│   │   └── emailService.js     # Nodemailer email service
│   │
│   ├── models/
│   │   ├── Admin.js            # Admin schema (email, password, role)
│   │   └── Intern.js           # Intern schema (name, email, internId, password)
│   │
│   ├── controllers/
│   │   ├── authController.js   # Admin & Intern login logic
│   │   └── adminController.js  # Add intern, get interns logic
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # Authentication routes
│   │   └── adminRoutes.js      # Admin protected routes
│   │
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification & admin role check
│   │
│   ├── server.js               # Express app entry point
│   ├── package.json
│   └── .env                    # Environment variables
│
├── frontend/                    # React.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx       # Main login page (3 buttons)
│   │   │   ├── AdminLogin.jsx  # Admin login form
│   │   │   └── InternLogin.jsx # Intern login form
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx  # Dashboard with sidebar
│   │   │   └── AddIntern.jsx       # Add intern form
│   │   │
│   │   ├── services/
│   │   │   └── api.js          # Axios API service
│   │   │
│   │   ├── App.jsx             # React Router setup
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md                    # Complete documentation
├── QUICKSTART.md               # Quick start guide
└── API_DOCUMENTATION.md        # API reference

```

---

## ✅ Features Implemented

### Backend Features:
1. **MongoDB Database Connection**
   - Auto-creates `progrentures` database
   - Dummy admin created on first run

2. **Admin Schema**
   - Email (unique)
   - Password (bcrypt hashed)
   - Role (admin)

3. **Intern Schema**
   - Name
   - Email (unique)
   - Intern ID (auto-generated: PRG{YEAR}{NUMBER})
   - Password (bcrypt hashed)
   - Role (intern)

4. **Authentication System**
   - Admin login with JWT
   - Intern login with JWT (Intern ID + password)
   - Token expiration: 24 hours

5. **Admin APIs**
   - POST /api/auth/admin-login
   - POST /api/admin/add-intern (protected)
   - GET /api/admin/interns (protected)

6. **Email Service**
   - Sends credentials to new interns
   - Professional HTML email template
   - Gmail SMTP integration

7. **Middleware**
   - JWT token verification
   - Admin role verification

### Frontend Features:
1. **Login Page**
   - Left: Company logo & branding
   - Right: 3 login buttons (Admin, Intern, SMS)

2. **Admin Login Form**
   - Email & password fields
   - Error handling
   - Navigation back to main login

3. **Intern Login Form**
   - Intern ID & password fields
   - Error handling
   - Navigation back to main login

4. **Admin Dashboard**
   - Sidebar navigation
   - Statistics cards (placeholders)
   - Menu items: Dashboard, Add Intern, Add SMS (disabled)
   - Logout button

5. **Add Intern Page**
   - Name, email, password fields
   - Form validation
   - Success/error messages
   - Shows generated Intern ID
   - Email confirmation status

6. **UI/UX**
   - Clean, professional design
   - Gradient backgrounds
   - Hover effects
   - Responsive layout
   - Error/success message displays

---

## 🔐 Default Credentials

### Admin Login:
- **Email**: admin@progrentures.com
- **Password**: admin123

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Environment
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/progrentures
JWT_SECRET=your_jwt_secret_key_here_change_in_production

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 3. Start MongoDB
```bash
mongod
# or start MongoDB service
```

### 4. Run Backend
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### 5. Run Frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

---

## 📊 Application Flow

```
1. User opens http://localhost:3000
   ↓
2. Sees Login Page with 3 options
   ↓
3. Clicks "Admin Login"
   ↓
4. Enters: admin@progrentures.com / admin123
   ↓
5. Backend verifies credentials
   ↓
6. Returns JWT token
   ↓
7. Frontend stores token in localStorage
   ↓
8. Redirects to Admin Dashboard
   ↓
9. Admin clicks "Add Intern" in sidebar
   ↓
10. Fills form: Name, Email, Password
   ↓
11. Submits form
   ↓
12. Backend:
    - Validates data
    - Generates Intern ID (e.g., PRG20250001)
    - Hashes password
    - Saves to MongoDB
    - Sends email to intern
   ↓
13. Frontend shows success message with Intern ID
   ↓
14. Intern receives email with credentials
   ↓
15. Intern can now login using their Intern ID
```

---

## 📧 Email Sample

When an intern is added, they receive:

```
Subject: Welcome to Progrentures - Your Internship Credentials

Dear John Doe,

Congratulations! You have been successfully registered as an intern at Progrentures.

Your Login Credentials:
Intern ID: PRG20250001
Password: intern123

Please keep these credentials safe and do not share them with anyone.
We recommend changing your password after your first login.

Best regards,
Progrentures Team
```

---

## 🔧 Technologies Used

| Layer      | Technology      | Purpose                          |
|------------|----------------|----------------------------------|
| Frontend   | React 18       | UI Framework                     |
| Frontend   | Vite           | Build tool & dev server         |
| Frontend   | React Router   | Client-side routing             |
| Frontend   | Axios          | HTTP requests                    |
| Backend    | Node.js        | Runtime environment             |
| Backend    | Express.js     | Web framework                   |
| Backend    | MongoDB        | Database                        |
| Backend    | Mongoose       | MongoDB ODM                     |
| Backend    | JWT            | Authentication                  |
| Backend    | bcryptjs       | Password hashing                |
| Backend    | Nodemailer     | Email service                   |
| Backend    | CORS           | Cross-origin requests           |
| Backend    | dotenv         | Environment variables           |

---

## 📝 Key Code Patterns

### 1. JWT Authentication
```javascript
// Generate token
const token = jwt.sign(
  { id: admin._id, email: admin.email, role: admin.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify token (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 2. Password Hashing
```javascript
// Hash password
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isMatch = await bcrypt.compare(password, hashedPassword);
```

### 3. Intern ID Generation
```javascript
const generateInternId = async () => {
  const year = new Date().getFullYear();
  const count = await Intern.countDocuments();
  return `PRG${year}${String(count + 1).padStart(4, '0')}`;
};
// Output: PRG20250001, PRG20250002, etc.
```

### 4. Protected Routes
```javascript
// Frontend
localStorage.setItem('token', response.data.token);

// Backend middleware
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

---

## 🎯 Project Highlights

✅ **Clean Architecture**: Separation of concerns (MVC pattern)  
✅ **Secure**: Password hashing, JWT authentication, protected routes  
✅ **User-Friendly**: Intuitive UI, clear error messages  
✅ **Professional**: Email notifications, auto-generated IDs  
✅ **Scalable**: Modular code structure, easy to extend  
✅ **Interview-Ready**: Well-documented, follows best practices  
✅ **Startup-Friendly**: Simple, no over-engineering  

---

## 🔮 Future Enhancements (Not Implemented Yet)

- SMS Login functionality
- Intern Dashboard
- Attendance tracking
- Task management
- Performance evaluation
- Analytics & reports
- Intern profile management
- Password reset functionality
- Multi-language support

---

## 📞 API Endpoints Summary

| Method | Endpoint               | Access  | Description           |
|--------|------------------------|---------|----------------------|
| POST   | /api/auth/admin-login  | Public  | Admin login          |
| POST   | /api/auth/intern-login | Public  | Intern login         |
| POST   | /api/admin/add-intern  | Admin   | Add new intern       |
| GET    | /api/admin/interns     | Admin   | Get all interns      |

---

## ✨ Ready to Use!

The system is fully functional and ready for:
- Development
- Testing
- Demonstration
- Production (with proper environment setup)

All files are created and organized.  
All features are implemented.  
All documentation is complete.

**Happy Coding!** 🚀
