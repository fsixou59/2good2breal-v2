# 2good2breal - Product Requirements Document

## Project Overview
**Name:** 2good2breal  
**Type:** Dating Profile Verification Service  
**Stack:** React Frontend + FastAPI Backend + MongoDB  
**Last Updated:** April 7, 2026

## Original Problem Statement
A verification service website for dating profiles where users submit profiles for manual verification by an admin team. Features AI analysis (for admin eyes only) and comprehensive admin-side reporting tool to generate and send detailed manual analysis reports to clients.

## Core Features

### User Features
- Email/password authentication
- Profile submission for verification
- Credit-based payment system (Stripe)
- Bilingual support (English/French)
- Refund request form

### Admin Features
- Separate admin login (credentials from environment variables)
- Dashboard to view all submissions with AI scores
- Multi-page printable manual report creation
- Email reports to clients

### Integrations
- **Resend:** Email notifications
- **Stripe:** Payment processing
- **Gemini 3 Flash:** AI analysis (Emergent LLM Key)

## Completed Work (April 7, 2026)

### Admin Print Layout Alignment ✅
- **Unified Print Layout** - Admin's "Print Submission" now matches Client's form print layout exactly
- **Underlined Section Titles** - All section headers use consistent underlined styling (.section-title with text-decoration: underline)
- **Field Order Corrected** - NAME appears before EMAIL in CLIENT INFORMATION section
- **New Form Fields Added:**
  - Assumed Marital Status
  - Hobbies / Interests
  - University / College
  - Year/s of Attendance
- **Payload Updated** - New fields are now included in the submission payload to backend

### AI Analysis in Print ✅
- **AI Analysis Section** now included in Admin "Print Submission" output:
  - Trust Score display (large, color-coded: red < 40, yellow 40-70, green > 70)
  - Trust Level badge (VERY LOW, LOW, MEDIUM, HIGH)
  - AI Summary text
  - Red Flags Detected with count and severity badges (HIGH=red, MEDIUM=orange, LOW=yellow)
  - Individual recommendations per red flag
  - AI Recommendations list

### Previous Work (April 6, 2026)

### UI/UX Changes
- **Renamed "Analyze Profile" to "Profile Submission"** across all pages and translations
- **Reorganized submission form into 4 pages:**
  - Page 1: Client Info + Basic Info (ends with Nationality/Language)
  - Page 2: Profile Details + Photos (photo box reduced 50%)
  - Page 3: Activity Information (photos info, social media, activity)
  - Page 4: Communication + Observations + Terms
- **Updated acceptance letter** to show only client's first name after "Dear"
- **Added progress indicator** with clickable steps

### Admin Report Enhancements
- **Added DOCX format download** for admin reports (python-docx integration)
- Admin can now choose between:
  - **DOCX** - Editable Word document for manual customization
  - **PDF** - Preview & Print for archival
- DOCX includes all sections: Client Info, Profile Verified, Trust Score, Expert Analysis (editable), Recommendations

### Bug Fixes
- **Fixed AI Image Analysis** - Corrected `ImageContent` and `UserMessage` parameters for emergentintegrations library
  - Changed `base64_data` to `image_base64` parameter
  - Changed `content=[]` to `text=..., file_contents=[...]` for proper message format
- **Fixed Admin Dashboard Photos Display** - Photos now correctly displayed from `form_data.photos`
  - Backend `/admin/analyses` endpoint now properly retrieves photos from form_data

### Previous Session Work (March-April 2026)

### Deployment Fixes
- Improved MongoDB connection with Atlas-compatible settings
- Added retry logic and better timeout configurations
- Added startup event for database connection verification
- Multiple health check endpoints (`/`, `/health`, `/api/`, `/api/health`)

### Landing Page Updates
- Phone numbers now clickable with `tel:` links
- Added physical address: "2good2breal, 75008 Paris, France"
- Contact section fully formatted with WhatsApp and Office Line

### Previous Session Work (March 7-11, 2026)
- Admin Report finalization with extensive text/styling changes
- Refund system implementation (form, API, email notifications)
- SEO implementation (meta tags, JSON-LD, sitemap.xml, robots.txt)
- Purple branding overhaul with new logo
- FAQ page created
- Legal pages updated (CGV, Terms, Cookies)
- Security fix: Admin credentials moved to environment variables

## File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI backend (monolithic - needs refactoring)
│   └── .env               # Environment variables
└── frontend/
    ├── public/
    │   ├── logo.png       # Purple logo
    │   ├── sitemap.xml    # SEO sitemap
    │   ├── robots.txt     # SEO robots
    │   └── manifest.json  # PWA manifest
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   └── CookieConsent.jsx  # (Unstable - needs rebuild)
        └── pages/
            ├── AdminPage.jsx
            ├── AdminReportPage.jsx
            ├── AnalyzePage.jsx
            ├── AuthPages.jsx
            ├── CGVPage.jsx
            ├── CookiesPage.jsx
            ├── DashboardPage.jsx
            ├── FAQPage.jsx
            ├── LandingPage.jsx
            ├── PricingPage.jsx
            ├── RefundRequestPage.jsx
            ├── ResultsPage.jsx    # (Obsolete - to be deleted)
            └── TermsPage.jsx
```

## Database Schema
- **users:** {email, password, username, created_at, credits}
- **analyses:** {user_id, status, submission_date, form_data, ai_analysis, admin_report}
- **refund_requests:** {username, email, order_ref, iban, reason, submission_date}

## Deployment Status
✅ **DEPLOYMENT READY**
- MongoDB connection improved with Atlas-compatible settings
- Multiple health check endpoints for Kubernetes probes
- Startup event for connection verification
- All environment variables properly configured

## Known Issues
- Cookie consent banner has been unstable (multiple runtime errors) - needs stable rebuild
- Frontend compilation fragility with babel-metadata-plugin on large JSX files
- **Resend DNS Verification Pending** - SPF/DKIM records for `send.2good2breal.com` awaiting OVH DNS propagation

## Backlog / Future Tasks
- **P1:** Verify Resend domain DNS propagation and complete verification (blocked on OVH support)
- **P1:** Redeploy Vercel frontend to include latest changes
- **P1:** Rebuild cookie consent banner with stable implementation
- **P1:** End-to-end test of all major flows on production
- **P2:** Enhance DashboardPage.jsx with submission history
- **P2:** Refactor backend/server.py into modular structure (routers for auth, analysis, admin, refund)
- **P3:** Remove obsolete ResultsPage.jsx
- **P3:** Implement FiltersPage.jsx functionality

## Credentials
- **Admin:** Login via "Admin Access" button - credentials in backend/.env
- **Test User:** Register new user and purchase credits
