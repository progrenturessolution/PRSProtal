# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication Endpoints

### 1. Admin Login
**POST** `/auth/admin-login`

Login as admin and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@progrentures.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "admin@progrentures.com",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 2. Intern Login
**POST** `/auth/intern-login`

Login as intern using Intern ID and password.

**Request Body:**
```json
{
  "internId": "PRG20250001",
  "password": "intern123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "name": "John Doe",
    "email": "john@example.com",
    "internId": "PRG20250001",
    "role": "intern"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Admin Endpoints (Protected)

> **Note:** All admin endpoints require JWT token in headers:
> ```
> Authorization: Bearer {your_jwt_token}
> ```

### 3. Add Intern
**POST** `/admin/add-intern`

Add a new intern to the system. Automatically generates Intern ID and sends credentials via email.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "intern123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Intern added successfully",
  "intern": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "name": "John Doe",
    "email": "john@example.com",
    "internId": "PRG20250001"
  },
  "emailSent": true
}
```

**Error Responses:**

**400 - Missing Fields:**
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

**400 - Duplicate Email:**
```json
{
  "success": false,
  "message": "Intern with this email already exists"
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**403 - Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Admin only."
}
```

---

### 4. Get All Interns
**GET** `/admin/interns`

Retrieve list of all interns (passwords excluded).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "interns": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "John Doe",
      "email": "john@example.com",
      "internId": "PRG20250001",
      "role": "intern",
      "createdAt": "2025-12-13T10:30:00.000Z",
      "updatedAt": "2025-12-13T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "internId": "PRG20250002",
      "role": "intern",
      "createdAt": "2025-12-13T11:15:00.000Z",
      "updatedAt": "2025-12-13T11:15:00.000Z"
    }
  ]
}
```

---

## Intern ID Format

Intern IDs are automatically generated in the format:
```
PRG{YEAR}{NUMBER}
```

Examples:
- `PRG20250001` - First intern of 2025
- `PRG20250002` - Second intern of 2025
- `PRG20250123` - 123rd intern of 2025

---

## Email Notification

When an intern is added, they automatically receive an email containing:
- Welcome message
- Their Intern ID
- Their password
- Instructions for first login

**Email Template:**
```
Subject: Welcome to Progrentures - Your Internship Credentials

Dear {Intern Name},

Congratulations! You have been successfully registered as an intern at Progrentures.

Your Login Credentials:
Intern ID: PRG20250001
Password: ********

Please keep these credentials safe and do not share them with anyone.
We recommend changing your password after your first login.

Best regards,
Progrentures Team
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `500` - Server Error

---

## Testing with Postman/cURL

### Example: Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@progrentures.com",
    "password": "admin123"
  }'
```

### Example: Add Intern (with token)
```bash
curl -X POST http://localhost:5000/api/admin/add-intern \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "intern123"
  }'
```

### Example: Get All Interns
```bash
curl -X GET http://localhost:5000/api/admin/interns \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## JWT Token

Tokens expire after **24 hours**. After expiration, users must login again.

Token payload contains:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "admin" | "intern",
  "iat": 1702468800,
  "exp": 1702555200
}
```
