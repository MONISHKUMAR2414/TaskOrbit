# TaskOrbit

A production-quality 3D task management SaaS built with React, TypeScript, Vite, Three.js (React Three Fiber), Supabase, and Tailwind CSS.

## Features

- **Authentication** — sign up / sign in / sign out, persistent sessions, protected routes, per-user data isolation via Row Level Security
- **Dashboard** — live stats, productivity streak, today's tasks, upcoming tasks
- **3D Scene** — floating task cubes that reflect priority/status/category, a rotating productivity ring, particle background
- **Task management** — full CRUD with a rich modal (category, priority, status, due date, start/end time, estimated duration)
- **Filtering** — search, category/priority/status/due-date filters, multiple sort orders
- **Calendar** — day (hour-by-hour planner), week (7-day grid with week-over-week comparison), and month views
- **Analytics** — category donut, 14-day trend, priority bars, status pie — all from real data
- **Productivity score** — deterministic, priority-weighted algorithm with daily/weekly/monthly scores and streaks
- **Recommendations** — morning briefing, midday check-in, evening summary stored in Supabase
- **Reports** — CSV export and a professional weekly PDF report
- **Settings** — profile, theme, productivity preferences, demo data seeding, account deletion

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at https://supabase.com.
2. Open the SQL editor and run the contents of `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and fill in your project URL and anon key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> The anon key is safe for browser use — it is not a secret. Never put the `service_role` key in the frontend.

### 3. Run

```bash
npm run dev        # start the dev server
npm run typecheck  # TypeScript check
npm run build      # production build
```

New users automatically get default categories (Work, Personal, Health, Learning) via a database trigger. Use **Settings → Demo Data** to add sample tasks.

## Deployment

Production flow: **GitHub → Vercel → Supabase**.

```
 GitHub ──▶ Vercel ──▶ Your website ──▶ Supabase (Auth + PostgreSQL)
```

### 1. Push the code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repository.
2. Framework preset is detected automatically (Vite). Build command: `npm run build`, output directory: `dist`. No changes needed — `vercel.json` handles SPA routing and caching.
3. Add the environment variables below (Project Settings → Environment Variables):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

4. Click **Deploy**. Until the env vars are added the site runs in local demo mode (data stored in the visitor's browser).

### 3. Connect Supabase

1. Create a project at https://supabase.com.
2. Run `supabase/schema.sql` in the Supabase SQL editor (creates tables, indexes, Row Level Security, triggers, and the `delete_user_account()` RPC).
3. Copy the **Project URL** and **anon key** (Project Settings → API) into the Vercel env vars and redeploy.

> The anon key is safe for browser use. Never expose the `service_role` key in the frontend.

### 4. Local production preview

```bash
npm run build
npm run preview   # serves dist/ locally to verify before pushing
```

## Architecture

```
src/
├── components/    Auth, Dashboard, Tasks, Calendar, Analytics, ThreeScene, Settings, common
├── contexts/      Auth, Theme, Task (shared live data)
├── hooks/         useAuth, useTasks, useCategories, useToast, useUi
├── lib/           supabase client, productivity engine, recommendations, exports, utils
├── pages/         SignIn, SignUp, Dashboard, Tasks, Calendar, Analytics, Recommendations, Reports, Settings
├── styles/        Tailwind + theme tokens
└── types/         shared TypeScript types
```

- All database access goes through `src/lib/supabase.ts` using the **anon** key.
- Row Level Security is enforced in `supabase/schema.sql` — every table only exposes rows where `user_id = auth.uid()`.
- The 3D scene is lazy-loaded and honors `prefers-reduced-motion`; particle/cube counts scale down on mobile.