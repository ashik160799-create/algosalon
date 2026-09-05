-- =============================================================================
-- Migration: Automated Salon Rating & Review Count Trigger
-- =============================================================================

create or replace function public.update_salon_rating_on_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_salon_id uuid;
  v_avg_rating numeric(3,2);
  v_review_count integer;
begin
  if tg_op = 'DELETE' then
    v_salon_id := old.salon_id;
  else
    v_salon_id := new.salon_id;
  end if;

  select coalesce(round(avg(rating)::numeric, 2), 5.0), count(*)
  into v_avg_rating, v_review_count
  from public.reviews
  where salon_id = v_salon_id;

  update public.salons
  set
    rating = v_avg_rating,
    reviews_count = v_review_count,
    updated_at = now()
  where id = v_salon_id;

  return null;
end;
$$;

drop trigger if exists on_review_changed on public.reviews;
create trigger on_review_changed
  after insert or update or delete on public.reviews
  for each row execute function public.update_salon_rating_on_review();
