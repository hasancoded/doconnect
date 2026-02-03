# Doconnect Local Development Setup Guide

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Common Issues](#common-issues)
- [Development Workflow](#development-workflow)

---

## Introduction

This guide will walk you through setting up the Doconnect application on your local machine from scratch. By the end of this guide, you will have a fully functional development environment with both the backend API server and frontend React application running locally.

**Estimated Time**: 30-45 minutes

**What You'll Have Running**:

- Backend API server on `http://localhost:5000`
- Frontend React application on `http://localhost:3000`
- MongoDB database (local or cloud)

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

### Required Software

#### 1. Node.js and npm

**Version Required**: Node.js 16.x or higher

**Check if installed**:

```bash
node --version
npm --version
```

**If not installed**:

- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS (Long Term Support) version
- Follow the installer instructions for your operating system

#### 2. Git

**Check if installed**:

```bash
git --version
```

**If not installed**:

- Download from [git-scm.com](https://git-scm.com/)
- Follow the installer instructions for your operating system

#### 3. Code Editor

**Recommended**: Visual Studio Code

- Download from [code.visualstudio.com](https://code.visualstudio.com/)
- Install recommended extensions:
  - ESLint
  - Prettier
  - ES7+ React/Redux/React-Native snippets

#### 4. MongoDB (Choose One Option)

**Option A: MongoDB Atlas (Cloud - Recommended for Beginners)**

- Free tier available
- No local installation required
- Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

**Option B: MongoDB Local Installation**

- Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Follow installation instructions for your operating system

---

## Initial Setup

### Step 1: Clone the Repository

Open your terminal or command prompt and navigate to where you want to store the project:

```bash
# Navigate to your projects folder
cd ~/projects  # On macOS/Linux
cd C:\projects  # On Windows

# Clone the repository
git clone https://github.com/hasan6-9/doconnect.git

# Navigate into the project directory
cd doconnect
```

### Step 2: Explore the Project Structure

Your project should have the following structure:

```
doconnect/
├── server/          # Backend API (Node.js/Express)
├── client/          # Frontend (React)
├── docs/            # Documentation
└── README.md        # Project overview
```

---

## Backend Setup

### Step 1: Navigate to Server Directory

```bash
cd server
```

### Step 2: Install Dependencies

This will install all required npm packages for the backend:

```bash
npm install
```

**Expected output**: You should see a progress bar and a list of installed packages. This may take 2-5 minutes.

### Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
# Create the file
touch .env  # On macOS/Linux
type nul > .env  # On Windows
```

Open the `.env` file in your code editor and add the following configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/doconnect

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Client URL
CLIENT_URL=http://localhost:3000

# Cloudinary Configuration (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Configuration (Optional - for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Step 4: Configure MongoDB

#### Option A: Using MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace the `MONGODB_URI` in your `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/doconnect?retryWrites=true&w=majority
```

**Important**: Replace `username` and `password` with your actual database credentials.

#### Option B: Using Local MongoDB

If you installed MongoDB locally, use:

```env
MONGODB_URI=mongodb://localhost:27017/doconnect
```

Make sure MongoDB is running:

```bash
# On macOS/Linux
sudo systemctl start mongod

# On Windows
# MongoDB should start automatically, or use:
net start MongoDB
```

### Step 5: Generate JWT Secret

For security, generate a strong JWT secret:

```bash
# On macOS/Linux
openssl rand -base64 64

# On Windows (using Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Copy the output and replace `your_super_secret_jwt_key_change_this_in_production` in your `.env` file.

### Step 6: Test Backend Connection

Start the backend server:

```bash
npm run dev
```

**Expected output**:

```
Server running on port 5000
MongoDB connected successfully
```

If you see these messages, your backend is configured correctly!

**Test the API**:

Open a new terminal window and run:

```bash
curl http://localhost:5000/api/health
```

**Expected response**:

```json
{
  "message": "Doconnect API is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

Leave the backend server running and proceed to frontend setup.

---

## Frontend Setup

### Step 1: Navigate to Client Directory

Open a **new terminal window** (keep the backend running in the first terminal):

```bash
# From the project root
cd client
```

### Step 2: Install Dependencies

Install all required npm packages for the frontend:

```bash
npm install
```

**Expected output**: Similar to backend, you'll see a progress bar and installed packages. This may take 3-7 minutes.

### Step 3: Configure Environment Variables

Create a `.env` file in the `client` directory:

```bash
# Create the file
touch .env  # On macOS/Linux
type nul > .env  # On Windows
```

Open the `.env` file and add:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Stripe Configuration (Optional)
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Note**: The `REACT_APP_` prefix is required for React environment variables.

### Step 4: Verify Configuration

Check that your `.env` file is correctly configured:

```bash
# On macOS/Linux
cat .env

# On Windows
type .env
```

You should see the environment variables you just added.

---

## Running the Application

### Step 1: Start the Backend (if not already running)

In your first terminal window:

```bash
cd server
npm run dev
```

**Expected output**:

```
Server running on port 5000
MongoDB connected successfully
```

### Step 2: Start the Frontend

In your second terminal window:

```bash
cd client
npm start
```

**Expected output**:

```
Compiled successfully!

You can now view doconnect in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

Your browser should automatically open to `http://localhost:3000`.

### Step 3: Verify Both Services Are Running

You should now have:

1. **Backend**: Running on `http://localhost:5000`

   - Check: `curl http://localhost:5000/api/health`

2. **Frontend**: Running on `http://localhost:3000`
   - Check: Open browser to `http://localhost:3000`

---

## Verification

### Step 1: Test the Home Page

1. Open your browser to `http://localhost:3000`
2. You should see the Doconnect landing page
3. Check the browser console (F12) for any errors

### Step 2: Test User Registration

1. Click on "Register" or "Sign Up"
2. Fill out the registration form with test data:

   - First Name: John
   - Last Name: Doe
   - Email: john.doe@test.com
   - Password: TestPass123!
   - Role: Junior Doctor
   - Medical License: ML12345
   - License State: CA
   - Primary Specialty: Cardiology
   - Years of Experience: 3
   - Medical School: Harvard Medical School
   - Graduation Year: 2020

3. Submit the form
4. You should be redirected to the dashboard

### Step 3: Test User Login

1. Log out if you're logged in
2. Click on "Login"
3. Enter credentials:
   - Email: john.doe@test.com
   - Password: TestPass123!
4. Submit the form
5. You should be redirected to the dashboard

### Step 4: Verify API Communication

Open browser DevTools (F12) and go to the Network tab:

1. Perform a login
2. You should see API requests to `http://localhost:5000/api/auth/login`
3. Check the response - it should return a success message and user data

### Step 5: Check Database

If using MongoDB Atlas:

1. Go to your cluster in MongoDB Atlas
2. Click "Browse Collections"
3. You should see a `doconnect` database
4. Inside, you should see a `users` collection with your test user

If using local MongoDB:

```bash
# Connect to MongoDB shell
mongosh

# Switch to doconnect database
use doconnect

# View users
db.users.find().pretty()
```

---

## Common Issues

### Issue 1: Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:

```bash
# Find and kill the process using port 5000

# On macOS/Linux
lsof -ti:5000 | xargs kill -9

# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

Or change the port in `server/.env`:

```env
PORT=5001
```

### Issue 2: MongoDB Connection Failed

**Error**: `MongoNetworkError: failed to connect to server`

**Solution**:

For MongoDB Atlas:

- Check your connection string in `.env`
- Verify your IP address is whitelisted (use 0.0.0.0/0 for development)
- Ensure username and password are correct

For Local MongoDB:

- Verify MongoDB is running:

  ```bash
  # On macOS/Linux
  sudo systemctl status mongod

  # On Windows
  services.msc  # Look for MongoDB service
  ```

### Issue 3: npm install Fails

**Error**: Various npm installation errors

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # macOS/Linux
rmdir /s node_modules && del package-lock.json  # Windows

# Reinstall
npm install
```

### Issue 4: Environment Variables Not Loading

**Error**: `undefined` when accessing environment variables

**Solution**:

Backend:

- Ensure `.env` file is in the `server` directory
- Restart the backend server after changing `.env`

Frontend:

- Ensure variables start with `REACT_APP_`
- Restart the frontend server after changing `.env`
- Clear browser cache

### Issue 5: CORS Errors

**Error**: `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**:

Check `server/server.js` or `server/index.js` for CORS configuration:

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
```

### Issue 6: Module Not Found Errors

**Error**: `Cannot find module '...'`

**Solution**:

```bash
# Ensure you're in the correct directory
pwd  # Should show .../doconnect/server or .../doconnect/client

# Reinstall dependencies
npm install
```

---

## Development Workflow

### Daily Development Routine

1. **Start Backend**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend** (in new terminal):

   ```bash
   cd client
   npm start
   ```

3. **Make Changes**:

   - Edit files in your code editor
   - Frontend will auto-reload on save
   - Backend will auto-reload if using nodemon

4. **Test Changes**:

   - Check browser for frontend changes
   - Use Postman or curl for backend API testing

5. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Useful Development Commands

#### Backend Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run database seed script (if available)
npm run seed

# Run tests (if configured)
npm test
```

#### Frontend Commands

```bash
# Start development server
npm start

# Create production build
npm run build

# Run tests (if configured)
npm test

# Analyze bundle size
npm run build
npx serve -s build
```

### Testing API Endpoints

Use curl or Postman to test API endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@test.com",
    "password": "TestPass123!",
    "role": "senior",
    "medicalLicenseNumber": "ML67890",
    "licenseState": "NY",
    "primarySpecialty": "Neurology",
    "yearsOfExperience": 10,
    "medicalSchool": {
      "name": "Johns Hopkins",
      "graduationYear": 2013
    }
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@test.com",
    "password": "TestPass123!"
  }'
```

### Browser DevTools Tips

1. **Console Tab**: Check for JavaScript errors and log messages
2. **Network Tab**: Monitor API requests and responses
3. **Application Tab**: View localStorage, cookies, and session data
4. **React DevTools**: Install the React DevTools browser extension for component inspection

### Code Organization

When making changes, follow these conventions:

**Backend**:

- Routes: `server/routes/`
- Controllers: `server/controllers/`
- Models: `server/models/`
- Middleware: `server/middleware/`
- Utilities: `server/utils/`

**Frontend**:

- Pages: `client/src/pages/`
- Components: `client/src/components/`
- Context: `client/src/context/`
- API: `client/src/api/`
- Utilities: `client/src/utils/`

### Git Workflow

```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
# After review and approval, merge to main
```

---

## Next Steps

Now that you have the application running locally, you can:

1. **Explore the Codebase**:

   - Review the backend API routes in `server/routes/`
   - Examine React components in `client/src/components/`
   - Understand the data models in `server/models/`

2. **Read the Documentation**:

   - API Reference: `docs/API_REFERENCE.md`
   - Deployment Guide: `docs/DEPLOYMENT.md`
   - Project README: `README.md`

3. **Start Development**:

   - Create new features
   - Fix bugs
   - Improve UI/UX
   - Add tests

4. **Test Thoroughly**:

   - Test all user flows
   - Check responsive design
   - Verify API integrations
   - Test error handling

5. **Prepare for Deployment**:
   - Review deployment guide
   - Set up production environment variables
   - Configure production database
   - Set up hosting services

---

## Support and Resources

### Documentation

- **API Reference**: Complete API endpoint documentation
- **Deployment Guide**: Production deployment instructions
- **Architecture Overview**: System design and structure

### External Resources

- **Node.js Documentation**: [nodejs.org/docs](https://nodejs.org/docs)
- **React Documentation**: [react.dev](https://react.dev)
- **MongoDB Documentation**: [docs.mongodb.com](https://docs.mongodb.com)
- **Express.js Guide**: [expressjs.com/guide](https://expressjs.com/en/guide/routing.html)

### Community

- **Stack Overflow**: Search for specific errors
- **GitHub Issues**: Report bugs or request features
- **Discord/Slack**: Join developer communities

---

## Summary

You have successfully set up the Doconnect application for local development. You should now have:

- Backend API server running on `http://localhost:5000`
- Frontend React application running on `http://localhost:3000`
- MongoDB database configured and connected
- Test user account created and verified

**Key Files to Remember**:

- `server/.env` - Backend configuration
- `client/.env` - Frontend configuration
- `server/server.js` - Backend entry point
- `client/src/index.js` - Frontend entry point

**Development Checklist**:

- [ ] Backend server starts without errors
- [ ] Frontend application loads in browser
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] API requests work (check Network tab)
- [ ] Database stores data correctly
- [ ] No console errors in browser

If you encounter any issues not covered in this guide, refer to the troubleshooting section or consult the API reference documentation.

Happy coding!
