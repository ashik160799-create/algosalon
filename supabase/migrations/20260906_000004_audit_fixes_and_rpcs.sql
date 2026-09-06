-- =============================================================================
-- Migration: 20260906_000004_audit_fixes_and_rpcs.sql
-- Description: Fix missing RPCs, role protection, salon insert policy,
--              booking auth gating, parameter matching, and special schedule fixes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Missing RPC: check_email_confirmed
-- -----------------------------------------------------------------------------
create or replace function public.check_email_confirmed(email_to_check text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_confirmed boolean := false;
begin
  if email_to_check is null or trim(email_to_check) = '' then
    return false;
  end if;

  select (email_confirmed_at is not null or confirmed_at is not null)
  into v_confirmed
  from auth.users
  where lower(email) = lower(trim(email_to_check))
  limit 1;

  return coalesce(v_confirmed, false);
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Missing RPC: check_recovery_link_verified
-- -----------------------------------------------------------------------------
create or replace function public.check_recovery_link_verified(
  email_to_check text,
  sent_after timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_verified boolean := false;
begin
  if email_to_check is null or trim(email_to_check) = '' then
    return false;
  end if;

  select case 
    when sent_after is not null then (recovery_sent_at is null or updated_at > sent_after or last_sign_in_at > sent_after)
    else (email_confirmed_at is not null or confirmed_at is not null)
  end
  into v_verified
  from auth.users
  where lower(email) = lower(trim(email_to_check))
  limit 1;

  return coalesce(v_verified, false);
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Missing RPC: check_user_account_status
-- -----------------------------------------------------------------------------
create or replace function public.check_user_account_status(email_to_check text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_role text := 'customer';
  v_user record;
  v_profile record;
begin
  if email_to_check is null or trim(email_to_check) = '' then
    return jsonb_build_object('exists', false);
  end if;

  select id, email, raw_user_meta_data into v_user
  from auth.users
  where lower(email) = lower(trim(email_to_check))
  limit 1;

  if not found then
    return jsonb_build_object('exists', false);
  end if;

  v_user_id := v_user.id;

  select * into v_profile
  from public.profiles
  where id = v_user_id;

  if (v_profile.role = 'business') or 
     (v_user.raw_user_meta_data->>'role' = 'business') or 
     (v_user.raw_user_meta_data->>'account_type' = 'Business') or
     exists (select 1 from public.salon_members where user_id = v_user_id and is_active = true) then
    v_role := 'business';
  end if;

  return jsonb_build_object(
    'exists', true,
    'id', v_user_id,
    'email', v_user.email,
    'role', v_role,
    'accountType', case when v_role = 'business' then 'Business' else 'Customer' end,
    'fullName', coalesce(v_profile.full_name, v_user.raw_user_meta_data->>'full_name', ''),
    'phone', coalesce(v_profile.phone_e164, v_user.raw_user_meta_data->>'phone', '')
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Missing RPC: sync_user_profile_and_auth
-- -----------------------------------------------------------------------------
create or replace function public.sync_user_profile_and_auth(
  p_full_name text default null,
  p_phone text default null,
  p_gender text default null,
  p_app_code text default null,
  p_avatar text default null,
  p_role text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_current_meta jsonb;
  v_new_meta jsonb;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to sync profile';
  end if;

  -- 1. Upsert public.profiles
  insert into public.profiles (
    id,
    full_name,
    phone_e164,
    avatar_url,
    role,
    updated_at
  ) values (
    v_caller_id,
    p_full_name,
    p_phone,
    p_avatar,
    coalesce(p_role, 'customer')::public.user_role,
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(p_full_name, public.profiles.full_name),
    phone_e164 = coalesce(p_phone, public.profiles.phone_e164),
    avatar_url = coalesce(p_avatar, public.profiles.avatar_url),
    role = case when p_role is not null then p_role::public.user_role else public.profiles.role end,
    updated_at = now();

  -- 2. Sync metadata in auth.users
  select coalesce(raw_user_meta_data, '{}'::jsonb) into v_current_meta
  from auth.users
  where id = v_caller_id;

  v_new_meta := v_current_meta;
  if p_full_name is not null then
    v_new_meta := jsonb_set(v_new_meta, '{full_name}', to_jsonb(p_full_name));
    v_new_meta := jsonb_set(v_new_meta, '{name}', to_jsonb(p_full_name));
  end if;
  if p_phone is not null then
    v_new_meta := jsonb_set(v_new_meta, '{phone}', to_jsonb(p_phone));
  end if;
  if p_gender is not null then
    v_new_meta := jsonb_set(v_new_meta, '{gender}', to_jsonb(p_gender));
  end if;
  if p_avatar is not null then
    v_new_meta := jsonb_set(v_new_meta, '{avatar_url}', to_jsonb(p_avatar));
  end if;
  if p_role is not null then
    v_new_meta := jsonb_set(v_new_meta, '{role}', to_jsonb(p_role));
    v_new_meta := jsonb_set(v_new_meta, '{account_type}', to_jsonb(case when p_role = 'business' then 'Business' else 'Customer' end));
  end if;

  update auth.users
  set raw_user_meta_data = v_new_meta, updated_at = now()
  where id = v_caller_id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Missing RPC: delete_user_account_complete
-- -----------------------------------------------------------------------------
create or replace function public.delete_user_account_complete(
  email_to_delete text default null,
  user_id_to_delete uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_target_id uuid;
begin
  if v_caller_id is null and user_id_to_delete is null and email_to_delete is null then
    raise exception 'Not authenticated or target missing';
  end if;

  v_target_id := coalesce(v_caller_id, user_id_to_delete);

  if v_target_id is null and email_to_delete is not null then
    select id into v_target_id from auth.users where lower(email) = lower(trim(email_to_delete)) limit 1;
  end if;

  if v_target_id is null then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;

  -- Only allow caller to delete themselves unless executed in administrative context
  if v_caller_id is not null and v_caller_id <> v_target_id then
    raise exception 'Cannot delete another user account';
  end if;

  delete from public.salon_members where user_id = v_target_id;
  delete from public.favorites where customer_id = v_target_id;
  delete from public.notifications where user_id = v_target_id;
  delete from public.reviews where customer_id = v_target_id;
  delete from public.appointments where customer_id = v_target_id;
  delete from public.profiles where id = v_target_id;
  delete from auth.users where id = v_target_id;

  return jsonb_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Role Protection Trigger on profiles
--    Prevents direct client UPDATE calls from self-promoting role to 'business'
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Prevent direct update of role column by standard clients
  if NEW.role is distinct from OLD.role and current_setting('algo.allow_role_change', true) is distinct from 'on' then
    -- Allow if called within security definer functions (e.g. register_business_salon / sync_user_profile_and_auth)
    if pg_trigger_depth() <= 1 and current_user = 'authenticated' then
      NEW.role := OLD.role;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- 7. Restrict Salons INSERT Policy
--    Salons must only be created via the register_business_salon RPC
-- -----------------------------------------------------------------------------
drop policy if exists "Authenticated users can create a salon" on public.salons;
create policy "Authenticated users can create a salon"
  on public.salons for insert
  with check (
    -- Allow insertion when executing inside security definer RPC
    auth.uid() = created_by or auth.role() = 'service_role'
  );

-- -----------------------------------------------------------------------------
-- 8. Updated register_business_salon RPC
--    Accepts both p_salon_name & p_name, handles dynamic country_code,
--    price_range, cover_image, and sets initial verification to unverified.
-- -----------------------------------------------------------------------------
create or replace function public.register_business_salon(
  p_salon_name text default null,
  p_name text default null,
  p_phone text default null,
  p_city text default 'Dubai',
  p_address text default 'Downtown',
  p_categories text[] default array['Haircut', 'Styling'],
  p_amenities text[] default array['WiFi', 'Valet Parking'],
  p_timezone text default 'Asia/Dubai',
  p_country_code text default null,
  p_price_range int default 2,
  p_cover_image text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_caller_id uuid := auth.uid();
  v_salon_id uuid;
  v_slug text;
  v_cleaned_name text;
  v_resolved_country text;
begin
  if v_caller_id is null then
    raise exception 'Authentication required to register a business';
  end if;

  v_cleaned_name := trim(coalesce(p_salon_name, p_name, ''));
  if char_length(v_cleaned_name) < 2 then
    raise exception 'Salon name must be at least 2 characters';
  end if;

  -- Infer or assign country code
  if p_country_code is not null and trim(p_country_code) <> '' then
    v_resolved_country := upper(trim(p_country_code));
  elsif lower(p_city) like '%mumbai%' or lower(p_city) like '%delhi%' or lower(p_city) like '%bangalore%' then
    v_resolved_country := 'IN';
  elsif lower(p_city) like '%london%' or lower(p_city) like '%manchester%' then
    v_resolved_country := 'GB';
  elsif lower(p_city) like '%riyadh%' or lower(p_city) like '%jeddah%' then
    v_resolved_country := 'SA';
  elsif lower(p_city) like '%new york%' or lower(p_city) like '%los angeles%' then
    v_resolved_country := 'US';
  else
    v_resolved_country := 'AE';
  end if;

  -- Generate clean unique slug
  v_slug := lower(regexp_replace(v_cleaned_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8);

  -- 1. Ensure caller profile is marked business
  update public.profiles
  set role = 'business', updated_at = now()
  where id = v_caller_id;

  -- 2. Create Salon record
  insert into public.salons (
    created_by,
    name,
    slug,
    phone_e164,
    address_line1,
    city,
    country_code,
    timezone,
    categories,
    amenities,
    price_range,
    cover_image,
    status,
    is_open_now,
    is_verified
  ) values (
    v_caller_id,
    v_cleaned_name,
    v_slug,
    p_phone,
    p_address,
    p_city,
    v_resolved_country,
    coalesce(p_timezone, 'Asia/Dubai'),
    coalesce(p_categories, array['Haircut', 'Styling']),
    coalesce(p_amenities, array['WiFi', 'Valet Parking']),
    coalesce(p_price_range, 2),
    p_cover_image,
    'published',
    true,
    false -- Requires verification review
  )
  returning id into v_salon_id;

  -- 3. Create Salon Member record linking user as owner
  insert into public.salon_members (
    salon_id,
    user_id,
    role,
    is_active
  ) values (
    v_salon_id,
    v_caller_id,
    'owner',
    true
  )
  on conflict (salon_id, user_id) do update set role = 'owner', is_active = true;

  -- 4. Create default weekly business hours
  insert into public.business_hours (salon_id, day_of_week, is_open, opens_at, closes_at)
  values
    (v_salon_id, 0, true, '09:00:00', '21:00:00'),
    (v_salon_id, 1, true, '09:00:00', '21:00:00'),
    (v_salon_id, 2, true, '09:00:00', '21:00:00'),
    (v_salon_id, 3, true, '09:00:00', '21:00:00'),
    (v_salon_id, 4, true, '09:00:00', '21:00:00'),
    (v_salon_id, 5, true, '13:00:00', '22:00:00'),
    (v_salon_id, 6, true, '09:00:00', '22:00:00')
  on conflict (salon_id, day_of_week) do nothing;

  return v_salon_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. Gated create_booking RPC (Rejects unauthenticated requests)
-- -----------------------------------------------------------------------------
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
  v_ends_at timestamptz;
  v_appointment_id uuid;
  v_caller_id uuid := auth.uid();
  v_salon_tz text;
  v_local_start_time time;
  v_local_end_time time;
  v_local_dow smallint;
  v_local_date date;
  v_owner record;
begin
  -- Enforce Authentication
  if v_caller_id is null then
    raise exception 'Authentication required to book an appointment';
  end if;

  -- 1. Validate future time
  if p_starts_at <= now() then
    raise exception 'Appointment time must be in the future';
  end if;

  -- 2. Validate salon exists and is published
  select id, name, timezone, is_open_now, status
  into v_salon
  from public.salons
  where id = p_salon_id;

  if not found then
    raise exception 'Salon not found';
  end if;

  if v_salon.status != 'published' and not is_salon_member(p_salon_id) then
    raise exception 'Salon is not currently open for bookings';
  end if;

  if v_salon.is_open_now = false then
    raise exception 'Salon is temporarily paused / offline for bookings';
  end if;

  v_salon_tz := coalesce(v_salon.timezone, 'Asia/Dubai');

  -- 3. Validate service
  select id, name, duration_minutes, price_minor, currency
  into v_service
  from public.services
  where id = p_service_id and salon_id = p_salon_id and is_active = true;

  if not found then
    raise exception 'Selected service is invalid or unavailable at this salon';
  end if;

  -- Calculate appointment end time
  v_ends_at := p_starts_at + (v_service.duration_minutes || ' minutes')::interval;

  -- 4. Validate specialist
  select id, display_name, is_bookable, is_active
  into v_staff
  from public.staff_profiles
  where id = p_staff_id and salon_id = p_salon_id and is_active = true and is_bookable = true;

  if not found then
    raise exception 'Selected specialist is not currently available for booking';
  end if;

  -- 5. Validate staff provides this service (if mappings are configured)
  if exists (select 1 from public.staff_services where staff_id = p_staff_id) then
    if not exists (
      select 1 from public.staff_services
      where staff_id = p_staff_id and service_id = p_service_id
    ) then
      raise exception 'Selected specialist does not offer the requested service';
    end if;
  end if;

  -- 6. Extract date and time in the salon's authoritative timezone
  v_local_date := (p_starts_at at time zone v_salon_tz)::date;
  v_local_start_time := (p_starts_at at time zone v_salon_tz)::time;
  v_local_end_time := (v_ends_at at time zone v_salon_tz)::time;
  v_local_dow := extract(dow from (p_starts_at at time zone v_salon_tz))::smallint;

  -- 7. Check special holiday schedule override
  select * into v_special_sched
  from public.special_schedules
  where salon_id = p_salon_id and date = v_local_date;

  if found then
    if v_special_sched.is_open = false then
      raise exception 'Salon is closed on % for special schedule: %', v_local_date, v_special_sched.title;
    end if;
    if v_special_sched.opens_at is not null and v_special_sched.closes_at is not null then
      if v_local_start_time < v_special_sched.opens_at or v_local_end_time > v_special_sched.closes_at then
        raise exception 'Appointment extends outside special holiday hours (% - %)',
          v_special_sched.opens_at, v_special_sched.closes_at;
      end if;
    end if;
  else
    -- Standard salon business hours check
    select * into v_salon_bh
    from public.business_hours
    where salon_id = p_salon_id and day_of_week = v_local_dow;

    if found then
      if v_salon_bh.is_open = false then
        raise exception 'Salon is closed on this day of the week';
      end if;
      if v_local_start_time < v_salon_bh.opens_at or v_local_end_time > v_salon_bh.closes_at then
        raise exception 'Appointment extends beyond salon operating hours (% - %)',
          v_salon_bh.opens_at, v_salon_bh.closes_at;
      end if;
    end if;
  end if;

  -- 8. Check staff working hours schedule
  select * into v_staff_wh
  from public.staff_working_hours
  where staff_id = p_staff_id and day_of_week = v_local_dow;

  if found then
    if v_staff_wh.is_working = false then
      raise exception 'Specialist is not scheduled to work on this day';
    end if;
    if v_staff_wh.starts_at is not null and v_staff_wh.ends_at is not null then
      if v_local_start_time < v_staff_wh.starts_at or v_local_end_time > v_staff_wh.ends_at then
        raise exception 'Appointment is outside the specialist scheduled working shift (% - %)',
          v_staff_wh.starts_at, v_staff_wh.ends_at;
      end if;
    end if;
  end if;

  -- 9. Check double-booking conflict for the specialist
  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
      and status in ('pending', 'confirmed', 'in_progress', 'rescheduled_by_business')
      and tstzrange(starts_at, ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'This specialist already has an active booking at the requested time.';
  end if;

  -- 10. Insert appointment
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
    'Booking requested by customer'
  );

  -- 11. Automatically notify salon managers
  for v_owner in (
    select user_id from public.salon_members
    where salon_id = p_salon_id and is_active = true
  ) loop
    insert into public.notifications (
      user_id,
      user_type,
      title,
      message,
      type,
      link_tab,
      appointment_id
    ) values (
      v_owner.user_id,
      'business',
      'New Booking Request',
      coalesce(p_customer_name, 'A client') || ' requested an appointment for ' || v_service.name || '.',
      'booking',
      'appointments',
      v_appointment_id
    );
  end loop;

  return v_appointment_id;
end;
$$;
