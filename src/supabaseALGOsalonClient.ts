/**
 * ALGO SALON SPOT-PRO — Supabase Client Connection (TypeScript)
 * Configured with environment variables and automatic session persistence.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(rawUrl?: unknown): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let cleaned = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');
  if (cleaned.startsWith('VITE_SUPABASE_URL=')) {
    cleaned = cleaned.replace(/^VITE_SUPABASE_URL=/, '').trim();
  }
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  if (!cleaned || cleaned.includes('YOUR_PROJECT_REF') || cleaned === 'undefined' || cleaned === 'null') {
    return '';
  }

  // Valid full HTTP/HTTPS URL
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      new URL(cleaned);
      return cleaned.replace(/\/+$/, '');
    } catch {
      return '';
    }
  }

  // Domain without protocol (e.g. yourproject.supabase.co)
  if (cleaned.includes('.')) {
    try {
      const formatted = `https://${cleaned}`.replace(/\/+$/, '');
      new URL(formatted);
      return formatted;
    } catch {
      return '';
    }
  }

  // Project reference (e.g. "mmmthrlbikllhdupslrz")
  if (/^[a-z0-9_-]+$/i.test(cleaned)) {
    return `https://${cleaned}.supabase.co`;
  }

  return '';
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

  return '';
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
const supabaseUrl: string = normalizeSupabaseUrl(env.VITE_SUPABASE_URL);

const supabaseAnonKey: string = normalizeSupabaseKey(
  env.VITE_SUPABASE_ANON_KEY,
  env.VITE_SUPABASE_PUBLISHABLE_KEY
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

  const effectiveUrl = supabaseUrl || 'https://unconfigured.supabase.co';
  const effectiveKey = supabaseAnonKey || 'unconfigured-placeholder-key-00000000000000000000000000';

  return createClient(effectiveUrl, effectiveKey, options);
}

export const supabaseALGOsalonClient: SupabaseClient = initSupabaseClient();

/**
 * Health check to verify live connectivity with your Supabase database
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string; data?: unknown }> {
  if (!isSupabaseConfigured()) {
    return { connected: false, error: 'Supabase environment variables are unconfigured' };
  }

  try {
    const { data, error } = await supabaseALGOsalonClient
      .from('salons')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.warn('Supabase connection check:', error.message);
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown network error';
    console.warn('Supabase connection error:', err);
    return { connected: false, error: message };
  }
}

export default supabaseALGOsalonClient;
