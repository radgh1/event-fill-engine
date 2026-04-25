# Event Fill Engine Demo MVP

Event Fill Engine is a client-ready demo web app for local health-event operators to fill live rooms through compliant outreach, registration, reminders, and door check-in.

## Product Overview

This MVP is a static frontend that demonstrates:

- Event setup and attendance goals
- Lead import and status tracking
- Outreach script generation (call, voicemail, SMS, email)
- Reminder queue for registered and confirmed attendees
- Mobile-friendly check-in with live counter
- Dashboard metrics and lead calculator
- System architecture view for production planning

Built with vanilla HTML, CSS, and JavaScript. No framework, no backend, and no build step.

## Demo Purpose

The app auto-loads a realistic demo dataset for a seminar:

- Event: Free Neuropathy Relief Seminar
- Goal: 75 attendees
- 20+ leads with mixed statuses
- Preloaded attendees with active check-ins

Use this as a sales/demo environment to show workflow and reporting behavior before backend integrations are added.

## Run Locally

1. Clone or download this folder.
2. Open [index.html](index.html) in a modern browser.

No install required.

## Persistence

All data is stored in browser localStorage using key eventFillEngine.v1.

Header actions:

- Load Demo Data: load demo records
- Reset Demo Data: reset demo records to default state
- Clear All Data: remove all event/leads/attendees

## Deploy on Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click Add New Project.
3. Import the repository.
4. Leave framework as static/other.
5. Leave build command empty.
6. Leave output directory empty.
7. Deploy.

## Future Production Integrations

The architecture section in-app maps this frontend to a production stack:

- Vercel frontend hosting
- Supabase database
- n8n or Make automation orchestration
- Retell AI outbound calling
- Twilio SMS delivery
- SendGrid or Postmark email messaging
- CRM integration (lead/attendee sync)
- Consent-aware outreach logging

## Compliance Note

This demo is educational workflow software only. It does not send real calls, texts, or emails and does not provide medical advice.

Outreach and reminder copy is written to be respectful and compliant, with this required disclaimer:

"Educational event only. Not medical advice. Please consult your healthcare provider."
