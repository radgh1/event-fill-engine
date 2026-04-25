Upgrade the current Event Fill Engine demo so it feels outcome-driven and client-ready.

Goal:
When someone opens the app, they should immediately understand:
“This system helps me fill a live event room with predictable attendance.”

Keep:
- Vanilla HTML/CSS/JS only
- No framework
- No build step
- localStorage persistence
- Existing multi-event structure
- Existing campaign planner, dashboard, leads, registration, check-in, analytics, export, and architecture sections

Implement all of the following:

========================================
1. TOP OUTCOME STATEMENT
========================================

Add a prominent outcome banner directly under the app title.

It should dynamically display:

“This campaign is projected to generate [projectedLow]-[projectedHigh] attendees using approximately [requiredLeads] leads across a 6-day outreach sequence.”

Calculation:
- requiredRegistrations = Math.ceil(targetAttendance / showUpRate)
- requiredLeads = Math.ceil(requiredRegistrations / conversionRate)
- projectedLow = Math.floor(requiredRegistrations * 0.75)
- projectedHigh = Math.ceil(requiredRegistrations * 1.0)

Use current campaign planner inputs if available.

Make this visually prominent.

========================================
2. CURRENT CAMPAIGN STATUS CARD
========================================

Add a card near the top of the dashboard called:

“Current Campaign Status”

It should show one of:
- On Track
- Needs More Leads
- Registration Behind
- Check-In Risk

Suggested logic:
- If currentLeads < requiredLeads: Needs More Leads
- Else if expectedAttendance < requiredRegistrations: Registration Behind
- Else if checkedInHeadcount / expectedAttendance < 0.30: Check-In Risk
- Else: On Track

Display supporting bullets:
- Lead volume status
- Registration status
- Show-up/check-in status

Example:
✔ Lead volume sufficient
⚠ Registration slightly behind target
✔ Show-up rate within expected range

========================================
3. NEXT ACTIONS CARD
========================================

Add a dashboard card called:

“What To Do Next”

Generate dynamic recommendations based on current campaign state.

Examples:
- “Add approximately [gap] more leads to reach target.”
- “Increase follow-up touches for Interested leads.”
- “Send day-before reminders to confirmed attendees.”
- “Call registered attendees who are not yet confirmed.”
- “Focus outreach on the top-performing city.”

Show 3–5 action items.

========================================
4. IMPROVE DEMO DATA
========================================

Adjust the default demo data so the campaign looks realistically achievable and mid-flight, not empty or failing.

Ensure demo data includes:
- At least 220 leads
- At least 45 registered attendee records
- At least 30 confirmed attendees
- At least 18 checked-in headcount
- Attendance goal remains 75
- Expected attendance projection should be between 45 and 65

Important:
Do not manually write hundreds of hardcoded rows if avoidable.
Generate realistic demo leads programmatically with names, cities, conditions, statuses, and attendee records.

Cities should include:
- Austin
- Round Rock
- Cedar Park
- Pflugerville
- Georgetown
- Leander
- Buda
- Kyle

Statuses should include:
- New
- Contacted
- Interested
- Registered
- Confirmed
- Checked In
- Not Interested

========================================
5. CAMPAIGN PLAN SHOULD FEEL BUSINESS-FOCUSED
========================================

In Campaign Planner, add a visible “Funnel Target” summary:

Example:
“To fill 75 seats at a 60% show-up rate, this campaign needs about 125 registrations and 500 leads at a 25% lead-to-registration rate.”

Also show:
- Leads needed
- Current leads
- Lead gap
- Registrations needed
- Current expected attendance
- Attendance gap

========================================
6. RENAME NAVIGATION TABS
========================================

Rename tabs to sound more productized:

- Dashboard -> Overview
- Campaign Planner -> Campaign Plan
- Registration -> Attendees
- Analytics -> Performance

Keep existing functionality.

Final tabs:
Overview | Leads | Campaign Plan | Attendees | Check-In | Performance

========================================
7. TOP-PERFORMING CITY INSIGHT
========================================

Add insight:
“Top Performing City”

Calculate city with highest number of registered/confirmed/checked-in attendees.

Show:
- city name
- number of expected attendees
- suggested action:
  “Prioritize follow-up and referrals in this city.”

========================================
8. MAKE EXPORT MORE USEFUL
========================================

Update “Export Campaign Plan” so it exports a readable text summary, not just raw JSON.

Include:
- Event name/date/location
- Attendance goal
- Current leads
- Expected attendance
- Required leads
- Required registrations
- Campaign status
- Next actions
- Outreach sequence
- Production stack summary

Filename:
event-fill-campaign-plan.txt

========================================
9. UX POLISH
========================================

Make the top of the app feel like a real SaaS/product demo:
- Stronger headline
- Short subheadline
- Outcome banner
- Status badge
- Cleaner spacing
- Professional cards
- Mobile responsive

Make sure the app still works well on mobile.

========================================
10. DATA CORRECTNESS
========================================

Ensure all calculations are consistent:

expectedAttendance = sum(attendees.map(a => 1 + guestCount))

checkedInHeadcount = sum(checked-in attendees as 1 + guestCount)

seatsRemaining = max(0, goal - expectedAttendance)

progressPercent = Math.round((expectedAttendance / goal) * 100)

leadToRegistrationRate = expectedAttendance / totalLeads

registrationToCheckInRate = checkedInHeadcount / expectedAttendance

Avoid divide-by-zero errors.

========================================
11. ACCEPTANCE TEST
========================================

After implementation, review manually:

- First load auto-seeds demo data
- Overview does not show empty or failing data
- Outcome banner appears immediately
- Current Campaign Status appears
- What To Do Next appears
- Campaign Plan math updates when inputs change
- Multi-event switching still works
- Lead city filter still works
- Export downloads readable campaign plan
- localStorage persistence still works
- Reset Demo Data works
- Clear All Data works
- Mobile layout remains usable

Fix any issues found.