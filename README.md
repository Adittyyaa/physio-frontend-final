# PhysioTrack — Patient Manager

A mobile-first React app for physiotherapists to manage patients, appointments, sessions and exercise library. Built with React + Vite + Tailwind CSS + Supabase.

## Tech Stack

- **React 18** + **Vite** — frontend framework & build tool
- **Tailwind CSS** — utility-first styling
- **Supabase** — authentication + PostgreSQL database
- **Zustand** — lightweight state management
- **react-hot-toast** — toast notifications

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (Button, Input, Card, Modal...)
│   ├── layout/          # TopBar, Tabs, BottomNav, FAB
│   ├── patients/        # Patients list, detail, add/edit forms
│   ├── appointments/    # Appointments list + booking form
│   ├── sessions/        # Session log list + log form
│   ├── exercises/       # Exercise library list + add form
│   └── modals/          # Stats modal
├── hooks/
│   └── useAuth.js       # Supabase auth hook
├── lib/
│   ├── supabase.js      # Supabase client
│   ├── utils.js         # Shared helpers (formatDate, sendWhatsApp, etc.)
│   └── defaultData.js   # Default exercises seed
├── pages/
│   └── AuthPage.jsx     # Login / Signup
├── store/
│   └── appStore.js      # Zustand store (patients, appointments, sessions, exercises)
├── App.jsx              # Root component
├── main.jsx             # Entry point
└── index.css            # Global styles + CSS variables
```

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd physiotrack
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** and run the contents of `supabase_schema.sql`
3. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Enable Google Auth (optional)

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**, enable it and add your Google OAuth Client ID/Secret.
2. In Supabase Dashboard → **Authentication** → **URL Configuration**, add these to **Redirect URLs**:
   - `http://localhost:5173`
   - Your production URL (e.g. `https://your-app.netlify.app`)

### 5. Run

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

## Features

- **Patients** — Add, edit, delete patients with full profile (diagnosis, treatment area, contact, active/inactive status)
- **Schedule** — Book appointments, filter by Today/Tomorrow/Week/All, mark complete/cancelled/reschedule
- **Sessions** — Log treatment sessions with pain scale (0–10), exercise tags, progress notes, star rating
- **Exercise Library** — Curated exercise database filterable by body area; seeded with 10 defaults
- **WhatsApp** — One-tap WhatsApp messages and appointment reminders
- **Stats** — Overview modal with patient counts, session totals, average pain score
- **Auth** — Supabase email/password auth; all data is per-user with RLS

## Database Tables

| Table | Key Fields |
|---|---|
| `patients` | name, age, gender, phone, diagnosis, treatment_area, active |
| `appointments` | patient_id, date, time, duration, type, status |
| `sessions` | patient_id, date, pain, exercises[], progress, next_plan, rating |
| `exercises` | name, category, reps, instructions, media |

All tables have `user_id` with Row Level Security so each therapist only sees their own data.

## Patient login (optional)

This app supports a simple **patient-only** login + dashboard.

### How it works

- Patients can log in and **link** their account to their record using **Patient Code**.
- RLS policies in `supabase_schema.sql` allow patients to **read only** their own `patients`, `appointments`, and `sessions` rows (via `patients.patient_auth_id = auth.uid()`).

### Setup steps (Supabase)

1. Run the updated `supabase_schema.sql` in Supabase SQL Editor (adds the patient read policies).
2. Create a Supabase Auth user for the patient (Email/Password).
3. Share the patient’s **Patient Code** (the `patients.id` 4-digit code) with the patient.
4. Patient logs in → enters Patient Code on the dashboard to link.

If you updated from an older version, re-run `supabase_schema.sql` and then refresh Supabase schema cache:

```sql
notify pgrst, 'reload schema';
```

### Patient sign up (optional)

Patients can also create their own account in the app:

- On the login screen, switch to **Patient** → **Patient sign up**
- Enter email + password + **Patient Code**

The **Patient Code** is a **4-digit** code stored in `patients.id` for that patient row (share it with the patient).

#### Netlify env vars (required for patient sign up)

Patient sign up runs client-side via Supabase Auth. If you hit `email rate limit exceeded`, wait a few minutes or create the patient user from the Supabase Dashboard (Authentication → Users).

### Therapist creates patient login (recommended)

Creating a patient Auth user from the therapist UI is implemented as a Netlify Function so the therapist doesn’t get logged out (admin auth APIs require a server-side service role key).

**Netlify environment variables (production + `netlify dev`)**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (keep secret; never expose in frontend)

When running locally, use Netlify’s dev server so functions work:

```bash
npx netlify dev
```
