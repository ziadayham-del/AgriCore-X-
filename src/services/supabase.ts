/**
 * Supabase Client & Realtime Subscription Abstraction
 * Uses environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Also supports runtime configuration from settings.
 * Never exposes service_role key to browser!
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function sanitizeKey(key: string): string {
  if (!key) return '';
  return key.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nawevbzqjzsobzvuzwuq.supabase.co';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('smartagri_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('smartagri_supabase_key') : null;

  return {
    url: storedUrl || envUrl,
    key: sanitizeKey(storedKey || envKey),
  };
}

export let supabase: SupabaseClient | null = null;

export function initSupabase(url?: string, key?: string): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  const targetUrl = url || creds.url;
  const targetKey = sanitizeKey(key || creds.key);

  if (!targetUrl || !targetKey || targetKey.length < 15) {
    supabase = null;
    return null;
  }

  try {
    supabase = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabase;
  } catch (err) {
    console.warn('[SmartAgri] Supabase initialization failed:', err);
    supabase = null;
    return null;
  }
}

// Initial initialization
initSupabase();

export const isSupabaseConfigured = Boolean(supabase !== null);

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = sanitizeKey(key);
  if (!cleanKey) {
    return { success: false, message: 'API key is missing' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: 'Successfully connected to Supabase REST & Realtime gateway!' };
    }

    if (res.status === 401) {
      return {
        success: false,
        message: '401 Unauthorized: The anon key appears truncated or invalid. Please check your Supabase Project Settings > API > Project API keys (anon public).',
      };
    }

    return {
      success: false,
      message: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to Supabase',
    };
  }
}

