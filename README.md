# Doconnect - Medical Professional Marketplace

> A comprehensive web platform connecting senior doctors with junior doctors for remote medical collaboration and freelance opportunities.

[![Status](https://img.shields.io/badge/Status-Active%20Development-green.svg)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Doconnect is a specialized marketplace platform that connects overworked senior doctors with junior doctors seeking freelance opportunities. The platform enables senior physicians to delegate tasks while junior doctors gain valuable experience and supplemental income.

### Platform Purpose

- **For Senior Doctors**: Post medical tasks, hire qualified junior doctors, manage projects
- **For Junior Doctors**: Browse opportunities, apply for positions, build professional portfolio
- **For Administrators**: Verify credentials, manage platform, ensure quality standards

### User Roles

| Role              | Description                                | Capabilities                                                  |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Senior Doctor** | Established physicians seeking assistance  | Post jobs, hire juniors, manage projects, review applications |
| **Junior Doctor** | Early-career doctors seeking opportunities | Browse jobs, apply, build portfolio, track applications       |
| **Admin**         | Platform administrators                    | Verify users, manage disputes, platform oversight             |

---

## Key Features

### Authentication & Security

- JWT-based authentication with secure token handling
- Role-based access control (Senior/Junior/Admin)
- Multi-level route protection
- Password encryption with bcrypt
- Account verification workflow

### Profile Management

- Comprehensive professional profiles
- Profile photo and document upload (Cloudinary integration)
- Professional experience timeline
- Skills and certification management
- Privacy controls and visibility settings
- Profile analytics and view tracking

### Job Posting System

- Multi-step job creation wizard
- Advanced job browsing with filters
- Skills-based job-candidate matching
- Application submission with portfolio integration
- Real-time application status tracking
- In-app messaging between doctors
- Interview scheduling system

### Search & Discovery

- Advanced doctor search with multiple filters
- Job search by category, specialty, and budget
- Match score algorithm for job-candidate pairing
- Pagination and optimized search results

### Admin Panel

- Comprehensive admin dashboard
- User verification workflow
- Document approval system
- Bulk verification actions
- Platform analytics and statistics

### Subscription System (Optional)

- Stripe integration for payments
- Tiered subscription plans
- Usage tracking and limits
- Billing management

---

## Technology Stack

### Frontend

- **React.js 18** - Modern React with hooks and context
- **Tailwind CSS 3** - Professional medical-themed styling
- **React Router 6** - Client-side routing with protected routes
- **Axios** - HTTP client with interceptors
- **Lucide React** - Professional icons

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Document database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing and security
- **Express Validator** - Input validation
- **Multer** - File upload handling
- **Cloudinary** - Image and document storage
- **Stripe** - Payment processing (optional)

---

## Project Structure

```
doconnect/
├── client/                         # React Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── api/                    # API service layer
│   │   ├── components/             # Reusable React components
│   │   ├── context/                # React context providers
│   │   ├── pages/                  # Page components
│   │   ├── utils/                  # Utility functions
│   │   ├── App.js                  # Main application component
│   │   └── index.js                # Application entry point
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                         # Node.js Backend Application
│   ├── config/                     # Configuration files
│   ├── controllers/                # Business logic
│   ├── middleware/                 # Express middleware
│   ├── models/                     # MongoDB schemas
│   ├── routes/                     # API routes
│   ├── utils/                      # Utility functions
│   ├── server.js                   # Server entry point
│   └── package.json
│
├── docs/                           # Documentation
│   ├── API_REFERENCE.md            # Complete API documentation
│   ├── DEPLOYMENT.md               # Production deployment guide
│   ├── LOCAL_DEVELOPMENT.md        # Local setup guide
│   └── SECURITY_VERIFICATION.md
│
├── .env.example                    # Environment variables template
├── .gitignore
├── package.json                    # Root project scripts
└── README.md                       # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Quick Start

1. **Clone the repository**:

   ```bash
   git clone https://github.com/hasan6-9/doconnect.git
   cd doconnect
   ```

2. **Install dependencies**:

   ```bash
   # Install all dependencies (backend and frontend)
   npm run install-all
   ```

3. **Configure environment variables**:

   ```bash
   # Copy example environment file
   cp .env.example .env

   # Edit .env with your configuration
   # Required: MONGODB_URI, JWT_SECRET
   # Optional: CLOUDINARY_*, STRIPE_*
   ```

4. **Start development servers**:

   ```bash
   # Start both backend and frontend
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

### Detailed Setup Instructions

For comprehensive setup instructions, see [LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md).

---

## Documentation

### Complete Guides

- **[LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)** - Complete local development setup guide
  - Prerequisites and installation
  - Environment configuration
  - Running the application
  - Troubleshooting common issues

- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Complete API documentation
  - Authentication & authorization
  - All API endpoints
  - Request/response patterns
  - Security best practices
  - Testing examples

- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide
  - MongoDB Atlas setup
  - Cloudinary configuration
  - Railway backend deployment
  - Hostinger frontend deployment
  - Stripe integration (optional)

- **[SECURITY_VERIFICATION.md](./docs/SECURITY_VERIFICATION.md)** - Security checklist

---

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new doctor account
- `POST /api/auth/login` - Authenticate existing user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/updatedetails` - Update profile information
- `PUT /api/auth/updatepassword` - Change account password
- `GET /api/auth/logout` - Logout current session

### Job Management

- `GET /api/jobs` - Get all public jobs with filters
- `POST /api/jobs` - Create new job posting (Senior only)
- `GET /api/jobs/:id` - Get specific job details
- `PUT /api/jobs/:id` - Update job posting (Senior, own jobs)
- `DELETE /api/jobs/:id` - Delete job posting (Senior, own jobs)
- `POST /api/jobs/:id/apply` - Apply for a job (Junior only)

### Application Management

- `GET /api/applications` - Get user's applications
- `GET /api/applications/:id` - Get specific application
- `PUT /api/applications/:id/status` - Update application status (Senior)
- `POST /api/applications/:id/message` - Send message in application
- `PUT /api/applications/bulk-action` - Bulk accept/reject (Senior)

### Profile Management

- `GET /api/profile/me` - Get current user's full profile
- `PUT /api/profile/basic` - Update basic profile information
- `POST /api/profile/photo` - Upload profile photo
- `POST /api/profile/documents` - Upload verification documents
- `POST /api/profile/experience` - Add professional experience
- `GET /api/profile/search` - Search doctors with filters
- `GET /api/profile/:slug` - Get public doctor profile

### Admin Endpoints

- `GET /api/admin/dashboard` - Admin dashboard analytics
- `GET /api/admin/verification/pending` - Pending verifications queue
- `PUT /api/admin/verification/identity/:userId` - Verify doctor identity
- `PUT /api/admin/verification/license/:userId` - Verify medical license
- `GET /api/admin/users` - Get all users with filters

For complete API documentation with request/response examples, see [API_REFERENCE.md](./docs/API_REFERENCE.md).

---

## Deployment

### Production Deployment

The application can be deployed to production using the following services:

- **Frontend**: Hostinger (or Vercel, Netlify)
- **Backend**: Railway.app (or Heroku, AWS)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Payments**: Stripe (optional)

### Deployment Options

**Option 1: Full Deployment with Stripe**

- Complete platform with subscription payments
- All features enabled
- Estimated time: 45-60 minutes

**Option 2: Deployment without Stripe**

- All features except payments
- Can add Stripe later
- Estimated time: 20-30 minutes

For detailed deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Environment Variables

### Required Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/doconnect
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRE=30d

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Optional Variables

```env
# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

---

## Development Workflow

### Running Locally

```bash
# Start backend only
cd server
npm run dev

# Start frontend only (in new terminal)
cd client
npm start

# Or start both from root
npm run dev
```

### Testing

```bash
# Test backend API
curl http://localhost:5000/api/health

# Test frontend
# Open browser to http://localhost:3000
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Write descriptive commit messages

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or contributions:

- **Documentation**: Check the `docs/` folder for detailed guides
- **API Reference**: See [API_REFERENCE.md](./docs/API_REFERENCE.md)
- **Issues**: Open an issue on GitHub
- **Email**: hassanmubarak007@gmail.com

---

## Acknowledgments

- Built with React, Node.js, Express, and MongoDB
- Styled with Tailwind CSS
- File storage powered by Cloudinary
- Payment processing by Stripe (optional)

---

**Version**: 1.0.0  
**Last Updated**: February 4, 2026  
**Status**: Production Ready
