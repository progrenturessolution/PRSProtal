# 📚 Documentation Index

Welcome to the **Progrentures Internship Management System** documentation!

---

## 🎯 Quick Links

| Document | Description | Best For |
|----------|-------------|----------|
| [QUICKSTART.md](QUICKSTART.md) | Get started in 5 minutes | First-time users |
| [INSTALLATION_WINDOWS.md](INSTALLATION_WINDOWS.md) | Windows installation guide | Windows users |
| [README.md](README.md) | Complete project documentation | Understanding the project |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Project overview & structure | Developers & reviewers |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API reference | API integration |

---

## 📖 Reading Guide

### For First-Time Users
1. Start with **QUICKSTART.md** to get the system running quickly
2. Read **INSTALLATION_WINDOWS.md** if you need help with prerequisites
3. Check **README.md** for detailed features and usage

### For Developers
1. Read **PROJECT_SUMMARY.md** to understand architecture
2. Review **API_DOCUMENTATION.md** for endpoint details
3. Explore the codebase with the structure guide in **README.md**

### For Interviewers/Reviewers
1. Start with **PROJECT_SUMMARY.md** for quick overview
2. Check **API_DOCUMENTATION.md** to see API design
3. Review code quality in the actual source files

---

## 📁 File Descriptions

### QUICKSTART.md
**Purpose**: Get up and running in 5 minutes  
**Contains**:
- Quick installation steps
- How to run the app
- Default credentials
- First intern addition
- Common troubleshooting

**When to use**: You want to test the system immediately

---

### INSTALLATION_WINDOWS.md
**Purpose**: Detailed Windows setup guide  
**Contains**:
- Node.js installation
- MongoDB installation
- Gmail configuration
- Step-by-step project setup
- Troubleshooting for Windows
- Useful PowerShell commands

**When to use**: You need help with prerequisites or Windows-specific issues

---

### README.md
**Purpose**: Main project documentation  
**Contains**:
- Project overview
- Tech stack details
- Complete folder structure
- Setup instructions
- Features list
- Database schemas
- API endpoints
- Usage flow
- Future enhancements

**When to use**: You want comprehensive project information

---

### PROJECT_SUMMARY.md
**Purpose**: High-level project overview  
**Contains**:
- Visual project structure
- Features checklist
- Application flow diagram
- Technology comparison table
- Key code patterns
- Project highlights
- Future enhancements

**When to use**: You need to understand the entire project quickly

---

### API_DOCUMENTATION.md
**Purpose**: Complete API reference  
**Contains**:
- All API endpoints
- Request/response examples
- Error codes and handling
- Authentication details
- cURL examples
- Postman examples
- JWT token information

**When to use**: You're integrating with the API or testing endpoints

---

## 🚀 Getting Started Path

```
1. Prerequisites?
   ├─ NO  → Go to QUICKSTART.md
   └─ YES → Go to INSTALLATION_WINDOWS.md
              ↓
2. After installation
   → Go to QUICKSTART.md Step 4
              ↓
3. Want to understand the code?
   → Go to PROJECT_SUMMARY.md
              ↓
4. Need API details?
   → Go to API_DOCUMENTATION.md
              ↓
5. Have issues?
   → Check troubleshooting in respective guides
```

---

## 🎓 Learning Path

### Beginner Level
1. **QUICKSTART.md** - Run the application
2. **README.md** (Features section) - Understand what it does

### Intermediate Level
1. **PROJECT_SUMMARY.md** - Learn the architecture
2. **README.md** (Schemas & API section) - Understand data flow

### Advanced Level
1. **API_DOCUMENTATION.md** - Master the API
2. **Source code** - Read implementation details
3. Extend features based on "Future Enhancements"

---

## 📞 Quick Reference

### Default Credentials
- **Admin Email**: admin@progrentures.com
- **Admin Password**: admin123

### Ports
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017

### Main Endpoints
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/intern-login` - Intern login
- `POST /api/admin/add-intern` - Add intern (protected)
- `GET /api/admin/interns` - Get interns (protected)

### Key Features
✅ JWT Authentication  
✅ Admin Dashboard  
✅ Add Intern  
✅ Email Notifications  
✅ Auto-generate Intern IDs  

---

## 🔍 Find What You Need

Looking for... | Check this file
---|---
How to install MongoDB | INSTALLATION_WINDOWS.md
How to run the app | QUICKSTART.md
API request examples | API_DOCUMENTATION.md
Project architecture | PROJECT_SUMMARY.md
Database schemas | README.md
Email configuration | INSTALLATION_WINDOWS.md
Troubleshooting | QUICKSTART.md or INSTALLATION_WINDOWS.md
Code structure | PROJECT_SUMMARY.md
Future features | README.md or PROJECT_SUMMARY.md

---

## 💡 Pro Tips

1. **Use QUICKSTART.md first** - Most users can start here
2. **Keep API_DOCUMENTATION.md handy** - Useful for testing
3. **Refer to PROJECT_SUMMARY.md** - Great for interviews
4. **Check troubleshooting sections** - Before asking for help

---

## 📝 Document Updates

All documentation is **up-to-date** with the current implementation.  
Last updated: December 13, 2025

---

## 🎯 Next Steps

1. Choose your starting document from the table above
2. Follow the guide step-by-step
3. Come back here if you need a different perspective

**Happy Learning!** 🚀
