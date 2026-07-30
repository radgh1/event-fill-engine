# Event Fill Engine - Campaign-Oriented MVP

Event Fill Engine is a static, browser-based system for planning and executing repeatable local event campaigns across multiple locations.

Tech stack:

- Vanilla HTML
- Vanilla CSS
- Vanilla JavaScript
- localStorage persistence only

No framework, no build step, no backend in MVP mode.

## What This Solves

Local operators often run events without a clear funnel plan and without consistent outreach sequencing. This system solves that by combining:

- campaign target planning
- event-level lead and attendee execution
- reminder and check-in workflows
- city-based segmentation and performance insights

It turns event operations into a repeatable campaign model, not a one-off manual process.

## How This Fills Rooms

1. Set attendance targets and funnel assumptions in Campaign Planner.
2. Calculate required registrations and leads automatically.
3. Import or manage leads per event and per city.
4. Execute outreach scripts with compliant messaging.
5. Register attendees and run reminder queue.
6. Track day-of check-in headcount against goal.
7. Use analytics and insights to improve next campaign.

## Campaign Planning Logic

Planner inputs:

- Target Attendance
- Expected Show-Up Rate (%)
- Lead-to-Registration Conversion Rate (%)

Core formulas:

- requiredRegistrations = Math.ceil(targetAttendance / showUpRate)
- requiredLeads = Math.ceil(requiredRegistrations / conversionRate)

System output includes:

- Required Registrations
- Required Leads
- Gap vs Current Leads
- Gap vs Current Registered
- Funnel visualization: Leads -> Registered -> Attended
- Expected funnel chain: Leads -> Contacts -> Interested -> Registered -> Attended

## Production Architecture

The app includes a visible readiness badge and architecture modal for production pathing:

- n8n or Make automation orchestration
- Retell AI calling workflows
- Twilio SMS messaging
- Supabase database layer
- CRM synchronization

This keeps the MVP deployable as static frontend while mapping directly to production components.

## Scaling Across Cities

The campaign system supports city-aware operations:

- Lead city filtering
- Lead counts per city
- Top-performing city by registrations
- Multi-event management through event selector and Create New Event flow

Each event has isolated leads and attendees, allowing teams to run parallel campaigns by location.

## Run Locally

1. Clone or download this repository.
2. Open [index.html](index.html) in a modern browser.

No install required.

## Data Persistence

Primary storage key:

- eventFillEngine.v3

Legacy data migration is supported from prior key eventFillEngine.v1.

## Deploy on Vercel

1. Push this project to a GitHub repository.
2. In Vercel, select Add New Project.
3. Import the repository.
4. Use static/other settings (no build command).
5. Deploy.

The app is hosted at: [https://event-fill-engine.vercel.app/](https://event-fill-engine.vercel.app/)

## Export Feature

Use Export Campaign Plan to download a JSON summary containing:

- active event details
- planner calculations
- funnel targets
- outreach strategy timeline

## Compliance Note

The MVP uses educational, non-diagnostic outreach copy. It does not send real calls, SMS, or email by itself.

Required script disclaimer:

"Educational event only. Not medical advice. Please consult your healthcare provider."
