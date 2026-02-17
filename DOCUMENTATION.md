# WBC Lending Advisory Platform -- Documentation

## Table of Contents

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Project Structure](#project-structure)
4. [Running Locally](#running-locally)
5. [Deployment](#deployment)
6. [Authentication & Roles](#authentication--roles)
7. [Data Model](#data-model)
8. [Deal Workflow & Stages](#deal-workflow--stages)
9. [Pages & Features](#pages--features)
10. [Matching Engine](#matching-engine)
11. [Lender Outreach Tracking](#lender-outreach-tracking)
12. [Term Sheet Management](#term-sheet-management)
13. [Data Rooms & Document Management](#data-rooms--document-management)
14. [Fee Tracking](#fee-tracking)
15. [Variables / Settings](#variables--settings)
16. [Activity Tracking & Analytics](#activity-tracking--analytics)
17. [Upload System](#upload-system)
18. [Document Generation](#document-generation)
19. [Email Drafts](#email-drafts)
20. [Supabase Setup](#supabase-setup)
21. [Troubleshooting](#troubleshooting)

---

## Overview

A full-stack lending advisory management platform for Whitebridge Capital (WBC). The app manages the entire deal lifecycle: from client intake, through lender matching and outreach, to term sheet negotiation and closing.

**Key capabilities:**

- **294+ lender database** with product/geography/structure flags
- **Deal pipeline** tracking with 9-stage WBC workflow
- **Automated lender matching** based on product type, geography, and structure
- **Per-deal lender outreach** tracking (contact, response, NDA, term sheets)
- **Term sheet comparison** with side-by-side cards and accept/reject
- **Per-lender data rooms** with auto-created folders for interested lenders
- **Fee tracking** (percentage-based, computed estimated fee per deal)
- **Client portal** for prospect users with limited deal access
- **Admin dashboard** with user management, activity monitoring, and analytics
- **Configurable variables** for dropdown options (stages, statuses, products, sectors)

**Tech stack:** React, Vite, Tailwind CSS, Supabase (production) / localStorage (development)

**Live site:** Deployed via GitHub Pages with GitHub Actions CI/CD

---

## Business Context

Whitebridge Capital is a lending advisory firm. Clients (family offices, individuals, advisors) approach WBC because they need financing for commercial real estate, fund finance, aircraft, art, yacht, and other specialty asset classes.

**WBC's role:** Arrange and coordinate financing between clients and a network of 294+ lenders. WBC earns a fee (typically 1-2%) of the loan proceeds upon closing.

**Workflow:**
1. Client approaches WBC with a financing need
2. WBC signs an NDA (with non-circumvent) and gathers deal details
3. WBC drafts a two-page no-name memo summarizing the deal
4. WBC searches its lender database for matches and reaches out
5. Interested lenders sign receiving NDAs and receive deal information via data rooms
6. Lenders submit term sheets; WBC helps client compare and negotiate
7. Client accepts a term sheet; deal closes; WBC collects its fee

---

## Project Structure

```
wbc/
  .github/workflows/deploy.yml   <- GitHub Pages CI/CD
  CREDENTIALS.md                  <- logins, keys, URLs
  DOCUMENTATION.md                <- this file
  data/
    lenders_cleaned.csv           <- source data: 294+ lenders
    pipeline_cleaned.csv          <- source data: pipeline deals
    fields_reference.csv          <- lookup values
  frontend/
    .env                          <- Supabase keys (not in git)
    vite.config.js                <- Vite build config
    supabase_migration.sql        <- full SQL schema (12 tables)
    src/
      main.jsx                    <- app entry point
      App.jsx                     <- route definitions
      index.css                   <- Tailwind + custom navy/gold theme
      data/
        users.json                <- seed user logins
        lenders.json              <- lender seed data
        pipeline.json             <- pipeline seed data
        seed.js                   <- CSV column mappings
      lib/
        supabase.js               <- Supabase client init
        dataService.js            <- all CRUD operations (dual-mode)
        matchingEngine.js         <- lender-deal scoring algorithm
        documentStorage.js        <- file upload/download (Supabase Storage / IndexedDB)
        tracker.js                <- event tracking system
      pages/
        Login.jsx                 <- login screen
        Dashboard.jsx             <- stats overview + stage chart
        LendersTable.jsx          <- lender list + new lender form
        LenderProfile.jsx         <- single lender detail + matched deals
        PipelineTable.jsx         <- deal list + new deal button
        ProspectProfile.jsx       <- deal detail (outreach, term sheets, docs, notes)
        ProspectDealView.jsx      <- client portal deal view
        Upload.jsx                <- CSV template download + upload
        ActivityLog.jsx           <- global change log
        AdminPanel.jsx            <- user management + prospect monitoring
        VariablesPage.jsx         <- dropdown option management
        MyDeals.jsx               <- prospect user's deal list
      components/
        Layout.jsx                <- sidebar nav + role-based menus
        ProtectedRoute.jsx        <- auth guard with role enforcement
        CreateDealForm.jsx        <- new deal + optional portal user creation
        DataTable.jsx             <- reusable table (search, sort, filter, columns, inline edit)
        DocumentUpload.jsx        <- file upload with deal + data room folders
        NotesPanel.jsx            <- per-entity notes with author tracking
        FilterPanel.jsx           <- column filter UI
        ColumnManager.jsx         <- show/hide columns UI
        MatchCard.jsx             <- lender/deal match result cards
        ScoreBadge.jsx            <- match score display
        StatCard.jsx              <- dashboard stat card
        DocumentGenerator.jsx     <- PDF generation (4 doc types)
        EmailPreview.jsx          <- email draft with copy-to-clipboard
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### Quick Start

```powershell
cd c:\Users\leogo\OneDrive\Desktop\cursor_projects\wbc\frontend
npm install
npm run dev
```

Open http://localhost:5173/ and log in (see CREDENTIALS.md).

No Supabase needed for local development -- the app automatically falls back to localStorage/IndexedDB.

---

## Deployment

The app is deployed to **GitHub Pages** via GitHub Actions.

**Repository:** https://github.com/DevMakaya/wbc

**Workflow:** `.github/workflows/deploy.yml` runs on every push to `main`:
1. Installs dependencies
2. Injects Supabase environment variables from GitHub Secrets
3. Builds with Vite
4. Deploys `dist/` to the `gh-pages` branch

**GitHub Secrets required:**
- `VITE_SUPABASE_URL` -- Supabase project URL
- `VITE_SUPABASE_ANON_KEY` -- Supabase anonymous key

Every push to `main` auto-deploys within ~2 minutes.

---

## Authentication & Roles

### Three roles:

| Role       | Access                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| **Admin**  | Everything: dashboard, lenders, deals, activity, upload, variables, admin panel |
| **Manager**| Dashboard, lenders, deals, activity, upload, variables                         |
| **Prospect** (Client) | My Deals only -- sees deals they've been granted access to         |

### How it works:

- Users are stored in the `app_users` table (Supabase) or seeded from `users.json` (local)
- Login validates email + password, stores role/name/id in localStorage
- `ProtectedRoute.jsx` enforces role-based access on every route
- Admins can create/edit/deactivate users from the Admin Panel
- Prospect users are created either from the Admin Panel or via the "Create Deal" form (optional portal user toggle)

### Deal access control:

Prospect users only see deals they've been explicitly granted access to via the `deal_access` table. Admins/managers grant access from the "Access" tab on any deal detail page.

---

## Data Model

### 12 Tables

| Table                  | Purpose                                      | Key Fields                                             |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------ |
| `lenders`              | 294+ financing sources                       | lender_name, lender_type, 19 product flags, debt structure flags, location |
| `pipeline`             | Deals / client engagements                   | client_name, deal_size, deal_stage, fee_percentage, pipeline_status |
| `app_users`            | System users (admin, manager, prospect)      | email, password, name, role, status, last_login        |
| `deal_access`          | Which prospect users can see which deals     | user_id, deal_id, granted_by                           |
| `deal_lender_outreach` | Per-deal lender contact tracking              | deal_id, lender_id, status, contacted_at, response_at  |
| `deal_term_sheets`     | Received term sheets per deal                | deal_id, lender_id, loan_amount, rate, ltv, term_years, status |
| `notes`                | Per-entity notes (deals, lenders)            | entity_type, entity_id, user_name, text                |
| `changelog`            | Field-level edit history                     | entity_type, entity_id, field, old_value, new_value    |
| `documents`            | Uploaded file metadata                       | deal_id, folder, filename, file_size, uploaded_by      |
| `deal_folders`         | Custom folders per deal (including data rooms)| deal_id, name, sort_order                              |
| `events`               | User activity tracking                       | user_name, event_type, page, entity_id, metadata (JSONB) |
| `app_variables`        | Configurable dropdown options                | category, value, sort_order                            |

### Lender product flags (19 binary columns):

CRE: construction, residential, land, office, industrial, hotel, retail, other
Specialty: real_estate, aircraft, art, insurance_premium, yacht, sports
Fund: fund_lp, fund_nav, fund_gp, fund_mgmt_company, fund_scf

### Lender debt structure flags (4 binary columns):

senior, subordinated, recourse, non_recourse

---

## Deal Workflow & Stages

Deals follow the real WBC lending advisory workflow through 9 stages:

| # | Stage                                  | Description                                                  |
| - | -------------------------------------- | ------------------------------------------------------------ |
| 1 | Lead / Intake                          | Client approaches WBC with a financing need                  |
| 2 | Discovery & NDA                        | Sign NDA/non-circumvent, gather deal details                 |
| 3 | Internal Conviction & Approval         | WBC reviews viability and decides to proceed                 |
| 4 | Preliminary Analysis (Two Pager)       | Draft no-name memo summarizing the deal                      |
| 5 | Market Sounding & Client Engagement    | Search lender database, initial outreach                     |
| 6 | Diligence & Financing Memo             | Deep diligence, data rooms, lender Q&A                       |
| 7 | Term Sheets & Negotiation              | Receive and compare term sheets                              |
| 8 | Term Sheet Signed & Closing            | Client accepts term sheet, closing process                   |
| 9 | Closed                                 | Deal closed, fee collected                                   |

### Pipeline statuses:

Active, On Hold, Closed - Won, Closed - Lost, Closed - Mandate

---

## Pages & Features

### Dashboard (`/`)

- 4 stat cards: Total Lenders, Active Deals, Total Matches, Est. Revenue (fee-based)
- Deals by Stage horizontal bar chart (color-coded by the 9 stages)
- Status breakdown grid
- Top products list

### Lenders Table (`/lenders`)

- Searchable, sortable, filterable table of 294+ lenders
- Column management (show/hide columns)
- Inline editing for all fields
- **"New Lender" button** opens a creation form with:
  - Basic info (name, type, contact, email, phone, website, LinkedIn)
  - Location (based in, coverage, state/region)
  - Debt structure checkboxes (senior, subordinated, recourse, non-recourse)
  - Product offerings checkboxes (19 product categories)
  - Notes

### Lender Profile (`/lenders/:id`)

- Full lender details, product offerings, notes
- Matched deals list with scores

### Deals Table (`/deals`)

- Searchable, sortable, filterable pipeline table
- Columns include: client, company, product, status, stage, deal size, **Fee %**, **Est. Fee**, RM, location
- Inline editing for all fields
- **"New Deal" button** navigates to the deal creation form

### Deal Creation Form (`/deals/new`)

- Client info: name, company, contact
- Deal info: product, status, stage, size, location, sector, close date, RM, **fee percentage**
- Optional toggle: **create client portal user** (email + password) and auto-grant deal access

### Deal Detail (`/deals/:id`)

Nine tabs:

| Tab             | Purpose                                                          |
| --------------- | ---------------------------------------------------------------- |
| **Outreach**    | Track lender contacts for this deal (add, status, notes)         |
| **Term Sheets** | Compare received term sheets, accept/reject                      |
| **Matches**     | Auto-matched lenders from the matching engine                    |
| **Documents**   | Upload/download files organized in deal + data room folders      |
| **Doc Activity**| See who viewed/downloaded each document                          |
| **Notes**       | Per-deal notes with author and timestamp                         |
| **Email Draft** | Pre-written outreach email with matched lenders                  |
| **Access**      | Grant/revoke prospect user access to this deal                   |
| **Activity**    | Field-level change history (who changed what, when)              |

Header shows: client name, company, product, deal size, **fee %**, **estimated fee**, close date, location, contact, sector, stage, RM, source, outreach counts (contacted, interested, term sheets).

**"View as Client" button** previews what a prospect user would see.

### Admin Panel (`/admin`) -- Admin only

- **Users tab**: table of all users, create/edit/deactivate, role assignment
  - "New Deal" button for quick deal + portal user creation
- **Monitoring tab**: prospect engagement analytics
  - Per-prospect: deals accessed, page views, doc views, doc uploads, notes, engagement status
  - Expandable rows with recent activity timeline

### Variables / Settings (`/variables`) -- Admin + Manager

- Manage dropdown options used across the app
- Categories: pipeline_status, deal_stage, wbc_sub_product, sector, lender_type, client_type, lead_source, wbc_product
- Add, rename, delete, reorder options

### Activity Log (`/activity`)

- Global audit trail of all field-level changes across lenders and deals
- Shows: who, what entity, which field, old value, new value, when

### Upload (`/upload`)

- Download CSV templates (vertical format for easier editing)
- Upload lender or pipeline CSVs (auto-detects vertical/horizontal format)
- Preview before importing
- Upserts (merges) into existing data

### Client Portal (`/my-deals`) -- Prospect users only

- List of deals the prospect user has been granted access to
- Per-deal view with documents (view/download) and basic deal info

---

## Matching Engine

Located in `frontend/src/lib/matchingEngine.js`.

Maps a deal's `wbc_sub_product` to the corresponding lender product flag and scores matches:

| Factor          | Points | Logic                                              |
| --------------- | ------ | -------------------------------------------------- |
| Primary Match   | 50     | Does the lender offer the product? Yes = 50, No = skip |
| Geography       | 0-20   | Global = 20, International = 15, Domestic same region = 20 |
| Product Breadth | 0-10   | Number of additional products the lender offers     |
| Structure       | 0-10   | Senior/subordinated/recourse/non-recourse flags     |

Only lenders scoring 50+ appear. Bidirectional: deal pages show matching lenders, lender pages show matching deals.

---

## Lender Outreach Tracking

Per-deal tracking of which lenders have been contacted and their responses.

### Outreach statuses:

| Status               | Color   | Meaning                                    |
| -------------------- | ------- | ------------------------------------------ |
| Pending              | Gray    | Added to list, not yet contacted           |
| Contacted            | Blue    | Initial outreach sent                      |
| Interested           | Green   | Lender expressed interest                  |
| Not Interested       | Red     | Lender declined                            |
| NDA Signed           | Violet  | Receiving NDA executed                     |
| Term Sheet Received  | Gold    | Lender submitted a term sheet              |
| Selected             | Green   | This lender was selected for the deal      |

### Features:

- Search and add lenders from the 294+ database
- Click status dropdown to update (auto-timestamps contact/response dates)
- Inline editable notes per lender
- Quick count badges in deal header (contacted, interested, term sheets)
- When a lender reaches "interested" or "NDA signed", a data room folder is auto-created

---

## Term Sheet Management

Side-by-side comparison of received term sheets per deal.

### Term sheet fields:

- Lender name, loan amount, rate, LTV, term (years), loan type (senior/subordinated/mezzanine), recourse (full/limited/non), conditions, notes

### Statuses:

- **Received** -- just arrived
- **Under Review** -- being evaluated
- **Accepted** -- client accepted this term sheet (auto-rejects others)
- **Rejected** -- declined

### Features:

- Card-based layout for visual comparison
- Only lenders at "interested" status or beyond can have term sheets added
- "Accept" button on a term sheet auto-rejects all other term sheets for that deal

---

## Data Rooms & Document Management

### Folder structure:

Each deal automatically gets default folders:
- Closing Documents, Monthly Reporting, Due Diligence, Correspondence, Other

### Per-lender data rooms:

When a lender reaches "interested" or "NDA signed" status in outreach, a "Data Room - [Lender Name]" folder is automatically created. This provides a dedicated space for documents shared with that specific lender.

### Features:

- Drag-and-drop or click-to-upload
- Custom folder creation/deletion (admin/manager only)
- Visual grouping: "Deal" folders vs "Data Rooms" sections
- File download with activity tracking (who viewed/downloaded what)
- Storage: Supabase Storage (production) or IndexedDB (local)

---

## Fee Tracking

Each deal can have a **fee percentage** (typically 1-2% for lending advisory).

- **Fee %** column in the deals table (editable inline)
- **Est. Fee** computed column: `deal_size × fee_percentage / 100`
- Fee display in deal detail header
- Dashboard "Est. Revenue" stat card computes total from fee data

---

## Variables / Settings

Admins and managers can customize all dropdown options used in the app.

### Categories:

| Category         | Used In              | Default Values                              |
| ---------------- | -------------------- | ------------------------------------------- |
| pipeline_status  | Deals table          | Active, On Hold, Closed - Won/Lost/Mandate  |
| deal_stage       | Deals table          | 9 WBC workflow stages                       |
| wbc_sub_product  | Deals table          | CRE, Fund Finance, Asset-Based, Specialty   |
| sector           | Deals table          | Real Estate, Finance, Technology, Healthcare, Energy |
| lender_type      | Lenders table        | Bank, Non-Bank, Private Credit, Family Office |
| client_type      | Deals table          | Individual, Company, Fund, Trust             |
| lead_source      | Deals table          | Referral, Direct, Website, Conference        |
| wbc_product      | Deals table          | Lending, Advisory                            |

Changes are reflected immediately in all table filter dropdowns and creation forms.

---

## Activity Tracking & Analytics

### Event types tracked:

| Event            | When                              | Metadata                    |
| ---------------- | --------------------------------- | --------------------------- |
| login            | User logs in                      | --                          |
| page_view        | User navigates to a page          | page path                   |
| document_view    | User downloads/views a document   | doc_id, doc_name            |
| document_upload  | User uploads a document           | doc_id, doc_name            |
| note_added       | User creates a note               | entity_type, entity_id      |

### Admin monitoring:

The Admin Panel "Monitoring" tab shows per-prospect-user:
- Number of deals accessed
- Page views, document views, document uploads, notes created
- Engagement status (Active / Inactive / Never logged in)
- Expandable recent activity timeline

### Deal-level doc activity:

The "Doc Activity" tab on each deal shows a timeline of document views and uploads with user name, document name, and timestamp.

---

## Upload System

### Template format (vertical):

```
Field,          Record 1, Record 2
Lender Name,    ABC Bank, XYZ Fund
Website,        abc.com,  xyz.com
Contact Name,   John,     Jane
```

### Ingestion:

- Accepts both vertical (template) and horizontal (traditional CSV) formats
- Auto-detects format
- 1-100 records per upload
- Upserts: new records appended, matching IDs updated

---

## Document Generation

From any deal's Documents tab, generate 4 PDF types:

| Document              | Contents                                                |
| --------------------- | ------------------------------------------------------- |
| Spec Sheet            | One-pager with deal details + top 5 matched lenders     |
| Investment One-Pager  | Deal summary with financials and matched lender count   |
| Offer Memorandum      | Full memo with background, terms, all matched lenders   |
| Power of Attorney     | Pre-filled limited POA template for client signing      |

Generated client-side using jsPDF with WBC navy/gold branding.

---

## Email Drafts

Pre-written outreach email on each deal's "Email Draft" tab including:

- Deal summary (product, size, sector, target close)
- Top 5 matched lenders with scores
- Prior successful deals in the same product category
- Currently active deals in the same category
- Copy-to-clipboard button

Preview only -- does not send. Copy and paste into your email client.

---

## Supabase Setup

### Tables

Run `frontend/supabase_migration.sql` in the Supabase SQL Editor. This creates all 12 tables with RLS policies.

### Storage

Create a storage bucket named `deal-documents` with public access for document uploads.

### Environment variables

Create `frontend/.env`:

```
VITE_SUPABASE_URL=https://pstzkcamnmnzksjbiizb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

For GitHub Pages deployment, add these as repository secrets in GitHub Settings.

### Sequence reset (after CSV import)

If you import seed data via CSV (with explicit IDs), reset auto-increment sequences:

```sql
SELECT setval('lenders_id_seq', (SELECT MAX(id) FROM lenders));
SELECT setval('pipeline_id_seq', (SELECT MAX(id) FROM pipeline));
SELECT setval('app_users_id_seq', (SELECT MAX(id) FROM app_users));
```

---

## Troubleshooting

### App shows blank page
- Open browser console (F12) for errors
- Run `npm install` in the `frontend` folder
- Clear localStorage: F12 -> Application -> Local Storage -> Clear

### Login doesn't work
- Check `frontend/src/data/users.json` for correct email/password (case-sensitive)
- In production, users are in the `app_users` table

### Data not persisting
- Local: data is in localStorage (cleared on browser data clear)
- Production: verify Supabase env vars are set and RLS policies exist

### Supabase 409 Conflict on user/record creation
- Auto-increment sequence is behind. Run the sequence reset SQL above.

### GitHub Pages 404 on refresh
- The GitHub Actions workflow includes a 404.html redirect for SPA routing

### Logo not loading
- Logo is loaded from `https://whitebridge.capital/images/WBC-logo-white.svg`
- If that URL is down, replace in `Layout.jsx` and `Login.jsx`

### Build fails
```powershell
cd frontend
npm install
npm run build
```
Check the output for errors. Common issue: missing dependency -- run `npm install` again.

### New tables not working in production
- Run the latest `supabase_migration.sql` in the Supabase SQL Editor
- For existing databases, run only the new `CREATE TABLE` statements for `deal_lender_outreach` and `deal_term_sheets`
- Also run: `ALTER TABLE pipeline ADD COLUMN IF NOT EXISTS fee_percentage REAL;`
