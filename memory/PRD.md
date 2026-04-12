# 2good2breal - Product Requirements Document

## Original Problem Statement
2good2breal is a dating profile verification service. Full-stack application (React frontend, FastAPI backend, MongoDB) allowing users to submit dating profiles for AI-driven verification (Gemini via Emergent LLM) and manual Admin review. Core features include an automated 4-step submission wizard, Stripe payments, Admin Dashboard, and PDF/DOCX report generation.

## User Personas
- **Clients**: Users submitting dating profiles for verification. Need a simple wizard flow to enter profile data and upload photos.
- **Admins**: Review submissions, generate customized DOCX/PDF verification reports, manage users.

## Core Requirements
1. 4-step client submission wizard (Information, Photos/Details, Activity, Observations)
2. AI-powered profile analysis (Gemini)
3. Admin dashboard with print, PDF, DOCX generation
4. Stripe payment integration for credit packages
5. Email notifications (Resend) with acceptance confirmation + PDF attachment
6. Multi-language support (EN/FR)

## Architecture
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI (monolithic server.py ~3700 lines)
- Database: MongoDB
- Integrations: Stripe, Resend, Gemini (Emergent LLM Key)

## What's Been Implemented
- Full submission wizard with date dropdowns (Day/Month/Year) for DOB, Profile Creation Date, Last Active
- Admin dashboard with expandable submissions, print, PDF, DOCX download
- Customized 7-page DOCX final report with 2-column tables, logos, rating scale images
- Visual DOCX preview in AdminReportPage.jsx
- XSS-safe print functionality (iframe srcdoc approach)
- Acceptance email with WhatsApp 1 & WhatsApp 2 numbers
- Photo Identification section includes "Research and confirmation of all Profile Platforms, Locations and Residencies" text
- Cookie consent banner
- Admin print form includes all fields (marital status, university, hobbies, graduation years)

## Prioritized Backlog
### P0 (None currently)
### P1
- Security: Move auth tokens from localStorage to HttpOnly cookies
- Resend Domain DNS Verification (waiting for OVH/Resend DNS propagation)
### P2
- Refactor server.py (~3700 lines) into modular FastAPI routers
- Refactor AnalyzePage.jsx (1800+ lines) into sub-components
- Refactor AdminPage.jsx (1010+ lines) into sub-components

## Known Issues
- Users testing on Vercel production before pushing to GitHub report false "bugs" (stale cache). Must use preview URL for testing, then Save to GitHub and redeploy Vercel.
