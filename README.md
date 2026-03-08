# Progrentures - Internship Management System

A simple, professional Internship Management System built for small startups.

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Email**: Nodemailer (Gmail SMTP)
- **Authentication**: JWT

## Project Structure

```
Progrenstures/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── emailService.js
│   ├── models/
│   │   ├── Admin.js
│   │   └── Intern.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx
    │   │   ├── AdminLogin.jsx
    │   │   └── InternLogin.jsx
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx
    │   │   └── AddIntern.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB installed and running locally
- Gmail account for email service

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your credentials:
# - MONGO_URI (default: mongodb://localhost:27017/progrentures)
# - JWT_SECRET (change to a secure random string)
# - EMAIL_USER (your Gmail address)
# - EMAIL_PASS (Gmail app-specific password)

# Start the backend server
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

**Important**: The system will automatically create a dummy admin on first run:

- Email: `admin@progrentures.com`
- Password: `admin123`

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Email Configuration

To enable email functionality:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Copy the 16-character password
4. Update `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

## Features Implemented

### Authentication

- Admin login with JWT
- Intern login with JWT
- Protected routes
- Token-based authorization

### Admin Features

- Admin dashboard with sidebar navigation
- Add new intern
- Auto-generate unique Intern ID (format: PRG{YEAR}{NUMBER})
- Send credentials via email
- Password hashing with bcrypt

### User Interface

- Clean, professional design
- Responsive layout
- Login page with company branding
- Admin dashboard
- Add intern form with validation

## API Endpoints

### Authentication Routes

```
POST /api/auth/admin-login
Body: { email, password }

POST /api/auth/intern-login
Body: { internId, password }
```

### Admin Routes (Protected)

```
POST /api/admin/add-intern
Headers: Authorization: Bearer {token}
Body: { name, email, password }

GET /api/admin/interns
Headers: Authorization: Bearer {token}
```

## Database Schemas

### Admin Schema

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: String (default: 'admin'),
  timestamps: true
}
```

### Intern Schema

```javascript
{
  name: String (required),
  email: String (unique, required),
  internId: String (unique, required),
  password: String (hashed, required),
  role: String (default: 'intern'),
  timestamps: true
}
```

## Default Credentials

### Admin Login

- **Email**: admin@progrentures.com
- **Password**: admin123

(These are created automatically when the server starts for the first time)

## Usage Flow

1. Start MongoDB service
2. Start backend server (`npm start` in backend folder)
3. Start frontend server (`npm run dev` in frontend folder)
4. Open browser to `http://localhost:3000`
5. Click "Admin Login"
6. Login with default credentials
7. Navigate to "Add Intern" from the sidebar
8. Fill in intern details and submit
9. Intern receives email with credentials
10. Intern can login using their Intern ID and password

## Future Enhancements

- SMS login functionality
- Intern dashboard
- Attendance tracking
- Task assignment
- Performance evaluation
- Reports and analytics

## Notes

- Clean and readable code
- Suitable for small startups
- Interview-friendly implementation
- No over-engineering
- Production-ready structure

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running: `mongod` or start MongoDB service
- Check if port 27017 is available

### Email Not Sending

- Verify Gmail App Password is correct
- Check if 2FA is enabled on Gmail account
- Ensure EMAIL_USER and EMAIL_PASS are set in .env

### Frontend Can't Connect to Backend

- Verify backend is running on port 5000
- Check CORS is enabled in backend
- Ensure API_BASE_URL in frontend is correct

## License

MIT
