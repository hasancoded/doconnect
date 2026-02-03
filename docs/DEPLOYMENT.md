# Doconnect Production Deployment Guide

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Pre-Deployment Setup](#pre-deployment-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Deployment Scenarios](#deployment-scenarios)
- [Post-Deployment](#post-deployment)
- [Maintenance & Updates](#maintenance--updates)
- [Troubleshooting](#troubleshooting)

---

## Introduction

This guide provides comprehensive instructions for deploying Doconnect to production. You can choose between two deployment scenarios:

- **Full Deployment with Stripe**: Complete platform with subscription payments
- **Deployment without Stripe**: All features except payments (can add Stripe later)

### What You'll Deploy

- **Frontend**: Hostinger (your domain)
- **Backend**: Railway.app (free tier available)
- **Database**: MongoDB Atlas (free tier available)
- **File Storage**: Cloudinary (free tier available)
- **Payments**: Stripe (optional)

### Estimated Time

- **With Stripe**: 45-60 minutes
- **Without Stripe**: 20-30 minutes

### Cost Breakdown

**Free Tier (Perfect for Starting)**:

- MongoDB Atlas: Free (512MB storage)
- Cloudinary: Free (25GB storage, 25GB bandwidth)
- Railway: $5 credit/month (enough for small apps)
- Hostinger: Your existing hosting
- Stripe: No monthly fee (transaction fees only)

**Total**: $0-5/month

---

## Prerequisites

### Required Accounts

- [ ] GitHub account
- [ ] Railway account (https://railway.app)
- [ ] MongoDB Atlas account (https://cloud.mongodb.com)
- [ ] Cloudinary account (https://cloudinary.com)
- [ ] Hostinger account with active domain
- [ ] Stripe account (optional - only for payments)

### Required Tools

- [ ] Git installed
- [ ] Node.js 14+ installed
- [ ] Code editor
- [ ] FTP client (FileZilla recommended) or access to Hostinger File Manager

### Code Preparation

- [ ] All features tested locally
- [ ] Code committed to Git
- [ ] `.gitignore` configured properly

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   Hostinger      │         │   Railway.app    │
│   (Frontend)     │◄───────►│   (Backend)      │
│                  │  HTTPS  │                  │
│  yourdomain.com  │         │  API calls       │
└──────────────────┘         └────────┬─────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
            │  MongoDB     │  │ Cloudinary  │  │   Stripe    │
            │  Atlas       │  │  (Files)    │  │ (Payments)  │
            │ (Database)   │  │             │  │ (Optional)  │
            └──────────────┘  └─────────────┘  └─────────────┘
```

---

## Pre-Deployment Setup

### Step 1: MongoDB Atlas Configuration

#### 1.1 Create Free Cluster

1. Go to https://cloud.mongodb.com
2. Sign up or log in
3. Click **"Build a Database"**
4. Choose **"FREE"** tier (M0)
5. Select cloud provider and region (closest to your users)
6. Click **"Create Cluster"**

#### 1.2 Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `doconnect-admin`
5. Generate a strong password and **save it securely**
6. Set role: **"Read and write to any database"**
7. Click **"Add User"**

#### 1.3 Configure Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   > This is safe because you have username/password protection
4. Click **"Confirm"**

#### 1.4 Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `myFirstDatabase` with `doconnect`

**Example format**:

```
mongodb+srv://doconnect-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/doconnect?retryWrites=true&w=majority
```

---

### Step 2: Cloudinary Setup

#### 2.1 Create Account

1. Go to https://cloudinary.com
2. Sign up for free account
3. Verify your email

#### 2.2 Get Credentials

1. Go to Dashboard
2. Find and save your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

#### 2.3 Create Upload Preset (Optional but Recommended)

1. Go to **Settings** → **Upload**
2. Scroll to **"Upload presets"**
3. Click **"Add upload preset"**
4. Name: `doconnect-profiles`
5. Signing Mode: **"Signed"**
6. Folder: `doconnect/profiles`
7. Save

---

### Step 3: Stripe Setup (Optional - Skip for Non-Payment Deployment)

> [!NOTE]
> Skip this section if you're deploying without Stripe. You can add it later.

#### 3.1 Get Production Keys

1. Go to https://dashboard.stripe.com
2. Toggle **"Test mode" OFF** (top right)
3. Go to **Developers** → **API keys**
4. Copy and save:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

> [!WARNING]
> Never use test keys in production. Ensure "Test mode" is OFF.

#### 3.2 Create Products & Prices

1. Go to **Products** → **Add Product**
2. Create three subscription products:
   - **Basic Plan** (e.g., $9.99/month)
   - **Professional Plan** (e.g., $29.99/month)
   - **Enterprise Plan** (e.g., $99.99/month)
3. For each product, copy the **Price ID** (starts with `price_...`)

#### 3.3 Webhook Setup (Complete After Backend Deployment)

> [!IMPORTANT]
> You'll complete this step after deploying your backend to Railway.

---

### Step 4: Prepare Environment Variables

#### 4.1 Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 64
```

Copy the output and save it securely.

#### 4.2 Prepare Backend Environment Variables

Create a list of your environment variables (you'll add these to Railway later):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_jwt_secret
CLIENT_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**If using Stripe, also add**:

```env
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_PRICE_BASIC=price_your_basic_id
STRIPE_PRICE_PROFESSIONAL=price_your_professional_id
STRIPE_PRICE_ENTERPRISE=price_your_enterprise_id
```

---

## Backend Deployment

### Step 1: Push Code to GitHub

#### 1.1 Verify .gitignore

Ensure your `.gitignore` includes:

```
node_modules/
.env
.env.local
.env.production
*.log
build/
dist/
uploads/
```

#### 1.2 Initialize Git and Push

```bash
cd d:\doconnect
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/doconnect.git
git push -u origin main
```

---

### Step 2: Deploy to Railway

#### 2.1 Create New Project

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"Start a New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your GitHub
6. Select your `doconnect` repository

#### 2.2 Configure Service

1. Railway will detect your Node.js app
2. Click on the service
3. Go to **"Settings"**
4. Set **Root Directory**: `server`
5. Set **Start Command**: `npm start`

#### 2.3 Add Environment Variables

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add each variable from your prepared list

**Required Variables**:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_jwt_secret
CLIENT_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Optional Variables (for Stripe)**:

```
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret (add after webhook creation)
STRIPE_PRICE_BASIC=price_your_basic_id
STRIPE_PRICE_PROFESSIONAL=price_your_professional_id
STRIPE_PRICE_ENTERPRISE=price_your_enterprise_id
```

#### 2.4 Deploy and Get Backend URL

1. Railway automatically deploys when you push to GitHub
2. Watch the build logs for any errors
3. Once deployed, go to **"Settings"** → **"Domains"**
4. Click **"Generate Domain"**
5. Copy your backend URL: `your-app.railway.app`
6. **Save this URL** - you'll need it for frontend configuration

#### 2.5 Test Backend

```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Expected response:
{
  "message": "Doconnect API is running!",
  "timestamp": "...",
  "environment": "production",
  "version": "1.0.0"
}
```

---

### Step 3: Configure Stripe Webhook (If Using Stripe)

> [!NOTE]
> Skip this section if you're not using Stripe.

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-app.railway.app/api/subscriptions/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_...`)
7. Add to Railway variables: `STRIPE_WEBHOOK_SECRET=whsec_your_secret`

---

## Frontend Deployment

### Step 1: Configure Production Environment

#### 1.1 Create .env.production File

Navigate to your client folder and create `.env.production`:

```bash
cd d:\doconnect\client
```

Create `client/.env.production` with the following content:

**Without Stripe**:

```env
REACT_APP_API_URL=https://your-app.railway.app
REACT_APP_NAME=DocConnect
REACT_APP_VERSION=1.0.0
```

**With Stripe**:

```env
REACT_APP_API_URL=https://your-app.railway.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
REACT_APP_NAME=DocConnect
REACT_APP_VERSION=1.0.0
```

> [!IMPORTANT]
> Replace `your-app.railway.app` with your actual Railway URL!

---

### Step 2: Create .htaccess File

Create `client/public/.htaccess` for React Router support:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

### Step 3: Build Production Bundle

#### 3.1 Install Dependencies

```bash
cd d:\doconnect\client
npm install
```

#### 3.2 Build for Production

```bash
npm run build
```

This will:

- Create optimized production build
- Minify JavaScript and CSS
- Generate static files in `build/` folder
- Process environment variables

**Expected output**:

```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  XX.XX kB  build/static/js/main.xxxxx.js
  XX.XX kB  build/static/css/main.xxxxx.css

The build folder is ready to be deployed.
```

#### 3.3 Verify Build

```bash
# Check build folder exists
dir build

# Should contain:
# - index.html
# - .htaccess
# - static/ (folder with JS, CSS, media)
# - asset-manifest.json
# - manifest.json
# - robots.txt
```

---

### Step 4: Upload to Hostinger

#### Method 1: File Manager (Easiest)

1. Log in to Hostinger
2. Go to **"Hosting"** → Your hosting plan
3. Click **"File Manager"**
4. Navigate to `public_html/` folder
5. Delete all existing files (backup first if needed!)
6. Click **"Upload Files"**
7. Navigate to `d:\doconnect\client\build\`
8. Select ALL files and folders:
   - `index.html`
   - `.htaccess`
   - `asset-manifest.json`
   - `manifest.json`
   - `robots.txt`
   - `static/` folder (entire folder)
   - `favicon.ico`
9. Upload and wait for completion

**Alternative: Upload as ZIP**

1. Compress `build/` folder contents to `build.zip`
2. Upload `build.zip` to `public_html/`
3. Right-click → Extract
4. Move files from extracted folder to `public_html/`
5. Delete the zip and empty folder

#### Method 2: FTP (Recommended for Faster Upload)

1. In Hostinger panel, go to **"Files"** → **"FTP Accounts"**
2. Note your FTP credentials:

   - Host: `ftp.yourdomain.com`
   - Username: (from Hostinger)
   - Password: (from Hostinger)
   - Port: 21

3. Download and install FileZilla: https://filezilla-project.org/
4. Open FileZilla and connect:
   - Host: `ftp.yourdomain.com`
   - Username: (from Hostinger)
   - Password: (from Hostinger)
   - Port: 21
5. Click **"Quickconnect"**

6. Upload files:
   - Left side: Navigate to `d:\doconnect\client\build\`
   - Right side: Navigate to `/public_html/`
   - Select all files in build folder
   - Drag to right side (public_html)
   - Wait for upload to complete

---

### Step 5: Configure SSL

#### 5.1 Verify Domain Configuration

1. In Hostinger, go to **"Domains"**
2. Click on your domain
3. Check DNS settings:
   - A record should point to Hostinger's IP
   - If using subdomain, add CNAME record

#### 5.2 Enable SSL Certificate

1. Go to **"Security"** → **"SSL"**
2. Select your domain
3. Click **"Install SSL"**
4. Choose **"Free SSL"** (Let's Encrypt)
5. Wait 5-10 minutes for activation

#### 5.3 Verify HTTPS

1. Visit `https://yourdomain.com`
2. Check for green padlock in browser
3. Verify HTTP redirects to HTTPS

---

## Deployment Scenarios

### Scenario A: Full Deployment with Stripe

If you followed all steps including Stripe configuration:

**✅ What's Working**:

- User registration & authentication
- Profile management
- File uploads (Cloudinary)
- Job posting & browsing
- Job applications
- Messaging & notifications
- **Subscription payments**
- Admin dashboard

**Next Steps**:

1. Test Stripe payments in test mode first
2. Use test card: `4242 4242 4242 4242`
3. Verify subscription creation
4. Check webhook events in Stripe dashboard
5. Switch to live mode when ready

---

### Scenario B: Deployment without Stripe

If you skipped Stripe configuration:

**✅ What's Working**:

- User registration & authentication
- Profile management
- File uploads (Cloudinary)
- Job posting & browsing
- Job applications
- Messaging & notifications
- Admin dashboard
- All core features

**❌ What's Not Working**:

- Subscription payments

**Adding Stripe Later**:

When you're ready to add payments:

1. Complete Stripe setup (Step 3 in Pre-Deployment)
2. Add Stripe environment variables to Railway:
   ```env
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   ```
3. Update frontend `.env.production`:
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   ```
4. Rebuild frontend: `npm run build`
5. Re-upload to Hostinger
6. Test payments

---

## Post-Deployment

### Testing Checklist

#### Basic Functionality

- [ ] Website loads at `https://yourdomain.com`
- [ ] No 404 errors on page refresh
- [ ] All routes work correctly
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] SSL certificate is valid (green padlock)

#### Authentication

- [ ] Registration works
- [ ] Email validation works
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect to login
- [ ] JWT tokens are being set
- [ ] Session persistence works

#### Profile Features

- [ ] Profile page loads
- [ ] Profile photo upload works
- [ ] Document upload works
- [ ] Profile editing works
- [ ] Experience can be added
- [ ] Skills can be updated
- [ ] Public profile accessible

#### Job System

- [ ] Job creation works (senior doctors)
- [ ] Job listing displays correctly
- [ ] Job search and filters work
- [ ] Job details page loads
- [ ] Application submission works (junior doctors)
- [ ] Application tracking works
- [ ] Job management dashboard works

#### Payments (If Using Stripe)

- [ ] Stripe checkout loads
- [ ] Test payment works (use test card: `4242 4242 4242 4242`)
- [ ] Subscription is created
- [ ] Webhook receives events
- [ ] Database is updated
- [ ] User subscription status updates

#### File Uploads

- [ ] Profile photos upload to Cloudinary
- [ ] Documents upload successfully
- [ ] Uploaded files are accessible
- [ ] File size limits enforced
- [ ] File type validation works

#### Real-time Features

- [ ] Socket.IO connects
- [ ] Messages send and receive
- [ ] Notifications work
- [ ] Online status updates

---

### Security Verification

#### HTTPS & SSL

- [ ] SSL certificate is valid
- [ ] All pages load over HTTPS
- [ ] No mixed content warnings
- [ ] HTTP redirects to HTTPS

#### CORS

- [ ] CORS configured correctly in backend
- [ ] Only allowed origins can access API
- [ ] Credentials are allowed for authenticated requests

#### Authentication

- [ ] JWT secrets are strong and unique
- [ ] Tokens expire appropriately
- [ ] Password reset works (if implemented)

#### Rate Limiting

- [ ] Rate limiting is active
- [ ] Excessive requests are blocked
- [ ] Auth endpoints have stricter limits

#### Input Validation

- [ ] All forms validate input
- [ ] XSS attacks prevented
- [ ] File upload validation works

---

### Monitoring Setup

#### Error Tracking

- [ ] Error logging configured
- [ ] Error notifications configured
- [ ] Check Railway logs regularly

#### Analytics (Optional)

- [ ] Google Analytics configured
- [ ] User tracking works
- [ ] Conversion tracking set up

#### Uptime Monitoring

- [ ] Uptime monitor configured (UptimeRobot, etc.)
- [ ] Alerts set up for downtime
- [ ] Health check endpoint monitored

---

## Maintenance & Updates

### Updating Code

#### Backend Updates

```bash
# Make changes to backend code
cd d:\doconnect\server

# Commit and push
git add .
git commit -m "Update backend feature"
git push

# Railway auto-deploys!
```

#### Frontend Updates

```bash
# Make changes to frontend code
cd d:\doconnect\client

# Rebuild
npm run build

# Upload new build/ contents to Hostinger via FTP or File Manager
```

---

### Database Backups

#### MongoDB Atlas Automatic Backups

1. Go to MongoDB Atlas dashboard
2. Click **"Backup"** tab
3. Verify automatic backups are enabled
4. Configure backup schedule if needed
5. Test restoration process periodically

#### Manual Backups

```bash
# Export database
mongodump --uri="your_mongodb_connection_string" --out=./backup

# Import database
mongorestore --uri="your_mongodb_connection_string" ./backup
```

---

### Scaling Considerations

#### When to Scale

**Backend (Railway)**:

- CPU usage consistently > 80%
- Memory usage > 80%
- Response times > 1 second

**Database (MongoDB)**:

- Storage > 400MB (on free tier)
- Connections maxed out
- Slow queries

**Frontend (Hostinger)**:

- High traffic (> 10k visitors/day)
- Consider Cloudflare CDN

#### How to Scale

1. **Backend**: Upgrade Railway plan ($5/month → $20/month)
2. **Database**: Upgrade MongoDB tier (Free → M10 $57/month)
3. **Files**: Upgrade Cloudinary plan (Free → Advanced $99/month)
4. **Frontend**: Add Cloudflare CDN (free tier available)

---

## Troubleshooting

### Frontend Issues

#### Blank Page

**Symptoms**: Website shows blank white page

**Solutions**:

1. Check browser console for errors
2. Verify `.env.production` has correct backend URL
3. Ensure API URL includes `https://`
4. Rebuild: `npm run build`
5. Clear browser cache
6. Re-upload build files

#### 404 on Routes

**Symptoms**: Direct URLs or page refresh shows 404

**Solutions**:

1. Verify `.htaccess` is uploaded to `public_html/`
2. Check if mod_rewrite is enabled (contact Hostinger support)
3. Verify `.htaccess` syntax is correct
4. Clear browser cache

#### API Calls Fail

**Symptoms**: CORS errors or failed API requests

**Solutions**:

1. Check `CLIENT_URL` in Railway matches your domain exactly
2. Include `https://` in the URL
3. Verify backend is running (check Railway logs)
4. Test backend health endpoint: `curl https://your-app.railway.app/api/health`
5. Redeploy backend after changing CORS settings

---

### Backend Issues

#### Build Fails on Railway

**Symptoms**: Deployment fails during build

**Solutions**:

1. Check Railway build logs for specific errors
2. Verify `package.json` has all dependencies
3. Run `npm install` locally to test
4. Check Node.js version compatibility
5. Verify `server` folder structure is correct

#### Database Connection Fails

**Symptoms**: Backend can't connect to MongoDB

**Solutions**:

1. Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
2. Verify connection string has correct password
3. Ensure database name is `doconnect`
4. Check connection string format
5. Test connection locally first

#### API Returns 502/503

**Symptoms**: Backend is unreachable

**Solutions**:

1. Check if service is running in Railway dashboard
2. Verify `PORT` environment variable is set to `5000`
3. Check Railway logs for errors
4. Verify start command is `npm start`
5. Check if backend crashed (restart if needed)

---

### Stripe Issues (If Applicable)

#### Webhook Not Receiving Events

**Symptoms**: Subscriptions not updating in database

**Solutions**:

1. Verify webhook URL is correct in Stripe dashboard
2. Check webhook secret matches Railway environment variable
3. Test webhook with Stripe CLI
4. Check Railway logs for webhook errors
5. Verify webhook events are configured correctly

#### Payments Fail

**Symptoms**: Checkout doesn't complete

**Solutions**:

1. Ensure you're using LIVE keys (not test keys)
2. Verify Stripe publishable key in frontend
3. Check Stripe dashboard for error messages
4. Test with Stripe test card first
5. Verify price IDs are correct

---

### File Upload Issues

#### Uploads Fail

**Symptoms**: Profile photos or documents don't upload

**Solutions**:

1. Verify Cloudinary credentials in Railway
2. Check file size limits
3. Verify file type validation
4. Check browser console for errors
5. Test Cloudinary connection

---

## Support Resources

### Hosting Platforms

- **Railway**: https://railway.app/help
- **Hostinger**: https://support.hostinger.com (24/7 live chat)
- **MongoDB Atlas**: https://support.mongodb.com

### Services

- **Stripe**: https://support.stripe.com
- **Cloudinary**: https://support.cloudinary.com

### Documentation

- **React**: https://react.dev
- **Express**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com
- **Stripe**: https://stripe.com/docs

---

## Rollback Plan

If critical issues occur after deployment:

### Frontend Rollback

1. Keep previous build folder as backup
2. Upload previous build folder to Hostinger
3. Clear browser cache
4. Test

### Backend Rollback

1. Go to Railway dashboard
2. Click **"Deployments"**
3. Find previous working deployment
4. Click **"..."** → **"Redeploy"**
5. Test API endpoints

### Database Rollback

1. Restore from MongoDB Atlas backup
2. Verify data integrity
3. Test application

---

## Deployment Complete! 🎉

Your Doconnect application is now live in production!

### Quick Reference

**Your URLs**:

- Frontend: `https://yourdomain.com`
- Backend: `https://your-app.railway.app`
- Backend Health: `https://your-app.railway.app/api/health`

**Default Admin Account** (created automatically):

- Email: `admin@doconnect.com`
- Password: `Admin@123`

> [!WARNING]
> Change the admin password immediately after first login!

### Next Steps

1. Test all features thoroughly
2. Monitor Railway logs for errors
3. Set up uptime monitoring
4. Configure database backups
5. Add privacy policy and terms of service
6. Announce to users!

---

**Need help?** Refer to the troubleshooting section or contact support for your hosting platforms.
