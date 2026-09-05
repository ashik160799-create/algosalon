/**
 * ALGO SALON SPOT-PRO — Supabase Client Connection (TypeScript)
 * Configured with live project credentials and automatic session persistence.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://mmmthrlbikllhdupslrz.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbXRocmxiaWtsbGhkdXBzbHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Mzk1MDcsImV4cCI6MjEwNDAxNTUwN30.K00AzMuva-wTGWzYBCGLeNxxGFnkXw0FJWI27a1PIz0';

function normalizeSupabaseUrl(rawUrl?: unknown): string {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SUPABASE_URL;

  let cleaned = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');
  if (cleaned.startsWith('VITE_SUPABASE_URL=')) {
    cleaned = cleaned.replace(/^VITE_SUPABASE_URL=/, '').trim();
  }
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  if (!cleaned || cleaned.includes('YOUR_PROJECT_REF') || cleaned === 'undefined' || cleaned === 'null') {
    return DEFAULT_SUPABASE_URL;
  }

  // Valid full HTTP/HTTPS URL
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      new URL(cleaned);
      return cleaned.replace(/\/+$/, '');
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  }

  // Domain without protocol (e.g. mmmthrlbikllhdupslrz.supabase.co)
  if (cleaned.includes('.')) {
    try {
      const formatted = `https://${cleaned}`.replace(/\/+$/, '');
      new URL(formatted);
      return formatted;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  }

  // Project reference (e.g. "mmmthrlbikllhdupslrz")
  if (/^[a-z0-9_-]+$/i.test(cleaned)) {
    return `https://${cleaned}.supabase.co`;
  }

  return DEFAULT_SUPABASE_URL;
}

function normalizeSupabaseKey(rawAnonKey?: unknown, rawPublishableKey?: unknown): string {
  const cleanKey = (key?: unknown): string => {
    if (!key || typeof key !== 'string') return '';
    let cleaned = key.trim().replace(/^['"]+|['"]+$/g, '');
    if (cleaned.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      cleaned = cleaned.replace(/^VITE_SUPABASE_ANON_KEY=/, '').trim();
    }
    if (cleaned.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
      cleaned = cleaned.replace(/^VITE_SUPABASE_PUBLISHABLE_KEY=/, '').trim();
    }
    cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
    return cleaned;
  };

  const key1 = cleanKey(rawAnonKey);
  if (key1 && key1.length > 20 && !key1.includes('YOUR_ANON_KEY')) {
    return key1;
  }

  const key2 = cleanKey(rawPublishableKey);
  if (key2 && key2.length > 20 && !key2.includes('YOUR_PUBLISHABLE_KEY')) {
    return key2;
  }

  return DEFAULT_SUPABASE_KEY;
}

const supabaseUrl: string = normalizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL);

const supabaseAnonKey: string = normalizeSupabaseKey(
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY,
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    supabaseAnonKey.length > 20
  );
};

function initSupabaseClient(): SupabaseClient {
  const options = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'algosalon_sb_auth',
    },
  };

  try {
    return createClient(supabaseUrl, supabaseAnonKey, options);
  } catch (err) {
    console.warn('Failed to initialize Supabase with current credentials, falling back to default:', err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, options);
  }
}

export const supabaseALGOsalonClient: SupabaseClient = initSupabaseClient();

/**
 * Health check to verify live connectivity with your Supabase database
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string; data?: any }> {
  try {
    const { data, error } = await supabaseALGOsalonClient
      .from('salons')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.warn('Supabase connection check:', error.message);
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err: any) {
    console.warn('Supabase connection error:', err);
    return { connected: false, error: err.message || 'Unknown network error' };
  }
}

export default supabaseALGOsalonClient;
