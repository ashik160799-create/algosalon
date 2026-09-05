# ALGO SALON — Supabase Requirements and Implementation Guide

**Status:** This application is currently a **local-preview React prototype**. Its mock data and browser storage must not be treated as a production database or authentication system. The included migration provides the production data model, guarded booking workflows, private media storage, and row-level access controls required before live use.

> **Security principle:** Supabase secures its platform infrastructure; the application owner remains responsible for correct Row Level Security policies, API-key handling, and application access controls.

## 1. Recommended Setup

Create one Supabase project for each environment—**development**, **staging**, and **production**—and deploy the migration through the Supabase CLI so the schema remains reproducible.

| Requirement | Decision for ALGO SALON | Reason |
| --- | --- | --- |
| Authentication | Supabase Auth using email magic link or OTP, with optional Google OAuth | Replaces the current hard-coded, client-side “App Code” and simulated Google/email verification. |
| Authorization | Postgres RLS plus `salon_members` roles | Separates customer data from salon staff and management access at the database layer. |
| Booking writes | Protected `create_booking` database RPC | Derives price/duration from live records and stops staff-time overlaps in a single transaction. |
| Status changes | Protected `set_appointment_status` RPC | Allows only valid customer or manager actions and creates an audit event. |
| Media | Private `avatars` and `salon-media` buckets with signed URLs | Restricts uploads and reads by authenticated identity and salon membership. |
| Payments | Payment provider integration through a server-side function | Keeps payment secrets and card data out of the React application and public schema. |
| Notifications | Server-triggered inserts / trusted function | Prevents browser users from creating messages for other people. |

### Environment variables

The browser may contain only the project URL and **publishable/anon key**. It must never contain the `service_role` key, payment-provider secret, SMTP secret, OAuth client secret, or webhook signing secret.

```bash
# .env.local — safe for the Vite browser bundle when prefixed with VITE_
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY

# Server-side / Edge Function secrets — never VITE_ prefixed and never committed
SUPABASE_SERVICE_ROLE_KEY=SERVER_ONLY
STRIPE_SECRET_KEY=SERVER_ONLY
STRIPE_WEBHOOK_SIGNING_SECRET=SERVER_ONLY
```

## 2. Database Tables

The migration at `supabase/migrations/20260831_000001_algo_salon_core.sql` implements these tables. Monetary amounts use **minor units** (for example, fils/cents) rather than JavaScript floating-point values.

| Table | Primary role | Client access |
| --- | --- | --- |
| `profiles` | Customer identity profile, phone, avatar path, locale, consent settings | A user reads/updates only their own row. |
| `salons` | Public salon catalogue, status, location, time zone, contact information | Anyone reads published salons; owner/manager edits their own salon. |
| `salon_members` | Links a user to a salon with owner, manager, or staff role | Member and management visibility only. First owner assignment is server-controlled. |
| `business_hours` | Open/close hours per salon/day | Published read; owner/manager write. |
| `services` | Live services, price, duration, category, image path | Published active read; owner/manager manage. |
| `staff_profiles` | Bookable employees and public profile details | Published active read; owner/manager manage. |
| `staff_services` | Which staff can perform each service | Published read; owner/manager manage. |
| `staff_working_hours` | Staff shift availability by weekday | Published read; owner/manager manage. |
| `salon_media` | Metadata for cover, gallery, and service media objects | Published read; owner/manager manage. |
| `appointments` | Customer bookings, quoted price, staff/time interval, business proposal, status | Customer sees own rows; salon members see their salon’s rows. Browser writes are blocked. |
| `appointment_events` | Immutable-ish audit trail of booking actions | Appointment participants read. Writes occur through protected procedures. |
| `reviews` | One review per completed appointment and optional business reply | Published read; customer creates only through guarded procedure; management replies only through guarded procedure. |
| `favorites` | A customer's saved salons | Customer manages only their own rows. |
| `notifications` | In-app user notifications | Recipient reads and marks own notifications read; creation is server-side. |
| `payment_records` | Payment provider IDs, amount, currency, status | No browser access. Never store raw card, CVC, or payment-token data. |
