# Supabase Package Runbook

This directory contains the database and storage foundation for ALGO SALON. It is provided for **review and staged implementation**; it is not connected to a Supabase project by this archive.

## Contents

| Path | Purpose |
| --- | --- |
| `migrations/20260831_000001_algo_salon_core.sql` | Complete core schema, booking/review RPCs, indexes, private buckets, grants, and RLS policies. |
| `../SUPABASE_REQUIREMENTS.md` | Product-specific decisions, security requirements, implementation order, and verification tests. |

## Safe application sequence

1. Create a separate **development** Supabase project. Do not begin in production.
2. Configure the email and OAuth providers required by your launch plan, including exact allowed redirect URLs.
3. Review the migration with your legal, payment, and operational requirements. The default salon location is `Asia/Dubai`; adjust it if that is not your operating time zone.
4. Apply the SQL migration through a version-controlled migration workflow or the project SQL editor.
5. Create non-sensitive development seed data for a published salon, owner member, services, staff profiles, staff/service links, and staff working hours.
6. Configure the Vite client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do **not** expose the service-role key.
7. Replace local-storage data actions with Supabase queries and calls to `create_booking`, `set_appointment_status`, `submit_review`, and `reply_to_review`.
8. Implement signed-URL media retrieval and the required path conventions. Do not change either bucket to public by default.
9. Execute the verification checklist in `SUPABASE_REQUIREMENTS.md` with unauthenticated, customer, staff, manager, and cross-salon identities.
10. Repeat the same migration and tests in staging before production.

## Non-negotiable security checks

| Check | Required result |
| --- | --- |
| Browser bundle inspection | It contains no service-role, payment, OAuth, webhook, or email-provider secrets. |
| RLS inspection | Every `public` table has RLS enabled, only needed grants exist, and policy tests cover allow/deny cases. |
| Business access | A client cannot create a salon ownership record or promote a salon to published status. |
| Booking contention | Concurrent overlapping reservations for one staff member result in no more than one successful booking. |
| Storage isolation | A user cannot list, read, update, or delete objects outside their own permitted folder. |
| Payment isolation | No client account can select or edit payment-provider records. |

> The application must treat all current local-storage login, App Code, location, notification, and payment behavior as preview data only until the Supabase integration is completed.
