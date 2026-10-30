# Legacy Media — Leave Management System

A leave portal for Legacy Media employees and administrators, built from the **Warm Editorial** screen designs in
`my_leaves_balance/`, `apply_for_leave/`, `admin_management/` and the design system in
`warm_editorial_leave_management/DESIGN.md`.

## Features

**Employees**
- Dashboard with remaining balance per leave type (Annual, Casual, Sick, Planned, Birthday, Eid Holidays, Other)
- Apply for leave: full or half days, live working-day calculation (weekends + public holidays excluded), colleague overlap check, draft saving
- Sick leave (and any type flagged "can apply after the date") can be submitted retrospectively
- Birthday leave restricted to the employee's birthday month
- Leave history filtered by Pending / Upcoming / Approved / Rejected / Past, request detail with an approval timeline, withdraw pending requests
- In-portal notifications plus email on every decision, CSV export of personal leave
- Company calendar of public holidays and who's out of office

**Admins**
- Pending approvals queue: approve, reject (with reason) or adjust dates
- All leave requests with filters and CSV export; remove (cancel) leave and return days to the balance
- Record leave on an employee's behalf (auto-approved)
- Employee directory: add, edit, deactivate/reactivate, permanently delete, reset password, edit yearly quotas
- Leave types & policies: quota, deducts-from-balance, retrospective allowed, half days, birthday-month only, max days per request, minimum notice, active/inactive
- Holiday ledger: add/delete holidays and toggle whether each is exempt from leave counts
- Email log and integration status

**Workflow**
1. Employee submits a request → it is stored, admins get an in-portal notification and an email.
2. Admin approves or rejects → the employee gets an email + notification, the balance updates.
3. Approved leave is written to the shared Google Calendar; cancelled/rejected leave is removed from it.

## Tech stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS · Prisma + PostgreSQL (Neon in production) · Nodemailer (SMTP) · Google Calendar API (service account) · JWT session cookies (jose + bcrypt).

## Getting started

```bash
npm install
cp .env.example .env        # then set AUTH_SECRET
npm run db:local            # starts a local Postgres (Prisma Dev) — keep it running, use the TCP URL it prints in .env
npm run db:deploy           # create the tables
npm run db:seed             # leave types, holidays, admin + demo employees
npm run dev                 # http://localhost:3000
```

`npm run db:local` runs Prisma's built-in local Postgres, so nothing else needs installing. A free Neon branch works just as well — put its URLs in `.env` instead.

The seeded admin email and the shared demo password come from `SEED_ADMIN_EMAIL` and `SEED_PASSWORD` in `.env`.
Set `SEED_DEMO_DATA="false"` to seed only the admin, leave types and holidays. Change the admin password after first sign-in (avatar menu → My Profile).

- `npm run db:migrate` — after editing `prisma/schema.prisma`, creates a new migration and applies it locally.
- `npm run db:reset` — wipes the database, reapplies migrations and re-seeds.

## Email notifications

Set the `SMTP_*` variables and `MAIL_FROM` in `.env` (Google Workspace, Microsoft 365, SendGrid, Mailgun, etc. all work over SMTP).
`ADMIN_NOTIFY_EMAIL` is a comma-separated list of inboxes that receive new requests; when blank, every active admin is emailed.

Without `SMTP_HOST`, emails aren't sent — they're printed to the server console and listed under **Admin → Email Log**, so the full workflow can be tested locally.

## Google Calendar integration

Approved leave is added as an all-day event to one shared company calendar.

1. In Google Cloud Console, create (or pick) a project and enable the **Google Calendar API**.
2. Create a **service account** and download a JSON key.
3. In Google Calendar, open the calendar's **Settings and sharing** → *Share with specific people* → add the service account's email with **Make changes to events**.
4. Copy the calendar's **Calendar ID** (under *Integrate calendar*).
5. Set in `.env`:
   - `GOOGLE_CALENDAR_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` (`client_email` from the JSON)
   - `GOOGLE_PRIVATE_KEY` (`private_key` from the JSON, in double quotes, keeping the `\n` sequences)
   - `APP_TIMEZONE` (e.g. `Australia/Sydney`, which switches between AEDT and AEST automatically)

Holidays added from the admin holiday ledger can optionally be pushed to the same calendar.

## Leave rules

- Working days are Monday–Friday (`WEEKEND_DAYS` in `src/lib/dates.ts`). Active holidays are never deducted.
- Balances are per calendar year; missing balances are created from each leave type's default quota.
- A request is counted against the year it starts in. Pending requests reserve days so employees can't over-book.
- Admin approval re-checks the balance, so quota edits made after submission are respected.
- The seeded public holidays are the NSW list for 2026–27 (national + NSW). For another state, edit them in Admin → Holiday Ledger or `HOLIDAYS` in `prisma/seed.ts`.
- Dates use Australian formats and times are shown in `APP_TIMEZONE` (default `Australia/Sydney`).

## Deploying to Vercel

The project is set up for Vercel + Neon Postgres in Sydney (`vercel.json` pins functions to `syd1`).

1. **Import** the GitHub repo into Vercel (framework: Next.js). Leave the build settings as they are — Vercel runs
   `npm run vercel-build`, which generates the Prisma client, applies any pending migrations, seeds an empty database and builds the app.
2. **Database:** Project → Storage → *Create Database* → **Neon**, region **Sydney (ap-southeast-2)**, and connect it to
   the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
   If preview deployments are enabled, turn on Neon's *preview branches* so previews never migrate the production database.
3. **Environment variables** (Production): see the checklist below, then deploy.
4. **First deploy seeds itself.** When the database has no users yet, the build creates the admin
   (`SEED_ADMIN_EMAIL` / `SEED_PASSWORD`), the leave types and the holidays — no demo data on Vercel unless
   `SEED_DEMO_DATA="true"`. Later deploys skip this. Sign in and change the password, then you can delete the `SEED_*` variables.
5. **Domain:** Project → Settings → Domains → add e.g. `leave.oneclickdigital.net.au`, then create the DNS record Vercel shows
   (a CNAME to `cname.vercel-dns.com` for a subdomain). HTTPS is automatic.

### Production environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Added by the Neon integration |
| `APP_URL` | Public URL, e.g. `https://leave.oneclickdigital.net.au` (email links and logo) |
| `AUTH_SECRET` | New random value: `openssl rand -base64 32` |
| `APP_TIMEZONE` | `Australia/Sydney` |
| `SEED_ADMIN_EMAIL`, `SEED_PASSWORD` | Your admin login, created on the first deploy (required for it) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | Real email delivery |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Optional, Google Calendar |

## Project structure

```
prisma/               schema + seed
src/app/(app)/        signed-in pages: dashboard, apply, holidays, leaves/[id], notifications, profile, policy, admin/*
src/app/actions/      server actions (auth, employee leave, admin)
src/app/api/export/   CSV export
src/components/       UI components (admin/ for admin-only)
src/lib/              leave rules & balances, dates, auth, email, Google Calendar, notification workflow
```
