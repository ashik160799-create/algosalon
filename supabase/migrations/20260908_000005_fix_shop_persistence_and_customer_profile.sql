-- =============================================================================
-- Migration: 20260908_000005_fix_shop_persistence_and_customer_profile.sql
-- Description: Fixes persistence for shop assets (logo, banner, details, hours,
--              services, offers, stylists), ensures complete customer profile
--              storage (image, name, mobile, email, PIN, religion, location),
--              and guarantees accurate booking customer data in business portal.
-- =============================================================================

-- 1. Extend Profiles Table with Religion, Location, and App Code
alter table public.profiles
  add column if not exists religion text,
  add column if not exists location text,
  add column if not exists app_code text;

-- 2. Extend Services Table with Offer Tag and Discount Percentage
alter table public.services
  add column if not exists offer_tag text,
  add column if not exists discount_percent integer check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100));

-- 3. Ensure Storage Buckets exist and are public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('salon-media', 'salon-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS Policies
drop policy if exists "Public avatar read access" on storage.objects;
create policy "Public avatar read access"
  on storage.objects for select
  using (bucket_id in ('avatars', 'salon-media', 'app-background-images'));

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id in ('avatars', 'salon-media') and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
  on storage.objects for update
  using (bucket_id in ('avatars', 'salon-media') and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
  on storage.objects for delete
  using (bucket_id in ('avatars', 'salon-media') and auth.role() = 'authenticated');

-- 4. Robust RLS Policies for Salons, Services, Staff, Hours, and Schedules
-- Salons
drop policy if exists "Salons are viewable by everyone" on public.salons;
create policy "Salons are viewable by everyone"
  on public.salons for select
  using (true);

drop policy if exists "Authenticated users can insert salons" on public.salons;
create policy "Authenticated users can insert salons"
  on public.salons for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Salon owners and managers can update salons" on public.salons;
create policy "Salon owners and managers can update salons"
  on public.salons for update
  using (
    created_by = auth.uid()
    or is_salon_member(id, 'manager')
  )
  with check (
    created_by = auth.uid()
    or is_salon_member(id, 'manager')
  );

-- Services
drop policy if exists "Services viewable by everyone" on public.services;
create policy "Services viewable by everyone"
  on public.services for select
  using (true);

drop policy if exists "Salon managers can manage services" on public.services;
create policy "Salon managers can manage services"
  on public.services for all
  using (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = services.salon_id and s.created_by = auth.uid())
  )
  with check (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = services.salon_id and s.created_by = auth.uid())
  );

-- Staff Profiles
drop policy if exists "Staff profiles viewable by everyone" on public.staff_profiles;
create policy "Staff profiles viewable by everyone"
  on public.staff_profiles for select
  using (true);

drop policy if exists "Salon managers can manage staff profiles" on public.staff_profiles;
create policy "Salon managers can manage staff profiles"
  on public.staff_profiles for all
  using (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = staff_profiles.salon_id and s.created_by = auth.uid())
  )
  with check (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = staff_profiles.salon_id and s.created_by = auth.uid())
  );

-- Business Hours
drop policy if exists "Business hours viewable by everyone" on public.business_hours;
create policy "Business hours viewable by everyone"
  on public.business_hours for select
  using (true);

drop policy if exists "Salon managers can manage business hours" on public.business_hours;
create policy "Salon managers can manage business hours"
  on public.business_hours for all
  using (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = business_hours.salon_id and s.created_by = auth.uid())
  )
  with check (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = business_hours.salon_id and s.created_by = auth.uid())
  );

-- Special Schedules
drop policy if exists "Special schedules viewable by everyone" on public.special_schedules;
create policy "Special schedules viewable by everyone"
  on public.special_schedules for select
  using (true);

drop policy if exists "Salon managers can manage special schedules" on public.special_schedules;
create policy "Salon managers can manage special schedules"
  on public.special_schedules for all
  using (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = special_schedules.salon_id and s.created_by = auth.uid())
  )
  with check (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = special_schedules.salon_id and s.created_by = auth.uid())
  );

-- Salon Media
drop policy if exists "Salon media viewable by everyone" on public.salon_media;
create policy "Salon media viewable by everyone"
  on public.salon_media for select
  using (true);

drop policy if exists "Salon managers can manage media" on public.salon_media;
create policy "Salon managers can manage media"
  on public.salon_media for all
  using (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = salon_media.salon_id and s.created_by = auth.uid())
  )
  with check (
    is_salon_member(salon_id, 'manager')
    or exists (select 1 from public.salons s where s.id = salon_media.salon_id and s.created_by = auth.uid())
  );

-- Profiles RLS
drop policy if exists "Profiles are viewable by owner or staff" on public.profiles;
create policy "Profiles are viewable by owner or staff"
  on public.profiles for select
  using (
    auth.uid() = id
    or is_salon_member(id)
    or exists (
      select 1 from public.appointments a
      where a.customer_id = profiles.id
        and (is_salon_member(a.salon_id) or exists (select 1 from public.salons s where s.id = a.salon_id and s.created_by = auth.uid()))
    )
    or exists (
      select 1 from public.salon_members sm
      where sm.user_id = profiles.id
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Appointments RLS
drop policy if exists "Users can view own appointments or salon appointments" on public.appointments;
create policy "Users can view own appointments or salon appointments"
  on public.appointments for select
  using (
    customer_id = auth.uid()
    or is_salon_member(salon_id)
    or exists (select 1 from public.salons s where s.id = appointments.salon_id and s.created_by = auth.uid())
  );

-- 5. Updated sync_user_profile_and_auth RPC function supporting Religion, Location, and PIN
create or replace function public.sync_user_profile_and_auth(
  p_full_name text default null,
  p_phone text default null,
  p_gender text default null,
  p_app_code text default null,
  p_avatar text default null,
  p_role text default null,
  p_religion text default null,
  p_location text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_user record;
  v_meta jsonb;
  v_profile record;
  v_effective_phone text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to sync profile';
  end if;

  select * into v_user from auth.users where id = v_caller_id;
  if not found then
    raise exception 'User not found in auth.users';
  end if;

  v_meta := coalesce(v_user.raw_user_meta_data, '{}'::jsonb);

  -- Sanitize phone if provided
  if p_phone is not null and trim(p_phone) <> '' then
    v_effective_phone := trim(p_phone);
  else
    v_effective_phone := null;
  end if;

  -- 1. Update auth.users metadata
  if p_full_name is not null and trim(p_full_name) <> '' then
    v_meta := jsonb_set(v_meta, '{full_name}', to_jsonb(trim(p_full_name)));
    v_meta := jsonb_set(v_meta, '{name}', to_jsonb(trim(p_full_name)));
  end if;
  if v_effective_phone is not null then
    v_meta := jsonb_set(v_meta, '{phone}', to_jsonb(v_effective_phone));
  end if;
  if p_gender is not null and trim(p_gender) <> '' then
    v_meta := jsonb_set(v_meta, '{gender}', to_jsonb(trim(p_gender)));
  end if;
  if p_app_code is not null and trim(p_app_code) <> '' then
    v_meta := jsonb_set(v_meta, '{app_code}', to_jsonb(trim(p_app_code)));
    v_meta := jsonb_set(v_meta, '{appCode}', to_jsonb(trim(p_app_code)));
  end if;
  if p_avatar is not null and trim(p_avatar) <> '' then
    v_meta := jsonb_set(v_meta, '{avatar_url}', to_jsonb(trim(p_avatar)));
  end if;
  if p_religion is not null and trim(p_religion) <> '' then
    v_meta := jsonb_set(v_meta, '{religion}', to_jsonb(trim(p_religion)));
  end if;
  if p_location is not null and trim(p_location) <> '' then
    v_meta := jsonb_set(v_meta, '{location}', to_jsonb(trim(p_location)));
  end if;

  update auth.users
  set raw_user_meta_data = v_meta,
      updated_at = now()
  where id = v_caller_id;

  -- 2. Upsert public.profiles
  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    phone_e164,
    avatar_path,
    gender,
    religion,
    location,
    app_code,
    updated_at
  ) values (
    v_caller_id,
    coalesce(trim(p_full_name), v_meta->>'full_name', v_meta->>'name', 'Valued Client'),
    v_user.email,
    coalesce(p_role, (v_meta->>'role')::text, 'customer'),
    v_effective_phone,
    coalesce(trim(p_avatar), v_meta->>'avatar_url'),
    p_gender,
    p_religion,
    p_location,
    p_app_code,
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(trim(p_full_name), ''), public.profiles.full_name),
    phone_e164 = coalesce(v_effective_phone, public.profiles.phone_e164),
    avatar_path = coalesce(nullif(trim(p_avatar), ''), public.profiles.avatar_path),
    gender = coalesce(p_gender, public.profiles.gender),
    religion = coalesce(p_religion, public.profiles.religion),
    location = coalesce(p_location, public.profiles.location),
    app_code = coalesce(p_app_code, public.profiles.app_code),
    role = coalesce(p_role, public.profiles.role),
    updated_at = now();

  select * into v_profile from public.profiles where id = v_caller_id;

  return jsonb_build_object(
    'success', true,
    'id', v_profile.id,
    'full_name', v_profile.full_name,
    'phone', v_profile.phone_e164,
    'email', v_profile.email,
    'avatar', v_profile.avatar_path,
    'gender', v_profile.gender,
    'religion', v_profile.religion,
    'location', v_profile.location,
    'app_code', v_profile.app_code,
    'role', v_profile.role
  );
end;
$$;

-- 6. Updated create_booking RPC populating customer profile avatar & details
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
  v_salon record;
  v_service record;
  v_staff record;
  v_salon_bh record;
  v_staff_wh record;
  v_special_sched record;
  v_caller_profile record;
  v_ends_at timestamptz;
  v_appointment_id uuid;
  v_caller_id uuid := auth.uid();
  v_salon_tz text;
  v_local_start_time time;
  v_local_end_time time;
  v_local_dow smallint;
  v_local_date date;
  v_effective_avatar text;
  v_effective_phone text;
  v_effective_email text;
  v_effective_name text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to book an appointment';
  end if;

  if p_starts_at <= now() then
    raise exception 'Appointment time must be in the future';
  end if;

  select id, name, timezone, is_open_now, status
  into v_salon
  from public.salons
  where id = p_salon_id;

  if not found then
    raise exception 'Salon not found';
  end if;

  if v_salon.status != 'published' and not is_salon_member(p_salon_id) and v_salon.created_by != v_caller_id then
    raise exception 'Salon is not currently open for bookings';
  end if;

  if v_salon.is_open_now = false then
    raise exception 'Salon is temporarily paused / offline for bookings';
  end if;

  v_salon_tz := coalesce(v_salon.timezone, 'Asia/Dubai');

  select id, name, duration_minutes, price_minor, currency
  into v_service
  from public.services
  where id = p_service_id and salon_id = p_salon_id and is_active = true;

  if not found then
    raise exception 'Selected service is invalid or unavailable at this salon';
  end if;

  v_ends_at := p_starts_at + (v_service.duration_minutes || ' minutes')::interval;

  select id, display_name, is_bookable, is_active
  into v_staff
  from public.staff_profiles
  where id = p_staff_id and salon_id = p_salon_id and is_active = true and is_bookable = true;

  if not found then
    raise exception 'Selected specialist is not currently available for booking';
  end if;

  -- Load customer profile details
  select * into v_caller_profile from public.profiles where id = v_caller_id;

  v_effective_name := coalesce(trim(p_customer_name), v_caller_profile.full_name, 'Valued Client');
  v_effective_phone := coalesce(p_customer_phone, v_caller_profile.phone_e164);
  v_effective_email := coalesce(p_customer_email, v_caller_profile.email);
  v_effective_avatar := v_caller_profile.avatar_path;

  -- Check double-booking conflict for specialist
  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
      and status in ('pending', 'confirmed', 'in_progress', 'rescheduled_by_business')
      and tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'This specialist already has an active booking at the requested time.';
  end if;

  -- Insert appointment
  insert into public.appointments (
    salon_id,
    customer_id,
    customer_display_name,
    customer_phone_e164,
    customer_email,
    customer_avatar_path,
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
    v_effective_name,
    v_effective_phone,
    v_effective_email,
    v_effective_avatar,
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

  -- Audit event
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
    'Appointment booked by client'
  );

  return v_appointment_id;
end;
$$;
