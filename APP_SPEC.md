# APP_SPEC.md — Event Fill Engine MVP

## Goal
Build a simple web app that helps local health-event operators fill live rooms through compliant outreach, registration, reminder, and check-in workflows.

## Product Name
Event Fill Engine

## Core Use Case
A clinic, wellness group, or seminar operator creates an event, imports leads, tracks outreach status, registers attendees, sends reminders, and checks people in at the door.

## MVP Constraints
- Vanilla HTML, CSS, JavaScript only
- No backend required for v1
- Store data in localStorage
- Free hosting compatible with Netlify, Vercel, or GitHub Pages
- Mobile-friendly
- No paid APIs required in v1
- No illegal or non-consensual outreach features

## Files
Create:
- index.html
- styles.css
- app.js
- README.md

## Pages / Sections

### 1. Dashboard
Show:
- Total leads
- Registered attendees
- Confirmed attendees
- Checked-in attendees
- Target attendance goal
- Progress bar toward goal

### 2. Event Setup
Fields:
- Event name
- Date
- Time
- Location
- Attendance goal
- Offer / topic
- Target audience notes

Save to localStorage.

### 3. Lead Import
Allow user to paste CSV-style lead data:

name, phone, email, condition, city, status

Parse and display leads in a table.

Default statuses:
- New
- Contacted
- Interested
- Registered
- Confirmed
- Checked In
- Not Interested

### 4. Outreach Script Generator
For each lead, generate:
- Call script
- Voicemail script
- SMS message
- Email message

Tone:
- respectful
- health-focused
- clear
- compliant
- no exaggerated medical claims

Include disclaimer:
“Educational event only. Not medical advice. Please consult your healthcare provider.”

### 5. Registration
Allow manual registration:
- Name
- Phone
- Email
- Guest count
- Notes

Registered people should appear in attendee list.

### 6. Reminder Queue
Show attendees who need:
- confirmation call
- reminder SMS
- day-before reminder
- day-of reminder

Generate reminder copy.

### 7. Check-In Mode
Simple mobile-friendly check-in screen:
- Search by name or phone
- Mark attendee as checked in
- Display checked-in count

### 8. Analytics
Show:
- Lead-to-registration rate
- Registration-to-check-in rate
- Remaining seats
- Suggested number of additional leads needed assuming 20%, 30%, and 40% conversion rates

## Data Model

Lead:
{
  id,
  name,
  phone,
  email,
  condition,
  city,
  status,
  notes,
  createdAt
}

Event:
{
  name,
  date,
  time,
  location,
  goal,
  topic,
  audienceNotes
}

Attendee:
{
  id,
  name,
  phone,
  email,
  guestCount,
  status,
  checkedIn,
  notes,
  createdAt
}

## Acceptance Criteria
- App runs by opening index.html
- User can create and save event details
- User can paste/import lead data
- Lead table displays correctly
- User can update lead status
- User can generate outreach scripts
- User can register attendees
- User can check attendees in
- Dashboard metrics update automatically
- Data persists after refresh using localStorage
- App is responsive on mobile
- README explains how to deploy free on Netlify and GitHub Pages

## Non-Goals for MVP
- Real SMS sending
- Real phone calls
- Ringless voicemail integration
- Medical advice
- HIPAA storage
- Payment processing
- User authentication
- Multi-user accounts

## Future Upgrade Path
Phase 2:
- Supabase database
- Twilio SMS
- Retell AI voice agent
- GoHighLevel or HubSpot CRM
- Zapier / Make / n8n workflows
- QR code check-in
- Consent tracking
- Campaign analytics

## Build Instructions for GitHub Copilot Chat
Read this entire APP_SPEC.md.
Implement the full MVP using vanilla HTML, CSS, and JavaScript.
Keep the UI clean, professional, and simple.
Prioritize working functionality over visual complexity.
Use localStorage for all persistence.
Create realistic sample data for demo mode.
After implementation, review against all acceptance criteria and fix gaps.