BITS PHOTO-MART: Complete Developer To-Do Checklist
PHASE 1: PROJECT SETUP & CONFIGURATION
Initial Setup
Initialize Next.js 16.1.6 with TypeScript and App Router

Configure TailwindCSS v4

Set up environment variables (.env.local)

Configure ESLint and Prettier

Set up folder structure (app, components, lib, utils, hooks, types)

Database Setup
Design Prisma schema with all models

Set up MariaDB connection

Run initial migration

Create seed script for initial data

Generate Prisma client

Test database connection

Authentication Setup
Configure NextAuth v5 with Prisma adapter

Set up Credentials provider

Add Google OAuth provider

Configure JWT and session callbacks

Set up middleware for route protection

Create login page UI

Create register page UI

Implement forgot password flow

Add email verification

PHASE 2: PUBLIC PAGES
Homepage
Hero section with headline and CTA

"What We Do" services cards (5 cards)

"Why Choose Us" features (6 items)

Featured gallery grid (6-12 images)

Get Started CTA section

About Page
"Who We Are" section

Mission statement card

Vision statement card

Core Values cards (4 values)

Services Page
Photography & Videography section

Documentary Production section

African Stock Photos & Footage section

Corporate Media Packages section

CTA buttons on each section

Gallery/Stock Library
Page header with title and description

"Perfect For" tags section

Category filter sidebar

Media grid with watermarked previews

Search bar with filters

Pricing information display

Individual media detail page

Add to cart functionality

Pagination or infinite scroll

For Creatives Page
Hero section with headline and CTA

Benefits cards (5 benefits)

"How It Works" 5-step process

Contributor benefits section

"What We Accept" list

Contributor onboarding steps

"Register Now" button

Blog
Blog listing page with pagination

Individual blog post page

Categories sidebar

Recent posts widget

Social sharing buttons

Blog search

Contact Page
Contact information display

Contact form with all fields

"Request a Quote" CTA

Map embed

Social media links

Global Components
Navigation menu (responsive)

Footer with all sections

Mobile menu

Breadcrumbs

PHASE 3: AUTHENTICATION PAGES
Login Page
Email field

Password field

Remember me checkbox

Forgot password link

Login button

Register link

Google login button

Register Page
Role selection (Client/Photographer)

Client registration form

Photographer multi-step registration

Terms agreement checkbox

Form validation

Success message

Forgot Password
Email field

Send reset link button

Back to login link

Reset Password
New password field

Confirm password field

Update password button

PHASE 4: CLIENT DASHBOARD
Dashboard Home
Welcome message

Stats cards (4 cards)

Recent activity feed

Quick actions buttons

Request Service
Multi-step service request form

Service type selection

Event details form

Budget input

File upload for references

Review and submit

Success confirmation

My Requests
List of all requests

Status filters

Request cards with key info

Click to view details

Request Detail
Request information display

Bids section (if applicable)

Photographer bid cards

Accept bid button

Assignment tracking (if assigned)

Completion section

Rating and feedback form

My Purchases
List of purchased media

Download buttons

Purchase details

Invoice download

My Collections
Create collection button

Collections list

Saved media grid

Remove from collection

Add to cart

Client Profile Settings
Edit personal information form

Change password form

Notification preferences

Delete account option

PHASE 5: PHOTOGRAPHER DASHBOARD
Onboarding Flow
Profile completion form

Portfolio upload

Skills selection

Equipment list

ID verification upload

Payment details form

Submit for review

Status tracking

Dashboard Home
Welcome message

Stats cards (4 cards)

Recent activity

Quick actions

Available Jobs
Job listings with filters

Search functionality

Job cards with key info

Click for details

Job Detail & Bid
Full job details

Client info (anonymized)

Bid form

Submit bid button

My Bids
List of all bids

Status indicators

Filter by status

Withdraw bid option

My Assignments
Current assignments list

Completed assignments

Assignment cards

Status tracking

Assignment Workspace
Assignment details

Client chat

Work submission form

File upload

Mark as complete

Stock Media Management
Upload media form

Metadata fields

Category selection

Tags input

Price field

My uploads list

Status indicators

Edit/delete options

Earnings Page
Total earnings summary

Earnings breakdown

Transaction history table

Available balance

Withdrawal form

Withdrawal history

Availability Calendar
Monthly calendar view

Mark availability

Block dates

Save functionality

Public Profile
Profile display

Portfolio gallery

Rating and reviews

Contact button

Photographer Settings
Edit profile form

Change password

Update payment details

Notification preferences

PHASE 6: ADMIN PANEL
Admin Dashboard
Key metrics cards

Charts and graphs

Recent activity log

Quick action buttons

User Management
Users list with filters

Search functionality

User detail view

Account actions (suspend, verify, delete)

Bulk actions

Photographer Vetting
Pending applications list

Application detail view

Document preview

Approve/reject buttons

Request more info option

Service Request Management
All requests list

Filters by status

Request detail view

Manual assignment

Dispute handling

Media Review Queue
Pending media list

Preview thumbnails

Uploader details

Approve/reject buttons

Feature option

Bulk actions

Category Management
Add category form

Categories list

Edit/delete options

Sort order

Transaction Management
All payments list

Filters and search

Transaction detail

Refund button

Export functionality

Payout Management
Payout requests list

Process payout button

Payout history

Commission settings

Blog Management
Create post form

Rich text editor

Posts list

Edit/delete options

Publish toggle

Content Management
Homepage content editor

About page editor

Services editor

Testimonials CRUD

FAQ management

Story of the Day
Select story interface

Set publication date

Preview

Rotation settings

System Settings
Role permissions

Email templates

Payment gateway config

Commission structure

Maintenance mode

PHASE 7: API ROUTES
Authentication
POST /api/auth/register

POST /api/auth/forgot-password

POST /api/auth/reset-password

GET /api/auth/verify-email/:token

Users
GET /api/users/profile

PUT /api/users/profile

GET /api/users/:id (admin)

PUT /api/users/:id/status (admin)

Photographers
POST /api/photographers/apply

GET /api/photographers/pending (admin)

PUT /api/photographers/:id/verify (admin)

GET /api/photographers/:id/portfolio

PUT /api/photographers/availability

Media
GET /api/media (public)

GET /api/media/:id

POST /api/media/upload

PUT /api/media/:id

DELETE /api/media/:id

GET /api/media/pending (admin)

PUT /api/media/:id/approve (admin)

Service Requests
POST /api/requests

GET /api/requests

GET /api/requests/:id

PUT /api/requests/:id

GET /api/requests/:id/bids

Bids
POST /api/bids

GET /api/bids/:id

PUT /api/bids/:id/accept

DELETE /api/bids/:id

Assignments
POST /api/assignments

GET /api/assignments/:id

PUT /api/assignments/:id/status

POST /api/assignments/:id/submit-work

Payments
POST /api/payments/create-intent

POST /api/payments/mpesa/stk-push

POST /api/webhooks/mpesa

POST /api/webhooks/stripe

POST /api/webhooks/paypal

GET /api/payments/history

POST /api/payments/withdraw

POST /api/payments/payout (admin)

Blog
GET /api/blog/posts

GET /api/blog/posts/:slug

POST /api/blog/posts (admin)

PUT /api/blog/posts/:id (admin)

DELETE /api/blog/posts/:id (admin)

PHASE 8: INTEGRATIONS
M-Pesa Integration
OAuth token generation

STK Push simulation

B2C payment for payouts

Webhook endpoint

Callback handling

Error handling

Stripe Integration
Payment intent creation

Checkout session

Webhook handling

Refund processing

PayPal Integration
Order creation

Capture order

Webhook handling

Cloud Storage (AWS S3)
Bucket creation

IAM user setup

Signed URL generation

Image optimization with Sharp

Watermarking on upload

CORS configuration

Email Service
SMTP configuration

Welcome email template

Email verification template

Password reset template

Bid notification template

Assignment update template

Payment confirmation template

Payout notification template

SMS Service
Provider setup

Job alert SMS

Payment confirmation SMS

Verification SMS

PHASE 9: UI COMPONENTS (SHARED)
Base Components
Button (variants)

Card

Modal/Dialog

Dropdown menu

Tabs

Accordion

Form inputs

File uploader

Toast notifications

Loading spinners

Skeleton loaders

Pagination

Breadcrumbs

Tooltips

Avatar

Badge

Rating stars

Layout Components
Navbar (desktop)

Mobile menu

Footer

Dashboard sidebar

Page header

PHASE 10: TESTING
Unit Testing
Utility functions

Form validation

API route handlers

Integration Testing
Authentication flow

Payment webhooks

Email sending

File upload

User Flow Testing
Client purchases photo

Client requests service

Photographer bids on job

Photographer uploads media

Admin approves photographer

Admin processes payout

Device Testing
Desktop responsive

Tablet responsive

Mobile responsive

Cross-browser testing

PHASE 11: DEPLOYMENT
Pre-Launch
Production environment variables set

Database migrations run

S3 bucket configured

CDN set up

SSL certificate installed

Domain configured

SEO meta tags added

Sitemap.xml generated

robots.txt created

Analytics script added

Error tracking setup

Deployment
Deploy to Vercel

Configure custom domain

Test live site

Verify all integrations

Test payment flows in production

Post-Launch
Monitor error logs

Check email delivery

Verify backups

Create admin documentation

User training (if needed)

PROGRESS TRACKING
Phase	Total Tasks	Completed	Progress
1: Setup	15	□	0%
2: Public Pages	45	□	0%
3: Auth Pages	15	□	0%
4: Client Dashboard	40	□	0%
5: Photographer Dashboard	60	□	0%
6: Admin Panel	55	□	0%
7: API Routes	30	□	0%
8: Integrations	25	□	0%
9: UI Components	25	□	0%
10: Testing	20	□	0%
11: Deployment	20	□	0%
TOTAL	350	0	0%
Instructions for Developer:

Check off items as you complete them

Move through phases sequentially

Test thoroughly after each phase

Commit code regularly

Update progress tracking daily