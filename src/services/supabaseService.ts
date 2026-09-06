/**
 * ALGO SALON SPOT-PRO — Supabase Data & Security Services Layer
 * Bridges frontend state to live Supabase Postgres schema with RLS and guarded RPCs.
 */
import { supabaseALGOsalonClient, isSupabaseConfigured } from '../supabaseALGOsalonClient';
import {
  Salon,
  ServiceItem,
  StaffMember,
  Appointment,
  Review,
  NotificationItem,
  AppointmentStatus,
  WorkingDayHour,
  SpecialSchedule,
  SpecialDateSchedule,
  Customer,
  Business,
  Role,
} from '../types';
import { sanitizeEmail } from '../utils/authErrorHandling';
import { getLocalDateString } from '../utils/dateTimeUtils';

export function getErrorMessage(err: unknown, fallback: string = 'Network error occurred'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

interface DbSpecialRow {
  id?: string;
  salon_id?: string;
  date: string;
  title?: string;
  note?: string;
  is_open: boolean;
  opens_at?: string;
  closes_at?: string;
  reason?: string;
}

/**
 * Maps raw database salon and related rows into frontend Salon type
 */
export async function fetchSalonsFromDb(): Promise<{
  salons: Salon[];
  services: ServiceItem[];
  staff: StaffMember[];
} | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const [salonsRes, servicesRes, staffRes, hoursRes, specialRes] = await Promise.all([
      supabaseALGOsalonClient
        .from('salons')
        .select('*')
        .eq('status', 'published')
        .order('rating', { ascending: false }),
      supabaseALGOsalonClient
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false }),
      supabaseALGOsalonClient
        .from('staff_profiles')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false }),
      supabaseALGOsalonClient
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true }),
      supabaseALGOsalonClient
        .from('special_schedules')
        .select('*'),
    ]);

    if (salonsRes.error || !salonsRes.data || salonsRes.data.length === 0) {
      console.warn('Salons fetch note:', salonsRes.error?.message || 'No published salons yet');
      return null;
    }

    const dbSalons = salonsRes.data;
    const dbServices = servicesRes.data || [];
    const dbStaff = staffRes.data || [];
    const dbHours = hoursRes.data || [];
    const dbSpecials: DbSpecialRow[] = (specialRes.data as DbSpecialRow[]) || [];

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Map salons
    const mappedSalons: Salon[] = dbSalons.map(s => {
      const salonHours: WorkingDayHour[] = dbHours
        .filter(h => h.salon_id === s.id)
        .map(h => ({
          day: DAY_NAMES[h.day_of_week] || 'Monday',
          isOpen: h.is_open,
          open: h.opens_at ? h.opens_at.slice(0, 5) : '09:00',
          close: h.closes_at ? h.closes_at.slice(0, 5) : '21:00',
        }));

      const salonSpecials: SpecialDateSchedule[] = dbSpecials
        .filter((ss: DbSpecialRow) => ss.salon_id === s.id)
        .map((ss: DbSpecialRow) => ({
          id: ss.id || ss.date,
          date: ss.date,
          title: ss.title || ss.note || 'Special Hours',
          isOpen: ss.is_open,
          open: ss.opens_at ? ss.opens_at.slice(0, 5) : '09:00',
          close: ss.closes_at ? ss.closes_at.slice(0, 5) : '21:00',
          reason: ss.reason || ss.note || undefined,
        }));

      const priceSigns: Record<number, '$' | '$$' | '$$$' | '$$$$'> = {
        1: '$',
        2: '$$',
        3: '$$$',
        4: '$$$$',
      };

      return {
        id: s.id,
        name: s.name,
        tagline: s.tagline || '',
        description: s.description || '',
        address: s.address_line1 + (s.address_line2 ? `, ${s.address_line2}` : ''),
        city: s.city,
        mapUrl: s.map_url || undefined,
        distanceKm: 1.2,
        lat: s.latitude !== null && s.latitude !== undefined && !isNaN(Number(s.latitude)) ? Number(s.latitude) : undefined,
        lng: s.longitude !== null && s.longitude !== undefined && !isNaN(Number(s.longitude)) ? Number(s.longitude) : undefined,
        phone: s.phone_e164,
        rating: Number(s.rating) || 4.9,
        reviewCount: s.review_count || 0,
        priceRange: priceSigns[s.price_range] || '$$',
        image: s.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        coverImage: s.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        logo: s.logo_image || undefined,
        amenities: s.amenities || [],
        isOpenNow: s.is_open_now ?? true,
        timezone: s.timezone || 'Asia/Dubai',
        workingHours: salonHours.length > 0 ? salonHours : [
          { day: 'Monday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Tuesday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Wednesday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Thursday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Friday', isOpen: true, open: '13:00', close: '22:00' },
          { day: 'Saturday', isOpen: true, open: '09:00', close: '22:00' },
          { day: 'Sunday', isOpen: true, open: '09:00', close: '21:00' },
        ],
        specialSchedules: salonSpecials,
        categories: s.categories || ['Haircut', 'Styling', 'Coloring'],
        featured: true,
        isVerified: s.is_verified,
        startingPrice: 50,
      };
    });

    // Map services
    const mappedServices: ServiceItem[] = dbServices.map(srv => ({
      id: srv.id,
      salonId: srv.salon_id,
      name: srv.name,
      category: srv.category as any,
      price: Math.round((srv.price_minor || 0) / 100),
      originalPrice: srv.original_price_minor ? Math.round(srv.original_price_minor / 100) : undefined,
      durationMinutes: srv.duration_minutes,
      description: srv.description || '',
      image: srv.image_path || undefined,
      genderTarget: srv.gender_target || 'Unisex',
      isPopular: srv.is_featured,
    }));

    // Map staff
    const mappedStaff: StaffMember[] = dbStaff.map(st => ({
      id: st.id,
      salonId: st.salon_id,
      name: st.display_name,
      roleTitle: st.role_title,
      avatar: st.avatar_path || '',
      rating: Number(st.rating) || 5.0,
      reviewsCount: st.reviews_count || 0,
      specialties: st.specialties || [],
      isAvailable: st.is_bookable && st.is_active,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      phone: st.phone_e164 || undefined,
    }));

    return {
      salons: mappedSalons,
      services: mappedServices,
      staff: mappedStaff,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

/**
 * Creates an appointment via guarded database RPC 'create_booking'
 */
export async function createBookingInDb(data: {
  salonId: string;
  serviceId: string;
  staffId: string;
  startsAt: string; // ISO timestamptz
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: 'pay_at_salon' | 'card';
  notes?: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data: appointmentId, error } = await supabaseALGOsalonClient.rpc('create_booking', {
      p_salon_id: data.salonId,
      p_service_id: data.serviceId,
      p_staff_id: data.staffId,
      p_starts_at: data.startsAt,
      p_customer_name: data.customerName,
      p_customer_phone: data.customerPhone || null,
      p_customer_email: data.customerEmail || null,
      p_payment_method: data.paymentMethod || 'pay_at_salon',
      p_notes: data.notes || null,
    });

    if (error) {
      console.warn('Booking creation RPC failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, appointmentId };
  } catch (err: unknown) {
    console.error('Error executing create_booking:', err);
    return { success: false, error: getErrorMessage(err, 'Network error during booking creation') };
  }
}

/**
 * Updates appointment status via guarded database RPC 'set_appointment_status'
 */
export async function setAppointmentStatusInDb(params: {
  appointmentId: string;
  status: AppointmentStatus;
  reason?: string;
  proposedStartsAt?: string;
  proposedEndsAt?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase unconfigured' };

  try {
    const { error } = await supabaseALGOsalonClient.rpc('set_appointment_status', {
      p_appointment_id: params.appointmentId,
      p_new_status: params.status,
      p_reason: params.reason || null,
      p_proposed_starts_at: params.proposedStartsAt || null,
      p_proposed_ends_at: params.proposedEndsAt || null,
    });

    if (error) {
      console.warn('set_appointment_status RPC rejected:', error.message);
      return { success: false, error: error.message };
    }

    // Ensure starts_at and ends_at are applied for confirmed appointments with proposed time
    if (params.status === 'confirmed' && params.proposedStartsAt) {
      await supabaseALGOsalonClient
        .from('appointments')
        .update({
          starts_at: params.proposedStartsAt,
          ...(params.proposedEndsAt ? { ends_at: params.proposedEndsAt } : {}),
          proposed_starts_at: null,
          proposed_ends_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.appointmentId);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error executing set_appointment_status:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Fetches appointments from live Supabase appointments table
 */
export async function fetchAppointmentsFromDb(options?: {
  customerId?: string;
  salonId?: string;
}): Promise<Appointment[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let query = supabaseALGOsalonClient
      .from('appointments')
      .select('*, salons(name, address_line1, phone_e164, cover_image), staff_profiles(avatar_path)')
      .order('starts_at', { ascending: false });

    if (options?.customerId) {
      query = query.eq('customer_id', options.customerId);
    } else if (options?.salonId) {
      query = query.eq('salon_id', options.salonId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Appointments fetch error:', error?.message);
      return null;
    }

    return data.map((apt: any) => {
      const startDate = new Date(apt.starts_at);
      const endDate = apt.ends_at ? new Date(apt.ends_at) : null;
      const durationMinutes = (endDate && !isNaN(endDate.getTime()) && !isNaN(startDate.getTime()))
        ? Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
        : 45;
      const dateStr = getLocalDateString(startDate);
      const timeSlotStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;

      let suggestedDate: string | undefined;
      let suggestedTimeSlot: string | undefined;
      if (apt.proposed_starts_at) {
        const propStart = new Date(apt.proposed_starts_at);
        if (!isNaN(propStart.getTime())) {
          suggestedDate = getLocalDateString(propStart);
          suggestedTimeSlot = `${String(propStart.getHours()).padStart(2, '0')}:${String(propStart.getMinutes()).padStart(2, '0')}`;
        }
      }

      return {
        id: apt.id,
        salonId: apt.salon_id,
        salonName: apt.salons?.name || 'ALGO Salon',
        salonAddress: apt.salons?.address_line1 || 'Downtown',
        salonPhone: apt.salons?.phone_e164 || '',
        salonImage: apt.salons?.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
        customerId: apt.customer_id || 'guest',
        customerName: apt.customer_display_name,
        customerPhone: apt.customer_phone_e164 || '',
        customerEmail: apt.customer_email || '',
        customerAvatar: apt.customer_avatar_path,
        serviceId: apt.service_id,
        serviceName: apt.service_name,
        servicePrice: Math.round((apt.quoted_price_minor || 0) / 100),
        durationMinutes,
        staffId: apt.staff_id,
        staffName: apt.staff_name,
        staffAvatar: apt.staff_profiles?.avatar_path || '',
        date: dateStr,
        timeSlot: timeSlotStr,
        status: apt.status as AppointmentStatus,
        paymentMethod: apt.payment_method || 'pay_at_salon',
        notes: apt.customer_notes,
        createdAt: apt.created_at,
        reviewed: apt.reviewed,
        declineReason: apt.decline_reason,
        suggestedDate,
        suggestedTimeSlot,
        suggestedNote: apt.status === 'rescheduled_by_business' ? apt.decline_reason : undefined,
      };
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return null;
  }
}

// =============================================================================
// SEPARATED CUSTOMER DATA DOMAIN SERVICES
// =============================================================================

/**
 * Customer Data Domain: Fetch appointments booked strictly by a specific Customer
 */
export async function fetchCustomerAppointments(customerId: string): Promise<Appointment[] | null> {
  return fetchAppointmentsFromDb({ customerId });
}

/**
 * Customer Data Domain: Fetch a Customer's profile from the public.profiles table
 */
export async function fetchCustomerProfileFromDb(customerId: string): Promise<Customer | null> {
  if (!isSupabaseConfigured() || !customerId) return null;
  try {
    const [profileRes, favsRes] = await Promise.all([
      supabaseALGOsalonClient
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle(),
      supabaseALGOsalonClient
        .from('favorites')
        .select('salon_id')
        .eq('customer_id', customerId),
    ]);

    if (profileRes.error || !profileRes.data) return null;
    const data = profileRes.data;
    const savedSalonIds: string[] = (favsRes.data || []).map((f: any) => f.salon_id);

    let customerEmail = data.email || '';
    if (!customerEmail) {
      const { data: authData } = await supabaseALGOsalonClient.auth.getUser();
      customerEmail = authData?.user?.email || '';
    }

    return {
      id: data.id,
      name: data.full_name,
      email: customerEmail,
      phone: data.phone_e164 || '',
      avatar: data.avatar_path || '',
      gender: data.gender || 'Prefer not to say',
      savedSalonIds,
      loyaltyPoints: data.loyalty_points || 0,
      preferredLocale: data.preferred_locale || 'en',
      preferredCurrency: data.preferred_currency || 'AED',
      marketingOptIn: data.marketing_opt_in ?? false,
    };
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    return null;
  }
}

// =============================================================================
// SEPARATED BUSINESS DATA DOMAIN SERVICES
// =============================================================================

/**
 * Business Data Domain: Fetch appointments scheduled strictly for a specific Salon / Business
 */
export async function fetchBusinessAppointments(salonId: string): Promise<Appointment[] | null> {
  return fetchAppointmentsFromDb({ salonId });
}

/**
 * Business Data Domain: Fetch a Business user profile from public.salon_members and public.salons
 */
export async function fetchBusinessProfileFromDb(userId: string): Promise<Business | null> {
  if (!isSupabaseConfigured() || !userId) return null;
  try {
    const { data: memberData } = await supabaseALGOsalonClient
      .from('salon_members')
      .select('salon_id, role, salons(name, phone_e164, city, address_line1)')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: profileData } = await supabaseALGOsalonClient
      .from('profiles')
      .select('full_name, phone_e164, email')
      .eq('id', userId)
      .maybeSingle();

    if (!memberData && !profileData) return null;

    let businessEmail = profileData?.email || '';
    if (!businessEmail) {
      const { data: authData } = await supabaseALGOsalonClient.auth.getUser();
      businessEmail = authData?.user?.email || '';
    }

    const salon: any = memberData?.salons;
    return {
      id: userId,
      name: profileData?.full_name || 'Business Director',
      email: businessEmail,
      phone: profileData?.phone_e164 || salon?.phone_e164 || '',
      salonId: memberData?.salon_id || '',
      ownerRole: memberData?.role ? `${memberData.role.toUpperCase()} & Salon Director` : 'Salon Owner',
      businessName: salon?.name || 'My Salon',
      location: salon?.city || salon?.address_line1 || 'Downtown',
    };
  } catch (err) {
    console.error('Error fetching business profile:', err);
    return null;
  }
}

/**
 * Real-time subscription to appointments table
 */
export function subscribeToAppointments(
  onUpdate: (payload: any) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabaseALGOsalonClient
    .channel('public:appointments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      payload => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabaseALGOsalonClient.removeChannel(channel);
  };
}

// =============================================================================
// REVIEWS DATA DOMAIN SERVICES
// =============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isValidUuid = (str?: string | null): boolean => {
  return Boolean(str && UUID_REGEX.test(str));
};

/**
 * Fetches reviews from live Supabase reviews table
 */
export async function fetchReviewsFromDb(salonId?: string): Promise<Review[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let query = supabaseALGOsalonClient
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (salonId && isValidUuid(salonId)) {
      query = query.eq('salon_id', salonId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Reviews fetch note:', error?.message);
      return null;
    }

    return data.map((r: any): Review => ({
      id: r.id,
      appointmentId: r.appointment_id || undefined,
      salonId: r.salon_id,
      customerId: r.customer_id,
      customerName: r.customer_name || 'Valued Client',
      customerAvatar: r.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: Number(r.rating) || 5,
      date: r.created_at ? getLocalDateString(new Date(r.created_at)) : 'Today',
      comment: r.comment || '',
      serviceName: r.service_name || undefined,
      staffName: r.staff_name || undefined,
      reply: r.business_reply || undefined,
      businessReply: r.business_reply ? {
        date: r.reply_date ? getLocalDateString(new Date(r.reply_date)) : 'Recently',
        message: r.business_reply,
      } : undefined,
    }));
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return null;
  }
}

/**
 * Adds a new review to Supabase
 */
export async function createReviewInDb(review: {
  appointmentId?: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  serviceName?: string;
  staffName?: string;
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  try {
    if (!isValidUuid(review.salonId)) {
      return { success: false, error: 'Salon does not have a database UUID' };
    }

    // When tied to an appointment, use guarded atomic RPC submit_review
    if (review.appointmentId && isValidUuid(review.appointmentId)) {
      const { data: rpcReviewId, error: rpcErr } = await supabaseALGOsalonClient.rpc('submit_review', {
        p_appointment_id: review.appointmentId,
        p_rating: Math.max(1, Math.min(5, Math.round(review.rating))),
        p_comment: (review.comment || 'Great service!').trim(),
        p_images: [],
      });

      if (!rpcErr && rpcReviewId) {
        return { success: true, reviewId: rpcReviewId };
      }

      if (rpcErr) {
        console.warn('submit_review RPC returned error:', rpcErr.message);
        // If it's a domain/authorization violation, return immediately
        if (
          rpcErr.message.includes('completed') ||
          rpcErr.message.includes('Unauthorized') ||
          rpcErr.message.includes('already reviewed')
        ) {
          return { success: false, error: rpcErr.message };
        }
      }
    }

    let targetCustomerId = review.customerId;
    if (!isValidUuid(targetCustomerId)) {
      const session = await getSupabaseUserSession();
      if (session?.user?.id && isValidUuid(session.user.id)) {
        targetCustomerId = session.user.id;
      } else {
        return { success: false, error: 'Valid Supabase customer UUID required for database persistence' };
      }
    }

    const payload: any = {
      salon_id: review.salonId,
      customer_id: targetCustomerId,
      customer_name: review.customerName || 'Client',
      customer_avatar: review.customerAvatar || null,
      rating: Math.max(1, Math.min(5, Math.round(review.rating))),
      comment: (review.comment || 'Great service!').trim(),
      service_name: review.serviceName || null,
      staff_name: review.staffName || null,
    };

    if (review.appointmentId && isValidUuid(review.appointmentId)) {
      payload.appointment_id = review.appointmentId;
    }

    const { data, error } = await supabaseALGOsalonClient
      .from('reviews')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('Review database insert error:', error.message);
      return { success: false, error: error.message };
    }

    if (review.appointmentId && isValidUuid(review.appointmentId)) {
      await supabaseALGOsalonClient
        .from('appointments')
        .update({ reviewed: true, updated_at: new Date().toISOString() })
        .eq('id', review.appointmentId);
    }

    return { success: true, reviewId: data?.id };
  } catch (err: unknown) {
    console.error('Error executing createReviewInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates salon rating and review count in Supabase
 */
export async function updateSalonRatingInDb(
  salonId: string,
  rating: number,
  reviewCount: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isValidUuid(salonId)) {
    return { success: false, error: 'Supabase unconfigured or local salon ID' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('salons')
      .update({
        rating: Number(rating.toFixed(1)),
        review_count: reviewCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salonId);

    if (error) {
      console.warn('updateSalonRatingInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error executing updateSalonRatingInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Replies to a review in Supabase (by business/salon director)
 */
export async function replyToReviewInDb(
  reviewId: string,
  replyMessage: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  if (!isValidUuid(reviewId)) {
    return { success: false, error: 'Local review ID is not in Supabase' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('reviews')
      .update({
        business_reply: replyMessage,
        reply_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      console.warn('Reply to review error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error executing replyToReviewInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Real-time subscription to reviews table
 */
export function subscribeToReviews(
  onUpdate: (payload: any) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabaseALGOsalonClient
    .channel('public:reviews')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reviews' },
      payload => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabaseALGOsalonClient.removeChannel(channel);
  };
}

// =============================================================================
// FAVORITES DATA DOMAIN SERVICES
// =============================================================================

/**
 * Fetches saved salon IDs for a given customer from Supabase
 */
export async function fetchFavoritesFromDb(customerId: string): Promise<string[] | null> {
  if (!isSupabaseConfigured() || !customerId) return null;

  let targetId = customerId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return null;
    }
  }

  try {
    const { data, error } = await supabaseALGOsalonClient
      .from('favorites')
      .select('salon_id')
      .eq('customer_id', targetId);

    if (error || !data) {
      console.warn('Favorites fetch note:', error?.message);
      return null;
    }

    return data.map((f: any) => f.salon_id);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    return null;
  }
}

/**
 * Adds a salon to customer's favorites in Supabase
 */
export async function addFavoriteInDb(
  customerId: string,
  salonId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !customerId || !salonId) {
    return { success: false, error: 'Missing customer or salon ID' };
  }

  if (!isValidUuid(salonId)) {
    return { success: false, error: 'Salon is not a database entity' };
  }

  let targetId = customerId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return { success: false, error: 'Active Supabase account required' };
    }
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('favorites')
      .upsert(
        { customer_id: targetId, salon_id: salonId, created_at: new Date().toISOString() },
        { onConflict: 'customer_id,salon_id' }
      );

    if (error) {
      console.warn('Add favorite database error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error executing addFavoriteInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Removes a salon from customer's favorites in Supabase
 */
export async function removeFavoriteInDb(
  customerId: string,
  salonId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !customerId || !salonId) {
    return { success: false, error: 'Missing customer or salon ID' };
  }

  if (!isValidUuid(salonId)) {
    return { success: false, error: 'Salon is not a database entity' };
  }

  let targetId = customerId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return { success: false, error: 'Active Supabase account required' };
    }
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('favorites')
      .delete()
      .eq('customer_id', targetId)
      .eq('salon_id', salonId);

    if (error) {
      console.warn('Remove favorite database error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error executing removeFavoriteInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// =============================================================================
// NOTIFICATIONS DATA DOMAIN SERVICES
// =============================================================================

/**
 * Fetches notifications for a given user from Supabase
 */
export async function fetchNotificationsFromDb(
  userId: string,
  userType?: Role
): Promise<NotificationItem[] | null> {
  if (!isSupabaseConfigured() || !userId) return null;

  let targetId = userId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return null;
    }
  }

  try {
    let query = supabaseALGOsalonClient
      .from('notifications')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    if (userType && (userType === 'customer' || userType === 'business')) {
      query = query.eq('user_type', userType);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Notifications fetch note:', error?.message);
      return null;
    }

    return data.map((n: any): NotificationItem => ({
      id: n.id,
      userId: n.user_id,
      userType: n.user_type as Role,
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      date: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today',
      read: Boolean(n.read),
      type: n.type || 'system',
      linkTab: n.link_tab || undefined,
      appointmentId: n.appointment_id || undefined,
    }));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return null;
  }
}

/**
 * Creates a notification in Supabase
 */
export async function createNotificationInDb(notification: {
  userId: string;
  userType: 'customer' | 'business';
  title: string;
  message: string;
  type?: string;
  linkTab?: string;
  appointmentId?: string;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!isSupabaseConfigured() || !notification.userId) {
    return { success: false, error: 'Supabase unconfigured or missing userId' };
  }

  let targetId = notification.userId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return { success: false, error: 'Valid UUID required for Supabase notification' };
    }
  }

  try {
    const allowedTypes = ['booking', 'reminder', 'review', 'promo', 'system'];
    const validType = notification.type && allowedTypes.includes(notification.type)
      ? notification.type
      : 'system';

    const payload: any = {
      user_id: targetId,
      user_type: notification.userType,
      title: notification.title.slice(0, 200),
      message: notification.message.slice(0, 1000),
      type: validType,
      link_tab: notification.linkTab || null,
      read: false,
    };

    if (notification.appointmentId && isValidUuid(notification.appointmentId)) {
      payload.appointment_id = notification.appointmentId;
    }

    const { data, error } = await supabaseALGOsalonClient
      .from('notifications')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('Create notification error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data?.id };
  } catch (err: unknown) {
    console.error('Error creating notification in Supabase:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Marks a notification as read in Supabase
 */
export async function markNotificationReadInDb(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !notificationId || !isValidUuid(notificationId)) {
    return { success: false, error: 'Supabase unconfigured or local notification' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('Mark notification read error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error marking notification read:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Marks all notifications as read for a user in Supabase
 */
export async function markAllNotificationsReadInDb(
  userId: string,
  userType?: Role
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  let targetId = userId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return { success: false };
    }
  }

  try {
    let query = supabaseALGOsalonClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', targetId);

    if (userType && (userType === 'customer' || userType === 'business')) {
      query = query.eq('user_type', userType);
    }

    const { error } = await query;
    if (error) {
      console.warn('Mark all notifications read error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error marking all notifications read:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Deletes a notification in Supabase
 */
export async function deleteNotificationInDb(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !notificationId || !isValidUuid(notificationId)) {
    return { success: false, error: 'Supabase unconfigured or local notification' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.warn('Delete notification error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting notification:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Clears all notifications for a user in Supabase
 */
export async function clearAllNotificationsInDb(
  userId: string,
  userType?: Role
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !userId) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  let targetId = userId;
  if (!isValidUuid(targetId)) {
    const session = await getSupabaseUserSession();
    if (session?.user?.id && isValidUuid(session.user.id)) {
      targetId = session.user.id;
    } else {
      return { success: false };
    }
  }

  try {
    let query = supabaseALGOsalonClient
      .from('notifications')
      .delete()
      .eq('user_id', targetId);

    if (userType && (userType === 'customer' || userType === 'business')) {
      query = query.eq('user_type', userType);
    }

    const { error } = await query;
    if (error) {
      console.warn('Clear notifications error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error clearing notifications:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Real-time subscription to notifications table
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notif: NotificationItem) => void
) {
  if (!isSupabaseConfigured() || !userId) return () => {};

  const channel = supabaseALGOsalonClient
    .channel(`public:notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        const row: any = payload.new;
        onNewNotification({
          id: row.id,
          userId: row.user_id,
          userType: row.user_type,
          title: row.title,
          message: row.message,
          date: row.created_at || new Date().toISOString(),
          timestamp: row.created_at || new Date().toISOString(),
          read: row.read,
          type: row.type,
          linkTab: row.link_tab,
          appointmentId: row.appointment_id,
        });
      }
    )
    .subscribe();

  return () => {
    supabaseALGOsalonClient.removeChannel(channel);
  };
}

// =============================================================================
// REAL SUPABASE AUTHENTICATION SERVICES (GOOGLE & EMAIL)
// =============================================================================

/**
 * Initiates real Google OAuth authentication using Supabase.
 * Redirects the patron to Google login and handles return to the application.
 */
export async function signInWithSupabaseGoogle(): Promise<{
  data: unknown;
  error: unknown;
}> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  try {
    const redirectTo = `${window.location.origin}/`;
    const response = await supabaseALGOsalonClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return response;
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

/**
 * Sends a real Supabase 6-digit OTP code or Magic Link to the customer's Gmail / Email.
 */
export async function sendSupabaseOtp(
  email: string,
  role?: 'customer' | 'business',
  name?: string
): Promise<{
  data: unknown;
  error: unknown;
}> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  try {
    const cleanEmail = sanitizeEmail(email);
    const redirectTo = `${window.location.origin}/`;
    const accountType = role === 'business' ? 'Business' : 'Customer';
    const metadata: Record<string, string | undefined> = {
      role: role || 'customer',
      account_type: accountType,
      type: accountType,
    };
    if (name && name.trim()) {
      metadata.full_name = name.trim();
      metadata.name = name.trim();
    }

    const response = await supabaseALGOsalonClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: metadata,
      },
    });
    return response;
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

/**
 * Resends a verification email or Magic Link to the customer's Gmail / Email.
 * Handles both signInWithOtp and auth.resend fallback with Supabase rate limit handling.
 */
export async function resendSupabaseVerification(
  email: string,
  role?: 'customer' | 'business',
  name?: string
): Promise<{
  data: unknown;
  error: unknown;
}> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  const cleanEmail = sanitizeEmail(email);
  const redirectTo = `${window.location.origin}/`;
  const accountType = role === 'business' ? 'Business' : 'Customer';
  const metadata: Record<string, string | undefined> = {
    role: role || 'customer',
    account_type: accountType,
    type: accountType,
  };
  if (name && name.trim()) {
    metadata.full_name = name.trim();
    metadata.name = name.trim();
  }

  try {
    const response = await supabaseALGOsalonClient.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
        data: metadata,
      },
    });

    if (response.error) {
      const msg = response.error.message?.toLowerCase() || '';
      // If error is not a rate limit, attempt auth.resend as fallback
      if (!msg.includes('security') && !msg.includes('rate') && !msg.includes('seconds')) {
        const fallback = await supabaseALGOsalonClient.auth.resend({
          type: 'signup',
          email: cleanEmail,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
        if (!fallback.error) {
          return fallback;
        }
      }
    }

    return response;
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

/**
 * Verifies the OTP code sent to the customer's email.
 */
export async function verifySupabaseOtp(
  email: string,
  token: string
): Promise<{
  data: unknown;
  error: unknown;
}> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  try {
    const cleanEmail = sanitizeEmail(email);
    const response = await supabaseALGOsalonClient.auth.verifyOtp({
      email: cleanEmail,
      token: token.trim(),
      type: 'email',
    });
    return response;
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

/**
 * Gets the current active authenticated Supabase session and user.
 */
export async function getSupabaseUserSession() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabaseALGOsalonClient.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Checks whether an email has been confirmed in Supabase (e.g. via magic link verification).
 */
export async function checkSupabaseEmailConfirmed(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) return false;

  try {
    // 1. Check local active session first
    const { data: sessionData } = await supabaseALGOsalonClient.auth.getSession();
    const activeUser = sessionData?.session?.user;
    if (
      activeUser &&
      activeUser.email?.toLowerCase() === cleanEmail.toLowerCase() &&
      (activeUser.email_confirmed_at || activeUser.confirmed_at || activeUser.role === 'authenticated')
    ) {
      return true;
    }

    // 2. Query Supabase RPC check_email_confirmed
    const { data, error } = await supabaseALGOsalonClient.rpc('check_email_confirmed', {
      email_to_check: cleanEmail,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks whether a password reset / identity re-verification link was clicked.
 */
export async function checkSupabaseRecoveryVerified(
  email: string,
  sentAfterIso?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) return false;

  try {
    // 1. Check local session first
    const { data: sessionData } = await supabaseALGOsalonClient.auth.getSession();
    const activeUser = sessionData?.session?.user;
    if (
      activeUser &&
      activeUser.email?.toLowerCase() === cleanEmail.toLowerCase()
    ) {
      return true;
    }

    // 2. Query Supabase RPC check_recovery_link_verified
    const { data, error } = await supabaseALGOsalonClient.rpc('check_recovery_link_verified', {
      email_to_check: cleanEmail,
      sent_after: sentAfterIso || null,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Signs out from Supabase auth.
 */
export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabaseALGOsalonClient.auth.signOut();
  } catch (err) {
    console.warn('Sign-out error:', err);
  }
}

/**
 * Checks Supabase for an existing account identity by email.
 * Ensures the app enforces: One Gmail = One Account (Customer OR Business).
 */
export async function checkSupabaseAccountIdentity(
  email: string
): Promise<{
  exists: boolean;
  accountType?: 'Customer' | 'Business';
  role?: 'customer' | 'business';
  email: string;
  account?: any;
}> {
  const normEmail = email.trim().toLowerCase();
  if (!normEmail || !isSupabaseConfigured()) {
    return { exists: false, email: normEmail };
  }

  try {
    // 1. Check current authenticated user session if available
    const { data: { session } } = await supabaseALGOsalonClient.auth.getSession();
    if (session?.user && session.user.email?.toLowerCase() === normEmail) {
      const metaRole = session.user.user_metadata?.role;
      const metaType = session.user.user_metadata?.account_type;
      const role: 'customer' | 'business' =
        metaRole === 'business' || metaType === 'Business' ? 'business' : 'customer';
      return {
        exists: true,
        accountType: role === 'business' ? 'Business' : 'Customer',
        role,
        email: normEmail,
        account: session.user,
      };
    }

    // 2. Query Supabase RPC check_user_account_status for existing account in database
    const { data: dbStatus, error } = await supabaseALGOsalonClient.rpc('check_user_account_status', {
      email_to_check: normEmail,
    });

    if (!error && dbStatus && dbStatus.exists) {
      return {
        exists: true,
        accountType: dbStatus.accountType || (dbStatus.role === 'business' ? 'Business' : 'Customer'),
        role: dbStatus.role || 'customer',
        email: normEmail,
        account: dbStatus,
      };
    }

    return { exists: false, email: normEmail };
  } catch (err) {
    console.warn('Error checking Supabase account identity:', err);
    return { exists: false, email: normEmail };
  }
}

/**
 * Synchronizes and locks the user's account identity in Supabase auth metadata,
 * ensuring Type : Customer or Type : Business is explicitly maintained.
 */
/**
 * Authoritatively syncs user profile, phone, role, and provider type to Supabase auth.users and public.profiles
 */
export async function syncUserProfileAndAuthInDb(params: {
  fullName?: string;
  phone?: string;
  gender?: string;
  appCode?: string;
  avatar?: string;
  role?: 'customer' | 'business';
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { data, error } = await supabaseALGOsalonClient.rpc('sync_user_profile_and_auth', {
      p_full_name: params.fullName || null,
      p_phone: params.phone || null,
      p_gender: params.gender || null,
      p_app_code: params.appCode || null,
      p_avatar: params.avatar || null,
      p_role: params.role || null,
    });

    if (error) {
      console.warn('sync_user_profile_and_auth RPC note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Error in syncUserProfileAndAuthInDb:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function syncAccountIdentityToSupabase(
  email: string,
  role: 'customer' | 'business',
  extraMetadata?: Record<string, any>
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const normEmail = email.trim().toLowerCase();

  try {
    const { data: { session } } = await supabaseALGOsalonClient.auth.getSession();
    const accountType: 'Customer' | 'Business' = role === 'business' ? 'Business' : 'Customer';
    const fullName = extraMetadata?.full_name || extraMetadata?.name || session?.user?.user_metadata?.full_name || '';

    // 1. Authoritative RPC sync to auth.users (phone, metadata, provider_type) and public.profiles
    await syncUserProfileAndAuthInDb({
      fullName: fullName.trim() || undefined,
      phone: extraMetadata?.phone?.trim() || undefined,
      gender: extraMetadata?.gender?.trim() || undefined,
      appCode: extraMetadata?.app_code || extraMetadata?.appCode || undefined,
      avatar: extraMetadata?.avatar || undefined,
      role,
    });

    // 2. Client-side auth update to keep JWT session metadata in sync
    if (session?.user && session.user.email?.toLowerCase() === normEmail) {
      await supabaseALGOsalonClient.auth.updateUser({
        data: {
          role,
          account_type: accountType,
          type: accountType,
          full_name: fullName,
          name: fullName,
          ...extraMetadata,
        },
      });
      console.log(`[Supabase Auth] Identity synchronized: Type: ${accountType}, User: ${normEmail}, Name: ${fullName}`);
    }

    // 3. Fallback direct update to public.profiles table
    const profileUpdates: Record<string, any> = {
      role,
      updated_at: new Date().toISOString(),
    };
    if (fullName) {
      profileUpdates.full_name = fullName.trim();
    }
    if (extraMetadata?.phone) {
      profileUpdates.phone_e164 = extraMetadata.phone.trim();
    }
    if (extraMetadata?.gender) {
      profileUpdates.gender = extraMetadata.gender.trim();
    }
    const targetUserId = session?.user?.id;
    if (targetUserId) {
      await supabaseALGOsalonClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId);
    } else {
      await supabaseALGOsalonClient
        .from('profiles')
        .update(profileUpdates)
        .eq('email', normEmail);
    }
  } catch (err) {
    console.warn('Failed to sync Supabase user identity:', err);
  }
}

/**
 * Cleans up conflicting or duplicate role identities in Supabase for this email.
 */
export async function cleanSupabaseDuplicateIdentities(
  email: string,
  targetRole: 'customer' | 'business'
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const normEmail = email.trim().toLowerCase();

  try {
    await syncAccountIdentityToSupabase(normEmail, targetRole);
  } catch (err) {
    console.warn('Cleanup Supabase duplicate error:', err);
  }
}

import { del } from 'idb-keyval';

/**
 * Direct public CDN URL for Screen 2 background image.
 * Bypasses database/storage RLS entirely for zero latency, instant response, and browser CDN caching.
 */
const DEFAULT_BG = 'https://mmmthrlbikllhdupslrz.supabase.co/storage/v1/object/public/app-background-images/Splash%20Screen%202/1788503584034(1)-Picsart-AiImageEnhancer.png';
const DEFAULT_BG_JPG = DEFAULT_BG;

// Clean up any heavy legacy Base64 blobs from IndexedDB asynchronously in background
try {
  del('algosalon_screen2_bg_cached_meta_v3').catch(() => {});
  del('algosalon_screen2_bg_cached_data').catch(() => {});
} catch {
  // Safe ignore
}

/**
 * Ultra-fast background image URL resolver:
 * 1. Checks localStorage for any user/admin customized URL.
 * 2. Dynamically queries the latest uploaded image in 'Splash Screen 2' from Supabase Storage.
 * 3. Falls back to DEFAULT_BG.
 */
export async function getBackgroundImage(): Promise<string> {
  try {
    const customUrl = localStorage.getItem('algosalon_screen2_bg_url');
    if (customUrl && !customUrl.includes('Image%202.png') && !customUrl.includes('Image 2.png')) {
      return customUrl;
    }

    if (isSupabaseConfigured()) {
      const { data } = await supabaseALGOsalonClient.storage
        .from('app-background-images')
        .list('Splash Screen 2', {
          limit: 5,
          sortBy: { column: 'updated_at', order: 'desc' },
        });

      if (data && data.length > 0) {
        const latestFile = data.find(f => f.name && !f.name.startsWith('.'));
        if (latestFile) {
          const { data: publicData } = supabaseALGOsalonClient.storage
            .from('app-background-images')
            .getPublicUrl(`Splash Screen 2/${latestFile.name}`);

          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_BG;
}

export async function fetchAppBackgroundFromSupabase(_filename: string = 'screen2-bg.png'): Promise<string | null> {
  return getBackgroundImage();
}

// =============================================================================
// SERVICES & STAFF DATABASE MUTATIONS (BUSINESS DOMAIN)
// =============================================================================

/**
 * Creates a new salon service in Supabase
 */
export async function addServiceInDb(service: Omit<ServiceItem, 'id'>): Promise<{
  success: boolean;
  serviceId?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  try {
    const payload: any = {
      salon_id: isValidUuid(service.salonId) ? service.salonId : '11111111-1111-1111-1111-111111111111',
      name: service.name,
      category: service.category || 'Haircut',
      description: service.description || '',
      price_minor: Math.round((service.price || 0) * 100),
      original_price_minor: service.originalPrice ? Math.round(service.originalPrice * 100) : null,
      currency: 'AED',
      duration_minutes: service.durationMinutes || 30,
      image_path: service.image || null,
      gender_target: service.genderTarget || 'Unisex',
      is_active: true,
      is_featured: Boolean(service.isPopular),
    };

    const { data, error } = await supabaseALGOsalonClient
      .from('services')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('addServiceInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, serviceId: data?.id };
  } catch (err: unknown) {
    console.error('Error adding service in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates a salon service in Supabase
 */
export async function updateServiceInDb(
  serviceId: string,
  updates: Partial<ServiceItem>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isValidUuid(serviceId)) {
    return { success: false, error: 'Supabase unconfigured or local service ID' };
  }

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price_minor = Math.round(updates.price * 100);
    if (updates.originalPrice !== undefined) {
      payload.original_price_minor = updates.originalPrice ? Math.round(updates.originalPrice * 100) : null;
    }
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.image !== undefined) payload.image_path = updates.image;
    if (updates.genderTarget !== undefined) payload.gender_target = updates.genderTarget;
    if (updates.isPopular !== undefined) payload.is_featured = updates.isPopular;

    const { error } = await supabaseALGOsalonClient
      .from('services')
      .update(payload)
      .eq('id', serviceId);

    if (error) {
      console.warn('updateServiceInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating service in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Deactivates or removes a service in Supabase
 */
export async function deleteServiceInDb(serviceId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isValidUuid(serviceId)) {
    return { success: false, error: 'Supabase unconfigured or local service ID' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', serviceId);

    if (error) {
      console.warn('deleteServiceInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting service in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Adds a new staff profile in Supabase
 */
export async function addStaffInDb(staff: Omit<StaffMember, 'id'>): Promise<{
  success: boolean;
  staffId?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  try {
    const payload: any = {
      salon_id: isValidUuid(staff.salonId) ? staff.salonId : '11111111-1111-1111-1111-111111111111',
      display_name: staff.name,
      role_title: staff.roleTitle || 'Senior Stylist',
      avatar_path: staff.avatar || null,
      phone_e164: staff.phone || null,
      specialties: staff.specialties || ['Styling'],
      rating: staff.rating || 5.0,
      reviews_count: staff.reviewsCount || 0,
      is_bookable: staff.isAvailable !== false,
      is_active: true,
    };

    const { data, error } = await supabaseALGOsalonClient
      .from('staff_profiles')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('addStaffInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, staffId: data?.id };
  } catch (err: unknown) {
    console.error('Error adding staff in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates a staff profile in Supabase
 */
export async function updateStaffInDb(
  staffId: string,
  updates: Partial<StaffMember>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isValidUuid(staffId)) {
    return { success: false, error: 'Supabase unconfigured or local staff ID' };
  }

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.display_name = updates.name;
    if (updates.roleTitle !== undefined) payload.role_title = updates.roleTitle;
    if (updates.avatar !== undefined) payload.avatar_path = updates.avatar;
    if (updates.phone !== undefined) payload.phone_e164 = updates.phone;
    if (updates.specialties !== undefined) payload.specialties = updates.specialties;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.reviewsCount !== undefined) payload.reviews_count = updates.reviewsCount;
    if (updates.isAvailable !== undefined) payload.is_bookable = updates.isAvailable;

    const { error } = await supabaseALGOsalonClient
      .from('staff_profiles')
      .update(payload)
      .eq('id', staffId);

    if (error) {
      console.warn('updateStaffInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating staff in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Deactivates or removes a staff member in Supabase
 */
export async function deleteStaffInDb(staffId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isValidUuid(staffId)) {
    return { success: false, error: 'Supabase unconfigured or local staff ID' };
  }

  try {
    const { error } = await supabaseALGOsalonClient
      .from('staff_profiles')
      .update({ is_active: false, is_bookable: false, updated_at: new Date().toISOString() })
      .eq('id', staffId);

    if (error) {
      console.warn('deleteStaffInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting staff in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates salon profile details in Supabase
 */
export async function updateSalonProfileInDb(
  salonId: string,
  updates: Partial<Salon>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase unconfigured' };
  const targetId = isValidUuid(salonId) ? salonId : '11111111-1111-1111-1111-111111111111';

  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.tagline !== undefined) payload.tagline = updates.tagline;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.phone !== undefined) payload.phone_e164 = updates.phone;
    if (updates.address !== undefined) payload.address_line1 = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
    if (updates.logo !== undefined) payload.logo_image = updates.logo;
    if (updates.amenities !== undefined) payload.amenities = updates.amenities;
    if (updates.categories !== undefined) payload.categories = updates.categories;
    if (updates.isOpenNow !== undefined) payload.is_open_now = updates.isOpenNow;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;

    const { error } = await supabaseALGOsalonClient
      .from('salons')
      .update(payload)
      .eq('id', targetId);

    if (error) {
      console.warn('updateSalonProfileInDb error:', error.message);
      return { success: false, error: error.message };
    }

    if (updates.workingHours && updates.workingHours.length > 0) {
      await updateBusinessHoursInDb(targetId, updates.workingHours);
    }

    if (updates.specialSchedules !== undefined) {
      await updateSpecialSchedulesInDb(targetId, updates.specialSchedules);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating salon profile in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates special holiday/override schedules in Supabase
 */
export async function updateSpecialSchedulesInDb(
  salonId: string,
  schedules: SpecialSchedule[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase unconfigured' };
  const targetId = isValidUuid(salonId) ? salonId : '11111111-1111-1111-1111-111111111111';

  try {
    if (schedules.length === 0) {
      await supabaseALGOsalonClient
        .from('special_schedules')
        .delete()
        .eq('salon_id', targetId);
      return { success: true };
    }

    const upsertRows = schedules.map(s => ({
      salon_id: targetId,
      date: s.date,
      is_open: s.isOpen,
      opens_at: s.isOpen ? (s.open?.length === 5 ? `${s.open}:00` : s.open || '09:00:00') : null,
      closes_at: s.isOpen ? (s.close?.length === 5 ? `${s.close}:00` : s.close || '21:00:00') : null,
      title: s.title || 'Special Hours',
      reason: s.reason || null,
      note: s.reason || s.title || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseALGOsalonClient
      .from('special_schedules')
      .upsert(upsertRows, { onConflict: 'salon_id,date' });

    if (error) {
      console.warn('updateSpecialSchedulesInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating special schedules in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Registers a new business salon and establishes ownership membership in Supabase
 */
export async function registerBusinessSalonInDb(params: {
  name: string;
  phone: string;
  city?: string;
  address?: string;
  categories?: string[];
  priceRange?: number;
  coverImage?: string;
  timezone?: string;
  countryCode?: string;
  amenities?: string[];
}): Promise<{ success: boolean; salonId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase unconfigured' };

  try {
    const { data: salonId, error } = await supabaseALGOsalonClient.rpc('register_business_salon', {
      p_salon_name: params.name,
      p_name: params.name,
      p_phone: params.phone,
      p_city: params.city || 'Dubai',
      p_address: params.address || 'Downtown Dubai',
      p_categories: params.categories || ['Haircut', 'Styling'],
      p_amenities: params.amenities || ['WiFi', 'Valet Parking'],
      p_timezone: params.timezone || 'Asia/Dubai',
      p_country_code: params.countryCode || null,
      p_price_range: params.priceRange || 2,
      p_cover_image: params.coverImage || null,
    });

    if (error) {
      console.warn('register_business_salon RPC error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, salonId };
  } catch (err: unknown) {
    console.error('Error executing register_business_salon:', err);
    return { success: false, error: getErrorMessage(err, 'Failed to register business salon') };
  }
}

/**
 * Updates salon weekly business hours in Supabase
 */
export async function updateBusinessHoursInDb(
  salonId: string,
  hours: WorkingDayHour[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase unconfigured' };
  const targetId = isValidUuid(salonId) ? salonId : '11111111-1111-1111-1111-111111111111';

  const DAY_MAP: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  try {
    const upsertRows = hours.map(h => ({
      salon_id: targetId,
      day_of_week: DAY_MAP[h.day] ?? 1,
      is_open: h.isOpen,
      opens_at: h.isOpen ? (h.open?.length === 5 ? `${h.open}:00` : h.open || '09:00:00') : null,
      closes_at: h.isOpen ? (h.close?.length === 5 ? `${h.close}:00` : h.close || '21:00:00') : null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseALGOsalonClient
      .from('business_hours')
      .upsert(upsertRows, { onConflict: 'salon_id,day_of_week' });

    if (error) {
      console.warn('updateBusinessHoursInDb error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating business hours in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Updates a customer profile in public.profiles
 */
export async function updateCustomerProfileInDb(
  customerId: string,
  updates: Partial<Customer>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase unconfigured' };
  }

  try {
    // 1. Authoritative RPC sync to auth.users and public.profiles
    await syncUserProfileAndAuthInDb({
      fullName: updates.name,
      phone: updates.phone,
      gender: updates.gender,
      appCode: (updates as any).appCode,
      avatar: updates.avatar,
      role: 'customer',
    });

    // 2. Direct fallback update
    const { data: { session } } = await supabaseALGOsalonClient.auth.getSession();
    const targetId = session?.user?.id || (isValidUuid(customerId) ? customerId : null);

    if (targetId) {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) payload.full_name = updates.name;
      if (updates.phone !== undefined) payload.phone_e164 = updates.phone;
      if (updates.avatar !== undefined) payload.avatar_path = updates.avatar;
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.preferredLocale !== undefined) payload.preferred_locale = updates.preferredLocale;
      if (updates.preferredCurrency !== undefined) payload.preferred_currency = updates.preferredCurrency;

      const { error } = await supabaseALGOsalonClient
        .from('profiles')
        .update(payload)
        .eq('id', targetId);

      if (error) {
        console.warn('updateCustomerProfileInDb direct error:', error.message);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error updating customer profile in DB:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Uploads a customer or business profile picture to Supabase Storage bucket 'avatars'
 */
export async function uploadAvatarToSupabase(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabaseALGOsalonClient.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadErr) {
      console.warn('Avatar upload failed:', uploadErr.message);
      return { success: false, error: uploadErr.message };
    }

    const { data: publicData } = supabaseALGOsalonClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { success: true, url: publicData?.publicUrl };
  } catch (err: unknown) {
    console.error('Error uploading avatar:', err);
    return { success: false, error: getErrorMessage(err, 'Failed to upload avatar') };
  }
}

/**
 * Deletes an avatar object from Supabase Storage bucket 'avatars'
 */
export async function deleteAvatarFromSupabase(
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !avatarUrl) {
    return { success: true };
  }

  try {
    // Extract path from public URL (after /avatars/)
    const parts = avatarUrl.split('/avatars/');
    if (parts.length > 1) {
      const storagePath = decodeURIComponent(parts[1].split('?')[0]);
      const { error } = await supabaseALGOsalonClient.storage
        .from('avatars')
        .remove([storagePath]);
      if (error) {
        console.warn('Avatar delete error:', error.message);
      }
    }
    return { success: true };
  } catch (err: unknown) {
    console.warn('Error deleting avatar from storage:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

/**
 * Permanently deletes user account, OAuth identities, and all database records from Supabase
 */
export async function deleteAccountInSupabase(
  userEmail?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { data: { session } } = await supabaseALGOsalonClient.auth.getSession();
    const resolvedUserId = userId || session?.user?.id;
    const resolvedEmail = userEmail || session?.user?.email;

    if (!resolvedUserId && !resolvedEmail) {
      return { success: true };
    }

    // 1. Authoritative RPC delete_user_account (SECURITY DEFINER)
    const { data: deleteRes, error: rpcErr } = await supabaseALGOsalonClient.rpc('delete_user_account');
    if (!rpcErr && (deleteRes === true || deleteRes === undefined)) {
      console.log('[Supabase] delete_user_account succeeded');
      return { success: true };
    }

    if (rpcErr) {
      console.warn('delete_user_account RPC note:', rpcErr.message, 'attempting fallback...');
    }

    // 2. Secondary RPC fallback: delete_user_account_complete
    const { data: rpcData, error: legacyRpcErr } = await supabaseALGOsalonClient.rpc(
      'delete_user_account_complete',
      {
        email_to_delete: resolvedEmail || null,
        user_id_to_delete: resolvedUserId || null,
      }
    );

    if (!legacyRpcErr && rpcData?.success) {
      console.log('[Supabase] delete_user_account_complete succeeded:', rpcData);
      return { success: true };
    }

    // 3. Direct client-side cleanup fallback if user id is available
    if (resolvedUserId) {
      await supabaseALGOsalonClient.from('salon_members').delete().eq('user_id', resolvedUserId);
      await supabaseALGOsalonClient.from('favorites').delete().eq('customer_id', resolvedUserId);
      await supabaseALGOsalonClient.from('notifications').delete().eq('user_id', resolvedUserId);
      await supabaseALGOsalonClient.from('reviews').delete().eq('customer_id', resolvedUserId);
      await supabaseALGOsalonClient.from('appointments').delete().eq('customer_id', resolvedUserId);
      await supabaseALGOsalonClient.from('profiles').delete().eq('id', resolvedUserId);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error deleting account in Supabase:', err);
    return { success: false, error: getErrorMessage(err, 'Database error during account deletion') };
  }
}
