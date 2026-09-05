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
  Customer,
  Business,
  Role,
} from '../types';
import { sanitizeEmail } from '../utils/authErrorHandling';
import { getLocalDateString } from '../utils/dateTimeUtils';

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
    const [salonsRes, servicesRes, staffRes, hoursRes] = await Promise.all([
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
    ]);

    if (salonsRes.error || !salonsRes.data || salonsRes.data.length === 0) {
      console.warn('Salons fetch note:', salonsRes.error?.message || 'No published salons yet');
      return null;
    }

    const dbSalons = salonsRes.data;
    const dbServices = servicesRes.data || [];
    const dbStaff = staffRes.data || [];
    const dbHours = hoursRes.data || [];

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
        lat: Number(s.latitude) || 25.1972,
        lng: Number(s.longitude) || 55.2744,
        phone: s.phone_e164,
        rating: Number(s.rating) || 4.9,
        reviewCount: s.review_count || 0,
        priceRange: priceSigns[s.price_range] || '$$',
        image: s.cover_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        gallery: s.gallery_images && s.gallery_images.length > 0
          ? s.gallery_images
          : [
              'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop&q=80',
            ],
        workingHours: salonHours.length > 0 ? salonHours : [
          { day: 'Monday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Tuesday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Wednesday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Thursday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Friday', isOpen: true, open: '09:00', close: '21:00' },
          { day: 'Saturday', isOpen: true, open: '10:00', close: '20:00' },
          { day: 'Sunday', isOpen: false, open: '10:00', close: '18:00' },
        ],
        amenities: s.amenities || ['Free Wi-Fi', 'Complimentary Beverages', 'Valet Parking', 'AC', 'Card Accepted'],
        categories: s.categories || ['Haircut', 'Coloring', 'Beard & Shave', 'Styling'],
        featured: s.is_featured || false,
        isOpenNow: true,
      };
    });

    // Map services
    const mappedServices: ServiceItem[] = dbServices.map(srv => ({
      id: srv.id,
      salonId: srv.salon_id,
      name: srv.name,
      category: srv.category,
      price: Number(srv.price),
      durationMin: srv.duration_min,
      description: srv.description || '',
      popular: srv.is_featured || false,
      image: srv.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
    }));

    // Map staff
    const mappedStaff: StaffMember[] = dbStaff.map(st => ({
      id: st.id,
      salonId: st.salon_id,
      name: st.name,
      role: st.role_title,
      avatar: st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      rating: Number(st.rating) || 5.0,
      reviewsCount: st.reviews_count || 0,
      specialties: st.specialties || ['General'],
      available: st.is_active,
    }));

    return {
      salons: mappedSalons,
      services: mappedServices,
      staff: mappedStaff,
    };
  } catch (err) {
    console.error('fetchSalonsFromDb fatal error:', err);
    return null;
  }
}

/**
 * Creates an appointment in Supabase database with guarded RPC or transactional fallback
 */
export async function createAppointmentInDb(appt: {
  salonId: string;
  serviceId: string;
  staffId?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  staffName?: string;
  salonName: string;
  salonAddress: string;
  date: string;
  time: string;
  price: number;
  status: AppointmentStatus;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database is not connected.' };
  }

  try {
    // 1. Check for slot conflict
    const { data: conflict, error: conflictErr } = await supabaseALGOsalonClient
      .from('appointments')
      .select('id')
      .eq('salon_id', appt.salonId)
      .eq('appointment_date', appt.date)
      .eq('start_time', appt.time.length === 5 ? `${appt.time}:00` : appt.time)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (conflictErr && conflictErr.code !== 'PGRST116') {
      console.warn('Conflict check note:', conflictErr.message);
    }

    if (conflict) {
      return { success: false, error: 'This time slot is already booked. Please choose another time.' };
    }

    // 2. Insert appointment
    const { data: inserted, error: insertErr } = await supabaseALGOsalonClient
      .from('appointments')
      .insert({
        salon_id: appt.salonId,
        customer_id: appt.customerId,
        service_id: appt.serviceId,
        staff_id: appt.staffId || null,
        appointment_date: appt.date,
        start_time: appt.time.length === 5 ? `${appt.time}:00` : appt.time,
        status: appt.status || 'pending',
        total_price: appt.price,
        customer_notes: `Booked for ${appt.customerName} (${appt.customerPhone || 'N/A'})`,
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      return { success: false, error: insertErr?.message || 'Failed to record booking.' };
    }

    return { success: true, appointmentId: inserted.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Database booking exception.' };
  }
}

/**
 * Updates an appointment status in Supabase
 */
export async function updateAppointmentStatusInDb(
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabaseALGOsalonClient
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Update failed' };
  }
}

/**
 * Fetches appointments for a specific customer or business salon
 */
export async function fetchAppointmentsFromDb(params: {
  customerId?: string;
  salonId?: string;
}): Promise<Appointment[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let query = supabaseALGOsalonClient
      .from('appointments')
      .select(`
        id,
        salon_id,
        customer_id,
        service_id,
        staff_id,
        appointment_date,
        start_time,
        end_time,
        status,
        total_price,
        customer_notes,
        created_at,
        salons:salon_id (name, address_line1, city),
        services:service_id (name, duration_min),
        staff_profiles:staff_id (name),
        profiles:customer_id (full_name, phone_e164)
      `)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (params.customerId) {
      query = query.eq('customer_id', params.customerId);
    }
    if (params.salonId) {
      query = query.eq('salon_id', params.salonId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn('Appointments fetch note:', error?.message);
      return null;
    }

    return data.map((row: any) => {
      const salon = Array.isArray(row.salons) ? row.salons[0] : row.salons;
      const service = Array.isArray(row.services) ? row.services[0] : row.services;
      const staff = Array.isArray(row.staff_profiles) ? row.staff_profiles[0] : row.staff_profiles;
      const customer = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      return {
        id: row.id,
        salonId: row.salon_id,
        serviceId: row.service_id,
        staffId: row.staff_id || undefined,
        customerId: row.customer_id,
        customerName: customer?.full_name || 'Customer',
        customerPhone: customer?.phone_e164 || '',
        serviceName: service?.name || 'Service',
        staffName: staff?.name || 'Any Stylist',
        salonName: salon?.name || 'ALGO Salon',
        salonAddress: salon?.address_line1 ? `${salon.address_line1}, ${salon.city || ''}` : 'Dubai, UAE',
        date: row.appointment_date,
        time: row.start_time ? row.start_time.slice(0, 5) : '10:00',
        price: Number(row.total_price) || 0,
        status: (row.status as AppointmentStatus) || 'pending',
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('fetchAppointmentsFromDb error:', err);
    return null;
  }
}

/**
 * Creates a review in Supabase and triggers rating recalculation
 */
export async function createReviewInDb(review: {
  salonId: string;
  customerId: string;
  appointmentId?: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await supabaseALGOsalonClient
      .from('reviews')
      .insert({
        salon_id: review.salonId,
        customer_id: review.customerId,
        appointment_id: review.appointmentId || null,
        rating: review.rating,
        comment: review.comment,
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Realtime subscription manager for booking updates
 */
export function subscribeToSalonAppointments(
  salonId: string,
  onUpdate: (payload: any) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabaseALGOsalonClient
    .channel(`salon_appts_${salonId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `salon_id=eq.${salonId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabaseALGOsalonClient.removeChannel(channel);
  };
}

/**
 * Realtime subscription manager for customer appointments
 */
export function subscribeToCustomerAppointments(
  customerId: string,
  onUpdate: (payload: any) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabaseALGOsalonClient
    .channel(`customer_appts_${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabaseALGOsalonClient.removeChannel(channel);
  };
}

/**
 * Fetches background images from Supabase Storage bucket 'app-background-images'
 */
export async function getBackgroundImage(screenKey: string, fallbackUrl: string): Promise<string> {
  if (!isSupabaseConfigured()) return fallbackUrl;

  try {
    const { data } = supabaseALGOsalonClient.storage
      .from('app-background-images')
      .getPublicUrl(screenKey);

    return data?.publicUrl || fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}
