Upgrade the Event Fill Engine MVP into a Campaign-Oriented System that helps operators plan, execute, and scale repeatable event campaigns across locations.

This is NOT just UI polish. Add real planning + business logic.

Implement the following:

========================================
1. NEW SECTION: Campaign Planner
========================================

Create a new tab: "Campaign Planner"

Inputs:
- Target Attendance (default 75)
- Expected Show-Up Rate (%) (default 60)
- Lead-to-Registration Conversion Rate (%) (default 25)

Derived calculations:

requiredRegistrations = Math.ceil(targetAttendance / showUpRate)
requiredLeads = Math.ceil(requiredRegistrations / conversionRate)

Display:
- Required Registrations
- Required Leads
- Gap vs Current Leads
- Gap vs Current Registered

Add visual:
- simple funnel display:
  Leads → Registered → Attended

========================================
2. CAMPAIGN STRATEGY RECOMMENDATION BLOCK
========================================

Below planner, add static + dynamic strategy output:

Sections:

Lead Sources:
- Purchased opt-in lists
- Local ads (55+ demographic)
- Referral incentives
- Community partnerships

Outreach Sequence Timeline:
Day 1: AI Call Attempt
Day 2: SMS Follow-Up
Day 3: Voicemail (if compliant)
Day 5: Reminder SMS
Day 6: Confirmation Call

Expected Funnel (based on user inputs):
Generate numbers dynamically:
Leads → Contacts → Interested → Registered → Attended

========================================
3. MULTI-EVENT SUPPORT (LIGHTWEIGHT)
========================================

Add ability to manage multiple events:

- Event selector dropdown
- “Create New Event” button
- Store events as array in localStorage
- Each event has its own:
  - leads
  - attendees
  - metrics

Switching events updates entire dashboard

========================================
4. GEO SEGMENTATION
========================================

Add to leads:
- city (already exists)

Add filter UI:
- filter leads by city
- show counts per city

Add insight:
"Top performing city by registrations"

========================================
5. PERFORMANCE INSIGHTS PANEL
========================================

Add a new panel:

Show:
- Lead → Registration %
- Registration → Show %
- Overall conversion %
- Best performing lead status bucket
- Suggested improvement tips:

Examples:
- “Low registration rate: increase follow-up touches”
- “High registration but low show-up: improve reminders”

========================================
6. “READY TO DEPLOY” BADGE
========================================

Add a visible badge:

"Prototype → Production Ready Architecture"

Tooltip/modal explains:
- n8n / Make automation
- Retell AI calling
- Twilio SMS
- Supabase DB
- CRM sync

========================================
7. EXPORT FEATURE
========================================

Add button:

“Export Campaign Plan”

Generate downloadable JSON or simple text summary including:
- event details
- planner calculations
- funnel targets
- outreach strategy

========================================
8. UX IMPROVEMENTS
========================================

- Tabs for:
  Dashboard | Leads | Campaign Planner | Registration | Check-In | Analytics
- Sticky top nav
- Cleaner card layout
- Status badges with color:
  New (gray)
  Contacted (blue)
  Interested (purple)
  Registered (orange)
  Confirmed (green)
  Checked In (dark green)
- Mobile responsive

========================================
9. DATA MODEL UPDATES
========================================

Event now includes:
{
  id,
  name,
  date,
  time,
  location,
  goal,
  topic,
  audienceNotes,
  leads: [],
  attendees: []
}

========================================
10. README UPGRADE
========================================

Add sections:

- “What this solves”
- “How this fills rooms”
- “Campaign planning logic”
- “Production architecture”
- “Scaling across cities”

========================================
IMPORTANT
========================================

- Keep everything vanilla HTML/CSS/JS
- Use localStorage only
- Do not add frameworks
- Ensure everything works immediately with demo data
- Maintain existing features
- Keep it fast and simple
- Make it look like a real product, not a prototype

After implementing, test:
- event switching
- planner math
- filters
- export
- responsiveness