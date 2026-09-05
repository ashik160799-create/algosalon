-- =============================================================================
-- ALGO SALON SPOT-PRO: Seed Data for Initial Live Environment
-- Adds initial luxury salons, services, staff, and working hours
-- =============================================================================

begin;

-- 1. Insert Initial Featured Salon
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

-- 2. Insert Business Hours for Downtown Salon
insert into public.business_hours (salon_id, day_of_week, is_open, opens_at, closes_at)
values
  ('11111111-1111-1111-1111-111111111111', 0, true, '09:00:00', '22:00:00'), -- Sun
  ('11111111-1111-1111-1111-111111111111', 1, true, '09:00:00', '22:00:00'), -- Mon
  ('11111111-1111-1111-1111-111111111111', 2, true, '09:00:00', '22:00:00'), -- Tue
  ('11111111-1111-1111-1111-111111111111', 3, true, '09:00:00', '22:00:00'), -- Wed
  ('11111111-1111-1111-1111-111111111111', 4, true, '09:00:00', '23:00:00'), -- Thu
  ('11111111-1111-1111-1111-111111111111', 5, true, '13:00:00', '23:00:00'), -- Fri
  ('11111111-1111-1111-1111-111111111111', 6, true, '09:00:00', '23:00:00')  -- Sat
on conflict (salon_id, day_of_week) do nothing;

-- 3. Insert Core Services
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
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Signature Executive Cut & Style',
    'Haircut',
    'Full precision haircut, hot towel finish, luxury scalp massage, and bespoke styling with premium clay or pomade.',
    8500, -- 85.00 AED
    'AED',
    45,
    11000,
    'Unisex',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Artisan Royal Beard Grooming',
    'Beard & Shave',
    'Traditional straight-razor shave with herbal steam, essential oils, and ice-cold soothing aftershave treatment.',
    5500, -- 55.00 AED
    'AED',
    30,
    7000,
    'Male',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Bespoke Balayage & Gloss Finish',
    'Coloring',
    'Custom hand-painted highlights, Olaplex restorative bonding treatment, and ultra-gloss toner.',
    28000, -- 280.00 AED
    'AED',
    120,
    35000,
    'Female',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111111',
    'Deep Detox Charcoal Facial & Massage',
    'Spa & Facial',
    'Deep pore cleansing, steam extraction, bamboo charcoal mask, and acupressure head massage.',
    12000, -- 120.00 AED
    'AED',
    60,
    15000,
    'Unisex',
    false
  )
on conflict (id) do nothing;

-- 4. Insert Staff Profiles
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
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Alexandre Dubois',
    'Master Stylist & Creative Director',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    '+971501112233',
    array['Precision Cuts', 'Balayage', 'Runway Styling'],
    4.98,
    94,
    true,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'Tariq Al-Mansoor',
    'Senior Master Barber',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    '+971502223344',
    array['Beard Sculpture', 'Fades', 'Hot Towel Rituals'],
    4.95,
    81,
    true,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Elena Rostova',
    'Senior Colorist & Hair Health Specialist',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    '+971503334455',
    array['Color Correction', 'Keratin Glow', 'Scalp Therapy'],
    4.92,
    67,
    true,
    true
  )
on conflict (id) do nothing;

-- 5. Map Staff to Services
insert into public.staff_services (staff_id, service_id)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221'),
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222223'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222224')
on conflict (staff_id, service_id) do nothing;

-- 6. Insert Staff Working Hours (Daily 09:00 - 20:00)
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

commit;
