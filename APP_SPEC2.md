Upgrade the Event Fill Engine MVP to make it feel like a real client-ready demo.

Implement all of the following:

1. Auto-load demo data
- Demo event: “Free Neuropathy Relief Seminar”
- Goal: 75 attendees
- Add 20–30 realistic demo leads
- Use mixed statuses: New, Contacted, Interested, Registered, Confirmed, Checked In, Not Interested
- Add demo attendees and check-ins

2. Dashboard metrics
Show:
- Total leads
- Registered attendees
- Confirmed attendees
- Checked-in attendees
- Attendance goal
- Seats remaining
- Progress bar toward goal

3. Lead calculator
Add a “Lead Calculator” card showing:
- Seats remaining
- Leads needed at 20% conversion
- Leads needed at 30% conversion
- Leads needed at 40% conversion

Formula:
leadsNeeded = Math.ceil(seatsRemaining / conversionRate)

4. Outreach Generator
Add a section where the user can select a lead and generate:
- Call script
- Voicemail script
- SMS message
- Email message

Use respectful, educational, compliant language.
Do not make medical claims.
Include this disclaimer:
“Educational event only. Not medical advice. Please consult your healthcare provider.”

5. Reminder Queue
Show registered/confirmed attendees who need:
- Confirmation call
- Day-before reminder
- Day-of reminder

Generate sample reminder copy.

6. Check-In Mode
Add a mobile-friendly check-in screen:
- Search by name or phone
- Display matching attendee
- Button: “Mark Checked In”
- Live counter: Checked In / Goal

7. System Architecture section
Add a polished section explaining that this MVP is the frontend layer of a production system.

Include:
- Vercel frontend
- Supabase database
- n8n or Make automation
- Retell AI calling
- Twilio SMS
- SendGrid/Postmark email
- CRM integration
- Consent-aware outreach logging

8. UX polish
- Make it look professional and client-ready
- Use clean cards, tabs/sections, status badges, progress bars, and responsive layout
- Make sure it works well on mobile
- Preserve localStorage persistence
- Add a reset demo data button
- Add clear empty states

9. README
Update README with:
- Product overview
- Demo purpose
- Vercel deployment instructions
- Future production integrations
- Compliance note about consent-aware outreach

After implementing, review against the requirements and fix any missing pieces.