# WBC Deal Matching System -- Documentation

## Table of Contents

1. [What This Is](#what-this-is)
2. [Project Structure](#project-structure)
3. [Running Locally](#running-locally)
4. [How the App Works](#how-the-app-works)
5. [Data Model](#data-model)
6. [Matching Engine](#matching-engine)
7. [Pages & Features](#pages--features)
8. [Upload System](#upload-system)
9. [Document Generation](#document-generation)
10. [Email Drafts](#email-drafts)
11. [User Management](#user-management)
12. [Launch Checklist (NOT YET DONE)](#launch-checklist-not-yet-done)
13. [Troubleshooting](#troubleshooting)

---

## What This Is

A web app for Whitebridge Capital that manages two datasets:

- **Lenders** (319 records) -- financing sources and what products they offer
- **Pipeline** (49 records) -- prospects/clients seeking financing

The app matches prospects to lenders based on product type, geography, and other factors, then lets you generate outreach documents and email drafts.

---

## Project Structure

```
wbc/
  01_start_project.bat       <- double-click to start locally
  02_kill_all.bat             <- double-click to stop everything
  CREDENTIALS.md             <- all logins, keys, URLs
  DOCUMENTATION.md           <- this file
  data/
    lenders_cleaned.csv      <- source data: 319 lenders
    pipeline_cleaned.csv     <- source data: 49 pipeline deals
    fields_reference.csv     <- lookup values (stages, products, etc.)
  process_lenders.py         <- script that generated lenders_cleaned.csv
  process_pipeline.py        <- script that generated pipeline_cleaned.csv
  frontend/
    .env                     <- Supabase keys (not committed to git)
    netlify.toml             <- Netlify hosting config
    supabase_migration.sql   <- SQL to create Supabase tables
    public/
      wbc-logo.svg           <- logo
      _redirects              <- Netlify SPA routing
    src/
      main.jsx               <- app entry point
      App.jsx                <- route definitions
      index.css              <- Tailwind + custom colors
      data/
        users.json           <- user login database
        lenders.json         <- lender seed data (JSON)
        pipeline.json        <- pipeline seed data (JSON)
        seed.js              <- CSV column mappings + parsers
      lib/
        supabase.js          <- Supabase client (optional)
        dataService.js       <- data CRUD (Supabase or localStorage)
        matchingEngine.js    <- scoring algorithm
      pages/
        Login.jsx            <- login screen
        Dashboard.jsx        <- stats overview
        LendersTable.jsx     <- lender list with search/sort
        LenderProfile.jsx    <- single lender detail + matched prospects
        PipelineTable.jsx    <- pipeline list with search/sort
        ProspectProfile.jsx  <- single prospect detail + matched lenders
        Upload.jsx           <- template download + CSV upload
      components/
        Layout.jsx           <- sidebar navigation + main content
        ProtectedRoute.jsx   <- auth guard
        DataTable.jsx        <- reusable sortable/filterable table
        MatchCard.jsx        <- lender/prospect match result cards
        ScoreBadge.jsx       <- score display badge
        StatCard.jsx         <- dashboard stat card
        DocumentGenerator.jsx <- PDF generation (4 doc types)
        EmailPreview.jsx     <- mock email with copy-to-clipboard
```

---

## Running Locally

### Quick Start

1. Double-click `01_start_project.bat` (or run `.\01_start_project.bat` in PowerShell)
2. Browser opens to http://localhost:5173/
3. Log in (see CREDENTIALS.md for users)

### Manual Start (PowerShell)

```powershell
cd c:\Users\leogo\OneDrive\Desktop\cursor_projects\wbc\frontend
npm run dev
```

Then open http://localhost:5173/

### Stopping

- Double-click `02_kill_all.bat`
- Or in PowerShell: `.\02_kill_all.bat`

### Requirements

- Node.js (already installed)
- npm (comes with Node)
- No Supabase needed for local -- app falls back to localStorage automatically

---

## How the App Works

### Data Flow

1. On first visit, the app loads seed data from `lenders.json` and `pipeline.json` into localStorage
2. All reads/writes go to localStorage (or Supabase if configured in `.env`)
3. The matching engine runs client-side, comparing each prospect's product type against lender flags
4. Results are scored and ranked

### Authentication

- Hard-coded users in `frontend/src/data/users.json`
- Login sets `wbc_auth=true` in localStorage
- ProtectedRoute component redirects to /login if not authenticated
- Sign Out button clears the auth flag

---

## Data Model

### Lenders (319 records)

| Field Group      | Fields                                                    |
| ---------------- | --------------------------------------------------------- |
| Identity         | lender_name, website, contact_name, linkedin, email, phone|
| Classification   | lender_type, based_in, geographic_coverage, location, note|
| Product Flags    | 21 binary (0/1) columns: cre_construction, cre_residential, cre_land, cre_office, cre_industrial, cre_hotel, cre_retail, cre_other, real_estate, aircraft, art, insurance_premium, yacht, sports, fund_lp, fund_nav, fund_gp, fund_mgmt_company, fund_scf, senior, subordinated, recourse, non_recourse |
| Other            | other_financing (text description or "0")                 |

### Pipeline (49 records)

| Field Group      | Fields                                                    |
| ---------------- | --------------------------------------------------------- |
| Identity         | client_name, contact_name, company_name, sector           |
| Deal Info        | lead_source, pipeline_status, wbc_product, wbc_sub_product, deal_stage, probability, lead_rm, deal_team, deal_size, total_est_revenue, est_close_date |
| Classification   | physical_location, client_type                            |

### Lender Types

Regional Bank, Private Credit Fund, Global Asset Manager, Other Lender, Global Bank, Insurance Company, Mortgage Banking, Family Office, Local Bank

### Pipeline Statuses

Active, On Hold, Closed - Won, Closed - Lost, Closed - Mandate

---

## Matching Engine

Located in `frontend/src/lib/matchingEngine.js`

### How It Works

Each pipeline prospect has a `wbc_sub_product` (e.g., "Aircraft Financing", "CRE - Office"). Each lender has binary flags for the products they offer. The engine maps the sub-product to the corresponding flag:

| Prospect Sub-Product          | Lender Column      |
| ----------------------------- | ------------------ |
| Aircraft Financing            | aircraft           |
| Art Financing                 | art                |
| CRE - Office                  | cre_office         |
| CRE - Hotel                   | cre_hotel          |
| CRE - Land                    | cre_land           |
| CRE - Residential             | cre_residential    |
| CRE - Industrial              | cre_industrial     |
| CRE - Retail                  | cre_retail         |
| CRE - Other                   | cre_other          |
| CRE - Construction            | cre_construction   |
| Real Estate                   | real_estate        |
| LP                            | fund_lp            |
| GP                            | fund_gp            |
| Management Company            | fund_mgmt_company  |
| Yacht Financing               | yacht              |
| Sports Financing              | sports             |
| Insurance Premium Financing   | insurance_premium  |
| Other Financing               | other_financing    |

### Scoring (max 90 points)

| Factor          | Points | Logic                                              |
| --------------- | ------ | -------------------------------------------------- |
| Primary Match   | 50     | Does the lender offer the product? Yes = 50, No = skip |
| Geography       | 0-20   | Global = 20, International = 15, Domestic same region = 20, Domestic different = 0 |
| Product Breadth | 0-10   | Number of additional products the lender offers     |
| Structure       | 0-10   | Senior/Subordinated/Recourse/Non-recourse flags     |

Only lenders that score 50+ (primary match) appear in results. Sorted highest to lowest.

### Bidirectional

- **Prospect Profile** shows: "Which lenders match this prospect?"
- **Lender Profile** shows: "Which prospects match this lender?"

---

## Pages & Features

### Login (`/login`)
- Email + password form
- Validates against users.json
- Stores auth state in localStorage

### Dashboard (`/`)
- 4 stat cards: Total Lenders, Active Deals, Total Matches, Est. Revenue
- Pipeline by Stage bar chart
- Status Breakdown grid
- Top Products list

### Lenders Table (`/lenders`)
- Searchable by name, type, contact, location
- Sortable columns (click header to toggle asc/desc)
- Paginated (25 per page)
- Click any row to see lender profile

### Lender Profile (`/lenders/:id`)
- Full lender details (contact, location, website, LinkedIn)
- Product offerings list
- Notes section
- Matched prospects list with scores

### Pipeline Table (`/pipeline`)
- Searchable by client, company, product, status, sector
- Color-coded status badges
- Deal size formatted as currency
- Click any row to see prospect profile

### Prospect Profile (`/pipeline/:id`)
- Full prospect details (company, deal size, stage, team)
- Three tabs:
  - **Matches** -- ranked lender matches with score breakdowns
  - **Documents** -- generate PDFs (see below)
  - **Email Draft** -- mock outreach email (see below)

### Upload (`/upload`)
- Toggle between Lenders and Pipeline mode
- Download vertical CSV template (fields as rows, records as columns)
- Drag-and-drop or click to upload
- Auto-detects vertical or horizontal CSV format
- Preview before importing
- Merges into existing data

---

## Upload System

### Template Format (Vertical)

Templates download with fields going down and records going across:

```
Field,          Record 1, Record 2, Record 3
Lender Name,    ABC Bank, XYZ Fund,
Website,        abc.com,  xyz.com,
Contact Name,   John,     Jane,
...
```

This is easier to fill in than scrolling sideways through 30+ columns.

### Ingestion

The uploader accepts both formats:
- **Vertical** (our template) -- auto-detected, transposed before processing
- **Horizontal** (traditional CSV with headers as first row) -- also works

### Limits

- 1-100 records per upload
- New records are appended, matching IDs are updated (upsert)

---

## Document Generation

From any Prospect Profile, the Documents tab offers 4 PDFs:

| Document              | Contents                                                |
| --------------------- | ------------------------------------------------------- |
| Spec Sheet            | One-pager with prospect details + top 5 matched lenders |
| Investment One-Pager  | Deal summary with financials and matched lender count   |
| Offer Memorandum      | Full memo with background, terms, all matched lenders   |
| Power of Attorney     | Pre-filled limited POA template for client signing      |

All PDFs are generated client-side using jsPDF with WBC branding (navy/gold colors). No server needed.

---

## Email Drafts

From any Prospect Profile, the Email Draft tab shows a pre-written outreach email including:

- Deal summary (product, size, sector, target close)
- Top 5 matched lenders with scores
- Prior successful deals in the same product category
- Currently active deals in the same category
- Copy-to-clipboard button

This is preview/mock only -- it does not send. Copy and paste into your email client.

---

## User Management

Users are stored in `frontend/src/data/users.json`. To add a user, add a line:

```json
{ "email": "newuser@wbc.com", "password": "their-password", "name": "Display Name" }
```

Current users are listed in CREDENTIALS.md.

---

## Launch Checklist (NOT YET DONE)

The app is currently local-only. When ready to launch:

### Step 1: Supabase Tables

1. Go to https://supabase.com/dashboard/project/pstzkcamnmnzksjbiizb/sql
2. Paste contents of `frontend/supabase_migration.sql` and click Run
3. Go to Table Editor -> import `data/lenders_cleaned.csv` into `lenders`
4. Go to Table Editor -> import `data/pipeline_cleaned.csv` into `pipeline`

### Step 2: Push to GitHub

```bash
cd c:\Users\leogo\OneDrive\Desktop\cursor_projects\wbc
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DevMakaya/wbc.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Netlify (Free)

1. Go to https://app.netlify.com and sign in with GitHub
2. Click Add new site -> Import an existing project -> GitHub -> DevMakaya/wbc
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://pstzkcamnmnzksjbiizb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (the anon key from CREDENTIALS.md)
5. Click Deploy
6. Change site name to something like `wbc-matching`
7. Live at `https://wbc-matching.netlify.app`

After initial deploy, every push to GitHub auto-deploys to Netlify.

### Anticipated Launch Issues

- **Supabase RLS policies**: The migration creates open policies. If data doesn't load after connecting Supabase, check that RLS policies are enabled and set to "allow all" in the Supabase dashboard.
- **Environment variables on Netlify**: If the deployed site shows data but doesn't persist changes, verify the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in Netlify's environment variables (Site configuration -> Environment variables).
- **CSV import column mismatch**: When importing CSVs into Supabase Table Editor, make sure the column names match the SQL migration (snake_case like `lender_name`, not the original CSV headers like `Lender Name`). Use the cleaned CSVs in `data/`, not the original Excel.
- **CORS**: Supabase handles CORS automatically for the anon key. If you see CORS errors, double-check the project URL in `.env`.

---

## Troubleshooting

### App shows blank page
- Open browser console (F12) for errors
- Make sure you ran `npm install` in the `frontend` folder
- Try clearing localStorage: F12 -> Application -> Local Storage -> Clear

### Login doesn't work
- Check `frontend/src/data/users.json` for correct email/password
- Email is case-sensitive

### No data showing after login
- First visit loads from JSON seed files into localStorage
- If localStorage was corrupted, clear it (F12 -> Application -> Local Storage -> Clear) and refresh

### Port already in use
- Run `02_kill_all.bat` first, then `01_start_project.bat`
- Or manually: `taskkill /F /IM node.exe`

### Build fails
```powershell
cd frontend
npm install
npm run build
```
Check for errors in the output.
