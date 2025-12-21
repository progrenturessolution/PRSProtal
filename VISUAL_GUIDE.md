# 🎨 Visual Project Guide

## 📊 Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                     http://localhost:3000                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                        │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                    │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │  Login   │  │ AdminLogin  │  │ InternLogin  │              │
│  └──────────┘  └─────────────┘  └──────────────┘              │
│                                                                 │
│  Pages:                                                         │
│  ┌────────────────┐  ┌──────────────┐                         │
│  │AdminDashboard  │  │  AddIntern   │                         │
│  └────────────────┘  └──────────────┘                         │
│                                                                 │
│  Services:                                                      │
│  ┌──────────────────────────────────────┐                     │
│  │  api.js (Axios)                      │                     │
│  │  - authAPI.adminLogin()              │                     │
│  │  - authAPI.internLogin()             │                     │
│  │  - adminAPI.addIntern()              │                     │
│  │  - adminAPI.getAllInterns()          │                     │
│  └──────────────────────────────────────┘                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Axios HTTP (JSON)
                         │ Authorization: Bearer <JWT>
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               EXPRESS BACKEND (Node.js)                         │
│                  http://localhost:5000                          │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │  /api/auth/*         │  │  /api/admin/*        │           │
│  │  - admin-login       │  │  - add-intern        │           │
│  │  - intern-login      │  │  - interns           │           │
│  └──────────────────────┘  └──────────────────────┘           │
│           │                          │                          │
│           ▼                          ▼                          │
│  ┌──────────────────┐  ┌──────────────────────┐               │
│  │ authController   │  │  adminController     │               │
│  │ - adminLogin()   │  │  - addIntern()       │               │
│  │ - internLogin()  │  │  - getAllInterns()   │               │
│  └──────────────────┘  └──────────────────────┘               │
│           │                          │                          │
│           ▼                          ▼                          │
│  Middleware:           ┌──────────────────────┐                │
│  ┌──────────────────┐  │  Email Service       │                │
│  │ verifyToken()    │  │  - sendIntern        │                │
│  │ verifyAdmin()    │  │    Credentials()     │                │
│  └──────────────────┘  └──────────────────────┘                │
│           │                          │                          │
│           │                          │ Nodemailer               │
│           │                          ▼                          │
│           │             ┌──────────────────────┐                │
│           │             │   Gmail SMTP         │                │
│           │             │   Email Delivery     │                │
│           │             └──────────────────────┘                │
│           ▼                                                     │
│  ┌──────────────────────────────────────┐                      │
│  │         Mongoose Models              │                      │
│  │  ┌──────────┐    ┌──────────┐       │                      │
│  │  │  Admin   │    │  Intern  │       │                      │
│  │  └──────────┘    └──────────┘       │                      │
│  └──────────────────────────────────────┘                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                            │
│               mongodb://localhost:27017/progrentures            │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                   │
│  ┌──────────────────────────────────────────────┐              │
│  │  admins                                      │              │
│  │  {                                           │              │
│  │    _id: ObjectId                             │              │
│  │    email: "admin@progrentures.com"           │              │
│  │    password: "$2a$10$..."  (hashed)          │              │
│  │    role: "admin"                             │              │
│  │    createdAt: ISODate                        │              │
│  │    updatedAt: ISODate                        │              │
│  │  }                                           │              │
│  └──────────────────────────────────────────────┘              │
│                                                                 │
│  ┌──────────────────────────────────────────────┐              │
│  │  interns                                     │              │
│  │  {                                           │              │
│  │    _id: ObjectId                             │              │
│  │    name: "John Doe"                          │              │
│  │    email: "john@example.com"                 │              │
│  │    internId: "PRG20250001"                   │              │
│  │    password: "$2a$10$..."  (hashed)          │              │
│  │    role: "intern"                            │              │
│  │    createdAt: ISODate                        │              │
│  │    updatedAt: ISODate                        │              │
│  │  }                                           │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagrams

### 1. Admin Login Flow

```
User                Frontend              Backend               Database
  │                    │                     │                     │
  │  Enter credentials │                     │                     │
  ├───────────────────>│                     │                     │
  │                    │  POST /api/auth/    │                     │
  │                    │  admin-login        │                     │
  │                    ├────────────────────>│                     │
  │                    │  {email, password}  │                     │
  │                    │                     │  Find admin by     │
  │                    │                     │  email              │
  │                    │                     ├────────────────────>│
  │                    │                     │                     │
  │                    │                     │<────────────────────┤
  │                    │                     │  Admin document     │
  │                    │                     │                     │
  │                    │                     │  Compare password   │
  │                    │                     │  with bcrypt        │
  │                    │                     │                     │
  │                    │                     │  Generate JWT token │
  │                    │                     │                     │
  │                    │<────────────────────┤                     │
  │                    │  {success, token,   │                     │
  │                    │   user}             │                     │
  │                    │                     │                     │
  │                    │  Store token in     │                     │
  │                    │  localStorage       │                     │
  │                    │                     │                     │
  │<───────────────────┤                     │                     │
  │  Redirect to       │                     │                     │
  │  Dashboard         │                     │                     │
```

### 2. Add Intern Flow

```
Admin               Frontend              Backend              Database        Email
  │                    │                     │                     │              │
  │  Fill intern form  │                     │                     │              │
  ├───────────────────>│                     │                     │              │
  │                    │  POST /api/admin/   │                     │              │
  │                    │  add-intern         │                     │              │
  │                    │  + JWT token        │                     │              │
  │                    ├────────────────────>│                     │              │
  │                    │  {name, email, pwd} │                     │              │
  │                    │                     │  Verify JWT token   │              │
  │                    │                     │  (middleware)       │              │
  │                    │                     │                     │              │
  │                    │                     │  Check if admin     │              │
  │                    │                     │  (middleware)       │              │
  │                    │                     │                     │              │
  │                    │                     │  Count interns      │              │
  │                    │                     ├────────────────────>│              │
  │                    │                     │<────────────────────┤              │
  │                    │                     │  count: 0           │              │
  │                    │                     │                     │              │
  │                    │                     │  Generate ID:       │              │
  │                    │                     │  PRG20250001        │              │
  │                    │                     │                     │              │
  │                    │                     │  Hash password      │              │
  │                    │                     │  with bcrypt        │              │
  │                    │                     │                     │              │
  │                    │                     │  Save intern        │              │
  │                    │                     ├────────────────────>│              │
  │                    │                     │<────────────────────┤              │
  │                    │                     │  Intern saved       │              │
  │                    │                     │                     │              │
  │                    │                     │  Send email         │              │
  │                    │                     ├────────────────────────────────────>│
  │                    │                     │  {internId, pwd}    │              │
  │                    │                     │                     │              │
  │                    │<────────────────────┤                     │              │
  │                    │  {success, intern,  │                     │              │
  │                    │   emailSent}        │                     │              │
  │<───────────────────┤                     │                     │              │
  │  Success message   │                     │                     │              │
  │  with Intern ID    │                     │                     │              │
```

### 3. Intern Login Flow

```
Intern              Frontend              Backend               Database
  │                    │                     │                     │
  │  Enter ID & pwd    │                     │                     │
  ├───────────────────>│                     │                     │
  │                    │  POST /api/auth/    │                     │
  │                    │  intern-login       │                     │
  │                    ├────────────────────>│                     │
  │                    │  {internId, pwd}    │                     │
  │                    │                     │  Find intern by     │
  │                    │                     │  internId           │
  │                    │                     ├────────────────────>│
  │                    │                     │<────────────────────┤
  │                    │                     │  Intern document    │
  │                    │                     │                     │
  │                    │                     │  Verify password    │
  │                    │                     │  with bcrypt        │
  │                    │                     │                     │
  │                    │                     │  Generate JWT       │
  │                    │                     │                     │
  │                    │<────────────────────┤                     │
  │                    │  {success, token,   │                     │
  │                    │   user}             │                     │
  │<───────────────────┤                     │                     │
  │  Login successful  │                     │                     │
```

---

## 🎨 UI Component Tree

```
App
│
├── Router
    │
    ├── Route: "/" 
    │   └── Login
    │       ├── Left Panel (Logo + Branding)
    │       └── Right Panel
    │           ├── [Admin Login Button]
    │           ├── [Intern Login Button]
    │           └── [SMS Login Button] (disabled)
    │
    ├── Route: "/admin-login"
    │   └── AdminLogin
    │       ├── Left Panel (Logo + "Admin Portal")
    │       └── Right Panel
    │           └── Form
    │               ├── Email Input
    │               ├── Password Input
    │               ├── [Login Button]
    │               └── [Back Link]
    │
    ├── Route: "/intern-login"
    │   └── InternLogin
    │       ├── Left Panel (Logo + "Intern Portal")
    │       └── Right Panel
    │           └── Form
    │               ├── Intern ID Input
    │               ├── Password Input
    │               ├── [Login Button]
    │               └── [Back Link]
    │
    └── Route: "/admin-dashboard"
        └── AdminDashboard
            ├── Sidebar
            │   ├── Header (PROGRENTURES + Admin Panel)
            │   ├── Menu
            │   │   ├── [📊 Dashboard]
            │   │   ├── [➕ Add Intern]
            │   │   └── [➕ Add SMS] (disabled)
            │   └── [Logout Button]
            │
            └── Main Content (Dynamic)
                │
                ├── If menu = "dashboard":
                │   ├── Header (Welcome message)
                │   ├── Stats Grid
                │   │   ├── Total Interns Card
                │   │   ├── Active Internships Card
                │   │   └── This Month Card
                │   └── Quick Actions Card
                │
                └── If menu = "add-intern":
                    └── AddIntern
                        ├── Header (Add New Intern)
                        └── Card
                            └── Form
                                ├── Name Input
                                ├── Email Input
                                ├── Password Input
                                └── [Add Intern Button]
```

---

## 🗂️ Data Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    DATA FLOW                               │
└────────────────────────────────────────────────────────────┘

1. USER INPUT
   ↓
   [React Component State]
   └── formData = { name, email, password }

2. FORM SUBMISSION
   ↓
   [Event Handler]
   └── handleSubmit(e)
       ├── e.preventDefault()
       └── Call API service

3. API SERVICE LAYER
   ↓
   [services/api.js]
   └── adminAPI.addIntern(formData)
       ├── Axios POST request
       ├── Add JWT token from localStorage
       └── Send to backend

4. BACKEND ROUTE
   ↓
   [routes/adminRoutes.js]
   └── POST /api/admin/add-intern
       ├── verifyToken middleware
       ├── verifyAdmin middleware
       └── adminController.addIntern

5. CONTROLLER LOGIC
   ↓
   [controllers/adminController.js]
   └── addIntern(req, res)
       ├── Validate input
       ├── Check duplicate email
       ├── Generate internId
       ├── Hash password
       ├── Create intern object
       └── Save to database

6. DATABASE OPERATION
   ↓
   [MongoDB via Mongoose]
   └── new Intern({...}).save()
       ├── Validate schema
       ├── Insert document
       └── Return saved document

7. EMAIL SERVICE
   ↓
   [config/emailService.js]
   └── sendInternCredentials(...)
       ├── Create email template
       ├── Configure SMTP
       ├── Send via Nodemailer
       └── Return success/failure

8. RESPONSE TO FRONTEND
   ↓
   [Backend Response]
   └── res.status(201).json({
       success: true,
       intern: {...},
       emailSent: true
   })

9. FRONTEND UPDATE
   ↓
   [React Component]
   ├── Update success message
   ├── Clear form
   └── Re-render UI

10. USER FEEDBACK
    ↓
    [UI Display]
    └── Show success message with Intern ID
```

---

## 📦 File Dependencies Map

```
backend/server.js
├── requires dotenv ──────────────┐
├── requires express              │
├── requires cors                 │
├── requires ./config/db ─────────┼────> config/db.js
│   └── requires mongoose         │       └── requires ./models/Admin
│                                 │           └── Admin.js
├── requires ./routes/authRoutes ─┼────> routes/authRoutes.js
│   └── requires ./controllers/   │       └── authController.js
│       authController            │           ├── bcryptjs
│                                 │           ├── jsonwebtoken
│                                 │           ├── models/Admin
│                                 │           └── models/Intern
└── requires ./routes/adminRoutes─┼────> routes/adminRoutes.js
    ├── middleware/authMiddleware │       ├── adminController.js
    └── controllers/adminController       │   ├── bcryptjs
                                  │       │   ├── models/Intern
                                  │       │   └── config/emailService
                                  │       └── authMiddleware.js
                                  │           └── jsonwebtoken
                                  │
                                  └────> config/emailService.js
                                          └── nodemailer

frontend/src/main.jsx
├── requires react
├── requires react-dom
└── requires ./App.jsx
    ├── requires react-router-dom
    ├── requires ./components/Login.jsx
    │   └── react-router-dom
    ├── requires ./components/AdminLogin.jsx
    │   ├── react
    │   ├── react-router-dom
    │   └── ./services/api.js
    │       └── axios
    ├── requires ./components/InternLogin.jsx
    │   ├── react
    │   ├── react-router-dom
    │   └── ./services/api.js
    └── requires ./pages/AdminDashboard.jsx
        ├── react
        ├── react-router-dom
        └── ./pages/AddIntern.jsx
            ├── react
            └── ./services/api.js
```

---

## 🔐 Security Flow

```
┌──────────────────────────────────────────────────────────┐
│              SECURITY IMPLEMENTATION                     │
└──────────────────────────────────────────────────────────┘

1. PASSWORD STORAGE
   ────────────────────────────────────────
   Plain Password (user input)
   ↓
   bcrypt.hash(password, 10)
   ↓
   $2a$10$N9qo8uLO...  ← Stored in MongoDB
   
   ✓ Uses bcrypt (industry standard)
   ✓ Salt rounds: 10
   ✓ One-way hashing (cannot be reversed)

2. PASSWORD VERIFICATION
   ────────────────────────────────────────
   Login attempt with plain password
   ↓
   Retrieve hashed password from DB
   ↓
   bcrypt.compare(plainPassword, hashedPassword)
   ↓
   Returns true/false
   
   ✓ Constant-time comparison
   ✓ Protected against timing attacks

3. JWT AUTHENTICATION
   ────────────────────────────────────────
   User logs in successfully
   ↓
   jwt.sign({id, email, role}, SECRET, {expiresIn: '24h'})
   ↓
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
   Sent to frontend
   ↓
   Stored in localStorage
   ↓
   Included in every protected request
   (Authorization: Bearer <token>)
   ↓
   jwt.verify(token, SECRET)
   ↓
   Decoded payload {id, email, role, iat, exp}
   ↓
   Request allowed if valid
   
   ✓ Stateless authentication
   ✓ Expires after 24 hours
   ✓ Secret key in environment variable

4. ROLE-BASED ACCESS
   ────────────────────────────────────────
   Protected route request
   ↓
   verifyToken middleware
   ↓
   Token valid?
   ├── No → 401 Unauthorized
   └── Yes → Continue
       ↓
       verifyAdmin middleware
       ↓
       Role === 'admin'?
       ├── No → 403 Forbidden
       └── Yes → Grant access
   
   ✓ Two-layer verification
   ✓ Proper HTTP status codes

5. CORS PROTECTION
   ────────────────────────────────────────
   Request from frontend
   ↓
   CORS middleware checks origin
   ↓
   Allowed origin?
   ├── No → Block request
   └── Yes → Allow request
   
   ✓ Prevents unauthorized domains
   ✓ Configured in server.js
```

---

## 📊 Database Schema Visualization

```
┌─────────────────────────────────────────────────────────┐
│                    admins Collection                    │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1")             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ email: "admin@progrentures.com"                   │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Unique: true                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Lowercase: true                                │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ password: "$2a$10$abcdef..."                      │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Hashed with bcrypt                             │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ role: "admin"                                     │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Default: "admin"                               │ │
│  │ └─ Enum: ["admin"]                                │ │
│  └───────────────────────────────────────────────────┘ │
│  createdAt: ISODate("2025-12-13T10:00:00.000Z")        │
│  updatedAt: ISODate("2025-12-13T10:00:00.000Z")        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   interns Collection                    │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId("65a1b2c3d4e5f6g7h8i9j0k2")             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ name: "John Doe"                                  │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Trim: true                                     │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ email: "john@example.com"                         │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Unique: true                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Lowercase: true                                │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ internId: "PRG20250001"                           │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Unique: true                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Auto-generated                                 │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ password: "$2a$10$xyz123..."                      │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Required: true                                 │ │
│  │ └─ Hashed with bcrypt                             │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ role: "intern"                                    │ │
│  │ └─ Type: String                                   │ │
│  │ └─ Default: "intern"                              │ │
│  │ └─ Enum: ["intern"]                               │ │
│  └───────────────────────────────────────────────────┘ │
│  createdAt: ISODate("2025-12-13T11:30:00.000Z")        │
│  updatedAt: ISODate("2025-12-13T11:30:00.000Z")        │
└─────────────────────────────────────────────────────────┘
```

---

This visual guide provides a comprehensive overview of how all components interact in the Progrentures Internship Management System! 🚀
