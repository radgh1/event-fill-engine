# Event Fill Engine (MVP)

Event Fill Engine is a static, browser-only app for local health-event operators to manage outreach, registration, reminders, check-in, and attendance analytics.

## Tech Stack

- Vanilla HTML
- Vanilla CSS
- Vanilla JavaScript
- localStorage persistence

No framework, no backend, and no build step.

## Features

- Dashboard metrics:
  - Total leads
  - Registered attendees
  - Confirmed attendees
  - Checked-in attendees
  - Attendance goal and progress bar
- Event setup with local persistence
- CSV-style lead import (`name, phone, email, condition, city, status`)
- Lead table with editable statuses
- Outreach script generation:
  - Call script
  - Voicemail script
  - SMS message
  - Email message
  - Includes required disclaimer text
- Manual attendee registration
- Reminder queue for pending confirmation/reminder tasks
- Mobile-friendly check-in mode (search + mark checked in)
- Analytics:
  - Lead-to-registration rate
  - Registration-to-check-in rate
  - Remaining seats
  - Suggested additional leads needed at 20%, 30%, 40% conversion
- Demo mode with realistic sample data

## Run Locally

1. Clone or download this folder.
2. Open [index.html](index.html) in any modern browser.

That is it. No install required.

## Data Persistence

All app data is stored in browser localStorage under key:

- `eventFillEngine.v1`

Use the **Clear All Data** button in the app header to reset.

## Deploy Free

This project is static-host friendly and works on Vercel, Netlify, and GitHub Pages.

### Vercel (Static)

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New Project**.
3. Import the repository.
4. Framework preset: **Other** (or leave auto-detected static).
5. Build command: leave empty.
6. Output directory: leave empty.
7. Deploy.

### Netlify

1. Push to GitHub (or drag-and-drop the folder).
2. In Netlify, choose **Add new site**.
3. If using Git:
   - Build command: leave empty
   - Publish directory: `.`
4. Deploy site.

### GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`
4. Save and wait for the Pages URL.

## Compliance Note

Outreach copy is educational and avoids exaggerated medical claims. This MVP does not send real calls/messages and is not medical advice software.

Disclaimer used in scripts/reminders:

> Educational event only. Not medical advice. Please consult your healthcare provider.
