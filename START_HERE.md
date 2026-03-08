# PROGRENTURES - START HERE

Welcome to the **Progrentures Internship Management System**!

---

## Quick Start (5 Minutes)

```powershell
# 1. Run automated setup
.\setup.ps1

# 2. Configure email in backend/.env (optional but recommended)
notepad backend\.env

# 3. Start backend (Terminal 1)
cd backend
npm start

# 4. Start frontend (Terminal 2)
cd frontend
npm run dev

# 5. Open browser
# http://localhost:3000

# 6. Login as admin
# Email: admin@progrentures.com
# Password: admin123
```

**Done! Your system is running.**

---

## Documentation Quick Links

| What You Need              | File to Read                                       | Time   |
| -------------------------- | -------------------------------------------------- | ------ |
| **Quick Setup**            | [QUICKSTART.md](QUICKSTART.md)                     | 5 min  |
| **Windows Install Help**   | [INSTALLATION_WINDOWS.md](INSTALLATION_WINDOWS.md) | 10 min |
| **Project Overview**       | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)         | 15 min |
| **Complete Documentation** | [README.md](README.md)                             | 20 min |
| **API Reference**          | [API_DOCUMENTATION.md](API_DOCUMENTATION.md)       | 15 min |
| **Architecture Details**   | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)           | 20 min |
| **Visual Diagrams**        | [VISUAL_GUIDE.md](VISUAL_GUIDE.md)                 | 10 min |
| **All Docs Index**         | [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)   | 5 min  |

---

## Choose Your Path

### I'm a User - Just Want to Run It

1. **[QUICKSTART.md](QUICKSTART.md)** <- Start here
2. Run the app
3. Done!

### I'm a Developer - Want to Understand the Code

1. **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** <- Overview
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** ← Architecture
3. **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** ← Diagrams
4. Explore the code

### I'm Setting Up for the First Time

1. **[INSTALLATION_WINDOWS.md](INSTALLATION_WINDOWS.md)** <- Prerequisites
2. **[QUICKSTART.md](QUICKSTART.md)** ← Setup & Run
3. Test the system

### I'm Building APIs / Testing

1. **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** <- API Reference
2. Test with Postman/cURL
3. Integrate

### I'm Presenting in an Interview

1. **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** <- Quick briefing
2. **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** ← Show diagrams
3. Run live demo

---

## What's Included

Full MERN Stack Application

- React.js frontend with clean UI
- Node.js + Express backend
- MongoDB database
- JWT authentication
- Email notifications

Complete Features

- Admin login & dashboard
- Intern login
- Add intern functionality
- Auto-generate intern IDs
- Email credentials to interns

Comprehensive Documentation

- 8 detailed documentation files
- Setup scripts
- Visual diagrams
- API reference

---

## Quick Reference

### Default Credentials

```
Admin Login:
Email:    admin@progrentures.com
Password: admin123
```

### Ports

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
MongoDB:   mongodb://localhost:27017
```

### Key Commands

```powershell
# Automated setup
.\setup.ps1

# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🗂️ Project Structure

```
Progrenstures/
│
├── START_HERE.md (this file)
│
├── Documentation/
│   ├── QUICKSTART.md
│   ├── INSTALLATION_WINDOWS.md
│   ├── README.md
│   ├── PROJECT_OVERVIEW.md
│   ├── PROJECT_SUMMARY.md
│   ├── API_DOCUMENTATION.md
│   ├── VISUAL_GUIDE.md
│   └── DOCUMENTATION_INDEX.md
│
├── Setup Scripts/
│   ├── setup.ps1
│   └── setup.bat
│
├── Backend/
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── index.html
```

---

## Features at a Glance

| Feature           | Status | Description           |
| ----------------- | ------ | --------------------- |
| Admin Login       |        | JWT authentication    |
| Intern Login      |        | ID-based login        |
| Admin Dashboard   |        | Sidebar navigation    |
| Add Intern        |        | Auto-generate ID      |
| Email Service     |        | Send credentials      |
| Password Security |        | Bcrypt hashing        |
| Protected Routes  |        | Middleware protection |
| Clean UI          |        | Professional design   |

---

## Learning Path

### Beginner

1. Run the app using QUICKSTART.md
2. Test all features
3. Read README.md for understanding

### Intermediate

1. Study PROJECT_SUMMARY.md
2. Review VISUAL_GUIDE.md
3. Understand the code structure

### Advanced

1. Read API_DOCUMENTATION.md
2. Study the source code
3. Extend with new features

---

## Find Specific Information

| Looking for...     | Check this file         |
| ------------------ | ----------------------- |
| Installation steps | INSTALLATION_WINDOWS.md |
| How to run         | QUICKSTART.md           |
| API endpoints      | API_DOCUMENTATION.md    |
| Architecture       | PROJECT_SUMMARY.md      |
| Flow diagrams      | VISUAL_GUIDE.md         |
| Database schemas   | README.md               |
| Email setup        | INSTALLATION_WINDOWS.md |
| Troubleshooting    | QUICKSTART.md           |
| Complete overview  | PROJECT_OVERVIEW.md     |

---

## Pro Tips

1. **First time?** Use the automated setup script: `.\setup.ps1`
2. **Need help?** Each documentation file has troubleshooting sections
3. **Visual learner?** Check VISUAL_GUIDE.md for diagrams
4. **Testing APIs?** Use API_DOCUMENTATION.md with Postman
5. **Interview prep?** Read PROJECT_OVERVIEW.md first

---

## Verification Checklist

Before you start, ensure you have:

- [ ] Node.js installed (v16+)
- [ ] MongoDB installed and running
- [ ] Gmail account (for email feature)
- [ ] Code editor (VS Code recommended)
- [ ] 2 terminal windows ready

---

## Next Steps

1. **Choose your path above** based on your goal
2. **Follow the recommended documentation**
3. **Run the application**
4. **Explore and learn**

---

## Notes

- All features are **fully implemented** and **tested**
- Code is **clean**, **documented**, and **interview-ready**
- System is **production-ready** (configure .env for production)
- Easily **extensible** with new features

---

## Ready to Begin!

**Choose your path above and start your journey!**

For most users, we recommend starting with **[QUICKSTART.md](QUICKSTART.md)**.

---

**Need Help?** All documentation files have detailed troubleshooting sections.

**Happy Coding!**

---

_Last Updated: December 13, 2025_  
_Status: Complete & Ready to Use_  
_Version: 1.0.0_
