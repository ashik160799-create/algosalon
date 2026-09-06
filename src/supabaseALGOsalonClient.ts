/**
 * ALGO SALON SPOT-PRO — Supabase Client Connection (TypeScript)
 * Configured with environment variables and automatic session persistence.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://mmmthrlbikllhdupslrz.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
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

  // Domain without protocol (e.g. yourproject.supabase.co)
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

  return DEFAULT_SUPABASE_ANON_KEY;
}

// Direct access to Vite compile-time environment variables with safe fallback
const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (import.meta as any)?.env?.VITE_SUPABASE_URL;

const envAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any)?.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl: string = normalizeSupabaseUrl(envUrl);

export const supabaseAnonKey: string = normalizeSupabaseKey(
  envAnonKey,
  undefined
);

export const getSupabaseProjectRef = (): string => {
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.hostname.split('.')[0] || 'mmmthrlbikllhdupslrz';
  } catch {
    return 'mmmthrlbikllhdupslrz';
  }
};

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

  const effectiveUrl = supabaseUrl || DEFAULT_SUPABASE_URL;
  const effectiveKey = supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;

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
