import { useState, useRef } from "react";
import { BookOpen, ChevronRight } from "lucide-react";

const MANAGER_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    content: `Whitebridge Capital is a lending advisory firm. Clients (family offices, individuals, advisors) approach WBC because they need financing for commercial real estate, fund finance, aircraft, art, yacht, and other specialty asset classes.

Your role as a manager is to guide each deal from initial intake through closing. This platform helps you track every deal, match clients with the right lenders from our 294+ lender database, manage outreach and negotiations, and ultimately close deals efficiently.

The core workflow:
1. A client approaches WBC with a financing need
2. You sign an NDA (with non-circumvent) and gather deal details
3. You draft a two-page no-name memo summarizing the deal
4. You search the lender database for matches and reach out
5. Interested lenders sign receiving NDAs and receive deal info via data rooms
6. Lenders submit term sheets — you help the client compare and negotiate
7. Client accepts a term sheet, deal closes, WBC collects its fee (typically 1-2%)`,
  },
  {
    id: "creating-deals",
    title: "Creating a New Deal",
    content: `Navigate to the Deals page and click "New Deal" (or use the button in the Admin Panel).

Fill in the deal form:
• Client Name (required) — the person or entity seeking financing
• Company Name — the client's company
• Contact Name — primary point of contact
• Product — the type of financing (CRE, Fund Finance, Aircraft, etc.)
• Deal Size — the loan amount being sought
• Stage — starts at "1. Lead / Intake" by default
• Status — typically "Active" for new deals
• Location — where the deal/collateral is located
• Sector — industry sector
• Close Date — estimated closing date
• Relationship Manager — who at WBC is leading this deal
• Fee % — your advisory fee percentage (e.g. 1.5 for 1.5%)

Optional: Toggle "Create client portal access" to create a prospect user account for the client. This gives them login credentials to view their deal, documents, and updates through the client portal.`,
  },
  {
    id: "deal-stages",
    title: "The 9 Deal Stages",
    content: `Every deal progresses through these stages. Update the stage as you move through the process:

1. Lead / Intake — Client has approached WBC. Capture basic info.
2. Discovery & NDA — Sign NDA/non-circumvent. Gather detailed deal information.
3. Internal Conviction & Approval — WBC reviews viability. Decide whether to proceed.
4. Preliminary Analysis (Two Pager) — Draft a no-name memo summarizing the deal terms, collateral, and client needs.
5. Market Sounding & Client Engagement — Search the lender database for matches. Begin outreach to potential lenders.
6. Diligence & Financing Memo — Deep diligence phase. Create data rooms. Handle lender Q&A.
7. Term Sheets & Negotiation — Receive term sheets from lenders. Compare and negotiate on client's behalf.
8. Term Sheet Signed & Closing — Client accepts a term sheet. Closing process begins.
9. Closed — Deal is closed. Fee is collected.

You can update the stage from the Deals table (inline edit) or from the deal detail page.`,
  },
  {
    id: "lender-matching",
    title: "How Lender Matching Works",
    content: `The platform automatically matches deals to lenders based on the deal's product type.

Each lender has flags indicating which products they offer (CRE Office, Aircraft, Fund LP, etc.). When you view a deal, the "Matches" tab shows lenders ranked by a scoring algorithm:

• Primary Match (50 pts) — Does the lender offer this product? This is the baseline requirement.
• Geography (0-20 pts) — Global coverage = 20, International = 15, Domestic same region = 20.
• Product Breadth (0-10 pts) — How many additional products does the lender offer?
• Structure (0-10 pts) — Does the lender offer the needed debt structure (senior, subordinated, recourse)?

Only lenders scoring 50+ (primary match) appear. Use these matches as your starting point for outreach.

You can also view matches from a lender's profile page — it shows which current deals match that lender.`,
  },
  {
    id: "lender-outreach",
    title: "Lender Outreach Tracking",
    content: `The "Outreach" tab on each deal is your command center for managing lender communications.

Adding lenders:
• Click "Add Lender" to open the search panel
• Search by name or type from the 294+ lender database
• Click "Add" to include them in the outreach list

Managing status — use the dropdown on each row to update:
• Pending — Added to list, not yet contacted
• Contacted — You've sent initial outreach (auto-timestamps the contact date)
• Interested — Lender expressed interest (auto-timestamps response)
• Not Interested — Lender declined
• NDA Signed — Receiving NDA has been executed
• Term Sheet Received — Lender submitted a term sheet
• Selected — This lender was chosen for the deal

Notes: Click the notes cell on any row to add context about conversations, preferences, or follow-ups.

The deal header shows quick count badges: how many contacted, how many interested, how many term sheets received.

Important: When a lender reaches "Interested" or "NDA Signed" status, a data room folder is automatically created for them in the Documents tab.`,
  },
  {
    id: "term-sheets",
    title: "Managing Term Sheets",
    content: `The "Term Sheets" tab lets you track and compare received term sheets side by side.

Adding a term sheet:
• Click "Add Term Sheet"
• Select the lender (only lenders at "Interested" status or beyond appear)
• Fill in: loan amount, rate (e.g. "SOFR+250"), LTV, term in years, loan type (senior/subordinated/mezzanine), recourse type, key conditions, and notes

Comparing: Term sheets display as cards in a grid so you can visually compare key terms across lenders.

Accepting/Rejecting:
• Click "Accept" on the winning term sheet — this automatically rejects all other term sheets
• Click "Reject" to decline individual term sheets
• After accepting, update the deal stage to "8. Term Sheet Signed & Closing"`,
  },
  {
    id: "data-rooms",
    title: "Data Rooms & Documents",
    content: `The "Documents" tab on each deal has two sections:

Deal Documents — Default folders created for every deal:
• Closing Documents, Monthly Reporting, Due Diligence, Correspondence, Other
• You can create additional custom folders using the + button

Lender Data Rooms — Auto-created when a lender reaches "Interested" or "NDA Signed" status:
• Named "Data Room - [Lender Name]"
• Use these to organize documents specific to each lender's diligence process

Uploading files:
• Click the active folder tab to select where files go
• Drag and drop files onto the upload area, or click to browse
• Files are tagged with uploader name and timestamp

Deleting: Managers can delete individual files and empty folders.

Generated documents: The "Generate Documents" section creates PDFs (Spec Sheet, Investment One-Pager, Offer Memorandum, Power of Attorney) pre-filled with deal data and matched lenders.`,
  },
  {
    id: "fee-tracking",
    title: "Fee Tracking",
    content: `Each deal has a Fee % field (typically 1-2% for lending advisory).

Setting the fee:
• Set it when creating the deal, or edit it inline in the Deals table
• The "Est. Fee" column automatically calculates: Deal Size × Fee %

Example: A $50M deal at 1.5% fee = $750,000 estimated fee.

The deal detail page shows both the fee percentage and estimated fee amount in the header.

The Dashboard "Est. Revenue" stat card sums all estimated fees across your pipeline.`,
  },
  {
    id: "notes",
    title: "Notes",
    content: `The "Notes" tab on each deal (and lender profile) lets you add timestamped notes.

Each note shows:
• Who wrote it
• When it was written
• The full text

Use notes to track important conversations, decisions, client preferences, or follow-up reminders. All team members can see notes on deals they have access to.`,
  },
  {
    id: "activity-log",
    title: "Activity Log",
    content: `The Activity page (sidebar) shows a global audit trail of all field-level changes across deals and lenders.

Each entry shows:
• Who made the change
• What entity was changed
• Which field was modified
• The old value and new value
• When it happened

The "Activity" tab on each deal page shows changes specific to that deal only.

The "Doc Activity" tab shows document-level tracking — who viewed, downloaded, or uploaded documents and when.`,
  },
  {
    id: "csv-upload",
    title: "Uploading Data (CSV)",
    content: `The Upload page lets you bulk-import lenders or deals via CSV.

Steps:
1. Toggle between "Lenders" and "Pipeline" mode
2. Click "Download Template" to get a pre-formatted CSV
3. Fill in the template (vertical format — fields go down, records go across)
4. Drag and drop or click to upload
5. Preview the data before confirming
6. Records are merged — new records are added, existing IDs are updated`,
  },
  {
    id: "variables",
    title: "Variables / Settings",
    content: `The Variables page lets you customize all dropdown options used across the app.

Categories you can manage:
• Pipeline Status — Active, On Hold, Closed - Won, Closed - Lost, Closed - Mandate
• Deal Stage — The 9 WBC workflow stages
• Product Types — CRE, Fund Finance, Asset-Based, Specialty, etc.
• Sectors — Real Estate, Finance, Technology, Healthcare, Energy
• Lender Types — Bank, Non-Bank, Private Credit, Family Office
• Client Types — Individual, Company, Fund, Trust
• Lead Sources — Referral, Direct, Website, Conference

You can add new options, rename existing ones, delete unused ones, and reorder them. Changes are reflected immediately in all table filters and creation forms.`,
  },
  {
    id: "client-access",
    title: "Client Portal Access",
    content: `You can give clients (prospects) limited access to view their deals.

Granting access:
1. Go to a deal's detail page
2. Click the "Access" tab
3. Select a prospect user from the dropdown and click "Grant Access"

The client will only see deals they've been explicitly granted access to. They can view deal info and download documents, but cannot edit anything.

Creating prospect users:
• From the "New Deal" form — toggle "Create client portal access" and provide email/password
• From the Admin Panel — create a user with the "prospect" role

Previewing: Click "View as Client" on any deal to see exactly what the prospect user sees.`,
  },
  {
    id: "lenders-management",
    title: "Managing Lenders",
    content: `The Lenders page shows your full database of 294+ financing sources.

Viewing: Search by name, type, contact, or location. Use column filters and the column manager to customize your view.

Adding a lender:
• Click "New Lender" at the top
• Fill in: name, type, contact info, location, geographic coverage
• Check debt structure flags (senior, subordinated, recourse, non-recourse)
• Check product offerings (19 categories from CRE to Fund Finance)
• Add notes about loan area, value range, book size, etc.

Editing: Click any cell in the table to edit it inline. Changes are logged in the activity trail.

Lender profile: Click a row to see full details, product offerings, notes, and which current deals match that lender.`,
  },
];

const ADMIN_SECTIONS = [
  {
    id: "admin-users",
    title: "Admin: User Management",
    content: `The Admin Panel (sidebar, admin only) has a "Users" tab for managing all system users.

Creating users:
• Click "Create User" and fill in name, email, password, and role
• Roles: Admin (full access), Manager (deals + lenders), Prospect (client portal only)

Editing: Click the pencil icon on any user row to update their details or change their role.

Deactivating: Click the trash icon to deactivate a user. They will no longer be able to log in.

Quick deal creation: Use the "New Deal" button in the Users tab to create a deal with an optional portal user in one step.`,
  },
  {
    id: "admin-monitoring",
    title: "Admin: Prospect Monitoring",
    content: `The "Prospect Monitoring" tab in the Admin Panel shows engagement analytics for all prospect (client) users.

For each prospect you can see:
• Number of deals they have access to
• Page views — how often they've logged in and browsed
• Document views — which documents they've looked at
• Document uploads — files they've uploaded
• Notes created
• Engagement status — Active (logged in within 7 days), Inactive, or Never logged in

Click any row to expand and see their recent activity timeline with specific events and timestamps.`,
  },
  {
    id: "admin-feedback",
    title: "Admin: Reviewing Feedback",
    content: `The "Feedback" tab in the Admin Panel shows all feedback submitted by any user.

Each entry shows:
• User name and email
• Their role
• Which page they were on when they submitted
• The feedback message (click to expand full text)
• Date and time

Use this to understand user pain points, feature requests, and bugs reported from the field.`,
  },
  {
    id: "admin-analytics",
    title: "Admin: Analytics",
    content: `The "Analytics" tab in the Admin Panel provides an overview of platform usage.

It shows user activity statistics, event breakdowns by type, and helps you understand how actively the team and clients are using the platform.`,
  },
];

const PROSPECT_SECTIONS = [
  {
    id: "prospect-overview",
    title: "Welcome to the Client Portal",
    content: `Welcome to the Whitebridge Capital client portal. This is your secure space to stay updated on your financing deals.

Through this portal you can:
• View the deals you've been invited to
• Access and download documents shared by your WBC team
• Stay informed on deal progress
• Submit feedback to the WBC team`,
  },
  {
    id: "prospect-deals",
    title: "Viewing Your Deals",
    content: `The "My Deals" page shows all deals you've been granted access to by your WBC relationship manager.

Click on any deal to see:
• Deal summary — product type, deal size, status, and key dates
• Documents — files organized in folders that your WBC team has shared with you
• You can download any document by clicking the download button

Note: You can only see deals that your WBC team has specifically shared with you. If you expect to see a deal that isn't showing, contact your relationship manager.`,
  },
  {
    id: "prospect-documents",
    title: "Documents",
    content: `Inside each deal, you'll find documents organized in folders.

Folders may include:
• Closing Documents — final deal paperwork
• Due Diligence — supporting materials
• Monthly Reporting — ongoing reports
• Data Room folders — documents related to specific lender conversations

To download a file, click the download icon next to it. Your document views are tracked so your WBC team knows you've received the materials.`,
  },
  {
    id: "prospect-feedback",
    title: "Submitting Feedback",
    content: `You can submit feedback at any time using the gold "Feedback" button.

• Click the button to open the feedback panel
• Type your message or use the microphone button for voice input
• Click "Submit Feedback" to send it to the WBC team
• You can view your past submissions in the panel

Your feedback goes directly to the WBC admin team and helps improve your experience. You can drag the feedback button to move it if it's in the way, or hide it using the eye icon.`,
  },
];

function Section({ section, isActive, onClick }) {
  return (
    <div id={section.id} className="scroll-mt-4">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left py-3 cursor-pointer group"
      >
        <h3 className="text-white font-semibold text-sm group-hover:text-teal-400 transition-colors">{section.title}</h3>
        <ChevronRight size={16} className={`text-navy-500 transition-transform ${isActive ? "rotate-90" : ""}`} />
      </button>
      {isActive && (
        <div className="pb-5 pl-1">
          <p className="text-navy-300 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  const role = localStorage.getItem("wbc_user_role") || "manager";
  const [activeSection, setActiveSection] = useState(null);
  const contentRef = useRef(null);

  let sections;
  if (role === "prospect") {
    sections = PROSPECT_SECTIONS;
  } else if (role === "admin") {
    sections = [...MANAGER_SECTIONS, ...ADMIN_SECTIONS];
  } else {
    sections = MANAGER_SECTIONS;
  }

  const toggle = (id) => {
    setActiveSection((prev) => (prev === id ? null : id));
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  const roleLabel = role === "admin" ? "Administrator" : role === "prospect" ? "Client" : "Manager";

  return (
    <div className="flex gap-6">
      <div className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-0">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-teal-400" />
            <h2 className="text-white font-semibold text-sm">Contents</h2>
          </div>
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? "bg-navy-800 text-teal-400"
                    : "text-navy-400 hover:text-white hover:bg-navy-800/50"
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 min-w-0" ref={contentRef}>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={24} className="text-teal-400" />
          <h1 className="text-2xl font-bold text-white">Documentation</h1>
        </div>
        <p className="text-navy-400 text-sm mb-6">
          Guide for <span className="text-teal-400 font-medium">{roleLabel}</span> role. Click any section to expand.
        </p>

        <div className="bg-navy-900 border border-navy-800 rounded-xl divide-y divide-navy-800/50 px-5">
          {sections.map((s) => (
            <Section
              key={s.id}
              section={s}
              isActive={activeSection === s.id}
              onClick={() => toggle(s.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
