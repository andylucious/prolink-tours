# ProLink Tours — Tours & Travel ERP

Public tour website + back-office ERP for a Kenyan tour operator, built from the
*Project Proposal & Quotation* (Netswift Studio, Sept 2026).

**Stack:** Next.js 15 (React 19) · Tailwind CSS 4 · Prisma 6 · MySQL / MariaDB

## What's inside

### Public website (`/`)
| Page | Notes |
|---|---|
| Home | Hero, categories, best-selling tours (★ featured), guides, CTA |
| Tours directory `/tours` | Filter by category, trip length, search |
| Tour details `/tours/[slug]` | Day-by-day tabs, inclusions/exclusions checklists, photo gallery with lightbox, pricing guide (group size × peak/low × resident/non-resident), add-ons (car hire, flights, lodge upgrades), downloadable PDF itinerary |
| Smart inquiry `/inquire?tour=…` | Tour pre-filled, dates, pax, residency, add-ons, **live price estimate** |
| About, Blog, Contact | Contact form + WhatsApp chat button on every page |
| SEO | Per-page titles/descriptions, `sitemap.xml`, `robots.txt` |

### Back office (`/admin`)
- **Dashboard** – new inquiries, open quotes, cash collected, receivables, departures, overdue invoices, supplier payables
- **Sales** – Inquiries (status, assignment, notes, WhatsApp/email shortcuts) → **Quotes** (line items with supplier *cost* and client *price*, live margin, printable PDF) → *Accept* creates a booking
- **Operations** – Bookings with supplier services, printable **vouchers**, confirm/cancel; Suppliers (lodges, camps, transport, airlines, parks) with balances owed
- **Finance** – Invoices (full or deposit %, tax, discount, printable), payments (M-Pesa/bank/cash with references, auto Paid/Partial status), supplier payments
- **Website CMS** – Tours (details, itinerary editor, rate grid, photo uploads), categories, add-ons, peak seasons, blog, contact messages
- **Reports** – cash by month, sales & margin per tour, receivables ageing, inquiry pipeline & sources
- **System** – staff users (Admin / Staff roles), company settings (contacts, WhatsApp, bank & M-Pesa details, exchange rate)

## Running it on this PC

1. The database is the **MySQL 8.0 Windows service (`MySQL80`)** on port 3306, which starts with Windows.
2. In this folder:
   ```bash
   npm install
   npx prisma migrate deploy   # creates/updates tables
   npm run seed                # first time only: demo tours, suppliers, logins
   npm run dev
   ```
3. Website: http://localhost:3000 · Back office: http://localhost:3000/admin

Demo logins (change them under **Staff users** straight away):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@tours.local` | `admin123` |
| Staff | `staff@tours.local` | `staff123` |

### Viewing the data in HeidiSQL
New session → *MariaDB or MySQL (TCP/IP)* · Host `127.0.0.1` · User `root` · Password: your MySQL root password · Port `3306` → database `tours_erp`.

## Configuration (`.env`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASS@HOST:PORT/tours_erp` |
| `AUTH_SECRET` | Long random string used to sign staff sessions |
| `SITE_URL` | Public URL, used in the sitemap (e.g. `https://yourdomain.co.ke`) |
| `SMTP_*`, `MAIL_FROM` | Optional – email alerts for new inquiries + auto-reply to the client |

## Deploying
The app needs **Node.js 18.18+** and a **MySQL 5.7+/MariaDB 10.4+** database.

- **cPanel hosting with "Setup Node.js App"** (common with Kenyan hosts): create a MySQL database, upload the project, set the env vars, run `npm install && npx prisma migrate deploy && npm run build`, start with `npm start`. Uploaded photos are stored in `./uploads` – include it in backups.
- **Vercel** (as in the proposal): works, but you need an external MySQL (your host's remote MySQL, Aiven, etc.) and photo uploads should move to cloud storage, because Vercel's disk is temporary. Pasting image URLs works as-is.

## Pricing rules
- Rates are per person, per **group-size band**, **season** and **residency**. Non-resident rates default to USD, resident rates to KES.
- Peak seasons are date ranges that repeat every year (e.g. 1 Jul – 31 Oct migration). Every other date is low season.
- Children under 12 pay 50% (`CHILD_FACTOR` in `src/lib/pricing.ts`).
- Add-ons are per person, per group, per day or per person per day, and are converted between USD and KES using the rate in Settings.
- The website estimate is recalculated on the server when an inquiry is saved.

## Useful scripts
| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build/serve |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run seed` | Load demo data (skips the catalog if tours already exist) |
