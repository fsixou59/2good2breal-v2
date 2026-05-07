# 2good2breal - Product Requirements Document

## Original Problem Statement
2good2breal is a dating profile verification service. Full-stack application (React frontend, FastAPI backend, MongoDB) allowing users to submit dating profiles for AI-driven verification (Gemini via Emergent LLM) and manual Admin review.

## Core Features Implemented
1. 4-step client submission wizard (Info, Photos, Activity, Observations)
2. AI-powered profile analysis (Gemini) - runs in background
3. Admin dashboard with 3 tabs: Profile Submissions, Profile Seeker, Comparator
4. Stripe payment integration
5. Email notifications (Resend) via contact@2good2breal.com
6. Multi-language support (EN/FR)
7. DOCX/PDF report generation
8. **Profile Seeker** with SerpAPI integration (web search + reverse image + AI analysis)
9. **Photo Comparator** with AI-powered facial analysis (Gemini)
10. Admin stored in MongoDB (auto-seed on login - works on serverless)

## Architecture
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI (server.py ~4100 lines)
- Database: MongoDB
- Integrations: Stripe, Resend, Gemini (Emergent LLM), SerpAPI

## Key API Endpoints
- POST /api/seeker/profiles/{id}/search - Launch web+image investigation (async)
- GET /api/seeker/profiles/{id}/search/{search_id} - Get search results
- POST /api/seeker/compare-photos - AI photo comparison
- POST /api/admin/login - Admin login (auto-seeds on first use)

## Backlog
- Refactoring server.py into modules
- Migration tokens auth vers HttpOnly cookies
- Refactoring AnalyzePage.jsx / AdminPage.jsx
