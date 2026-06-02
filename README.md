# Asian LE Staff Admin

An internal admin dashboard for managing staff schedules, hours, and tips at Asian LE.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Firebase (Firestore + Authentication)
- **State:** Zustand
- **Hosting:** Firebase App Hosting (Cloud Run)

## Features

- **Authentication** — Admin-only sign-in via Firebase Auth (email/password)
- **Users** — Add, edit, and delete staff members with name and PIN
- **Staff Schedule** — Monthly calendar view per staff member; add, edit, and delete shifts
- **Staff Hours** — Track hours worked with date range, month, or week filters; interactive calendar with per-shift editing
- **Tips** — Log morning/afternoon cash and card tips per day; monthly totals summary

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Firebase Setup

The Firebase project is `asianlestaff`. Configuration is in `lib/firebaseConfig.ts`.

To deploy via Firebase App Hosting:

```bash
firebase deploy
```

## Project Structure

```
app/
  (dashboard)/          # Protected dashboard routes
    page.tsx            # Home
    staff-schedule/     # Shift scheduling
    staff-hours/        # Hours tracking
    tips/               # Tips logging
    users/              # Staff management
  login/                # Auth page
components/
  auth/                 # Auth guard
  calendar/             # Shared calendar components
  shifts/               # Shift modals (add/edit/delete)
  tips/                 # Tips modal
  users/                # User modal
hooks/                  # Firestore data hooks (users, shifts, tips)
lib/                    # Firebase config, Firestore helpers, utilities
stores/                 # Zustand stores
types/                  # Global TypeScript types
```
