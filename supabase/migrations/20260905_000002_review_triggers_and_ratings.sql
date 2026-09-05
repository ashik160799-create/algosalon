-- -------------------------------------------------------------
-- Migration: Add dynamic salon rating triggers and appointment status guards
-- -------------------------------------------------------------

-- Function to recalculate salon rating and review count automatically
CREATE OR REPLACE FUNCTION public.update_salon_rating_on_review()
RETURNS TRIGGER AS $$
DECLARE
  target_salon_id UUID;
  new_rating NUMERIC;
  new_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_salon_id := OLD.salon_id;
  ELSE
    target_salon_id := NEW.salon_id;
  END IF;

  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0),
    COUNT(*)::integer
  INTO
    new_rating,
    new_count
  FROM public.reviews
  WHERE salon_id = target_salon_id;

  UPDATE public.salons
  SET
    rating = new_rating,
    review_count = new_count
  WHERE id = target_salon_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_salon_rating ON public.reviews;
CREATE TRIGGER trigger_update_salon_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_salon_rating_on_review();
