# College Complaint Management System

**Report • Prioritize • Resolve**

A production-style complaint management system for a college, built with
Next.js (App Router) and Supabase (PostgreSQL + Auth). Students raise
complaints; administrators process them through a real **priority queue**.

## Core concept

```
Student Complaint
      ↓
Category + Description
      ↓
Admin-controlled Keyword Detection
      ↓
Priority Calculation
      ↓
Priority Queue
      ↓
Admin Processing
      ↓
Completed / Rejected
```

Priority levels: `CRITICAL = 4`, `HIGH = 3`, `MEDIUM = 2`, `LOW = 1`.

Priority is derived from an **admin-managed keyword table** — it is never
hardcoded and never chosen by the student. When a complaint is submitted, the
resolved priority level, score and detected keywords are **stored on the
complaint**, so later keyword changes never rewrite historical data.

## Setup

### 1. Environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and **anon** key. The service-role key is not
used by this app and must never be exposed to the browser.

### 2. Database

Open Supabase → SQL Editor, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) and run it.

It is idempotent and creates/migrates:

| Table | Purpose |
| --- | --- |
| `complaints` | Submitted complaints with frozen priority + status lifecycle |
| `categories` | Categories shown in the student form (soft-deletable) |
| `priority_keywords` | Admin-managed keyword → priority mapping |
| `admin_profiles` | Authorization: who is an administrator |

It also enables Row Level Security, creates the priority-queue index
(`priority_score DESC, created_at ASC` for active complaints) and seeds the
initial categories and priority keywords.

### 3. Create an admin

1. Supabase → Authentication → Users → **Add user** (email + password).
2. Run the admin registration snippet at the bottom of `supabase/schema.sql`
   with that email.

Being signed in is **not** enough to reach `/admin`: only users with a row in
`admin_profiles` can read or update complaints, and this is enforced by RLS.

### 4. Run

```bash
npm run dev
```

- `/` — landing page
- `/raise` — student complaint form
- `/admin/login` — admin sign-in (redirects to `/admin`)

## Priority queue

Active complaints are `PENDING` and `IN_PROGRESS`. The queue is ordered in the
database query, not merely in the UI:

```sql
ORDER BY priority_score DESC, created_at ASC
```

So CRITICAL is served before HIGH, HIGH before MEDIUM, MEDIUM before LOW, and
within a band the oldest complaint comes first. Completing or rejecting a
complaint removes it from the queue.

## Admin features

All Complaints (search + filters) · Priority Queue · Pending · In Progress ·
Completed · Rejected · Priority Keywords · Categories · Analytics

Completed and Rejected complaints can be **permanently removed** by an admin
(confirmation required). This is a hard delete — there is no soft-delete path —
and only the selected complaint row is removed; categories, keywords and admin
accounts are untouched.

Search covers complaint number, student name, roll number, Gmail ID and
category. Filters cover category, priority, status, department and date range,
and can be combined.

## Security notes

- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` reach the
  browser. The service-role key is never referenced.
- Students may insert complaints and read active categories/keywords only.
  They cannot read, update or delete complaints. Only authorized admins
  (`is_admin_user(auth.uid())`) may DELETE a complaint.
- Admin authorization is enforced by RLS via the `is_admin_user()` function,
  not by hiding UI.

## Verifying the setup

After applying the schema, check the live project:

```bash
npm run verify:supabase
```

It confirms the tables exist, that the student form can read active categories
and priority keywords, that anonymous users cannot read complaints, and that an
admin profile is registered.

To also prove the submission path end to end (writes one real row and removes
it again):

```bash
npm run verify:supabase -- --submit --delete
```

`--delete` needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (local tooling
only — it is never used by the app or shipped to the browser).

## Scripts

```bash
npm run dev              # development server
npm run build            # production build (also typechecks)
npm run lint             # eslint
npm run verify:supabase  # verify the Supabase schema + RLS
```
