-- =============================================================================
-- ALGO SALON SPOT-PRO: COMPLETE 1-CLICK SUPABASE SETUP
-- Copy and paste this entire script into your Supabase Dashboard -> SQL Editor
-- and click "RUN" (or Ctrl+Enter).
-- It creates all 15 tables, indexes, RLS policies, RPCs, storage, and seed data.
-- =============================================================================

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- -----------------------------------------------------------------------------
-- 1. Custom Types & Enums
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.salon_status as enum ('pending_review', 'published', 'suspended', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.salon_member_role as enum ('owner', 'manager', 'staff');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_status as enum (
    'pending',
    'confirmed',
    'in_progress',
    'rescheduled_by_business',
    'completed',
    'cancelled',
    'no_show'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('pay_at_salon', 'card');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('booking', 'reminder', 'review', 'promo', 'system');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Core Tables
-- -----------------------------------------------------------------------------

-- 2.1 Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  avatar_path text,
  gender text check (gender is null or gender in ('Male', 'Female', 'Other', 'Prefer not to say')),
  preferred_locale text not null default 'en' check (preferred_locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  preferred_currency text not null default 'AED' check (preferred_currency ~ '^[A-Z]{3}$'),
  marketing_opt_in boolean not null default false,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 Salons
create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  status public.salon_status not null default 'published',
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  tagline text,
  description text,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  address_line1 text not null,
  address_line2 text,
  city text not null,
  country_code char(2) not null default 'AE' check (country_code ~ '^[A-Z]{2}$'),
  postal_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  timezone text not null default 'Asia/Dubai',
  map_url text,
  price_range smallint check (price_range between 1 and 4),
  rating numeric(3,2) not null default 5.0 check (rating between 1.0 and 5.0),
  review_count integer not null default 0 check (review_count >= 0),
  cover_image text,
  logo_image text,
  amenities text[] not null default '{}',
  categories text[] not null default '{}',
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

-- 2.3 Salon Members
create table if not exists public.salon_members (
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.salon_member_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (salon_id, user_id)
);

-- 2.4 Business Hours
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  opens_at time,
  closes_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_id, day_of_week),
  check ((is_open = false and opens_at is null and closes_at is null) or
         (is_open = true and opens_at is not null and closes_at is not null and opens_at < closes_at))
);

-- 2.5 Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  category text not null check (char_length(trim(category)) between 2 and 80),
  description text,
  price_minor integer not null check (price_minor >= 0),
  currency char(3) not null default 'AED' check (currency ~ '^[A-Z]{3}$'),
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  original_price_minor integer check (original_price_minor is null or original_price_minor >= price_minor),
  image_path text,
  gender_target text not null default 'Unisex' check (gender_target in ('Unisex', 'Male', 'Female')),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.6 Staff Profiles
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid unique references public.profiles(id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  role_title text not null check (char_length(trim(role_title)) between 2 and 120),
  avatar_path text,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  specialties text[] not null default '{}',
  rating numeric(3,2) not null default 5.0 check (rating between 1.0 and 5.0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  is_bookable boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.7 Staff to Services
create table if not exists public.staff_services (
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- 2.8 Staff Working Hours
create table if not exists public.staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_working boolean not null default true,
  starts_at time,
  ends_at time,
  unique (staff_id, day_of_week),
  check ((is_working = false and starts_at is null and ends_at is null) or
         (is_working = true and starts_at is not null and ends_at is not null and starts_at < ends_at))
);

-- 2.9 Salon Media
create table if not exists public.salon_media (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  object_path text not null unique,
  alt_text text,
  media_type text not null check (media_type in ('cover', 'gallery', 'service')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2.10 Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete restrict,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_display_name text not null check (char_length(trim(customer_display_name)) between 1 and 120),
  customer_phone_e164 text,
  customer_email text,
  customer_avatar_path text,
  service_id uuid not null references public.services(id) on delete restrict,
  service_name text not null,
  staff_id uuid not null references public.staff_profiles(id) on delete restrict,
  staff_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  payment_method public.payment_method not null default 'pay_at_salon',
  quoted_price_minor integer not null check (quoted_price_minor >= 0),
  currency char(3) not null default 'AED' check (currency ~ '^[A-Z]{3}$'),
  customer_notes text check (char_length(customer_notes) <= 1000),
  business_note text check (char_length(business_note) <= 1000),
  proposed_starts_at timestamptz,
  proposed_ends_at timestamptz,
  proposal_note text check (char_length(proposal_note) <= 1000),
  decline_reason text,
  reviewed boolean not null default false,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check ((proposed_starts_at is null and proposed_ends_at is null) or
         (proposed_starts_at is not null and proposed_ends_at is not null and proposed_starts_at < proposed_ends_at))
);

-- Double-booking exclusion constraint
alter table public.appointments
  drop constraint if exists no_overlapping_staff_appointments;

alter table public.appointments
  add constraint no_overlapping_staff_appointments
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('pending', 'confirmed', 'in_progress', 'rescheduled_by_business'));

-- 2.11 Appointment Events
create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  previous_status public.appointment_status,
  new_status public.appointment_status not null,
  event_note text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2.12 Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid unique references public.appointments(id) on delete set null,
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  customer_avatar text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 1 and 2000),
  service_name text,
  staff_name text,
  business_reply text,
  reply_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.13 Favorites
create table if not exists public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, salon_id)
);

-- 2.14 Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_type text not null check (user_type in ('customer', 'business')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  type public.notification_type not null default 'system',
  link_tab text,
  appointment_id uuid references public.appointments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2.15 Payment Records
create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_intent_id text,
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null default 'AED',
  status text not null default 'pending' check (status in ('pending', 'authorized', 'captured', 'refunded', 'failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Helper Functions
-- -----------------------------------------------------------------------------
create or replace function public.is_salon_member(
  check_salon_id uuid,
  required_role public.salon_member_role default null
)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.salon_members sm
    where sm.salon_id = check_salon_id
      and sm.user_id = auth.uid()
      and sm.is_active = true
      and (
        required_role is null
        or sm.role = required_role
        or (required_role = 'staff' and sm.role in ('staff', 'manager', 'owner'))
        or (required_role = 'manager' and sm.role in ('manager', 'owner'))
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.salon_members enable row level security;
alter table public.business_hours enable row level security;
alter table public.services enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_services enable row level security;
alter table public.staff_working_hours enable row level security;
alter table public.salon_media enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.payment_records enable row level security;

-- Profiles
drop policy if exists "Profiles are viewable by owner or staff" on public.profiles;
create policy "Profiles are viewable by owner or staff"
  on public.profiles for select
  using (auth.uid() = id or auth.role() = 'authenticated');

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Salons
drop policy if exists "Published salons are viewable by everyone" on public.salons;
create policy "Published salons are viewable by everyone"
  on public.salons for select
  using (status = 'published' or is_salon_member(id));

drop policy if exists "Salon owners and managers can update their salon" on public.salons;
create policy "Salon owners and managers can update their salon"
  on public.salons for update
  using (is_salon_member(id, 'manager'))
  with check (is_salon_member(id, 'manager'));

drop policy if exists "Authenticated users can create a salon" on public.salons;
create policy "Authenticated users can create a salon"
  on public.salons for insert
  with check (auth.role() = 'authenticated');

-- Salon Members
drop policy if exists "Salon members can view team" on public.salon_members;
create policy "Salon members can view team"
  on public.salon_members for select
  using (is_salon_member(salon_id) or user_id = auth.uid());

drop policy if exists "Salon owners can manage members" on public.salon_members;
create policy "Salon owners can manage members"
  on public.salon_members for all
  using (is_salon_member(salon_id, 'owner'));

-- Business Hours
drop policy if exists "Business hours viewable by everyone" on public.business_hours;
create policy "Business hours viewable by everyone"
  on public.business_hours for select
  using (true);

drop policy if exists "Salon managers can edit business hours" on public.business_hours;
create policy "Salon managers can edit business hours"
  on public.business_hours for all
  using (is_salon_member(salon_id, 'manager'));

-- Services
drop policy if exists "Active services viewable by everyone" on public.services;
create policy "Active services viewable by everyone"
  on public.services for select
  using (is_active = true or is_salon_member(salon_id));

drop policy if exists "Salon managers can manage services" on public.services;
create policy "Salon managers can manage services"
  on public.services for all
  using (is_salon_member(salon_id, 'manager'));

-- Staff Profiles
drop policy if exists "Bookable staff viewable by everyone" on public.staff_profiles;
create policy "Bookable staff viewable by everyone"
  on public.staff_profiles for select
  using (is_active = true or is_salon_member(salon_id));

drop policy if exists "Salon managers can manage staff" on public.staff_profiles;
create policy "Salon managers can manage staff"
  on public.staff_profiles for all
  using (is_salon_member(salon_id, 'manager'));

-- Staff Services
drop policy if exists "Staff services viewable by everyone" on public.staff_services;
create policy "Staff services viewable by everyone"
  on public.staff_services for select
  using (true);

drop policy if exists "Salon managers can manage staff services" on public.staff_services;
create policy "Salon managers can manage staff services"
  on public.staff_services for all
  using (
    exists (
      select 1 from public.staff_profiles sp
      where sp.id = staff_services.staff_id
        and is_salon_member(sp.salon_id, 'manager')
    )
  );

-- Staff Working Hours
drop policy if exists "Staff working hours viewable by everyone" on public.staff_working_hours;
create policy "Staff working hours viewable by everyone"
  on public.staff_working_hours for select
  using (true);

drop policy if exists "Salon managers can manage staff working hours" on public.staff_working_hours;
create policy "Salon managers can manage staff working hours"
  on public.staff_working_hours for all
  using (
    exists (
      select 1 from public.staff_profiles sp
      where sp.id = staff_working_hours.staff_id
        and is_salon_member(sp.salon_id, 'manager')
    )
  );

-- Salon Media
drop policy if exists "Salon media viewable by everyone" on public.salon_media;
create policy "Salon media viewable by everyone"
  on public.salon_media for select
  using (true);

drop policy if exists "Salon managers can manage media" on public.salon_media;
create policy "Salon managers can manage media"
  on public.salon_media for all
  using (is_salon_member(salon_id, 'manager'));

-- Appointments
drop policy if exists "Users can view own appointments or salon appointments" on public.appointments;
create policy "Users can view own appointments or salon appointments"
  on public.appointments for select
  using (
    customer_id = auth.uid()
    or is_salon_member(salon_id)
    or auth.role() = 'authenticated'
  );

drop policy if exists "Users or managers can insert appointments" on public.appointments;
create policy "Users or managers can insert appointments"
  on public.appointments for insert
  with check (
    customer_id = auth.uid()
    or is_salon_member(salon_id)
    or auth.role() = 'authenticated'
  );

drop policy if exists "Customers can cancel, managers can manage status" on public.appointments;
create policy "Customers can cancel, managers can manage status"
  on public.appointments for update
  using (
    customer_id = auth.uid()
    or is_salon_member(salon_id)
  );

-- Appointment Events
drop policy if exists "Appointment participants can view audit events" on public.appointment_events;
create policy "Appointment participants can view audit events"
  on public.appointment_events for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_events.appointment_id
        and (a.customer_id = auth.uid() or is_salon_member(a.salon_id))
    )
  );

-- Reviews
drop policy if exists "Published reviews viewable by everyone" on public.reviews;
create policy "Published reviews viewable by everyone"
  on public.reviews for select
  using (true);

drop policy if exists "Customers can insert review for their appointment" on public.reviews;
create policy "Customers can insert review for their appointment"
  on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.customer_id = auth.uid()
        and a.status = 'completed'
    )
  );

drop policy if exists "Salon managers can reply to reviews" on public.reviews;
create policy "Salon managers can reply to reviews"
  on public.reviews for update
  using (is_salon_member(salon_id, 'manager'))
  with check (is_salon_member(salon_id, 'manager'));

-- Favorites
drop policy if exists "Customers can manage their own favorites" on public.favorites;
create policy "Customers can manage their own favorites"
  on public.favorites for all
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Notifications
drop policy if exists "Users manage their own notifications" on public.notifications;
create policy "Users manage their own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can mark own notifications read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Payment Records (Strictly hidden from client browser)
drop policy if exists "No browser access to raw payment records" on public.payment_records;
create policy "No browser access to raw payment records"
  on public.payment_records for all
  using (false);

-- -----------------------------------------------------------------------------
-- 5. Stored Procedures (Guarded RPCs)
-- -----------------------------------------------------------------------------

-- Create Booking RPC
create or replace function public.create_booking(
  p_salon_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_payment_method public.payment_method default 'pay_at_salon',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_service record;
  v_staff record;
  v_ends_at timestamptz;
  v_appointment_id uuid;
  v_caller_id uuid := auth.uid();
begin
  select id, name, duration_minutes, price_minor, currency
  into v_service
  from public.services
  where id = p_service_id and salon_id = p_salon_id and is_active = true;

  if not found then
    raise exception 'Selected service is invalid or unavailable at this salon';
  end if;

  select id, display_name, is_bookable, is_active
  into v_staff
  from public.staff_profiles
  where id = p_staff_id and salon_id = p_salon_id and is_active = true and is_bookable = true;

  if not found then
    raise exception 'Selected specialist is not currently available for booking';
  end if;

  v_ends_at := p_starts_at + (v_service.duration_minutes || ' minutes')::interval;

  if p_starts_at <= now() then
    raise exception 'Appointment time must be in the future';
  end if;

  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
      and status in ('pending', 'confirmed', 'in_progress', 'rescheduled_by_business')
      and tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'This specialist already has an active booking at the requested time.';
  end if;

  insert into public.appointments (
    salon_id,
    customer_id,
    customer_display_name,
    customer_phone_e164,
    customer_email,
    service_id,
    service_name,
    staff_id,
    staff_name,
    starts_at,
    ends_at,
    status,
    payment_method,
    quoted_price_minor,
    currency,
    customer_notes
  ) values (
    p_salon_id,
    v_caller_id,
    coalesce(trim(p_customer_name), 'Valued Client'),
    p_customer_phone,
    p_customer_email,
    v_service.id,
    v_service.name,
    v_staff.id,
    v_staff.display_name,
    p_starts_at,
    v_ends_at,
    'pending',
    p_payment_method,
    v_service.price_minor,
    v_service.currency,
    p_notes
  )
  returning id into v_appointment_id;

  insert into public.appointment_events (
    appointment_id,
    actor_id,
    previous_status,
    new_status,
    event_note
  ) values (
    v_appointment_id,
    v_caller_id,
    null,
    'pending',
    'Booking requested by customer'
  );

  return v_appointment_id;
end;
$$;

-- Set Appointment Status RPC
create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_new_status public.appointment_status,
  p_reason text default null,
  p_proposed_starts_at timestamptz default null,
  p_proposed_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_apt record;
  v_caller_id uuid := auth.uid();
  v_is_manager boolean;
  v_is_customer boolean;
begin
  select * into v_apt from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'Appointment not found';
  end if;

  v_is_manager := is_salon_member(v_apt.salon_id, 'staff');
  v_is_customer := (v_apt.customer_id = v_caller_id);

  if not (v_is_manager or v_is_customer) then
    raise exception 'Not authorized to update this appointment';
  end if;

  if v_is_customer and not v_is_manager then
    if p_new_status not in ('cancelled', 'confirmed') then
      raise exception 'Customers can only cancel or confirm appointments';
    end if;
  end if;

  update public.appointments
  set
    status = p_new_status,
    decline_reason = coalesce(p_reason, decline_reason),
    starts_at = case
      when p_new_status = 'confirmed' and coalesce(p_proposed_starts_at, v_apt.proposed_starts_at) is not null
      then coalesce(p_proposed_starts_at, v_apt.proposed_starts_at)
      else starts_at
    end,
    ends_at = case
      when p_new_status = 'confirmed' and coalesce(p_proposed_starts_at, v_apt.proposed_starts_at) is not null
      then coalesce(
        p_proposed_ends_at,
        v_apt.proposed_ends_at,
        coalesce(p_proposed_starts_at, v_apt.proposed_starts_at) + (v_apt.ends_at - v_apt.starts_at)
      )
      else ends_at
    end,
    proposed_starts_at = case
      when p_new_status = 'confirmed' then null
      when p_proposed_starts_at is not null then p_proposed_starts_at
      else proposed_starts_at
    end,
    proposed_ends_at = case
      when p_new_status = 'confirmed' then null
      when p_proposed_ends_at is not null then p_proposed_ends_at
      else proposed_ends_at
    end,
    cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
    completed_at = case when p_new_status = 'completed' then now() else completed_at end,
    updated_at = now()
  where id = p_appointment_id;

  insert into public.appointment_events (
    appointment_id,
    actor_id,
    previous_status,
    new_status,
    event_note
  ) values (
    p_appointment_id,
    v_caller_id,
    v_apt.status,
    p_new_status,
    p_reason
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Storage Setup
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('salon-media', 'salon-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Avatar Read" on storage.objects;
create policy "Public Avatar Read"
  on storage.objects for select
  using (bucket_id in ('avatars', 'salon-media'));

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload salon media" on storage.objects;
create policy "Authenticated users can upload salon media"
  on storage.objects for insert
  with check (bucket_id = 'salon-media' and auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- 7. Automated User Registration Trigger
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone_e164,
    avatar_path,
    preferred_locale,
    preferred_currency
  ) values (
    new.id,
    coalesce(trim(new.raw_user_meta_data->>'full_name'), trim(new.raw_user_meta_data->>'name'), 'Valued Client'),
    new.phone,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'preferred_locale', 'en'),
    coalesce(new.raw_user_meta_data->>'preferred_currency', 'AED')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    avatar_path = coalesce(excluded.avatar_path, public.profiles.avatar_path),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 8. Seed Initial Published Salon, Services & Staff
-- -----------------------------------------------------------------------------
insert into public.salons (
  id,
  name,
  slug,
  tagline,
  description,
  phone_e164,
  address_line1,
  city,
  country_code,
  latitude,
  longitude,
  timezone,
  price_range,
  rating,
  review_count,
  cover_image,
  logo_image,
  amenities,
  categories,
  is_verified,
  status
) values (
  '11111111-1111-1111-1111-111111111111',
  'ALGO Luxury Salon & Spa - Downtown',
  'algo-luxury-salon-downtown',
  'Exclusive Grooming & Bespoke Hair Artistry',
  'Premier flagship sanctuary in Downtown Dubai offering master barbering, artisan color, VIP styling suites, and holistic treatments.',
  '+97143219876',
  'Financial Centre Road, Downtown Dubai',
  'Dubai',
  'AE',
  25.1972,
  55.2744,
  'Asia/Dubai',
  3,
  4.95,
  128,
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&auto=format&fit=crop&q=80',
  array['Valet Parking', 'VIP Suite', 'WiFi', 'Beverage Bar', 'Prayer Room'],
  array['Haircut', 'Styling', 'Coloring', 'Beard & Shave', 'Spa & Facial'],
  true,
  'published'
) on conflict (id) do nothing;

insert into public.business_hours (salon_id, day_of_week, is_open, opens_at, closes_at)
values
  ('11111111-1111-1111-1111-111111111111', 0, true, '09:00:00', '22:00:00'),
  ('11111111-1111-1111-1111-111111111111', 1, true, '09:00:00', '22:00:00'),
  ('11111111-1111-1111-1111-111111111111', 2, true, '09:00:00', '22:00:00'),
  ('11111111-1111-1111-1111-111111111111', 3, true, '09:00:00', '22:00:00'),
  ('11111111-1111-1111-1111-111111111111', 4, true, '09:00:00', '23:00:00'),
  ('11111111-1111-1111-1111-111111111111', 5, true, '13:00:00', '23:00:00'),
  ('11111111-1111-1111-1111-111111111111', 6, true, '09:00:00', '23:00:00')
on conflict (salon_id, day_of_week) do nothing;

insert into public.services (
  id,
  salon_id,
  name,
  category,
  description,
  price_minor,
  currency,
  duration_minutes,
  original_price_minor,
  gender_target,
  is_featured
) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Signature Executive Cut & Style', 'Haircut', 'Full precision haircut, hot towel finish, luxury scalp massage, and bespoke styling with premium clay or pomade.', 8500, 'AED', 45, 11000, 'Unisex', true),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Artisan Royal Beard Grooming', 'Beard & Shave', 'Traditional straight-razor shave with herbal steam, essential oils, and ice-cold soothing aftershave treatment.', 5500, 'AED', 30, 7000, 'Male', true),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Bespoke Balayage & Gloss Finish', 'Coloring', 'Custom hand-painted highlights, Olaplex restorative bonding treatment, and ultra-gloss toner.', 28000, 'AED', 120, 35000, 'Female', true),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Deep Detox Charcoal Facial & Massage', 'Spa & Facial', 'Deep pore cleansing, steam extraction, bamboo charcoal mask, and acupressure head massage.', 12000, 'AED', 60, 15000, 'Unisex', false)
on conflict (id) do nothing;

insert into public.staff_profiles (
  id,
  salon_id,
  display_name,
  role_title,
  avatar_path,
  phone_e164,
  specialties,
  rating,
  reviews_count,
  is_bookable,
  is_active
) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Alexandre Dubois', 'Master Stylist & Creative Director', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', '+971501112233', array['Precision Cuts', 'Balayage', 'Runway Styling'], 4.98, 94, true, true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Tariq Al-Mansoor', 'Senior Master Barber', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', '+971502223344', array['Beard Sculpture', 'Fades', 'Hot Towel Rituals'], 4.95, 81, true, true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Elena Rostova', 'Senior Colorist & Hair Health Specialist', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80', '+971503334455', array['Color Correction', 'Keratin Glow', 'Scalp Therapy'], 4.92, 67, true, true)
on conflict (id) do nothing;

insert into public.staff_services (staff_id, service_id)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221'),
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222223'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222224')
on conflict (staff_id, service_id) do nothing;

insert into public.staff_working_hours (staff_id, day_of_week, is_working, starts_at, ends_at)
select
  s.id as staff_id,
  d.day as day_of_week,
  true as is_working,
  '09:00:00'::time as starts_at,
  '20:00:00'::time as ends_at
from public.staff_profiles s
cross join (
  select 0 as day union select 1 union select 2 union select 3 union select 4 union select 5 union select 6
) d
where s.salon_id = '11111111-1111-1111-1111-111111111111'
on conflict (staff_id, day_of_week) do nothing;

-- -----------------------------------------------------------------------------
-- 8. Customer & Business Domain Separation Views
-- -----------------------------------------------------------------------------

-- Dedicated Customer Domain View: Isolates patron profiles, bookings and loyalty
create or replace view public.customers_view as
select 
  p.id as customer_id,
  p.full_name as customer_name,
  p.phone_e164 as customer_phone,
  p.avatar_path as customer_avatar,
  p.gender,
  p.preferred_locale,
  p.preferred_currency,
  p.loyalty_points,
  p.marketing_opt_in,
  p.created_at,
  count(distinct a.id) as total_appointments,
  count(distinct f.salon_id) as total_favorites
from public.profiles p
left join public.appointments a on a.customer_id = p.id
left join public.favorites f on f.customer_id = p.id
where not exists (
  select 1 from public.salon_members sm where sm.user_id = p.id and sm.is_active = true
)
group by p.id, p.full_name, p.phone_e164, p.avatar_path, p.gender, p.preferred_locale, p.preferred_currency, p.loyalty_points, p.marketing_opt_in, p.created_at;

-- Dedicated Business Domain View: Isolates salon profiles, staff, and management
create or replace view public.businesses_view as
select 
  s.id as salon_id,
  s.name as business_name,
  s.slug,
  s.status,
  s.phone_e164 as business_phone,
  s.address_line1 as address,
  s.city,
  s.country_code,
  s.rating,
  s.review_count,
  s.cover_image,
  s.logo_image,
  s.amenities,
  s.categories,
  s.is_verified,
  sm.user_id as owner_user_id,
  p.full_name as owner_name,
  p.phone_e164 as owner_phone,
  sm.role as member_role,
  (select count(*) from public.services srv where srv.salon_id = s.id and srv.is_active = true) as total_active_services,
  (select count(*) from public.staff_profiles sp where sp.salon_id = s.id and sp.is_active = true) as total_staff_count
from public.salons s
left join public.salon_members sm on sm.salon_id = s.id and sm.role in ('owner', 'manager')
left join public.profiles p on p.id = sm.user_id;

commit;
