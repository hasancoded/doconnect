# Doconnect API Reference

## Table of Contents

- [Introduction](#introduction)
- [Authentication & Authorization](#authentication--authorization)
- [Route Protection](#route-protection)
- [API Endpoints](#api-endpoints)
- [Subscription System](#subscription-system)
- [Request/Response Patterns](#requestresponse-patterns)
- [Security & Best Practices](#security--best-practices)
- [Testing & Integration](#testing--integration)

---

## Introduction

### Platform Overview

Doconnect is a MERN-stack (MongoDB, Express.js, React, Node.js) marketplace platform connecting senior doctors (employers) with junior doctors (freelancers) for medical freelance opportunities, such as consultations, research, documentation, reviews, and telemedicine.

### Architecture

- **Backend**: Node.js with Express.js, MongoDB (via Mongoose)
- **Authentication**: JWT-based with role-based access control (RBAC)
- **File Handling**: Cloudinary for image and document uploads
- **Payments**: Stripe for subscription management (optional)
- **Real-time**: Socket.IO for messaging and notifications

### Base URLs

- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-backend-url.railway.app/api`

### Rate Limiting

| Endpoint Type     | Limit        | Window     |
| ----------------- | ------------ | ---------- |
| General endpoints | 100 requests | 15 minutes |
| Authentication    | 10 requests  | 15 minutes |
| Job posting       | 20 requests  | 1 hour     |
| Applications      | 30 requests  | 1 hour     |

**Exceeded Response** (429):

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Authentication & Authorization

### JWT Token Requirements

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**Token Acquisition**:

- Obtained through `POST /api/auth/register` or `POST /api/auth/login`
- Stored as HTTP-only cookie in production
- Expires after 30 days (configurable)

### Role-Based Access Control (RBAC)

| Role     | Description                          | Access Level                          |
| -------- | ------------------------------------ | ------------------------------------- |
| `junior` | Junior doctors seeking opportunities | Apply to jobs, manage profile         |
| `senior` | Senior doctors posting jobs          | Post jobs, manage applications        |
| `admin`  | System administrators                | Full system access, user verification |

### Account Status Levels

| Status      | Description                          | Access                   |
| ----------- | ------------------------------------ | ------------------------ |
| `pending`   | New registration, needs verification | Basic profile management |
| `active`    | Verified and active account          | Full platform access     |
| `inactive`  | Temporarily disabled                 | No protected routes      |
| `suspended` | Banned/restricted by admin           | No protected routes      |

### Verification Status

| Type                  | Field                                            | Required For           |
| --------------------- | ------------------------------------------------ | ---------------------- |
| Email verification    | `isVerified: true`                               | Communication features |
| Identity verification | `verificationStatus.identity: "verified"`        | Job marketplace        |
| Medical license       | `verificationStatus.medicalLicense: "verified"`  | Professional features  |
| Background check      | `verificationStatus.backgroundCheck: "verified"` | High-trust roles       |

---

## Route Protection

### Backend Middleware System

#### Protection Levels

| Level | Middleware               | Requirements                             | Use Case                   |
| ----- | ------------------------ | ---------------------------------------- | -------------------------- |
| **1** | `protect`                | Valid JWT token                          | Basic authenticated routes |
| **2** | `requireActive`          | `accountStatus: "active"`                | Sensitive operations       |
| **3** | `requireVerified`        | `isVerified: true`                       | Email-verified features    |
| **4** | `requireVerifiedAccount` | `verificationStatus.overall: "verified"` | Professional features      |
| **5** | `requireSubscription`    | `subscriptionStatus: "active"`           | Premium features           |
| **6** | `requireAdmin`           | `role: "admin"`                          | Admin-only routes          |

#### Middleware Usage Examples

```javascript
// Level 1: Basic authentication
router.get("/auth/me", protect, getMe);

// Level 2: Active account required
router.put("/auth/updatepassword", protect, requireActive, updatePassword);

// Level 4: Professional verification required
router.get("/jobs", protect, requireVerifiedAccount, getJobs);

// Level 6: Admin only
router.get("/admin/users", protect, requireAdmin, getAllUsers);

// Combined requirements
router.post(
  "/expert-consultation",
  protect,
  requireActive,
  requireVerifiedAccount,
  requireSubscription,
  createConsultation
);
```

### Frontend Route Protection

#### React Component Props

```jsx
<ProtectedRoute
  requireActive={boolean} // Level 2
  requireVerified={boolean} // Level 3
  requireVerifiedAccount={boolean} // Level 4
  requireSubscription={boolean} // Level 5
  requireAdmin={boolean} // Level 6
  redirectTo={string} // Custom redirect path
>
  <YourComponent />
</ProtectedRoute>
```

#### Protection Examples

```jsx
// Basic protected route
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Professional verification required
<Route path="/jobs" element={
  <ProtectedRoute requireVerifiedAccount={true}>
    <JobMarketplace />
  </ProtectedRoute>
} />

// Premium subscription required
<Route path="/premium/analytics" element={
  <ProtectedRoute requireSubscription={true}>
    <PremiumAnalytics />
  </ProtectedRoute>
} />

// Admin only
<Route path="/admin/*" element={
  <ProtectedRoute requireAdmin={true}>
    <AdminPanel />
  </ProtectedRoute>
} />
```

### Account Status Flow

```
Registration → pending → active → verified professional
     ↓           ↓         ↓              ↓
   Basic     Basic +   Full Access   Professional
   Access   Documents              +   Features
```

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Authentication**: Not required (public)

**Request Body**:

```json
{
  "firstName": "string (required, 2-50 chars)",
  "lastName": "string (required, 2-50 chars)",
  "email": "string (required, valid email)",
  "phone": "string (required)",
  "password": "string (required, min 6 chars, must include uppercase, lowercase, number)",
  "role": "enum (required, values: ['senior', 'junior', 'admin'])",
  "medicalLicenseNumber": "string (required, 3-50 chars)",
  "licenseState": "string (required, 2-50 chars)",
  "primarySpecialty": "string (required, 2-100 chars)",
  "subspecialties": "array<string> (optional)",
  "yearsOfExperience": "number (required, 0-50)",
  "medicalSchool": {
    "name": "string (required, 2-200 chars)",
    "graduationYear": "number (required, 1950-current year)"
  },
  "location": {
    "city": "string (optional, max 100)",
    "state": "string (optional, max 100)",
    "country": "string (optional, max 100)",
    "timezone": "string (optional, max 50)"
  },
  "languages": "array<object> (optional)",
  "bio": "string (optional, max 2000)",
  "privacy": "object (optional)"
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "66f42da2f64df30000000001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "junior",
    "primarySpecialty": "Cardiology",
    "yearsOfExperience": 3,
    "accountStatus": "pending",
    "verificationStatus": { "overall": "pending" },
    "profileCompletion": { "percentage": 60 }
  }
}
```

**Error Responses**:

- `400` - Validation failed or user already exists
- `500` - Server error

**cURL Example**:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "password": "SecurePass1",
    "role": "junior",
    "medicalLicenseNumber": "ML12345",
    "licenseState": "CA",
    "primarySpecialty": "Cardiology",
    "yearsOfExperience": 3,
    "medicalSchool": {"name": "Harvard Medical School", "graduationYear": 2020}
  }'
```

**JavaScript/Axios**:

```javascript
const response = await axios.post("/api/auth/register", {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  // ... other fields
});
console.log(response.data.token);
```

---

#### POST /auth/login

Authenticate user and receive JWT token.

**Authentication**: Not required (public)

**Request Body**:

```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "66f42da2f64df30000000001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "junior",
    "accountStatus": "active"
  }
}
```

**Error Responses**:

- `400` - Validation failed
- `401` - Invalid credentials, account locked, or account not accessible
- `500` - Server error

**cURL Example**:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com", "password": "SecurePass1"}'
```

**JavaScript/Axios**:

```javascript
const response = await axios.post("/api/auth/login", {
  email: "john.doe@example.com",
  password: "SecurePass1",
});
localStorage.setItem("token", response.data.token);
```

---

#### GET /auth/logout

Logout user and clear session.

**Authentication**: Optional (updates lastActive if authenticated)

**Success Response** (200):

```json
{
  "success": true,
  "message": "User logged out successfully"
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

#### GET /auth/me

Get current authenticated user's profile.

**Authentication**: Required (Level 1)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "66f42da2f64df30000000001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "junior",
    "accountStatus": "active",
    "verificationStatus": { "overall": "verified" },
    "subscriptionStatus": "active"
  }
}
```

**Error Responses**:

- `401` - Not authorized or account not accessible
- `404` - User not found

**cURL Example**:

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

#### PUT /auth/updatedetails

Update user account details.

**Authentication**: Required (Level 1)

**Request Body** (partial update):

```json
{
  "firstName": "string (optional, 2-50 chars)",
  "lastName": "string (optional, 2-50 chars)",
  "email": "string (optional, valid email)",
  "phone": "string (optional)",
  "bio": "string (optional, max 2000)",
  "location": "object (optional)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Details updated successfully",
  "token": "new_jwt_token_if_email_changed",
  "data": {
    /* updated user */
  }
}
```

---

#### PUT /auth/updatepassword

Change user password.

**Authentication**: Required (Level 2 - Active account)

**Request Body**:

```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars, complex)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Password updated successfully",
  "token": "new_jwt_token",
  "data": {
    /* user */
  }
}
```

**Error Responses**:

- `400` - Missing fields
- `401` - Incorrect current password
- `403` - Active account required

---

### Profile Management Endpoints

#### GET /profile/me

Get own complete profile with populated reviews.

**Authentication**: Required (Level 1)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "66f42da2f64df30000000001",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "https://res.cloudinary.com/...",
    "bio": "Experienced cardiologist...",
    "reviews": [
      {
        "reviewer": { "firstName": "Jane", "lastName": "Smith" },
        "rating": 5,
        "comment": "Excellent work!",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "rating": { "average": 4.8, "count": 25 },
    "profileCompletion": { "percentage": 85 }
  }
}
```

---

#### GET /profile/:identifier

Get public profile by slug or ID.

**Authentication**: Optional (full view if owner)

**URL Parameters**:

- `identifier`: User slug or ObjectId

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "https://...",
    "bio": "...",
    "primarySpecialty": "Cardiology",
    "yearsOfExperience": 3,
    "rating": { "average": 4.8, "count": 25 }
    // Private fields excluded if not owner
  }
}
```

---

#### PUT /profile/basic

Update basic profile information.

**Authentication**: Required (Level 1)

**Request Body**:

```json
{
  "firstName": "string (optional, 2-50)",
  "lastName": "string (optional, 2-50)",
  "bio": "string (optional, max 2000)",
  "location": {
    "city": "string (optional, max 100)",
    "state": "string (optional, max 100)",
    "country": "string (optional, max 100)",
    "timezone": "string (optional, max 50)"
  },
  "languages": "array<object> (optional)",
  "subspecialties": "array<string> (optional)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    /* updated profile */
  }
}
```

---

#### POST /profile/photo

Upload profile photo.

**Authentication**: Required (Level 1)

**Request**: `multipart/form-data`

- `profilePhoto`: File (image/\*, max 10MB)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "profilePhoto": "https://res.cloudinary.com/.../profile.jpg"
  }
}
```

**Error Responses**:

- `400` - Invalid file type
- `500` - Upload failed

**cURL Example**:

```bash
curl -X POST http://localhost:5000/api/profile/photo \
  -H "Authorization: Bearer <token>" \
  -F "profilePhoto=@/path/to/photo.jpg"
```

**JavaScript/Axios**:

```javascript
const formData = new FormData();
formData.append("profilePhoto", file);

const response = await axios.post("/api/profile/photo", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});
```

---

#### POST /profile/documents

Upload verification documents.

**Authentication**: Required (Level 1)

**Request**: `multipart/form-data`

- `documents`: Array of files (image/\* or application/pdf, max 5 files, 10MB each)
- `types`: Array of strings (e.g., ['medical_license', 'identity'])

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "type": "medical_license",
        "url": "https://res.cloudinary.com/.../doc.pdf",
        "uploadedAt": "2024-01-15T10:30:00Z",
        "verified": false
      }
    ]
  }
}
```

---

#### DELETE /profile/documents/:docId

Delete a verification document.

**Authentication**: Required (Level 1)

**URL Parameters**:

- `docId`: Document ObjectId

**Success Response** (200):

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

#### POST /profile/experience

Add work experience entry.

**Authentication**: Required (Level 2 - Active)

**Request Body**:

```json
{
  "title": "string (required, 2-100 chars)",
  "organization": "string (required, 2-200 chars)",
  "location": "string (optional, max 100)",
  "startDate": "date (required)",
  "endDate": "date (optional)",
  "current": "boolean (optional)",
  "description": "string (optional, max 2000)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "experience": [
      {
        "id": "exp_123",
        "title": "Cardiologist",
        "organization": "City Hospital",
        "startDate": "2020-01-01",
        "current": true
      }
    ]
  }
}
```

---

### Job Posting Endpoints

#### POST /jobs

Create a new job posting (senior doctors only).

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: `canPostJobs` (checks role and verification)

**Request Body**:

```json
{
  "title": "string (required, 5-200 chars)",
  "description": "string (required, 50-5000 chars)",
  "category": "enum (required, values: ['consultation', 'research', 'documentation', 'review', 'telemedicine', 'other'])",
  "specialty": "string (required, 2-100 chars)",
  "experienceLevel": "enum (required, values: ['entry', 'intermediate', 'expert'])",
  "budget": {
    "min": "number (required, min 0)",
    "max": "number (required, min 0)",
    "currency": "string (default: 'USD')"
  },
  "duration": {
    "value": "number (required, min 1)",
    "unit": "enum (required, values: ['hours', 'days', 'weeks', 'months'])"
  },
  "location": {
    "type": "enum (required, values: ['remote', 'onsite', 'hybrid'])",
    "city": "string (optional)",
    "state": "string (optional)",
    "country": "string (optional)"
  },
  "requirements": "array<string> (optional)",
  "skills": "array<string> (optional)",
  "deadline": "date (optional)"
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "Job posted successfully",
  "data": {
    "id": "job_123",
    "title": "Medical Consultation Required",
    "category": "consultation",
    "status": "active",
    "postedBy": "user_id",
    "createdAt": "2024-01-15T10:30:00Z",
    "slug": "medical-consultation-required-123"
  }
}
```

**Error Responses**:

- `400` - Validation failed
- `403` - Not authorized to post jobs (role or verification issue)
- `500` - Server error

---

#### GET /jobs

Get all active job postings.

**Authentication**: Required (Level 4 - Verified professional)

**Query Parameters**:

```
page: integer (default: 1)
limit: integer (1-50, default: 10)
category: string (optional filter)
specialty: string (optional filter)
experienceLevel: string (optional filter)
location: string (optional filter)
minBudget: number (optional filter)
maxBudget: number (optional filter)
search: string (optional, searches title and description)
sort: string (optional, values: 'newest', 'budget-high', 'budget-low', 'deadline')
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "job_123",
      "title": "Medical Consultation Required",
      "description": "...",
      "category": "consultation",
      "specialty": "Cardiology",
      "budget": { "min": 500, "max": 1000, "currency": "USD" },
      "location": { "type": "remote" },
      "postedBy": {
        "id": "user_id",
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePhoto": "https://..."
      },
      "applicationsCount": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

#### GET /jobs/:id

Get single job posting details.

**Authentication**: Required (Level 4 - Verified professional)

**URL Parameters**:

- `id`: Job ObjectId or slug

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "title": "Medical Consultation Required",
    "description": "Detailed description...",
    "category": "consultation",
    "specialty": "Cardiology",
    "experienceLevel": "intermediate",
    "budget": { "min": 500, "max": 1000, "currency": "USD" },
    "duration": { "value": 2, "unit": "weeks" },
    "location": { "type": "remote" },
    "requirements": ["Board certified", "5+ years experience"],
    "skills": ["Echocardiography", "Patient consultation"],
    "status": "active",
    "postedBy": {
      "id": "user_id",
      "firstName": "Jane",
      "lastName": "Smith",
      "profilePhoto": "https://...",
      "rating": { "average": 4.8, "count": 25 }
    },
    "applicationsCount": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "deadline": "2024-02-15T23:59:59Z"
  }
}
```

---

#### PUT /jobs/:id

Update job posting (owner only).

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: Checks ownership

**Request Body**: Same as POST /jobs (partial update allowed)

**Success Response** (200):

```json
{
  "success": true,
  "message": "Job updated successfully",
  "data": {
    /* updated job */
  }
}
```

---

#### DELETE /jobs/:id

Delete job posting (owner only).

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: Checks ownership

**Success Response** (200):

```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

### Application Endpoints

#### POST /applications

Submit job application (junior doctors only).

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: `canApplyToJobs` (checks role and verification)

**Request Body**:

```json
{
  "jobId": "string (required, valid ObjectId)",
  "coverLetter": "string (required, 50-2000 chars)",
  "proposedBudget": "number (optional)",
  "proposedDuration": {
    "value": "number (optional)",
    "unit": "string (optional)"
  },
  "availability": "date (optional)"
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "id": "app_123",
    "jobId": "job_123",
    "applicantId": "user_id",
    "status": "pending",
    "coverLetter": "...",
    "proposedBudget": 750,
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:

- `400` - Validation failed or already applied
- `403` - Not authorized to apply (role or verification issue)
- `404` - Job not found
- `500` - Server error

---

#### GET /applications

Get user's applications.

**Authentication**: Required (Level 4 - Verified professional)

**Query Parameters**:

```
page: integer (default: 1)
limit: integer (1-50, default: 10)
status: string (optional, values: 'pending', 'accepted', 'rejected', 'withdrawn')
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "app_123",
      "job": {
        "id": "job_123",
        "title": "Medical Consultation Required",
        "category": "consultation"
      },
      "status": "pending",
      "coverLetter": "...",
      "proposedBudget": 750,
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 12, "pages": 2 }
}
```

---

#### GET /applications/:id

Get single application details.

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: Checks ownership (applicant or job owner)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "job": {
      /* full job details */
    },
    "applicant": {
      /* applicant profile */
    },
    "status": "pending",
    "coverLetter": "...",
    "proposedBudget": 750,
    "submittedAt": "2024-01-15T10:30:00Z",
    "reviewedAt": null,
    "feedback": null
  }
}
```

---

#### PUT /applications/:id/status

Update application status (job owner only).

**Authentication**: Required (Level 4 - Verified professional)

**Middleware**: Checks job ownership

**Request Body**:

```json
{
  "status": "enum (required, values: ['accepted', 'rejected'])",
  "feedback": "string (optional, max 1000 chars)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Application status updated",
  "data": {
    "id": "app_123",
    "status": "accepted",
    "feedback": "Great application! Looking forward to working with you.",
    "reviewedAt": "2024-01-16T14:20:00Z"
  }
}
```

---

### Admin Endpoints

All admin endpoints require `protect` + `requireAdmin` middleware.

#### GET /admin/users

Get all users with filtering and pagination.

**Authentication**: Required (Level 6 - Admin)

**Query Parameters**:

```
page: integer (default: 1)
limit: integer (1-100, default: 20)
role: string (optional filter)
accountStatus: string (optional filter)
verificationStatus: string (optional filter)
search: string (optional, searches name and email)
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "junior",
      "accountStatus": "active",
      "verificationStatus": { "overall": "verified" },
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActive": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

---

#### PUT /admin/verify/:userId

Verify user's professional credentials.

**Authentication**: Required (Level 6 - Admin)

**URL Parameters**:

- `userId`: User ObjectId

**Request Body**:

```json
{
  "verificationType": "enum (required, values: ['identity', 'medicalLicense', 'backgroundCheck'])",
  "status": "enum (required, values: ['verified', 'rejected'])",
  "notes": "string (optional, max 500 chars)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Verification status updated",
  "data": {
    "userId": "user_123",
    "verificationStatus": {
      "identity": "verified",
      "medicalLicense": "verified",
      "backgroundCheck": "pending",
      "overall": "verified"
    }
  }
}
```

---

#### PUT /admin/users/:userId/status

Update user account status.

**Authentication**: Required (Level 6 - Admin)

**Request Body**:

```json
{
  "accountStatus": "enum (required, values: ['pending', 'active', 'inactive', 'suspended'])",
  "reason": "string (optional, max 500 chars)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Account status updated",
  "data": {
    "userId": "user_123",
    "accountStatus": "suspended",
    "reason": "Violation of terms of service"
  }
}
```

---

## Subscription System

### Subscription Plans

| Plan             | Price     | Billing | Features                                                                                                                    |
| ---------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Free**         | $0/month  | N/A     | 5 applications/month, 50 profile views/month, 3 job postings/month                                                          |
| **Basic**        | $19/month | Monthly | Unlimited applications, 500 profile views/month, 20 job postings/month, Advanced search, Direct messaging                   |
| **Professional** | $39/month | Monthly | All Basic features, Unlimited profile views, 50 job postings/month, Featured postings, Advanced analytics, Priority support |
| **Enterprise**   | $99/month | Monthly | All features unlimited, Custom integrations, Dedicated account manager, SLA support                                         |

### Subscription Endpoints

#### GET /subscriptions/plans

Get all available subscription plans.

**Authentication**: Not required (public)

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free Tier",
      "price": 0,
      "currency": "usd",
      "interval": "month",
      "description": "Basic access to Doconnect platform",
      "features": {
        "unlimitedApplications": false,
        "advancedSearch": false,
        "featuredJobPostings": false,
        "directMessaging": false,
        "advancedAnalytics": false,
        "prioritySupport": false
      },
      "usage": {
        "jobApplications": 5,
        "profileViews": 50,
        "jobPostings": 3,
        "messageThreads": 10
      }
    }
  ]
}
```

---

#### GET /subscriptions/current

Get current user's subscription details.

**Authentication**: Required (Level 1)

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "userId": "user_123",
    "planId": "professional",
    "planName": "Professional Plan",
    "planPrice": 3900,
    "status": "active",
    "isActive": true,
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "daysUntilRenewal": 15,
    "paymentMethod": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    },
    "features": {
      /* plan features */
    },
    "usage": {
      "jobApplications": { "used": 15, "limit": -1 },
      "profileViews": { "used": 250, "limit": -1 },
      "jobPostings": { "used": 12, "limit": 50 }
    }
  }
}
```

**Error Response** (404):

```json
{
  "success": false,
  "message": "No subscription found"
}
```

---

#### POST /subscriptions/create-checkout-session

Create Stripe checkout session for subscription purchase.

**Authentication**: Required (Level 1)

**Request Body**:

```json
{
  "planId": "enum (required, values: ['basic', 'professional', 'enterprise'])",
  "billingCycle": "enum (optional, values: ['monthly', 'annually'], default: 'monthly')"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_ABC123...",
    "url": "https://checkout.stripe.com/pay/cs_test_ABC123...",
    "planId": "professional",
    "planName": "Professional Plan",
    "amount": 3900,
    "billingCycle": "monthly"
  }
}
```

**Error Responses**:

- `400` - Invalid plan or already has this plan
- `500` - Stripe error

**Usage**:

```javascript
const response = await axios.post(
  "/api/subscriptions/create-checkout-session",
  {
    planId: "professional",
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

// Redirect to Stripe checkout
window.location.href = response.data.data.url;
```

---

#### POST /subscriptions/cancel

Cancel current subscription.

**Authentication**: Required (Level 1)

**Request Body**:

```json
{
  "reason": "string (optional)",
  "feedback": "string (optional, max 1000 chars)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "planId": "professional",
    "status": "canceled",
    "canceledAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### POST /subscriptions/upgrade

Upgrade to a higher tier plan.

**Authentication**: Required (Level 1)

**Request Body**:

```json
{
  "targetPlanId": "enum (required, values: ['basic', 'professional', 'enterprise'])"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Plan upgraded successfully",
  "data": {
    "fromPlan": "basic",
    "toPlan": "professional",
    "newPrice": 3900,
    "billingCycle": "monthly"
  }
}
```

**Error Response** (400):

```json
{
  "success": false,
  "message": "This is not an upgrade or plan is not available",
  "currentPlan": "enterprise",
  "targetPlan": "professional"
}
```

---

#### POST /subscriptions/downgrade

Downgrade to a lower tier plan.

**Authentication**: Required (Level 1)

**Request Body**:

```json
{
  "targetPlanId": "enum (required, values: ['free', 'basic', 'professional'])"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Plan downgrade scheduled",
  "data": {
    "fromPlan": "professional",
    "toPlan": "basic",
    "effectiveDate": "2024-02-01T00:00:00Z",
    "message": "New plan will take effect at your next billing cycle"
  }
}
```

---

#### GET /subscriptions/invoices

Get payment history and invoices.

**Authentication**: Required (Level 1)

**Query Parameters**:

```
page: integer (default: 1)
limit: integer (1-100, default: 10)
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "in_ABC123",
      "amount": 3900,
      "currency": "usd",
      "status": "paid",
      "date": "2024-01-01T00:00:00Z",
      "periodStart": "2024-01-01T00:00:00Z",
      "periodEnd": "2024-02-01T00:00:00Z",
      "paidAt": "2024-01-01T08:30:00Z",
      "invoiceUrl": "https://invoice.stripe.com/...",
      "receiptUrl": "https://receipt.stripe.com/...",
      "description": "Professional Plan subscription"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 12, "pages": 2 }
}
```

---

#### POST /subscriptions/webhook

Handle Stripe webhook events (signature verified).

**Authentication**: Not required (Stripe signature verification)

**Headers**:

```
Content-Type: application/json
Stripe-Signature: <signature>
```

**Webhook Events Handled**:

- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed
- `customer.updated` - Customer info updated
- `charge.refunded` - Refund processed

**Success Response** (200):

```json
{
  "received": true
}
```

---

## Request/Response Patterns

### Common Response Format

**Success Response**:

```json
{
  "success": true,
  "message": "Operation successful (optional)",
  "data": {
    /* response data */
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    /* validation errors (optional) */
  ]
}
```

### Pagination Format

Endpoints that return lists include pagination metadata:

```json
{
  "success": true,
  "data": [
    /* array of items */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Validation Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### Status Codes

| Code  | Meaning               | Usage                              |
| ----- | --------------------- | ---------------------------------- |
| `200` | OK                    | Successful GET, PUT, DELETE        |
| `201` | Created               | Successful POST (resource created) |
| `400` | Bad Request           | Validation failed, invalid input   |
| `401` | Unauthorized          | Not authenticated or invalid token |
| `403` | Forbidden             | Authenticated but not authorized   |
| `404` | Not Found             | Resource not found                 |
| `429` | Too Many Requests     | Rate limit exceeded                |
| `500` | Internal Server Error | Server error                       |

---

## Security & Best Practices

### HTTPS Requirements

- **Production**: All API calls MUST use HTTPS
- **Development**: HTTP allowed for localhost only
- **Cookies**: HTTP-only, secure flag in production

### CORS Configuration

**Allowed Origins**:

- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

**Credentials**: Allowed for authenticated requests

### Input Validation

All endpoints use `express-validator` for input validation:

- **Sanitization**: Trim, escape, normalize
- **Type checking**: String, number, email, date
- **Length validation**: Min/max character limits
- **Enum validation**: Allowed values only
- **Custom validation**: Business logic rules

### Rate Limiting

Implemented via `express-rate-limit`:

```javascript
// General endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

// Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per window
});
```

### Password Requirements

- Minimum 6 characters
- Must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Hashed using bcrypt (10 rounds)

### JWT Token Security

- **Secret**: Strong, randomly generated (use `openssl rand -base64 64`)
- **Expiration**: 30 days (configurable)
- **Storage**: HTTP-only cookies in production
- **Refresh**: Re-login required on expiration

### File Upload Security

**Profile Photos**:

- Allowed types: `image/*`
- Max size: 10MB
- Stored in: Cloudinary
- Validation: MIME type check

**Documents**:

- Allowed types: `image/*`, `application/pdf`
- Max files: 5 per upload
- Max size: 10MB per file
- Stored in: Cloudinary
- Validation: MIME type and extension check

---

## Testing & Integration

### Testing with cURL

**Register User**:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass1",
    "role": "junior",
    "medicalLicenseNumber": "ML12345",
    "licenseState": "CA",
    "primarySpecialty": "Cardiology",
    "yearsOfExperience": 3,
    "medicalSchool": {"name": "Harvard", "graduationYear": 2020}
  }'
```

**Login**:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "SecurePass1"}'
```

**Get Profile** (with token):

```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Create Job**:

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Medical Consultation Required",
    "description": "Need expert opinion on cardiology case...",
    "category": "consultation",
    "specialty": "Cardiology",
    "experienceLevel": "intermediate",
    "budget": {"min": 500, "max": 1000},
    "duration": {"value": 2, "unit": "weeks"},
    "location": {"type": "remote"}
  }'
```

### Testing with JavaScript/Axios

**Setup Axios Instance**:

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Usage Examples**:

```javascript
// Register
const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  localStorage.setItem("token", response.data.token);
  return response.data;
};

// Login
const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", response.data.token);
  return response.data;
};

// Get current user
const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

// Create job
const createJob = async (jobData) => {
  const response = await api.post("/jobs", jobData);
  return response.data;
};

// Upload profile photo
const uploadPhoto = async (file) => {
  const formData = new FormData();
  formData.append("profilePhoto", file);

  const response = await api.post("/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
```

### Common Integration Patterns

**Authentication Flow**:

```javascript
// 1. Register or Login
const { token, data: user } = await login(email, password);

// 2. Store token
localStorage.setItem("token", token);

// 3. Set up axios with token
api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// 4. Fetch user data
const currentUser = await getCurrentUser();

// 5. Check account status
if (currentUser.accountStatus === "pending") {
  // Redirect to profile completion
} else if (currentUser.accountStatus === "active") {
  // Full access
}
```

**File Upload Pattern**:

```javascript
const handleFileUpload = async (file) => {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      throw new Error("Only images are allowed");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }

    // Create form data
    const formData = new FormData();
    formData.append("profilePhoto", file);

    // Upload
    const response = await api.post("/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });

    return response.data.data.profilePhoto;
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
    throw error;
  }
};
```

### Troubleshooting Guide

**401 Unauthorized**:

- Check if token is included in Authorization header
- Verify token hasn't expired
- Ensure user account status is not suspended/inactive

**403 Forbidden**:

- Check if user has required role (senior/junior/admin)
- Verify account status is active (if required)
- Confirm professional verification (if required)
- Check subscription status (if required)

**400 Bad Request**:

- Review validation errors in response
- Check required fields are present
- Verify data types match schema
- Ensure enum values are valid

**404 Not Found**:

- Verify resource ID is correct
- Check if resource exists
- Ensure user has access to resource

**429 Too Many Requests**:

- Wait for rate limit window to reset
- Implement exponential backoff
- Consider caching responses

**500 Internal Server Error**:

- Check server logs for details
- Verify database connection
- Ensure all environment variables are set
- Contact support if persists

### FAQ

**Q: How do I get a JWT token?**  
A: Register via `POST /auth/register` or login via `POST /auth/login`. The token is returned in the response.

**Q: How long does the JWT token last?**  
A: Tokens expire after 30 days by default. You'll need to re-login after expiration.

**Q: Can I use the API without Stripe?**  
A: Yes! Stripe is optional. Users will have free tier access without subscription endpoints.

**Q: What's the difference between account status and verification status?**  
A: Account status (`pending`, `active`, `suspended`) controls access level. Verification status (`verified`, `pending`, `rejected`) indicates professional credential verification.

**Q: How do I test payments without real money?**  
A: Use Stripe test mode with test card `4242 4242 4242 4242`. Never use real cards in development.

**Q: What happens if I exceed rate limits?**  
A: You'll receive a 429 error. Wait for the rate limit window to reset (shown in response headers).

**Q: Can I upload multiple files at once?**  
A: Yes, for documents you can upload up to 5 files per request. Profile photos are single file only.

**Q: How do I handle file uploads in React?**  
A: Use `FormData` with `Content-Type: multipart/form-data`. See examples in Testing & Integration section.

**Q: What's the maximum file size for uploads?**  
A: 10MB per file for both profile photos and documents.

**Q: How do I filter job listings?**  
A: Use query parameters: `category`, `specialty`, `experienceLevel`, `location`, `minBudget`, `maxBudget`, `search`.

---

## Support & Resources

### API Status

- **Health Check**: `GET /api/health`
- **Status Page**: Check Railway dashboard for backend status

### Documentation

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Security Verification**: See `SECURITY_VERIFICATION.md`

### Contact

- **Technical Support**: Check Railway logs for backend issues
- **Stripe Support**: https://support.stripe.com
- **MongoDB Support**: https://support.mongodb.com

---

**Last Updated**: December 31, 2024  
**API Version**: 1.0  
**Documentation Version**: 2.0
